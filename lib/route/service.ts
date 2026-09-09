import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { timeInTz } from "@/lib/date";
import {
  optimizeRouteOrder,
  planRouteInOrder,
  type RoutePlan,
  type RouteStopLike,
} from "@/lib/route/optimize";
import { TRANSPORT_KMH } from "@/lib/day/optimize";
import type { Prisma, RouteStop } from "@/generated/prisma/client";
import { geocodeAddress } from "@/lib/maps/geocode";

export type RouteSettingsData = {
  date?: string;
  name?: string | null;
  startAddress?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  startTime?: Date | null;
  endAddress?: string | null;
  endLat?: number | null;
  endLng?: number | null;
};

export type RouteCreateData = {
  date: string;
  name?: string | null;
  startAddress?: string | null;
  startLat?: number | null;
  startLng?: number | null;
  startTime?: Date | null;
};

async function requireRoute(tenantId: string, routeId: string) {
  const route = await db.route.findFirst({
    where: { id: routeId, tenantId },
    include: {
      tenant: true,
      stops: { orderBy: { position: "asc" } },
    },
  });
  if (!route) {
    throw new ApiError("ROUTE_NOT_FOUND", 404, "Rota não encontrada.");
  }
  return route;
}

function routePlanInputs(
  stops: Array<{ id: string; lat: number | null; lng: number | null }>,
  route: { startLat: number | null; startLng: number | null },
): { stops: RouteStopLike[]; origin: { lat: number | null; lng: number | null } } {
  return {
    stops: stops.map((s) => ({ key: s.id, lat: s.lat, lng: s.lng })),
    origin: { lat: route.startLat, lng: route.startLng },
  };
}

export type DbRoute = Awaited<ReturnType<typeof db.route.findFirst>>;

async function applyPlan(
  tx: Prisma.TransactionClient,
  routeId: string,
  stops: Array<{ id: string }>,
  plan: RoutePlan,
  orderedStopIds?: string[],
): Promise<void> {
  const byKey = new Map(
    plan.ordered.map((p, idx) => [p.key, { ...p, index: idx }]),
  );

  for (const stop of stops) {
    const planned = byKey.get(stop.id);
    if (!planned) continue;
    await tx.routeStop.update({
      where: { id: stop.id },
      data: {
        plannedStartAt: planned.plannedStart,
        plannedEndAt: planned.plannedEnd,
        travelMinutes: planned.travelMinutes,
        distanceFromPreviousMeters: planned.distanceMeters,
      },
    });
  }

  if (orderedStopIds) {
    for (let i = 0; i < orderedStopIds.length; i++) {
      await tx.routeStop.updateMany({
        where: { id: orderedStopIds[i], routeId },
        data: { position: -(i + 1) },
      });
    }
    for (let i = 0; i < orderedStopIds.length; i++) {
      await tx.routeStop.updateMany({
        where: { id: orderedStopIds[i], routeId },
        data: { position: i },
      });
    }
  }

  await tx.route.update({
    where: { id: routeId },
    data: {
      totalDistanceMeters: plan.totalDistanceMeters,
      totalDurationMinutes: plan.totalDurationMinutes,
      version: { increment: 1 },
    },
  });
}

async function recalcRouteInTx(
  tx: Prisma.TransactionClient,
  route: {
    id: string;
    date: Date;
    startLat: number | null;
    startLng: number | null;
    startTime: Date | null;
  },
  timezone: string,
  transportMode: keyof typeof TRANSPORT_KMH,
  stops: Array<{ id: string; lat: number | null; lng: number | null }>,
): Promise<RoutePlan> {
  const dayIso = route.date.toISOString().slice(0, 10);
  const start =
    route.startTime ?? timeInTz(dayIso, "08:00", timezone);
  const { stops: inputs, origin } = routePlanInputs(stops, route);
  const plan = planRouteInOrder(
    inputs,
    origin,
    start,
    TRANSPORT_KMH[transportMode],
  );
  await applyPlan(tx, route.id, stops, plan);
  return plan;
}

export async function createRoute(
  tenantId: string,
  userId: string | null,
  data: RouteCreateData,
) {
  const route = await db.$transaction(async (tx) => {
    const created = await tx.route.create({
      data: {
        tenantId,
        date: new Date(`${data.date}T00:00:00Z`),
        name: data.name?.trim() || null,
        startAddress: data.startAddress?.trim() || null,
        startLat: data.startLat ?? null,
        startLng: data.startLng ?? null,
        startTime: data.startTime ?? null,
      },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "CREATE",
        entityType: "Route",
        entityId: created.id,
      },
    });
    return created;
  });
  return route;
}

export async function listRoutes(tenantId: string, includeArchived = false) {
  return db.route.findMany({
    where: { tenantId, ...(includeArchived ? {} : { status: { not: "ARQUIVADO" } }) },
    include: { _count: { select: { stops: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });
}

export async function getRoute(tenantId: string, routeId: string) {
  return requireRoute(tenantId, routeId);
}

export async function updateRouteSettings(
  tenantId: string,
  userId: string | null,
  routeId: string,
  data: RouteSettingsData,
) {
  await requireRoute(tenantId, routeId);

  const next: Prisma.RouteUpdateInput = {
    startAddress: data.startAddress ?? undefined,
    startLat: data.startLat ?? undefined,
    startLng: data.startLng ?? undefined,
    startTime: data.startTime ?? undefined,
    endAddress: data.endAddress ?? undefined,
    endLat: data.endLat ?? undefined,
    endLng: data.endLng ?? undefined,
  };
  if (data.name !== undefined) next.name = data.name?.trim() || null;
  if (data.date) {
    next.date = new Date(`${data.date}T00:00:00Z`);
  }

  await db.$transaction(async (tx) => {
    const updated = await tx.route.update({
      where: { id: routeId, tenantId },
      data: next,
      include: { tenant: true, stops: { orderBy: { position: "asc" } } },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Route",
        entityId: routeId,
      },
    });
    if (updated.stops.length > 0) {
      await recalcRouteInTx(
        tx,
        updated,
        updated.tenant.timezone,
        updated.tenant.transportMode,
        updated.stops,
      );
    }
  });
}

export async function addCustomerStop(
  tenantId: string,
  userId: string | null,
  routeId: string,
  customerId: string,
) {
  const route = await requireRoute(tenantId, routeId);

  const customer = await db.customer.findFirst({
    where: { id: customerId, tenantId, deletedAt: null },
    include: {
      addresses: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
    },
  });
  if (!customer) {
    throw new ApiError("CUSTOMER_NOT_FOUND", 404, "Cliente não encontrado.");
  }
  const primary = customer.addresses[0];
  if (!primary) {
    throw new ApiError(
      "CUSTOMER_NO_ADDRESS",
      400,
      "Cliente não possui endereço cadastrado.",
    );
  }

  const already = await db.routeStop.findFirst({
    where: { routeId, customerId: customer.id },
    select: { id: true },
  });
  if (already) {
    throw new ApiError(
      "STOP_ALREADY_EXISTS",
      409,
      "Este cliente já está na rota.",
    );
  }

  const { _max } = await db.routeStop.aggregate({
    where: { routeId },
    _max: { position: true },
  });

  return db.$transaction(async (tx) => {
    const stop = await tx.routeStop.create({
      data: {
        routeId,
        customerId: customer.id,
        position: (_max.position ?? -1) + 1,
        title: customer.name,
        notes: `${customer.name}${primary.label ? ` — ${primary.label}` : ""}`,
        address: primary.raw,
        lat: primary.lat,
        lng: primary.lng,
      },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Route",
        entityId: routeId,
      },
    });

    const stops = await tx.routeStop.findMany({
      where: { routeId },
      orderBy: { position: "asc" },
      select: { id: true, lat: true, lng: true },
    });
    await recalcRouteInTx(
      tx,
      route,
      route.tenant.timezone,
      route.tenant.transportMode,
      stops,
    );

    return stop;
  });
}

export async function addAddressStop(
  tenantId: string,
  userId: string | null,
  routeId: string,
  data: { title: string; address: string; lat?: number | null; lng?: number | null },
) {
  const route = await requireRoute(tenantId, routeId);

  let lat = data.lat ?? null;
  let lng = data.lng ?? null;
  if (lat == null || lng == null) {
    const geo = await geocodeAddress(data.address).catch(() => null);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }
  }

  const { _max } = await db.routeStop.aggregate({
    where: { routeId },
    _max: { position: true },
  });

  return db.$transaction(async (tx) => {
    const stop = await tx.routeStop.create({
      data: {
        routeId,
        position: (_max.position ?? -1) + 1,
        title: data.title.trim(),
        address: data.address.trim(),
        lat,
        lng,
      },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Route",
        entityId: routeId,
      },
    });

    const stops = await tx.routeStop.findMany({
      where: { routeId },
      orderBy: { position: "asc" },
      select: { id: true, lat: true, lng: true },
    });
    await recalcRouteInTx(
      tx,
      route,
      route.tenant.timezone,
      route.tenant.transportMode,
      stops,
    );

    return stop;
  });
}

export async function removeRouteStop(
  tenantId: string,
  userId: string | null,
  routeId: string,
  stopId: string,
) {
  const route = await requireRoute(tenantId, routeId);
  const stop = await db.routeStop.findFirst({
    where: { id: stopId, routeId },
  });
  if (!stop) throw new ApiError("STOP_NOT_FOUND", 404, "Parada não encontrada.");

  await db.$transaction(async (tx) => {
    await tx.routeStop.delete({ where: { id: stopId } });
    const remaining = await tx.routeStop.findMany({
      where: { routeId },
      orderBy: { position: "asc" },
    });
    for (let i = 0; i < remaining.length; i++) {
      await tx.routeStop.update({
        where: { id: remaining[i]!.id },
        data: { position: i },
      });
    }
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Route",
        entityId: routeId,
      },
    });

    const stops = await tx.routeStop.findMany({
      where: { routeId },
      orderBy: { position: "asc" },
      select: { id: true, lat: true, lng: true },
    });
    await recalcRouteInTx(
      tx,
      route,
      route.tenant.timezone,
      route.tenant.transportMode,
      stops,
    );
  });
}

export async function reorderRouteStops(
  tenantId: string,
  userId: string | null,
  routeId: string,
  orderedStopIds: string[],
) {
  const route = await requireRoute(tenantId, routeId);
  const existing = await db.routeStop.findMany({
    where: { routeId },
    select: { id: true },
  });
  const validIds = new Set(existing.map((s) => s.id));
  if (!orderedStopIds.every((id) => validIds.has(id))) {
    throw new ApiError("STOP_NOT_FOUND", 404, "Parada inválida na reordenação.");
  }

  await db.$transaction(async (tx) => {
    const stops = await tx.routeStop.findMany({
      where: { routeId },
      orderBy: { position: "asc" },
      select: { id: true, lat: true, lng: true },
    });
    const ordered = orderedStopIds
      .map((id) => stops.find((s) => s.id === id)!)
      .filter(Boolean);

    const plan = planRouteInOrder(
      ordered.map((s) => ({ key: s.id, lat: s.lat, lng: s.lng })),
      { lat: route.startLat, lng: route.startLng },
      route.startTime ??
        timeInTz(route.date.toISOString().slice(0, 10), "08:00", route.tenant.timezone),
      TRANSPORT_KMH[route.tenant.transportMode],
    );
    await applyPlan(tx, route.id, ordered, plan, orderedStopIds);

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Route",
        entityId: routeId,
      },
    });
  });
}

export async function optimizeRoute(
  tenantId: string,
  userId: string | null,
  routeId: string,
) {
  const route = await requireRoute(tenantId, routeId);
  if (route.stops.length < 2) {
    throw new ApiError(
      "NOT_ENOUGH_STOPS",
      400,
      "Adicione pelo menos duas paradas para otimizar.",
    );
  }

  const plan = optimizeRouteOrder(
    route.stops.map((s) => ({ key: s.id, lat: s.lat, lng: s.lng })),
    { lat: route.startLat, lng: route.startLng },
    route.startTime ??
      timeInTz(route.date.toISOString().slice(0, 10), "08:00", route.tenant.timezone),
    TRANSPORT_KMH[route.tenant.transportMode],
  );

  const orderedStopIds = plan.ordered.map((p) => p.key);

  await db.$transaction(async (tx) => {
    await applyPlan(tx, routeId, route.stops, plan, orderedStopIds);
    await tx.route.update({
      where: { id: routeId },
      data: {
        status: "OTIMIZADO",
        optimizationProvider: "roteia-internal-nearest-neighbor",
        optimizedAt: new Date(),
        version: { increment: 1 },
      },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "OPTIMIZE",
        entityType: "Route",
        entityId: routeId,
      },
    });
  });
}

export async function setRouteStopStatus(
  tenantId: string,
  userId: string | null,
  routeId: string,
  stopId: string,
  status: RouteStop["status"],
) {
  const route = await requireRoute(tenantId, routeId);
  const stop = route.stops.find((s) => s.id === stopId);
  if (!stop) throw new ApiError("STOP_NOT_FOUND", 404, "Parada não encontrada.");

  await db.$transaction(async (tx) => {
    await tx.routeStop.update({
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

    const stops = await tx.routeStop.findMany({
      where: { routeId },
      select: { status: true },
    });
    const allDone = stops.every(
      (s) => s.status === "FEITO" || s.status === "PULADO",
    );
    const inProgress = stops.some((s) => s.status === "EM_ANDAMENTO");

    const nextStatus = allDone
      ? "CONCLUIDO"
      : inProgress
        ? "EM_ANDAMENTO"
        : route.status === "CONCLUIDO" || route.status === "EM_ANDAMENTO"
          ? "OTIMIZADO"
          : route.status;

    await tx.route.update({
      where: { id: routeId },
      data: { status: nextStatus, version: { increment: 1 } },
    });

    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "UPDATE",
        entityType: "Route",
        entityId: routeId,
      },
    });
  });
}

export async function archiveRoute(
  tenantId: string,
  userId: string | null,
  routeId: string,
) {
  await requireRoute(tenantId, routeId);
  await db.route.update({
    where: { id: routeId },
    data: { status: "ARQUIVADO", version: { increment: 1 } },
  });
  await db.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "UPDATE",
      entityType: "Route",
      entityId: routeId,
    },
  });
}

export async function restoreRoute(
  tenantId: string,
  userId: string | null,
  routeId: string,
) {
  const route = await requireRoute(tenantId, routeId);
  const next = route.stops.length > 0 ? "OTIMIZADO" : "RASCUNHO";
  await db.route.update({
    where: { id: routeId },
    data: { status: next, version: { increment: 1 } },
  });
  await db.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "UPDATE",
      entityType: "Route",
      entityId: routeId,
    },
  });
}

/**
 * Reotimiza apenas as paradas ainda não concluídas (C8/P1), preservando a
 * ordem e os horários do que já passou. A nova origem é a última parada
 * concluída/pulada; a partir dela o restante é reordenado por vizinho mais
 * próximo e re-agendado.
 */
export async function optimizeRemainingRoute(
  tenantId: string,
  userId: string | null,
  routeId: string,
) {
  const route = await requireRoute(tenantId, routeId);
  const done = route.stops.filter(
    (s) => s.status === "FEITO" || s.status === "PULADO",
  );
  const pending = route.stops.filter(
    (s) => s.status !== "FEITO" && s.status !== "PULADO",
  );

  if (pending.length === 0) {
    throw new ApiError(
      "NOT_ENOUGH_STOPS",
      400,
      "Todas as paradas já foram concluídas ou puladas.",
    );
  }
  if (done.length === 0) {
    await optimizeRoute(tenantId, userId, routeId);
    return;
  }

  const lastDone = done[done.length - 1]!;
  const kmh = TRANSPORT_KMH[route.tenant.transportMode];
  const restStart =
    lastDone.finishedAt ??
    lastDone.plannedEndAt ??
    route.startTime ??
    timeInTz(
      route.date.toISOString().slice(0, 10),
      "08:00",
      route.tenant.timezone,
    );
  const origin =
    lastDone.lat != null && lastDone.lng != null
      ? { lat: lastDone.lat, lng: lastDone.lng }
      : { lat: route.startLat, lng: route.startLng };

  const plan = optimizeRouteOrder(
    pending.map((s) => ({ key: s.id, lat: s.lat, lng: s.lng })),
    origin,
    restStart,
    kmh,
  );
  const orderedStopIds = [
    ...done.map((s) => s.id),
    ...plan.ordered.map((p) => p.key),
  ];

  const doneDistanceMeters = done.reduce(
    (acc, s) => acc + (s.distanceFromPreviousMeters ?? 0),
    0,
  );
  const doneDurationMinutes = done.reduce(
    (acc, s) => acc + (s.travelMinutes ?? 0),
    0,
  );

  await db.$transaction(async (tx) => {
    await applyPlan(tx, routeId, route.stops, plan, orderedStopIds);
    await tx.route.update({
      where: { id: routeId },
      data: {
        status: route.status === "CONCLUIDO" ? "EM_ANDAMENTO" : "OTIMIZADO",
        optimizationProvider: "roteia-internal-nearest-neighbor",
        optimizedAt: new Date(),
        totalDistanceMeters: doneDistanceMeters + plan.totalDistanceMeters,
        totalDurationMinutes: doneDurationMinutes + plan.totalDurationMinutes,
      },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        userId,
        action: "OPTIMIZE",
        entityType: "Route",
        entityId: routeId,
      },
    });
  });
}

export async function deleteRoute(tenantId: string, routeId: string) {
  const route = await db.route.findFirst({
    where: { id: routeId, tenantId },
    select: { id: true },
  });
  if (!route) throw new ApiError("ROUTE_NOT_FOUND", 404, "Rota não encontrada.");
  await db.route.delete({ where: { id: routeId } });
}