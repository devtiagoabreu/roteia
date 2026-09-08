"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

function FitView({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const zoom = Math.max(map.getZoom(), 16);
    map.setView(pos, zoom);
  }, [map, pos]);
  return null;
}

function dragIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
        width:22px;height:22px;border-radius:50%;
        background:#2563eb;border:3px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,.45);cursor:grab;
      "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function CoordinateMap({
  coords,
  onPick,
}: {
  coords: { lat: number; lng: number } | null;
  onPick: (c: { lat: number; lng: number }) => void;
}) {
  const fallback = useMemo<[number, number]>(
    () => [coords?.lat ?? -15.7939, coords?.lng ?? -47.8828],
    [coords],
  );
  const [pos, setPos] = useState<[number, number]>(fallback);

  if (coords && (coords.lat !== pos[0] || coords.lng !== pos[1])) {
    setPos([coords.lat, coords.lng]);
  }

  return (
    <div className="h-56 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <MapContainer
        center={pos}
        zoom={16}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={pos}
          draggable
          icon={dragIcon()}
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onPick({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
        <FitView pos={pos} />
      </MapContainer>
      <div className="border-t border-zinc-200 bg-white px-3 py-1.5 text-[11px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
        Arraste o marcador para ajustar a posição exata.
      </div>
    </div>
  );
}