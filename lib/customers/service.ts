import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { geocodeAddressDetailed } from "@/lib/maps/geocode";
import type { Address, Customer } from "@/generated/prisma/client";

export type CustomerData = {
  code?: string | null;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  notes?: string | null;
};

export type AddressData = {
  label?: string | null;
  raw: string;
  zipcode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type AddressResolved = {
  lat: number | null;
  lng: number | null;
  geocodingProvider: string | null;
  confidence: number | null;
  geocodedAt: Date | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

async function resolveAddress(
  data: AddressData,
): Promise<AddressResolved> {
  let lat = data.lat ?? null;
  let lng = data.lng ?? null;
  let provider: string | null = null;
  let confidence: number | null = null;
  let geocodedAt: Date | null = null;

  if (lat == null || lng == null) {
    const geo = await geocodeAddressDetailed(data.raw).catch(() => null);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      provider = geo.provider;
      confidence = geo.confidence;
      geocodedAt = new Date();
    }
  }

  return { lat, lng, geocodingProvider: provider, confidence, geocodedAt };
}

function addressCreateData(tenantId: string, customerId: string, data: AddressData, resolved: AddressResolved) {
  return {
    tenantId,
    customerId,
    label: clean(data.label),
    raw: data.raw.trim(),
    zipcode: clean(data.zipcode),
    street: clean(data.street),
    number: clean(data.number),
    complement: clean(data.complement),
    district: clean(data.district),
    city: clean(data.city),
    state: clean(data.state),
    country: clean(data.country) ?? "BR",
    ...resolved,
  };
}

export async function listCustomers(
  tenantId: string,
  search?: string,
): Promise<Array<Customer & { primaryAddress: Address | null }>> {
  const q = search?.trim();
  const customers = await db.customer.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
              { document: { contains: q, mode: "insensitive" } },
              { mobile: { contains: q, mode: "insensitive" } },
              {
                addresses: {
                  some: { raw: { contains: q, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      addresses: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 1,
      },
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    take: 300,
  });

  return customers.map(({ addresses, ...customer }) => ({
    ...customer,
    primaryAddress: addresses[0] ?? null,
  }));
}

export async function getCustomer(
  tenantId: string,
  customerId: string,
): Promise<Customer & { addresses: Address[] } | null> {
  const customer = await db.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    include: {
      addresses: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
    },
  });
  return customer ?? null;
}

async function assertCodeAvailable(
  tenantId: string,
  code: string | null,
  excludeId?: string,
): Promise<void> {
  if (!code) return;
  const existing = await db.customer.findFirst({
    where: {
      tenantId,
      code,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(
      "CUSTOMER_CODE_TAKEN",
      409,
      "Já existe um cliente com este código.",
    );
  }
}

export async function createCustomer(
  tenantId: string,
  userId: string | null,
  data: CustomerData & AddressData,
): Promise<Customer> {
  await assertCodeAvailable(tenantId, clean(data.code));

  const resolved = await resolveAddress(data);

  const customer = await db.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        tenantId,
        code: clean(data.code),
        name: data.name.trim(),
        document: clean(data.document),
        email: clean(data.email)?.toLowerCase(),
        phone: clean(data.phone),
        mobile: clean(data.mobile),
        notes: clean(data.notes),
      },
    });

    await tx.address.create({
      data: addressCreateData(tenantId, created.id, data, resolved),
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "CREATE",
        entityType: "Customer",
        entityId: created.id,
      },
    });

    return created;
  });

  return customer;
}

export async function updateCustomer(
  tenantId: string,
  userId: string | null,
  customerId: string,
  data: CustomerData & AddressData,
): Promise<Customer> {
  const existing = await getCustomer(tenantId, customerId);
  if (!existing) {
    throw new ApiError("CUSTOMER_NOT_FOUND", 404, "Cliente não encontrado.");
  }

  await assertCodeAvailable(tenantId, clean(data.code), customerId);

  const primary =
    existing.addresses.find((a) => a.isPrimary) ?? existing.addresses[0];
  const resolved = await resolveAddress(data);

  const customer = await db.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id: customerId },
      data: {
        code: clean(data.code),
        name: data.name.trim(),
        document: clean(data.document),
        email: clean(data.email)?.toLowerCase(),
        phone: clean(data.phone),
        mobile: clean(data.mobile),
        notes: clean(data.notes),
      },
    });

    if (primary) {
      await tx.address.update({
        where: { id: primary.id },
        data: {
          label: clean(data.label),
          raw: data.raw.trim(),
          zipcode: clean(data.zipcode),
          street: clean(data.street),
          number: clean(data.number),
          complement: clean(data.complement),
          district: clean(data.district),
          city: clean(data.city),
          state: clean(data.state),
          country: clean(data.country) ?? "BR",
          ...resolved,
        },
      });
    } else {
      await tx.address.create({
        data: addressCreateData(tenantId, customerId, data, resolved),
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Customer",
        entityId: customerId,
      },
    });

    return updated;
  });

  return customer;
}

export async function archiveCustomer(
  tenantId: string,
  userId: string | null,
  customerId: string,
): Promise<Customer> {
  const existing = await getCustomer(tenantId, customerId);
  if (!existing) {
    throw new ApiError("CUSTOMER_NOT_FOUND", 404, "Cliente não encontrado.");
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.customer.update({
      where: { id: customerId },
      data: { active: !existing.active },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Customer",
        entityId: customerId,
      },
    });

    return updated;
  });
}

export async function deleteCustomer(
  tenantId: string,
  userId: string | null,
  customerId: string,
): Promise<void> {
  const existing = await getCustomer(tenantId, customerId);
  if (!existing) {
    throw new ApiError("CUSTOMER_NOT_FOUND", 404, "Cliente não encontrado.");
  }

  await db.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: { deletedAt: new Date(), active: false },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "DELETE",
        entityType: "Customer",
        entityId: customerId,
      },
    });
  });
}