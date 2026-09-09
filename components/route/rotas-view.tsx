"use client";

import Link from "next/link";
import { useState } from "react";
import {
  routeStatusLabels,
  formatRouteTime,
  type RouteDto,
} from "@/components/route/types";
import { RouteCreateForm } from "@/components/route/route-create-form";
import { Button, Card } from "@/components/ui";
import { formatDistance, formatDuration } from "@/lib/format";

export function RotasView({
  routes,
  tz,
}: {
  routes: RouteDto[];
  tz: string;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {routes.length === 0
            ? "Nenhuma rota criada ainda."
            : `${routes.length} rota${routes.length === 1 ? "" : "s"} planejada${routes.length === 1 ? "" : "s"}.`}
        </p>
        <Button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          variant={showCreate ? "ghost" : "primary"}
          className="px-3 py-1.5 text-xs"
        >
          {showCreate ? "Fechar" : "+ Nova rota"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <RouteCreateForm tz={tz} onDone={() => setShowCreate(false)} />
        </Card>
      )}

      {routes.length > 0 && (
        <ul className="space-y-2">
          {routes.map((route) => (
            <li key={route.id}>
              <Link
                href={`/rota/rotas/${route.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {route.name ?? "Rota sem nome"}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {route.displayDate}
                  </span>
                  <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {routeStatusLabels[route.status]}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span>{route.stopCount} parada{route.stopCount === 1 ? "" : "s"}</span>
                  {route.startTime && (
                    <span>início {formatRouteTime(route.startTime, tz)}</span>
                  )}
                  {route.startAddress && <span>{route.startAddress}</span>}
                  {route.totalDistanceMeters != null && (
                    <span>{formatDistance(route.totalDistanceMeters)}</span>
                  )}
                  {route.totalDurationMinutes != null && (
                    <span>{formatDuration(route.totalDurationMinutes)}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}