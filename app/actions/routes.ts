"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import {
  addAddressStop,
  addCustomerStop,
  createRoute,
  deleteRoute,
  optimizeRoute,
  removeRouteStop,
  reorderRouteStops,
  updateRouteSettings,
} from "@/lib/route/service";
import { geocodeAddress } from "@/lib/maps/geocode";
import { timeInTz } from "@/lib/date";
import { db } from "@/lib/db";

export type RouteActionResult = { ok: boolean; error?: string; id?: string };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function createRouteAction(
  formData: FormData,
): Promise<RouteActionResult> {
  try {
    const user = await requireUser();
    const tz = user.tenant.timezone;

    const date = String(formData.get("date") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return { ok: false, error: "Informe uma data válida." };
    }

    const address = String(formData.get("startAddress") ?? "").trim();
    const rawLat = Number(formData.get("startLat") ?? NaN);
    const rawLng = Number(formData.get("startLng") ?? NaN);
    const hasPicked = Number.isFinite(rawLat) && Number.isFinite(rawLng);
    let startLat: number | null = hasPicked ? rawLat : null;
    let startLng: number | null = hasPicked ? rawLng : null;
    if (address && !hasPicked) {
      try {
        const point = await geocodeAddress(address);
        if (point) {
          startLat = point.lat;
          startLng = point.lng;
        }
      } catch {
        // segue sem coordenadas
      }
    }

    const startTimeRaw = String(formData.get("startTime") ?? "");
    let startTime: Date | null = null;
    if (startTimeRaw) {
      if (!HHMM.test(startTimeRaw)) {
        return { ok: false, error: "Horário de início inválido." };
      }
      startTime = timeInTz(date, startTimeRaw, tz);
    }

    const route = await createRoute(user.tenantId, user.id, {
      date,
      name: String(formData.get("name") ?? "").trim() || null,
      startAddress: address || null,
      startLat,
      startLng,
      startTime,
    });

    revalidatePath("/rota/rotas");
    return { ok: true, id: route.id };
  } catch {
    return { ok: false, error: "Não foi possível criar a rota." };
  }
}

export async function updateRouteSettingsAction(
  routeId: string,
  formData: FormData,
): Promise<RouteActionResult> {
  try {
    const user = await requireUser();
    const tz = user.tenant.timezone;

    const dateRaw = String(formData.get("date") ?? "");
    const date = dateRaw || undefined;
    if (dateRaw && !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) {
      return { ok: false, error: "Informe uma data válida." };
    }

    const address = String(formData.get("startAddress") ?? "").trim();

    const rawLat = Number(formData.get("startLat") ?? NaN);
    const rawLng = Number(formData.get("startLng") ?? NaN);
    const hasPicked = Number.isFinite(rawLat) && Number.isFinite(rawLng);

    let startLat: number | null = hasPicked ? rawLat : null;
    let startLng: number | null = hasPicked ? rawLng : null;
    if (address && !hasPicked) {
      try {
        const point = await geocodeAddress(address);
        if (point) {
          startLat = point.lat;
          startLng = point.lng;
        }
      } catch {
        // segue sem coordenadas
      }
    }

    const startTimeRaw = String(formData.get("startTime") ?? "");
    let startTime: Date | null = null;
    if (startTimeRaw) {
      if (!HHMM.test(startTimeRaw)) {
        return { ok: false, error: "Horário de início inválido." };
      }
      const route = await db.route.findFirst({
        where: { id: routeId, tenantId: user.tenantId },
        select: { date: true },
      });
      const baseIso = dateRaw || route?.date.toISOString().slice(0, 10);
      if (!baseIso) return { ok: false, error: "Rota não encontrada." };
      startTime = timeInTz(baseIso, startTimeRaw, tz);
    }

    await updateRouteSettings(user.tenantId, user.id, routeId, {
      date,
      name: String(formData.get("name") ?? "").trim() || null,
      startAddress: address || null,
      startLat,
      startLng,
      startTime,
    });

    revalidatePath(`/rota/rotas/${routeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível salvar as configurações." };
  }
}

export async function addCustomerStopAction(
  routeId: string,
  customerId: string,
): Promise<RouteActionResult> {
  try {
    const user = await requireUser();
    await addCustomerStop(user.tenantId, user.id, routeId, customerId);
    revalidatePath(`/rota/rotas/${routeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível adicionar o cliente." };
  }
}

export async function addAddressStopAction(
  routeId: string,
  formData: FormData,
): Promise<RouteActionResult> {
  try {
    const user = await requireUser();

    const title = String(formData.get("title") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    if (!title) return { ok: false, error: "Informe o título da parada." };
    if (address.length < 3) {
      return { ok: false, error: "Informe o endereço da parada." };
    }

    const rawLat = Number(formData.get("lat") ?? NaN);
    const rawLng = Number(formData.get("lng") ?? NaN);
    const coords =
      Number.isFinite(rawLat) && Number.isFinite(rawLng)
        ? { lat: rawLat, lng: rawLng }
        : null;

    await addAddressStop(user.tenantId, user.id, routeId, {
      title,
      address,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });

    revalidatePath(`/rota/rotas/${routeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível adicionar a parada." };
  }
}

export async function removeRouteStopAction(
  routeId: string,
  stopId: string,
): Promise<RouteActionResult> {
  try {
    const user = await requireUser();
    await removeRouteStop(user.tenantId, user.id, routeId, stopId);
    revalidatePath(`/rota/rotas/${routeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível remover a parada." };
  }
}

export async function reorderRouteStopsAction(
  routeId: string,
  orderedStopIds: string[],
): Promise<RouteActionResult> {
  try {
    const user = await requireUser();
    await reorderRouteStops(user.tenantId, user.id, routeId, orderedStopIds);
    revalidatePath(`/rota/rotas/${routeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível reordenar." };
  }
}

export async function optimizeRouteAction(
  routeId: string,
): Promise<RouteActionResult> {
  try {
    const user = await requireUser();
    await optimizeRoute(user.tenantId, user.id, routeId);
    revalidatePath(`/rota/rotas/${routeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível otimizar." };
  }
}

export async function deleteRouteAction(routeId: string): Promise<RouteActionResult> {
  try {
    const user = await requireUser();
    await deleteRoute(user.tenantId, routeId);
    revalidatePath("/rota/rotas");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir a rota." };
  }
}