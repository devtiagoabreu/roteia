"use client";

import { useMemo, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { reorderStopsAction, removeStopAction, optimizeDayAction, addToDayAction } from "@/app/actions/day";
import { ActivityForm } from "@/components/day/activity-form";
import { StopList } from "@/components/day/stop-list";
import { MapPanel } from "@/components/day/map-panel";
import { Button, Card } from "@/components/ui";
import { addDaysIso } from "@/lib/date";
import { formatDistance, formatDuration } from "@/lib/format";
import type { ActivityDto, DayDto, StopDto } from "@/components/day/types";
import type { PlaceDto } from "@/components/places/types";

const dayStatusLabels: Record<DayDto["status"], string> = {
  RASCUNHO: "rascunho",
  OTIMIZADO: "otimizado",
  EM_ANDAMENTO: "em andamento",
  CONCLUIDO: "concluído",
};

export function DayPlanner({
  day,
  stops,
  activities,
  savedPlaces,
  tz,
  dateIso,
  today,
}: {
  day: DayDto;
  stops: StopDto[];
  activities: ActivityDto[];
  savedPlaces: PlaceDto[];
  tz: string;
  dateIso: string;
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const available = activities
    .filter((a) => !stops.some((s) => s.activityId === a.id))
    .slice(0, 30);

  function goToDate(iso: string) {
    router.push(`/?date=${iso}`);
  }

  function addExisting(activityId: string) {
    startTransition(async () => {
      await addToDayAction(day.id, activityId);
      router.refresh();
    });
  }

  function handleReorder(ids: string[]) {
    startTransition(async () => {
      await reorderStopsAction(day.id, ids);
      router.refresh();
    });
  }

  function handleRemove(stopId: string) {
    startTransition(async () => {
      await removeStopAction(stopId);
      router.refresh();
    });
  }

  function handleOptimize() {
    setOptimizeError(null);
    startTransition(async () => {
      const res = await optimizeDayAction(day.id);
      if (!res.ok) setOptimizeError(res.error);
      router.refresh();
    });
  }

  const nextStopId = useMemo(() => {
    const next = stops.find(
      (s) => s.status === "PENDENTE" || s.status === "EM_ANDAMENTO",
    );
    return next?.id ?? null;
  }, [stops]);

  const mapPoints = useMemo(
    () =>
      stops
        .filter((s) => s.lat != null && s.lng != null && !(s.status === "PULADO"))
        .map((s, i) => ({
          id: s.id,
          label: s.title,
          lat: s.lat!,
          lng: s.lng!,
          index: i,
          done: s.status === "FEITO",
          next: s.id === nextStopId,
        })),
    [stops, nextStopId],
  );

  const itinerary = useMemo(() => {
    const pts: Array<[number, number]> = [];
    if (day.startLat != null && day.startLng != null) {
      pts.push([day.startLat, day.startLng]);
    }
    for (const p of mapPoints) pts.push([p.lat, p.lng]);
    return pts;
  }, [mapPoints, day.startLat, day.startLng]);

  const optimized = day.status === "OTIMIZADO" || day.status === "EM_ANDAMENTO";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Meu Dia</h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {dayStatusLabels[day.status]}
            </span>
          </div>
          <p className="text-sm text-zinc-500">{day.displayDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700">
            <span className="text-xs text-zinc-500">Data</span>
            <input
              type="date"
              defaultValue={dateIso}
              onChange={(e) => {
                if (e.target.value) goToDate(e.target.value);
              }}
              className="bg-transparent text-sm outline-none"
            />
          </label>
          <Button
            variant="ghost"
            className="px-3 py-1.5 text-xs"
            onClick={() => goToDate(dateIso === today ? addDaysIso(today, 1) : today)}
          >
            {dateIso === today ? "Amanhã" : "Hoje"}
          </Button>
          <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => goToDate(addDaysIso(today, 1))}>
            Amanhã
          </Button>
        </div>
      </div>

      <div className="mb-4 text-right text-xs text-zinc-500">
        {stops.length} {stops.length === 1 ? "parada" : "paradas"}
        {optimized && day.totalDistanceMeters != null && (
          <>
            {" · "}
            {formatDistance(day.totalDistanceMeters)} · {formatDuration(day.totalDurationMinutes)}
          </>
        )}
      </div>

      {optimizeError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {optimizeError}
        </p>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-6">
        <div className="min-w-0">
          {stops.length > 0 ? (
            <StopList
              stops={stops}
              tz={tz}
              onReorder={handleReorder}
              onRemove={handleRemove}
            />
          ) : (
            <Card className="text-center">
              <p className="text-sm text-zinc-500">
                Seu dia está vazio. Adicione atividades abaixo para começar.
              </p>
            </Card>
          )}

          {stops.length > 0 && (
            <div className="mt-4">
              <Button
                onClick={handleOptimize}
                disabled={pending}
                variant="secondary"
                className="w-full py-3 text-base"
              >
                {pending ? "Otimizando…" : optimized ? "Reotimizar rota" : "Otimizar rota do dia"}
              </Button>
              <p className="mt-2 text-center text-[11px] text-zinc-400">
                Mantém essenciais e horários fixos; ajusta as flexíveis para encurtar o caminho.
              </p>
            </div>
          )}

          <section className="mt-8">
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
            >
              {showAdd ? "Fechar formulário" : "+ Adicionar atividade ao dia"}
              <span className="text-xs text-zinc-400">{available.length} disponíveis</span>
            </button>

            {showAdd && (
              <Card className="mt-3">
                <ActivityForm
                  dayId={day.id}
                  dateIso={dateIso}
                  savedPlaces={savedPlaces}
                  onCreated={() => setShowAdd(false)}
                />
              </Card>
            )}

            {available.length > 0 && (
              <div className="mt-4">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Atividades sem local marcado
                </h2>
                <ul className="space-y-2">
                  {available.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
                      <div className="min-w-0">
                        <p className="truncate text-sm">{a.title}</p>
                        {a.address && (
                          <p className="truncate text-xs text-zinc-500">{a.address}</p>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => addExisting(a.id)}
                        disabled={pending}
                        className="shrink-0 px-3 py-1.5 text-xs"
                      >
                        Adicionar
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 lg:mt-0">
          <div className="lg:sticky lg:top-20">
            <MapPanel points={mapPoints} itinerary={itinerary} className="lg:h-[calc(100vh-7rem)]" />
          </div>
        </div>
      </div>
    </main>
  );
}