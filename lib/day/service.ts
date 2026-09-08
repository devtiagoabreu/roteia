import { db } from "@/lib/db";
import { buildDayPlan, planInOrder, TRANSPORT_KMH } from "@/lib/day/optimize";
import { timeInTz, toDate } from "@/lib/date";
import { ApiError } from "@/lib/api-error";
import type { Day, DayStop } from "@/generated/prisma/client";

export async function getOrCreateDay(
  tenantId: string,
  dateIso: string,
): Promise<Day> {
  const date = toDate(dateIso);
  const existing = await db.day.findUnique({
    where: { tenantId_date: { tenantId, date } },
  });
  if (existing) return existing;

  return db.day.create({
    data: { tenantId, date },
  });
}

export async function getDayWithStops(
  tenantId: string,
  dateIso: string,
): Promise<{ day: Day; stops: DayStop[] }> {
  const day = await getOrCreateDay(tenantId, dateIso);
  const stops = await db.dayStop.findMany({
    where: { dayId: day.id },
    orderBy: { position: "asc" },
  });
  return { day, stops };
}

export async function addActivityToDay(
  tenantId: string,
  dayId: string,
  activityId: string,
): Promise<DayStop> {
  const day = await db.day.findFirst({ where: { id: dayId, tenantId } });
  if (!day) throw new ApiError("DAY_NOT_FOUND", 404, "Dia não encontrado.");

  const activity = await db.activity.findFirst({
    where: { id: activityId, tenantId },
  });
  if (!activity) {
    throw new ApiError("ACTIVITY_NOT_FOUND", 404, "Atividade não encontrada.");
  }

  const { _max } = await db.dayStop.aggregate({
    where: { dayId },
    _max: { position: true },
  });

  return db.dayStop.create({
    data: {
      dayId,
      activityId: activity.id,
      position: (_max.position ?? -1) + 1,
      title: activity.title,
      notes: activity.notes,
      address: activity.address,
      lat: activity.lat,
      lng: activity.lng,
      priority: activity.priority,
      timeType: activity.timeType,
      startAt: activity.startAt,
      windowStartAt: activity.windowStart,
      windowEndAt: activity.windowEnd,
      plannedStartAt: null,
      plannedEndAt: null,
      durationMinutes: activity.durationMinutes,
      marginMinutes: activity.marginMinutes,
    },
  });
}

export async function removeDayStop(
  tenantId: string,
  stopId: string,
): Promise<void> {
  const stop = await db.dayStop.findFirst({
    where: { id: stopId, day: { tenantId } },
    include: { day: true },
  });
  if (!stop) throw new ApiError("STOP_NOT_FOUND", 404);

  await db.$transaction(async (tx) => {
    await tx.dayStop.delete({ where: { id: stopId } });
    const remaining = await tx.dayStop.findMany({
      where: { dayId: stop.dayId },
      orderBy: { position: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.dayStop.update({
        where: { id: remaining[i]!.id },
        data: { position: i },
      });
    }
  });
}

export async function reorderDayStops(
  tenantId: string,
  dayId: string,
  orderedStopIds: string[],
): Promise<void> {
  const day = await db.day.findFirst({ where: { id: dayId, tenantId } });
  if (!day) throw new ApiError("DAY_NOT_FOUND", 404, "Dia não encontrado.");

  await db.$transaction(async (tx) => {
    for (let i = 0; i < orderedStopIds.length; i++) {
      await tx.dayStop.updateMany({
        where: { id: orderedStopIds[i], dayId },
        data: { position: i },
      });
    }
    await tx.day.update({
      where: { id: dayId },
      data: { version: { increment: 1 } },
    });
  });
}

export async function setStopStatus(
  tenantId: string,
  stopId: string,
  status: DayStop["status"],
): Promise<void> {
  const stop = await db.dayStop.findFirst({
    where: { id: stopId, day: { tenantId } },
  });
  if (!stop) throw new ApiError("STOP_NOT_FOUND", 404);

  await db.$transaction(async (tx) => {
    await tx.dayStop.update({
      where: { id: stopId },
      data: {
        status,
        startedAt:
          status === "EM_ANDAMENTO"
            ? stop.startedAt ?? new Date()
            : status === "PENDENTE"
              ? null
              : stop.startedAt,
        finishedAt:
          status === "FEITO"
            ? new Date()
            : status === "PENDENTE"
              ? null
              : stop.finishedAt,
      },
    });
    if (status === "FEITO") {
      await tx.activity
        .updateMany({
          where: { id: stop.activityId ?? "", tenantId },
          data: { completedAt: new Date() },
        })
        .catch(() => {});
    }

    const stops = await tx.dayStop.findMany({
      where: { dayId: stop.dayId },
      select: { status: true },
    });
    if (stops.length === 0) return;
    const doneOrSkipped = stops.every(
      (s) => s.status === "FEITO" || s.status === "PULADO",
    );
    const inProgress = stops.some((s) => s.status === "EM_ANDAMENTO");
    if (doneOrSkipped) {
      await tx.day.update({
        where: { id: stop.dayId },
        data: { status: "CONCLUIDO", version: { increment: 1 } },
      });
    } else if (inProgress) {
      await tx.day.update({
        where: { id: stop.dayId },
        data: { status: "EM_ANDAMENTO", version: { increment: 1 } },
      });
    }
  });
}

export async function optimizeDay(tenantId: string, dayId: string): Promise<Day> {
  const day = await db.day.findFirst({
    where: { id: dayId, tenantId },
    include: {
      stops: { orderBy: { position: "asc" } },
      tenant: true,
    },
  });
  if (!day) throw new ApiError("DAY_NOT_FOUND", 404, "Dia não encontrado.");

  const tz = day.tenant.timezone;
  const dayIso = day.date.toISOString().slice(0, 10);
  const start =
    day.startTime ?? timeInTz(dayIso, "08:00", tz);

  const plan = buildDayPlan(
    day.stops.map((s) => ({
      key: s.id,
      lat: s.lat,
      lng: s.lng,
      priority: s.priority,
      timeType: s.timeType,
      startAt: s.startAt,
      windowStart: s.windowStartAt,
      windowEnd: s.windowEndAt,
      durationMinutes: s.durationMinutes,
      marginMinutes: s.marginMinutes,
    })),
    {
      lat: day.startLat,
      lng: day.startLng,
    },
    start,
    TRANSPORT_KMH[day.tenant.transportMode],
  );

  const byKey = new Map(
    plan.ordered.map((p, idx) => [p.key, { ...p, index: idx }]),
  );

  await db.$transaction(async (tx) => {
    for (const stop of day.stops) {
      const planned = byKey.get(stop.id);
      await tx.dayStop.update({
        where: { id: stop.id },
        data: {
          position: -(planned?.index ?? stop.position) - 1,
          plannedStartAt: planned?.plannedStart ?? null,
          plannedEndAt: planned?.plannedEnd ?? null,
          travelMinutes: planned?.travelMinutes ?? null,
          distanceFromPreviousMeters: planned?.distanceMeters ?? null,
          conflict: planned?.conflict ?? null,
        },
      });
    }
    for (const stop of day.stops) {
      const planned = byKey.get(stop.id);
      await tx.dayStop.update({
        where: { id: stop.id },
        data: { position: planned?.index ?? stop.position },
      });
    }
  });

  const updated = await db.day.update({
    where: { id: dayId },
    data: {
      totalDistanceMeters: plan.totalDistanceMeters,
      totalDurationMinutes: plan.totalDurationMinutes,
      status: "OTIMIZADO",
      version: { increment: 1 },
    },
  });

  await db.auditLog.create({
    data: {
      tenantId,
      action: "OPTIMIZE",
      entityType: "Day",
      entityId: dayId,
    },
  });

  return updated;
}

export async function listOpenActivities(
  tenantId: string,
): Promise<Awaited<ReturnType<typeof db.activity.findMany>>> {
  return db.activity.findMany({
    where: { tenantId, completedAt: null },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function listDaysOverview(
  tenantId: string,
): Promise<Array<Day & { _count: { stops: number } }>> {
  return db.day.findMany({
    where: { tenantId, stops: { some: {} } },
    include: { _count: { select: { stops: true } } },
    orderBy: { date: "desc" },
    take: 60,
  });
}

export async function deleteDay(
  tenantId: string,
  dayId: string,
): Promise<void> {
  const day = await db.day.findFirst({ where: { id: dayId, tenantId } });
  if (!day) throw new ApiError("DAY_NOT_FOUND", 404, "Dia não encontrado.");
  await db.day.delete({ where: { id: dayId } });
}

export async function updateDaySettings(
  tenantId: string,
  dayId: string,
  opts: {
    startAddress: string | null;
    startLat: number | null;
    startLng: number | null;
    startTime: Date | null;
    endAddress: string | null;
    endLat: number | null;
    endLng: number | null;
  },
): Promise<Day> {
  const day = await db.day.findFirst({ where: { id: dayId, tenantId } });
  if (!day) throw new ApiError("DAY_NOT_FOUND", 404, "Dia não encontrado.");

  return db.day.update({
    where: { id: dayId },
    data: {
      startAddress: opts.startAddress,
      startLat: opts.startLat,
      startLng: opts.startLng,
      startTime: opts.startTime,
      endAddress: opts.endAddress,
      endLat: opts.endLat,
      endLng: opts.endLng,
      version: { increment: 1 },
    },
  });
}

export async function rescheduleRemainingStops(
  tenantId: string,
  dayId: string,
  now: Date,
): Promise<{ rescheduled: number } | null> {
  const day = await db.day.findFirst({
    where: { id: dayId, tenantId },
    include: {
      stops: { orderBy: { position: "asc" } },
      tenant: true,
    },
  });
  if (!day) throw new ApiError("DAY_NOT_FOUND", 404, "Dia não encontrado.");

  const stops = day.stops;
  const remaining = stops.filter(
    (s) => s.status === "PENDENTE" || s.status === "EM_ANDAMENTO",
  );
  if (remaining.length === 0) return null;

  const firstIndex = stops.findIndex((s) => s.id === remaining[0]!.id);
  const prev = firstIndex > 0 ? stops[firstIndex - 1] : null;
  const origin =
    prev != null && prev.lat != null && prev.lng != null
      ? { lat: prev.lat, lng: prev.lng }
      : { lat: day.startLat, lng: day.startLng };

  const plan = planInOrder(
    remaining.map((s) => ({
      key: s.id,
      lat: s.lat,
      lng: s.lng,
      priority: s.priority,
      timeType: s.timeType,
      startAt: s.startAt,
      windowStart: s.windowStartAt,
      windowEnd: s.windowEndAt,
      durationMinutes: s.durationMinutes,
      marginMinutes: s.marginMinutes,
    })),
    origin,
    now,
    TRANSPORT_KMH[day.tenant.transportMode],
  );

  const byKey = new Map(plan.ordered.map((p) => [p.key, p]));

  await db.$transaction(async (tx) => {
    for (const stop of remaining) {
      const planned = byKey.get(stop.id);
      await tx.dayStop.update({
        where: { id: stop.id },
        data: {
          plannedStartAt: planned?.plannedStart ?? stop.plannedStartAt,
          plannedEndAt: planned?.plannedEnd ?? stop.plannedEndAt,
          travelMinutes: planned?.travelMinutes ?? stop.travelMinutes,
          distanceFromPreviousMeters:
            planned?.distanceMeters ?? stop.distanceFromPreviousMeters,
          conflict: planned?.conflict ?? stop.conflict,
        },
      });
    }
    await tx.day.update({
      where: { id: dayId },
      data: {
        status: "EM_ANDAMENTO",
        totalDurationMinutes: plan.totalDurationMinutes,
        version: { increment: 1 },
      },
    });
  });

  await db.auditLog.create({
    data: {
      tenantId,
      action: "UPDATE",
      entityType: "Day",
      entityId: dayId,
    },
  });

  return { rescheduled: remaining.length };
}

export async function replanPendingToToday(
  tenantId: string,
  sourceDayId: string,
  targetDayId: string,
): Promise<number> {
  const source = await db.day.findFirst({
    where: { id: sourceDayId, tenantId },
    include: { stops: { orderBy: { position: "asc" } } },
  });
  if (!source) throw new ApiError("DAY_NOT_FOUND", 404, "Dia não encontrado.");

  const pending = source.stops.filter(
    (s) => s.status === "PENDENTE" || s.status === "EM_ANDAMENTO",
  );
  if (pending.length === 0) return 0;

  const { _max } = await db.dayStop.aggregate({
    where: { dayId: targetDayId },
    _max: { position: true },
  });
  let position = (_max.position ?? -1) + 1;

  await db.$transaction(async (tx) => {
    for (const stop of pending) {
      await tx.dayStop.create({
        data: {
          dayId: targetDayId,
          activityId: stop.activityId,
          position: position++,
          title: stop.title,
          notes: stop.notes,
          address: stop.address,
          lat: stop.lat,
          lng: stop.lng,
          priority: stop.priority,
          timeType: stop.timeType,
          startAt: stop.startAt,
          windowStartAt: stop.windowStartAt,
          windowEndAt: stop.windowEndAt,
          plannedStartAt: null,
          plannedEndAt: null,
          durationMinutes: stop.durationMinutes,
          marginMinutes: stop.marginMinutes,
          status: "PENDENTE",
        },
      });
      await tx.dayStop.update({
        where: { id: stop.id },
        data: { status: "PULADO" },
      });
    }
  });

  return pending.length;
}