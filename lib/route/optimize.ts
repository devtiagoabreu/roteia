import { haversineMeters } from "@/lib/maps/route";
import { TRANSPORT_KMH } from "@/lib/day/optimize";

export type RouteStopPriority = "AUTO" | "PRIMEIRA" | "ULTIMA";

export type RouteStopLike = {
  key: string;
  lat?: number | null;
  lng?: number | null;
  serviceMinutes?: number;
  windowStart?: Date | null;
  windowEnd?: Date | null;
  priority?: RouteStopPriority;
};

export type PlannedRouteStop = {
  key: string;
  plannedStart: Date;
  plannedEnd: Date;
  travelMinutes: number;
  distanceMeters: number;
  conflict?: string | null;
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

function formatTime(d: Date): string {
  return d
    .toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace("24:", "00:");
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

  for (const stop of orderedStops) {
    const travel = travelStats(prev, stop, kmh);
    const earliest = new Date(
      cursor.getTime() + travel.travelMinutes * 60000,
    );
    const plannedStart =
      stop.windowStart && stop.windowStart.getTime() > earliest.getTime()
        ? stop.windowStart
        : earliest;
    const serviceMinutes = stop.serviceMinutes ?? 0;
    const plannedEnd = new Date(
      plannedStart.getTime() + serviceMinutes * 60000,
    );
    let conflict: string | null = null;
    if (stop.windowEnd && plannedEnd.getTime() > stop.windowEnd.getTime() + 60000) {
      conflict = `Fora da janela: termina às ${formatTime(plannedEnd)}, janela até ${formatTime(stop.windowEnd)}.`;
    }
    ordered.push({
      key: stop.key,
      plannedStart,
      plannedEnd,
      travelMinutes: travel.travelMinutes,
      distanceMeters: travel.distanceMeters,
      conflict,
    });
    cursor = plannedEnd;
    if (hasCoord(stop)) prev = stop;
  }

  const last = ordered[ordered.length - 1];
  const totalDurationMinutes =
    last != null
      ? Math.max(0, Math.round((last.plannedEnd.getTime() - start.getTime()) / 60000))
      : 0;

  return {
    ordered,
    totalDistanceMeters: ordered.reduce(
      (acc, s) => acc + s.distanceMeters,
      0,
    ),
    totalDurationMinutes,
  };
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
 * Otimiza a sequência por vizinho mais próximo, respeitando a prioridade
 * First/Last/Auto: paradas `PRIMEIRA` permanecem no início (ordem humana),
 * paradas `ULTIMA` no fim (ordem humana) e o meio é reordenado do mais
 * próximo. Paradas sem coordenadas permanecem ao final, na ordem original.
 */
export function optimizeRouteOrder(
  stops: RouteStopLike[],
  origin: { lat?: number | null; lng?: number | null } | null,
  start: Date,
  kmh: number = TRANSPORT_KMH.CARRO,
): RoutePlan {
  const first = stops.filter((s) => s.priority === "PRIMEIRA");
  const last = stops.filter((s) => s.priority === "ULTIMA");
  const middle = stops.filter(
    (s) => s.priority !== "PRIMEIRA" && s.priority !== "ULTIMA",
  );

  const withCoords = middle.filter(hasCoord);
  const withoutCoords = middle.filter((s) => !hasCoord(s));

  let prevPoint: { lat?: number | null; lng?: number | null } | null = origin;
  const placed: RouteStopLike[] = [];
  for (const s of first) {
    placed.push(s);
    if (hasCoord(s)) prevPoint = s;
  }

  const remaining = [...withCoords];
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

  placed.push(...withoutCoords, ...last);
  return buildPlan(placed, origin, start, kmh);
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