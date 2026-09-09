import type { RouteStatus } from "@/generated/prisma/client";

export type RouteStopDto = {
  id: string;
  customerId: string | null;
  position: number;
  title: string;
  notes: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  plannedStartAt: string | null;
  travelMinutes: number | null;
  distanceFromPreviousMeters: number | null;
};

export type RouteCustomerOption = {
  id: string;
  name: string;
  code: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export type RouteDto = {
  id: string;
  date: string;
  displayDate: string;
  name: string | null;
  status: RouteStatus;
  startAddress: string | null;
  startLat: number | null;
  startLng: number | null;
  startTime: string | null;
  totalDistanceMeters: number | null;
  totalDurationMinutes: number | null;
  stopCount: number;
};

export const routeStatusLabels: Record<RouteStatus, string> = {
  RASCUNHO: "rascunho",
  OTIMIZADO: "otimizada",
  EM_ANDAMENTO: "em andamento",
  CONCLUIDO: "concluída",
  ARQUIVADO: "arquivada",
};

export function formatRouteTime(
  iso: string | null,
  tz: string,
): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}