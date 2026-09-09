import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { listRoutes } from "@/lib/route/service";
import { RotasView } from "@/components/route/rotas-view";
import type { RouteDto } from "@/components/route/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rotas · Programa a Rota · Roteia",
};

export default async function RotasPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const tz = user.tenant.timezone;
  const routes = await listRoutes(user.tenantId);

  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const dto: RouteDto[] = routes.map((r) => ({
    id: r.id,
    date: r.date.toISOString().slice(0, 10),
    displayDate: fmt.format(r.date),
    name: r.name,
    status: r.status,
    startAddress: r.startAddress,
    startLat: r.startLat,
    startLng: r.startLng,
    startTime: r.startTime?.toISOString() ?? null,
    totalDistanceMeters: r.totalDistanceMeters,
    totalDurationMinutes: r.totalDurationMinutes,
    stopCount: r._count.stops,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rotas</h1>
        <p className="text-sm text-zinc-500">
          Planeje entregas: monte a sequência de paradas, otimize e execute.
        </p>
      </div>

      <RotasView routes={dto} tz={tz} />
    </main>
  );
}