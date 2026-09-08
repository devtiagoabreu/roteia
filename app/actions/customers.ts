"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { customerWithAddressSchema } from "@/lib/validations";
import {
  archiveCustomer,
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/lib/customers/service";
import type { Customer } from "@/generated/prisma/client";

export type CustomerActionResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

export type SimpleResult = { ok: boolean; error?: string };

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseInput(
  formData: FormData,
  fallbackLatLng?: { lat: number | null; lng: number | null },
) {
  const parsed = customerWithAddressSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    document: formData.get("document"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    mobile: formData.get("mobile"),
    notes: formData.get("notes"),
    address: {
      label: formData.get("addressLabel"),
      raw: formData.get("addressRaw"),
      zipcode: formData.get("addressZipcode"),
      street: formData.get("addressStreet"),
      number: formData.get("addressNumber"),
      complement: formData.get("addressComplement"),
      district: formData.get("addressDistrict"),
      city: formData.get("addressCity"),
      state: formData.get("addressState"),
      country: formData.get("addressCountry"),
      lat: parseNumber(formData.get("lat")),
      lng: parseNumber(formData.get("lng")),
    },
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "Dados inválidos.",
    );
  }

  const address = parsed.data.address;
  const lat = address.lat ?? fallbackLatLng?.lat ?? null;
  const lng = address.lng ?? fallbackLatLng?.lng ?? null;

  return { ...parsed.data, address: { ...address, lat, lng } };
}

export async function createCustomerAction(
  formData: FormData,
): Promise<CustomerActionResult> {
  try {
    const user = await requireUser();
    const data = parseInput(formData);
    const customer = await createCustomer(user.tenantId, user.id, {
      ...data,
      ...data.address,
    });
    revalidatePath("/rota");
    revalidatePath("/rota/clientes");
    return { ok: true, customer };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Não foi possível salvar o cliente.",
    };
  }
}

export async function updateCustomerAction(
  customerId: string,
  formData: FormData,
): Promise<CustomerActionResult> {
  try {
    const user = await requireUser();
    const data = parseInput(formData);
    const customer = await updateCustomer(user.tenantId, user.id, customerId, {
      ...data,
      ...data.address,
    });
    revalidatePath("/rota");
    revalidatePath("/rota/clientes");
    return { ok: true, customer };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Não foi possível atualizar o cliente.",
    };
  }
}

export async function archiveCustomerAction(
  customerId: string,
): Promise<SimpleResult> {
  try {
    const user = await requireUser();
    await archiveCustomer(user.tenantId, user.id, customerId);
    revalidatePath("/rota/clientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar o cliente." };
  }
}

export async function deleteCustomerAction(
  customerId: string,
): Promise<SimpleResult> {
  try {
    const user = await requireUser();
    await deleteCustomer(user.tenantId, user.id, customerId);
    revalidatePath("/rota");
    revalidatePath("/rota/clientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir o cliente." };
  }
}