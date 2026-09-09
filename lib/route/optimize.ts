import { haversineMeters } from "@/lib/maps/route";
import { TRANSPORT_KMH } from "@/lib/day/optimize";

export type RouteStopLike = {
  key: string;
  lat?: number | null;
  lng?: number | null;
};

export type PlannedRouteStop = {
  key: string;
  plannedStart: Date;
  plannedEnd: Date;
  travelMinutes: number;
  distanceMeters: number;
};

export type RoutePlan = {
  ordered: PlannedRouteStop[];
  totalDistanceMeters: number;
  totalDurationMinutes: number;
};

type Travel = { distanceMeters: number; travelMinutes: number };

function travelStats(
  from: { lat?: number | null; lng?: number | null } | null,
  to: RouteStopLike,
  kmh: number,
): Travel {
  if (
    !from ||
    from.lat == null ||
    from.lng == null ||
    to.lat == null ||
    to.lng == null
  ) {
    return { distanceMeters: 0, travelMinutes: 0 };
  }
  const distance = haversineMeters(
    { lat: from.lat, lng: from.lng },
    { lat: to.lat, lng: to.lng },
  );
  const withStreets = distance * 1.3;
  const travelMinutes = Math.round((withStreets / 1000 / kmh) * 60);
  return { distanceMeters: Math.round(withStreets), travelMinutes };
}

export function hasCoord(
  s: RouteStopLike,
): s is { key: string; lat: number; lng: number } {
  return s.lat != null && s.lng != null;
}

function buildPlan(
  orderedStops: RouteStopLike[],
  origin: { lat?: number | null; lng?: number | null } | null,
  start: Date,
  kmh: number,
): RoutePlan {
  const ordered: PlannedRouteStop[] = [];
  let cursor = start;
  let prev = origin;
  let totalDistanceMeters = 0;

  for (const stop of orderedStops) {
    const travel = travelStats(prev, stop, kmh);
    const plannedStart = new Date(cursor.getTime() + travel.travelMinutes * 60000);
    const plannedEnd = plannedStart;
    ordered.push({
      key: stop.key,
      plannedStart,
      plannedEnd,
      travelMinutes: travel.travelMinutes,
      distanceMeters: travel.distanceMeters,
    });
    totalDistanceMeters += travel.distanceMeters;
    cursor = plannedEnd;
    if (hasCoord(stop)) prev = stop;
  }

  const last = ordered[ordered.length - 1];
  const totalDurationMinutes =
    last != null
      ? Math.max(0, Math.round((last.plannedStart.getTime() - start.getTime()) / 60000))
      : 0;

  return { ordered, totalDistanceMeters, totalDurationMinutes };
}

/**
 * Agenda as paradas na ordem fornecida (sem reordenar), recalculando
 * deslocamento e horários — usado após adicionar/remover/reordenar.
 */
export function planRouteInOrder(
  stops: RouteStopLike[],
  origin: { lat?: number | null; lng?: number | null } | null,
  start: Date,
  kmh: number = TRANSPORT_KMH.CARRO,
): RoutePlan {
  return buildPlan(stops, origin, start, kmh);
}

/**
 * Otimiza a sequência por vizinho mais próximo: sai da origem (quando
 * houver coordenadas) e sempre visita a parada não visitada mais próxima.
 * Paradas sem coordenadas permanecem ao final, na ordem original.
 */
export function optimizeRouteOrder(
  stops: RouteStopLike[],
  origin: { lat?: number | null; lng?: number | null } | null,
  start: Date,
  kmh: number = TRANSPORT_KMH.CARRO,
): RoutePlan {
  const withCoords = stops.filter(hasCoord);
  const withoutCoords = stops.filter((s) => !hasCoord(s));

  const placed: RouteStopLike[] = [];
  const remaining = [...withCoords];
  let prevPoint: { lat?: number | null; lng?: number | null } | null = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = travelStats(prevPoint, remaining[i]!, TRANSPORT_KMH.CARRO)
        .distanceMeters;
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    const next = remaining.splice(bestIndex, 1)[0]!;
    placed.push(next);
    prevPoint = next;
  }

  return buildPlan([...placed, ...withoutCoords], origin, start, kmh);
}

/**
 * Para cada parada na ordem final, indica se ela foi escolhida por ser a
 * mais próxima da parada anterior (regra do vizinho mais próximo) — usado
 * para explicar a ordem da otimização. Paradas sem coordenadas → false.
 */
export function nearestReasons(
  ordered: RouteStopLike[],
  origin: { lat?: number | null; lng?: number | null } | null,
): Record<string, boolean> {
  const reasons: Record<string, boolean> = {};
  const placed = new Set<string>();
  let prev = origin;

  for (const stop of ordered) {
    if (!hasCoord(stop)) {
      reasons[stop.key] = false;
      continue;
    }
    const dThis = travelStats(prev, stop, TRANSPORT_KMH.CARRO).distanceMeters;
    let nearest = true;
    for (const other of ordered) {
      if (placed.has(other.key) || !hasCoord(other) || other.key === stop.key) {
        continue;
      }
      const dOther = travelStats(prev, other, TRANSPORT_KMH.CARRO).distanceMeters;
      if (dOther < dThis) {
        nearest = false;
        break;
      }
    }
    reasons[stop.key] = nearest;
    placed.add(stop.key);
    prev = stop;
  }

  return reasons;
}