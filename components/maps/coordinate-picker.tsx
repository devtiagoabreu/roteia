"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(
  () =>
    import("@/components/maps/coordinate-map").then((m) => m.CoordinateMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
    ),
  },
);

export function CoordinatePicker({
  coords,
  onPick,
}: {
  coords: { lat: number; lng: number } | null;
  onPick: (c: { lat: number; lng: number }) => void;
}) {
  return <Inner coords={coords} onPick={onPick} />;
}