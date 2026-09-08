"use client";

import { useMemo, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { reorderStopsAction, removeStopAction, optimizeDayAction, addToDayAction } from "@/app/actions/day";
import { ActivityForm } from "@/components/day/activity-form";
import { StopList } from "@/components/day/stop-list";
import { MapPanel } from "@/components/day/map-panel";
import { Button, Card } from "@/components/ui";
import type { ActivityDto, DayDto, StopDto } from "@/components/day/types";

export function DayPlanner({
  day,
  stops,
  activities,
  tz,
  dateIso,
}: {
  day: DayDto;
  stops: StopDto[];
  activities: ActivityDto[];
  tz: string;
  dateIso: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const available = activities
    .filter((a) => !stops.some((s) => s.activityId === a.id))
    .slice(0, 30);

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
        })),
    [stops],
  );

  const itinerary = useMemo(() => {
    const pts: Array<[number, number]> = [];
    if (day.startLat != null && day.startLng != null) {
      pts.push([day.startLat, day.startLng]);
    }
    for (const p of mapPoints) pts.push([p.lat, p.lng]);
    return pts;
  }, [mapPoints, day.startLat, day.startLng]);

  const optimized = day.status === "OTIMIZADO";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu Dia</h1>
          <p className="text-sm text-zinc-500">{day.displayDate}</p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          {stops.length} {stops.length === 1 ? "parada" : "paradas"}
          {optimized && day.totalDistanceMeters != null && (
            <>
              <br />
              {formatDistance(day.totalDistanceMeters)} · {formatDuration(day.totalDurationMinutes)}
            </>
          )}
        </div>
      </div>

      {optimizeError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {optimizeError}
        </p>
      )}

      <MapPanel points={mapPoints} itinerary={itinerary} />

      {stops.length > 0 && (
        <div className="mt-4">
          <StopList
            stops={stops}
            tz={tz}
            onReorder={handleReorder}
            onRemove={handleRemove}
          />
          <Button
            onClick={handleOptimize}
            disabled={pending}
            variant="secondary"
            className="mt-4 w-full py-3 text-base"
          >
            {pending ? "Otimizando…" : optimized ? "Reotimizar rota" : "Otimizar rota do dia"}
          </Button>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Mantém essenciais e horários fixos; ajusta as flexíveis para encurtar o caminho.
          </p>
        </div>
      )}

      {stops.length === 0 && (
        <Card className="mt-6 text-center">
          <p className="text-sm text-zinc-500">
            Seu dia está vazio. Adicione atividades abaixo para começar.
          </p>
        </Card>
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
            <ActivityForm dayId={day.id} dateIso={dateIso} onCreated={() => setShowAdd(false)} />
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
    </main>
  );
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  return `${h}h${(minutes % 60).toString().padStart(2, "0")}`;
}