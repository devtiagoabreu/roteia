import { db } from "@/lib/db";
import { buildDayPlan } from "@/lib/day/optimize";
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
    await tx.dayStop.update({ where: { id: stopId }, data: { status } });
    if (status === "FEITO") {
      await tx.activity
        .updateMany({
          where: { id: stop.activityId ?? "", tenantId },
          data: { completedAt: new Date() },
        })
        .catch(() => {});
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