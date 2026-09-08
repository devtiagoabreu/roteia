"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

export type MapPoint = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  index: number;
  done?: boolean;
  next?: boolean;
};

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
    }
  }, [map, points]);
  return null;
}

function markerIcon(index: number, done?: boolean, next?: boolean) {
  const bg = next ? "#f59e0b" : done ? "#10b981" : "#18181b";
  const ring = next ? "4px solid #fde68a" : "2px solid #fff";
  return L.divIcon({
    className: "",
    html: `<div style="
        display:flex;align-items:center;justify-content:center;
        width:26px;height:26px;border-radius:50%;
        background:${bg};
        color:#fff;font-size:12px;font-weight:700;
        border:${ring};box-shadow:0 2px 6px rgba(0,0,0,.35);
      ">${index + 1}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

export function LeafletMap({
  points,
  itinerary,
  className,
}: {
  points: MapPoint[];
  itinerary: Array<[number, number]>;
  className?: string;
}) {
  const center = useMemo<[number, number]>(() => [0, 0] as [number, number], []);
  const coords = useMemo(
    () => (points[0] ? ([points[0].lat, points[0].lng] as [number, number]) : center),
    [points, center],
  );

  return (
    <div className={`h-64 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${className ?? ""}`}>
      <MapContainer
        center={coords}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {itinerary.length > 1 && <Polyline positions={itinerary} color="#18181b" />}
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={markerIcon(p.index, p.done, p.next)}
          >
            <Popup>{p.label}</Popup>
          </Marker>
        ))}
        <FitBounds points={[...points.map((p) => [p.lat, p.lng] as [number, number])]} />
      </MapContainer>
    </div>
  );
}