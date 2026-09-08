import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { todayIso } from "@/lib/date";
import { listDaysOverview } from "@/lib/day/service";
import { formatDistance, formatDuration, formatDateLabel } from "@/lib/format";
import { DeleteDayButton } from "@/components/day/delete-day-button";
import type { DayStatus } from "@/generated/prisma/client";

const dayStatusLabels: Record<DayStatus, string> = {
  RASCUNHO: "Rascunho",
  OTIMIZADO: "Otimizado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

export default async function DaysPage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const tz = user.tenant.timezone;
  const today = todayIso(tz);
  const days = await listDaysOverview(user.tenantId);

  const upcoming = days
    .filter((d) => d.date.toISOString().slice(0, 10) >= today)
    .reverse();
  const history = days
    .filter((d) => d.date.toISOString().slice(0, 10) < today);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meus Dias</h1>
        <p className="text-sm text-zinc-500">
          Planeje e revise todos os seus dias.
        </p>
      </div>

      {days.length === 0 && (
        <p className="rounded-lg border border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Nenhum dia com atividades ainda. Volte ao{" "}
          <Link href="/dia" className="font-medium text-blue-600 hover:underline">
            Meu Dia
          </Link>{" "}
          para adicionar suas primeiras paradas.
        </p>
      )}

      {upcoming.length > 0 && (
        <DaySection title="Próximos">
          {upcoming.map((d) => (
            <DayRow key={d.id} day={d} tz={tz} today={today} />
          ))}
        </DaySection>
      )}

      {history.length > 0 && (
        <DaySection title="Histórico">
          {history.map((d) => (
            <DayRow key={d.id} day={d} tz={tz} today={today} />
          ))}
        </DaySection>
      )}
    </main>
  );
}

function DaySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function DayRow({
  day,
  tz,
  today,
}: {
  day: Awaited<ReturnType<typeof listDaysOverview>>[number];
  tz: string;
  today: string;
}) {
  const iso = day.date.toISOString().slice(0, 10);
  const total =
    day.totalDistanceMeters != null
      ? `${formatDistance(day.totalDistanceMeters)} · ${formatDuration(day.totalDurationMinutes)}`
      : null;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0">
        <p className="text-sm font-semibold capitalize">
          {formatDateLabel(day.date, tz, today)}
        </p>
        <p className="truncate text-xs text-zinc-500">
          {dayStatusLabels[day.status]} · {day._count.stops}{" "}
          {day._count.stops === 1 ? "parada" : "paradas"}
          {total && ` · ${total}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/dia?date=${iso}`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Abrir
        </Link>
        <DeleteDayButton dayId={day.id} dateIso={iso} />
      </div>
    </li>
  );
}