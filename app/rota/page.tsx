import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/require-user";
import { listRoutes } from "@/lib/route/service";
import { todayIso } from "@/lib/date";
import { routeStatusLabels } from "@/components/route/types";
import { RouteArchiveButton } from "@/components/route/route-actions";

export const metadata: Metadata = {
  title: "Programa a Rota · Roteia",
  description:
    "Roteirização de entregas: rotas de hoje, planejamento otimizado e execução das paradas.",
};

function RouteRow({
  route,
  tz,
  archived = false,
}: {
  route: Awaited<ReturnType<typeof listRoutes>>[number];
  tz: string;
  archived?: boolean;
}) {
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <Link
      href={`/rota/rotas/${route.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {route.name ?? "Rota sem nome"}
        </p>
        <p className="text-xs text-zinc-500">
          {fmt.format(route.date).toLowerCase()} · {route._count.stops} parada
          {route._count.stops === 1 ? "" : "s"} ·{" "}
          <span className="capitalize">{routeStatusLabels[route.status]}</span>
        </p>
      </div>
      {!archived && <RouteArchiveButton routeId={route.id} />}
    </Link>
  );
}

export default async function RotaHomePage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const tz = user.tenant.timezone;
  const today = todayIso(tz);
  const routes = await listRoutes(user.tenantId);
  const archived = (await listRoutes(user.tenantId, true)).filter(
    (r) => r.status === "ARQUIVADO",
  );

  const hoje = routes.find((r) => r.date.toISOString().slice(0, 10) === today);
  const hojeRoutes = routes.filter((r) => r.date.toISOString().slice(0, 10) === today);
  const futuras = routes.filter((r) => r.date.toISOString().slice(0, 10) > today);
  const concluidas = routes.filter(
    (r) =>
      r.status === "CONCLUIDO" &&
      r.date.toISOString().slice(0, 10) !== today,
  );

  const emAndamentoHoje = hojeRoutes.filter(
    (r) => r.status === "EM_ANDAMENTO",
  ).length;
  const concluidasHoje = hojeRoutes.filter(
    (r) => r.status === "CONCLUIDO",
  ).length;
  const proxima =
    hojeRoutes.find((r) => r.status !== "CONCLUIDO") ??
    hojeRoutes.find((r) => r.status === "CONCLUIDO") ??
    null;

  const summary = [
    {
      label: "Rotas hoje",
      value: String(hojeRoutes.length),
      accent: hojeRoutes.length > 0,
    },
    { label: "Em andamento hoje", value: String(emAndamentoHoje), accent: emAndamentoHoje > 0 },
    { label: "Concluídas hoje", value: String(concluidasHoje), accent: concluidasHoje > 0 },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rotas</h1>
          <p className="text-sm text-zinc-500">
            Planeje, otimize e execute suas entregas.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/rota/clientes"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
          >
            Clientes
          </Link>
          <Link
            href="/rota/rotas"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
          >
            + Nova rota
          </Link>
        </div>
      </div>

      <section className="mb-6 grid grid-cols-3 gap-3">
        {summary.map((s) => (
          <div
            key={s.label}
            className={`rounded-lg border p-3 text-center ${
              s.accent
                ? "border-zinc-900 dark:border-zinc-100"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[11px] text-zinc-500">{s.label}</p>
          </div>
        ))}
      </section>

      {proxima && (
        <section className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Próxima rota
          </p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{proxima.name ?? "Rota sem nome"}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {proxima._count.stops} parada{proxima._count.stops === 1 ? "" : "s"} ·{" "}
                <span className="capitalize">{routeStatusLabels[proxima.status]}</span>
              </p>
            </div>
            <Link
              href={`/rota/rotas/${proxima.id}`}
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Abrir
            </Link>
          </div>
        </section>
      )}

      {!hoje && futuras.length === 0 && concluidas.length === 0 && (
        <section className="rounded-xl border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          <p className="text-sm font-medium">Nenhuma rota ainda</p>
          <p className="mt-1 text-sm text-zinc-500">
            Cadastre clientes e crie sua primeira rota otimizada.
          </p>
          <Link
            href="/rota/rotas"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-85 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Criar rota
          </Link>
        </section>
      )}

      {hojeRoutes.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Hoje</h2>
          <div className="space-y-2">
            {hojeRoutes.map((r) => (
              <RouteRow key={r.id} route={r} tz={tz} />
            ))}
          </div>
        </section>
      )}

      {futuras.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Futuras</h2>
          <div className="space-y-2">
            {futuras.map((r) => (
              <RouteRow key={r.id} route={r} tz={tz} />
            ))}
          </div>
        </section>
      )}

      {concluidas.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Concluídas</h2>
          <div className="space-y-2">
            {concluidas.map((r) => (
              <RouteRow key={r.id} route={r} tz={tz} />
            ))}
          </div>
        </section>
      )}

      {archived.length > 0 && (
        <details className="mb-6">
          <summary className="cursor-pointer text-sm font-semibold text-zinc-500">
            Arquivadas ({archived.length})
          </summary>
          <div className="mt-2 space-y-2">
            {archived.map((r) => (
              <RouteRow key={r.id} route={r} tz={tz} archived />
            ))}
          </div>
        </details>
      )}
    </main>
  );
}