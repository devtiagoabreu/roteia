import type { Priority, TimeType } from "@/generated/prisma/client";
import { haversineMeters } from "@/lib/maps/route";

export type OptimizableStop = {
  key: string;
  lat?: number | null;
  lng?: number | null;
  priority: Priority;
  timeType: TimeType;
  startAt?: Date | null;
  windowStart?: Date | null;
  windowEnd?: Date | null;
  durationMinutes: number;
  marginMinutes?: number | null;
};

export type PlannedStop = {
  key: string;
  plannedStart: Date;
  plannedEnd: Date;
  travelMinutes: number;
  distanceMeters: number;
  conflict?: string | null;
};

export type DayPlan = {
  ordered: PlannedStop[];
  totalDistanceMeters: number;
  totalDurationMinutes: number;
};

type Entry = {
  stop: OptimizableStop;
  plannedStart: Date;
  plannedEnd: Date;
  travelMinutes: number;
  distanceMeters: number;
  conflict: string | null;
};

const DEFAULT_MARGIN_MINUTES = 10;

export const TRANSPORT_KMH = {
  CARRO: 30,
  MOTO: 35,
  BICICLETA: 16,
  PEDESTRE: 5,
} as const;

export type TransportMode = keyof typeof TRANSPORT_KMH;

function formatTime(d: Date): string {
  return d
    .toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace("24:", "00:");
}

function totalMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

function travelStats(
  from: { lat?: number | null; lng?: number | null } | null,
  to: OptimizableStop,
  kmh = 30,
): { distanceMeters: number; travelMinutes: number } {
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

export function buildDayPlan(
  stops: OptimizableStop[],
  origin: { lat?: number | null; lng?: number | null } | null,
  start: Date,
  kmh: number = TRANSPORT_KMH.CARRO,
): DayPlan {
  const order: Record<Priority, number> = {
    ESSENCIAL: 0,
    ALTA: 1,
    NORMAL: 2,
    BAIXA: 3,
  };

  const anchors = stops
    .filter((s) => s.timeType === "FIXO" && s.startAt != null)
    .sort((a, b) => a.startAt!.getTime() - b.startAt!.getTime());

  const windowed = stops
    .filter(
      (s) =>
        !(s.timeType === "FIXO" && s.startAt != null) &&
        s.timeType === "JANELA",
    )
    .sort(
      (a, b) =>
        (a.windowStart?.getTime() ?? 0) - (b.windowStart?.getTime() ?? 0),
    );

  const flexible = stops
    .filter(
      (s) =>
        !(s.timeType === "FIXO" && s.startAt != null) &&
        s.timeType !== "JANELA",
    )
    .sort((a, b) => {
      const p = order[a.priority] - order[b.priority];
      if (p !== 0) return p;
      return (a.windowStart?.getTime() ?? 0) - (b.windowStart?.getTime() ?? 0);
    });

  const initial = [...anchors, ...windowed, ...flexible];
  const entries: Entry[] = [];
  let mastersCount = 0;

  for (const stop of initial) {
    const isMaster = stop.timeType === "FIXO" && stop.startAt != null;
    const scale: Record<TimeType, number> = {
      FIXO: 1000,
      JANELA: 100,
      FLEXIVEL: 1,
    };
    const scaleValue = scale[stop.timeType];

    let bestScore = Infinity;
    let bestPlan: Entry[] | null = null;

    // Horários fixos mantêm o slot canônico (ordem cronológica já garantida
    // pelo sort de `anchors`) e nada é inserido antes deles.
    const probePositions = isMaster
      ? [entries.length]
      : Array.from(
          { length: entries.length - mastersCount + 1 },
          (_, i) => mastersCount + i,
        );
    if (isMaster) mastersCount++;

    for (const i of probePositions) {
      const candidate = schedule(entries, stop, start, origin, i, kmh);
      if (!candidate) continue;
      const last = candidate[candidate.length - 1]!;
      const score =
        totalMinutes(start, last.plannedEnd) * 2 +
        candidate.reduce((sum, e) => sum + e.distanceMeters, 0) +
        scaleValue * (i === entries.length ? 0 : 1);

      if (score < bestScore && last.plannedEnd.getTime() >= start.getTime()) {
        bestScore = score;
        bestPlan = candidate;
      }
    }

    const applied =
      bestPlan ?? schedule(entries, stop, start, origin, entries.length, kmh);
    entries.length = 0;
    entries.push(...(applied ?? []));
  }

  const ordered = toPlanned(entries);
  const stats = totalStats(entries, start);
  return {
    ordered,
    totalDistanceMeters: stats.totalDistanceMeters,
    totalDurationMinutes: stats.totalDurationMinutes,
  };
}

function schedule(
  entriesIn: Entry[],
  stop: OptimizableStop,
  start: Date,
  origin: { lat?: number | null; lng?: number | null } | null,
  insertAt: number,
  kmh: number = TRANSPORT_KMH.CARRO,
): Entry[] | null {
  const entries = entriesIn.map((e) => ({ ...e }));
  entries.splice(insertAt, 0, {
    stop,
    plannedStart: new Date(),
    plannedEnd: new Date(),
    travelMinutes: 0,
    distanceMeters: 0,
    conflict: null,
  });

  let cursor: Date | null = null;
  let prevPoint: { lat?: number | null; lng?: number | null } | null = origin;

  for (const entry of entries) {
    const { stop: s } = entry;
    const margin = s.marginMinutes ?? DEFAULT_MARGIN_MINUTES;

    let travel = { distanceMeters: 0, travelMinutes: 0 };
    const hasCoords = s.lat != null && s.lng != null;
    if (hasCoords) {
      travel = travelStats(prevPoint, s, kmh);
    }
    entry.travelMinutes = travel.travelMinutes;
    entry.distanceMeters = travel.distanceMeters;

    const earliest =
      cursor == null ? start : new Date(cursor.getTime() + margin * 60000);
    if (cursor != null) {
      earliest.setTime(
        earliest.getTime() + entry.travelMinutes * 60000,
      );
    } else {
      earliest.setTime(earliest.getTime() + entry.travelMinutes * 60000);
    }

    let plannedStart = earliest;
    let conflict: string | null = null;

    if (s.timeType === "FIXO" && s.startAt) {
      if (s.startAt.getTime() < plannedStart.getTime() - 30000) {
        conflict = `Conflito: horário fixo ${formatTime(s.startAt)}, mas o anterior termina às ${formatTime(plannedStart)}.`;
      }
      plannedStart = s.startAt;
    } else if (
      (s.windowStart != null || s.windowEnd != null) &&
      s.timeType === "JANELA"
    ) {
      if (s.windowStart && s.windowStart > earliest) {
        plannedStart = s.windowStart;
      }
      const plannedEnd = plannedStart.getTime() + s.durationMinutes * 60000;
      if (s.windowEnd && plannedEnd > s.windowEnd.getTime() + 60000) {
        conflict = `Fora da janela: termina às ${formatTime(new Date(plannedEnd))}, janela até ${formatTime(s.windowEnd)}.`;
      }
    }

    entry.plannedStart = plannedStart;
    entry.plannedEnd = new Date(
      plannedStart.getTime() + s.durationMinutes * 60000,
    );
    entry.conflict = conflict;

    cursor = entry.plannedEnd;
    if (hasCoords) {
      prevPoint = { lat: s.lat, lng: s.lng };
    }
  }

  return entries;
}

export function hasCoord(
  s: { lat?: number | null; lng?: number | null },
): s is { lat: number; lng: number } {
  return s.lat != null && s.lng != null;
}

function toPlanned(entries: Entry[]): PlannedStop[] {
  return entries.map((e) => ({
    key: e.stop.key,
    plannedStart: e.plannedStart,
    plannedEnd: e.plannedEnd,
    travelMinutes: e.travelMinutes,
    distanceMeters: e.distanceMeters,
    conflict: e.conflict,
  }));
}

function totalStats(
  entries: Entry[],
  start: Date,
): { totalDurationMinutes: number; totalDistanceMeters: number } {
  const last = entries[entries.length - 1];
  const totalDurationMinutes =
    entries.length > 0 && last
      ? totalMinutes(start, last.plannedEnd)
      : 0;
  const totalDistanceMeters = entries.reduce(
    (sum, e) => sum + e.distanceMeters,
    0,
  );
  return { totalDurationMinutes, totalDistanceMeters };
}

/**
 * Agenda as paradas na ordem fornecida (sem reordenar),
 * respeitando horários fixos/janelas e buscando o menor
 * deslocamento; usado no recalculo do restante durante execução.
 */
export function planInOrder(
  stops: OptimizableStop[],
  origin: { lat?: number | null; lng?: number | null } | null,
  start: Date,
  kmh: number = TRANSPORT_KMH.CARRO,
): DayPlan {
  let entries: Entry[] = [];
  for (const stop of stops) {
    const applied = schedule(entries, stop, start, origin, entries.length, kmh);
    if (applied) entries = applied;
  }

  const ordered = toPlanned(entries);
  const stats = totalStats(entries, start);
  return {
    ordered,
    totalDistanceMeters: stats.totalDistanceMeters,
    totalDurationMinutes: stats.totalDurationMinutes,
  };
}