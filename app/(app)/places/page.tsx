import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { listSavedPlaces } from "@/lib/places/service";
import { PlacesView } from "@/components/places/places-view";
import type { PlaceDto } from "@/components/places/types";

export default async function PlacesPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const tz = user.tenant.timezone;
  const places = await listSavedPlaces(user.tenantId);

  const dto: PlaceDto[] = places.map((p) => ({
    id: p.id,
    label: p.label,
    category: p.category,
    address: p.address,
    notes: p.notes,
    isFavorite: p.isFavorite,
    lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meus Locais</h1>
        <p className="text-sm text-zinc-500">
          Guarde os lugares que você repete e preencha paradas rapidinho.
        </p>
      </div>

      <PlacesView places={dto} tz={tz} />
    </main>
  );
}