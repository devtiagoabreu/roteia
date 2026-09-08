"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/day/leaflet-map";

const LeafletMap = dynamic(
  () =>
    import("@/components/day/leaflet-map").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div className="flex h-64 w-full items-center justify-center rounded-xl border border-zinc-200 text-sm text-zinc-400 dark:border-zinc-800">
      Carregando mapa…
    </div>
  );
}

export function MapPanel({
  points,
  itinerary,
}: {
  points: MapPoint[];
  itinerary: Array<[number, number]>;
}) {
  if (points.length === 0) return null;
  return <LeafletMap points={points} itinerary={itinerary} />;
}