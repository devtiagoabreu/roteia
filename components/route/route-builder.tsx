"use client";

import { useMemo, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  deleteRouteAction,
  optimizeRemainingRouteAction,
  optimizeRouteAction,
  removeRouteStopAction,
  reorderRouteStopsAction,
  setRouteStopStatusAction,
} from "@/app/actions/routes";
import { AddStopPanel } from "@/components/route/add-stop-panel";
import { RouteSettings } from "@/components/route/route-settings";
import { RouteStopList } from "@/components/route/route-stop-list";
import { MapPanel } from "@/components/day/map-panel";
import { Button, Card } from "@/components/ui";
import { formatDistance, formatDuration } from "@/lib/format";
import {
  formatRouteTime,
  routeStatusLabels,
  type RouteCustomerOption,
  type RouteDto,
  type RouteStopDto,
} from "@/components/route/types";

export function RouteBuilder({
  route,
  stops,
  customers,
  tz,
  reasons,
}: {
  route: RouteDto;
  stops: RouteStopDto[];
  customers: RouteCustomerOption[];
  tz: string;
  reasons?: Record<string, boolean>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  function handleReorder(ids: string[]) {
    startTransition(async () => {
      const res = await reorderRouteStopsAction(route.id, ids);
      if (!res.ok) setBannerError(res.error ?? "Não foi possível reordenar.");
      router.refresh();
    });
  }

  function handleRemove(stopId: string) {
    startTransition(async () => {
      const res = await removeRouteStopAction(route.id, stopId);
      if (!res.ok) setBannerError(res.error ?? "Não foi possível remover.");
      router.refresh();
    });
  }

  function handleStatusChange(
    stopId: string,
    status: RouteStopDto["status"],
  ) {
    setBannerError(null);
    startTransition(async () => {
      const res = await setRouteStopStatusAction(route.id, stopId, status);
      if (!res.ok) setBannerError(res.error ?? "Não foi possível atualizar.");
      router.refresh();
    });
  }

  function handleOptimize() {
    setBannerError(null);
    startTransition(async () => {
      const res = await optimizeRouteAction(route.id);
      if (!res.ok) setBannerError(res.error ?? "Não foi possível otimizar.");
      router.refresh();
    });
  }

  function handleOptimizeRemaining() {
    setBannerError(null);
    startTransition(async () => {
      const res = await optimizeRemainingRouteAction(route.id);
      if (!res.ok) setBannerError(res.error ?? "Não foi possível reotimizar.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm("Excluir esta rota e todas as suas paradas?")) return;
    startTransition(async () => {
      await deleteRouteAction(route.id);
      router.push("/rota/rotas");
      router.refresh();
    });
  }

  const mapPoints = useMemo(
    () =>
      stops
        .filter((s) => s.lat != null && s.lng != null)
        .map((s, i) => ({
          id: s.id,
          label: `${i + 1}. ${s.title}`,
          lat: s.lat!,
          lng: s.lng!,
          index: i,
        })),
    [stops],
  );

  const itinerary = useMemo(() => {
    const pts: Array<[number, number]> = [];
    if (route.startLat != null && route.startLng != null) {
      pts.push([route.startLat, route.startLng]);
    }
    for (const p of mapPoints) pts.push([p.lat, p.lng]);
    return pts;
  }, [mapPoints, route.startLat, route.startLng]);

  const optimized = route.status === "OTIMIZADO" || route.status === "EM_ANDAMENTO";
  const doneCount = stops.filter(
    (s) => s.status === "FEITO" || s.status === "PULADO",
  ).length;
  const hasDone = doneCount > 0;
  const hasPending = doneCount < stops.length;

  const explanations = useMemo(() => {
    if (!optimized || !reasons) return [];
    return stops.map((stop, i) => {
      const prev =
        i === 0
          ? route.startAddress ?? "o ponto de partida"
          : stops[i - 1]!.title;
      const isNearest = reasons[stop.id] !== false;
      const leg = stop.distanceFromPreviousMeters ?? 0;
      return {
        title: stop.title,
        prev,
        isNearest,
        distance: formatDistance(leg),
        minutes: stop.travelMinutes,
      };
    });
  }, [optimized, reasons, stops, route.startAddress]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              {route.name ?? "Rota"}
            </h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {routeStatusLabels[route.status]}
            </span>
          </div>
          <p className="text-sm text-zinc-500">{route.displayDate}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/rota/rotas"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Voltar
          </Link>
          <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </div>

      <section className="mb-4">
        <button
          type="button"
          onClick={() => setShowSettings((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
        >
          {showSettings ? "Fechar configurações" : "Configurações da rota (data, origem e horário)"}
          <span className="text-xs text-zinc-400">
            {formatRouteTime(route.startTime, tz)}
            {route.startAddress ? ` · ${route.startAddress}` : ""}
          </span>
        </button>

        {showSettings && (
          <Card className="mt-3 p-4">
            <RouteSettings
              routeId={route.id}
              date={route.date}
              name={route.name}
              startAddress={route.startAddress}
              startTimeIso={route.startTime}
              tz={tz}
            />
          </Card>
        )}
      </section>

      <div className="mb-4 text-right text-xs text-zinc-500">
        <span>
          {stops.length} parada{stops.length === 1 ? "" : "s"}
        </span>
        {doneCount > 0 && (
          <>
            {" · "}
            <span className={doneCount === stops.length ? "font-semibold text-green-600 dark:text-green-400" : ""}>
              {doneCount}/{stops.length} {doneCount === stops.length ? "concluídas ✓" : "concluídas"}
            </span>
          </>
        )}
        {(optimized || route.totalDistanceMeters != null) &&
          route.totalDistanceMeters != null && (
            <>
              {" · "}
              {formatDistance(route.totalDistanceMeters)}
              {route.totalDurationMinutes != null &&
                ` · ${formatDuration(route.totalDurationMinutes)}`}
            </>
          )}
      </div>

      {bannerError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {bannerError}
        </p>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-6">
        <div className="min-w-0">
          <RouteStopList
            stops={stops}
            tz={tz}
            onReorder={handleReorder}
            onRemove={handleRemove}
            onStatusChange={handleStatusChange}
          />

          {stops.length > 0 && (
            <div className="mt-4">
              <Button
                onClick={handleOptimize}
                disabled={pending}
                variant="secondary"
                className="w-full py-3 text-base"
              >
                {pending
                  ? "Otimizando…"
                  : optimized
                    ? "Reotimizar rota"
                    : "Otimizar rota"}
              </Button>
              {hasDone && hasPending && (
                <Button
                  onClick={handleOptimizeRemaining}
                  disabled={pending}
                  variant="ghost"
                  className="mt-2 w-full text-sm"
                >
                  Reotimizar apenas o restante
                </Button>
              )}
              <p className="mt-2 text-center text-[11px] text-zinc-400">
                Reordena as paradas para encurtar o caminho partindo da origem.
              </p>
            </div>
          )}

          {explanations.length > 0 && (
            <details className="mt-4 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <summary className="cursor-pointer text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Por que esta ordem?
              </summary>
              <ol className="mt-2 space-y-1 text-xs text-zinc-500">
                {explanations.map((e) => (
                  <li key={e.title}>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      {e.title}
                    </span>{" "}
                    — {e.isNearest ? `mais próxima de ${e.prev}` : "parada sem coordenadas"} (
                    {e.distance}
                    {e.minutes != null && e.minutes > 0
                      ? ` · ${formatDuration(e.minutes)}`
                      : ""}
                    )
                  </li>
                ))}
              </ol>
            </details>
          )}

          <section className="mt-8">
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
            >
              {showAdd ? "Fechar formulário" : "+ Adicionar parada"}
            </button>

            {showAdd && (
              <Card className="mt-3 p-4">
                <AddStopPanel routeId={route.id} customers={customers} stops={stops} />
              </Card>
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