import { notFound } from "next/navigation";
import Link from "next/link";
import { getDayByShareToken } from "@/lib/day/service";

export const metadata = { title: "Dia compartilhado · Roteia" };

const statusLabels: Record<string, string> = {
  RASCUNHO: "rascunho",
  OTIMIZADO: "otimizado",
  EM_ANDAMENTO: "em andamento",
  CONCLUIDO: "concluído",
};

const stopStatusLabels: Record<string, string> = {
  PENDENTE: "pendente",
  EM_ANDAMENTO: "em andamento",
  FEITO: "feita",
  PULADO: "pulada",
};

export default async function SharedDayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  let data;
  try {
    data = await getDayByShareToken(token);
  } catch {
    notFound();
  }

  const tz = data.tenant.timezone;
  const fmtTime = (iso: Date | null): string =>
    iso
      ? new Intl.DateTimeFormat("pt-BR", {
          timeZone: tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(iso)
      : "—";

  const fmtDate = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(data.date);

  const done = data.stops.filter((s) => s.status === "FEITO").length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Roteia · dia compartilhado
          </p>
          <h1 className="text-2xl font-bold capitalize">{fmtDate}</h1>
          <p className="text-sm text-zinc-500">
            {statusLabels[data.status] ?? data.status} · {data.stops.length}{" "}
            paradas · {done} feitas
          </p>
        </div>
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Criar meu dia
        </Link>
      </div>

      {(data.startAddress || data.endAddress) && (
        <div className="mb-4 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {data.startAddress && (
            <p className="text-zinc-600 dark:text-zinc-300">
              <span className="font-medium">Início:</span> {data.startAddress}
              {data.startTime && <> às {fmtTime(data.startTime)}</>}
            </p>
          )}
          {data.endAddress && (
            <p className="text-zinc-600 dark:text-zinc-300">
              <span className="font-medium">Destino final:</span>{" "}
              {data.endAddress}
            </p>
          )}
        </div>
      )}

      <ol className="space-y-2">
        {data.stops.map((s, i) => (
          <li
            key={s.id}
            className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.title}</p>
              {s.address && (
                <p className="truncate text-xs text-zinc-500">{s.address}</p>
              )}
              <p className="mt-0.5 text-xs text-zinc-400">
                {s.plannedStartAt
                  ? `planejado ${fmtTime(s.plannedStartAt)}–${fmtTime(s.plannedEndAt)}`
                  : "sem horário planejado"}
                {s.startedAt && ` · iniciado ${fmtTime(s.startedAt)}`}
                {s.finishedAt && ` · concluído ${fmtTime(s.finishedAt)}`}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                s.status === "FEITO"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : s.status === "PULADO"
                    ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              }`}
            >
              {stopStatusLabels[s.status] ?? s.status}
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-center text-xs text-zinc-400">
        Compartilhado por {data.tenant.name} via{" "}
        <Link href="/" className="underline">
          Roteia
        </Link>
      </p>
    </main>
  );
}