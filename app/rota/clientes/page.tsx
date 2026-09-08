import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { listCustomers } from "@/lib/customers/service";
import { CustomersView } from "@/components/customers/customers-view";
import type { CustomerDto } from "@/components/customers/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clientes · Programa a Rota · Roteia",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const customers = await listCustomers(user.tenantId, q);

  const dto: CustomerDto[] = customers.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    document: c.document,
    email: c.email,
    phone: c.phone,
    mobile: c.mobile,
    notes: c.notes,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
    primaryAddress: c.primaryAddress
      ? {
          id: c.primaryAddress.id,
          label: c.primaryAddress.label,
          raw: c.primaryAddress.raw,
          zipcode: c.primaryAddress.zipcode,
          district: c.primaryAddress.district,
          city: c.primaryAddress.city,
          state: c.primaryAddress.state,
          lat: c.primaryAddress.lat,
          lng: c.primaryAddress.lng,
          geocodingProvider: c.primaryAddress.geocodingProvider,
          confidence: c.primaryAddress.confidence,
          geocodedAt: c.primaryAddress.geocodedAt?.toISOString() ?? null,
        }
      : null,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-zinc-500">
          Cadastro permanente com endereço e coordenadas — a base das suas
          rotas.
        </p>
      </div>

      <CustomersView customers={dto} search={q ?? ""} />
    </main>
  );
}