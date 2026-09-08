"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import {
  addActivityToDay,
  deleteDay,
  getOrCreateShareToken,
  optimizeDay,
  removeDayStop,
  reorderDayStops,
  replanPendingToToday,
  rescheduleRemainingStops,
  setStopStatus,
  updateDaySettings,
  getOrCreateDay,
} from "@/lib/day/service";
import { db } from "@/lib/db";
import { todayIso, timeInTz } from "@/lib/date";
import { geocodeAddress } from "@/lib/maps/geocode";
import type { Day, DayStop } from "@/generated/prisma/client";

export type DayActionResult = {
  ok: boolean;
  error?: string;
};
export type OptimizeResult =
  | { ok: true; day: Day }
  | { ok: false; error: string };

export async function addToDayAction(
  dayId: string,
  activityId: string,
): Promise<DayActionResult> {
  try {
    const user = await requireUser();
    await addActivityToDay(user.tenantId, dayId, activityId);
    revalidatePath("/dia");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Não foi possível adicionar.",
    };
  }
}

export async function removeStopAction(stopId: string): Promise<DayActionResult> {
  try {
    const user = await requireUser();
    await removeDayStop(user.tenantId, stopId);
    revalidatePath("/dia");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível remover." };
  }
}

export async function reorderStopsAction(
  dayId: string,
  orderedStopIds: string[],
): Promise<DayActionResult> {
  try {
    const user = await requireUser();
    await reorderDayStops(user.tenantId, dayId, orderedStopIds);
    revalidatePath("/dia");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível reordenar." };
  }
}

export async function toggleStopStatusAction(
  stopId: string,
  status: DayStop["status"],
): Promise<DayActionResult> {
  try {
    const user = await requireUser();
    await setStopStatus(user.tenantId, stopId, status);
    revalidatePath("/dia");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar." };
  }
}

export async function optimizeDayAction(dayId: string): Promise<OptimizeResult> {
  try {
    const user = await requireUser();
    const day = await optimizeDay(user.tenantId, dayId);
    revalidatePath("/dia");
    return { ok: true, day };
  } catch {
    return {
      ok: false,
      error: "Não foi possível otimizar.",
    };
  }
}

export async function deleteDayAction(dayId: string): Promise<DayActionResult> {
  try {
    const user = await requireUser();
    await deleteDay(user.tenantId, dayId);
    revalidatePath("/dia");
    revalidatePath("/dia/days");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir o dia." };
  }
}

export type DaySettingsResult = { ok: boolean; error?: string };
export type RescheduleResult = { ok: boolean; error?: string; rescheduled?: number; moved?: number };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function setDaySettingsAction(
  dayId: string,
  formData: FormData,
): Promise<DaySettingsResult> {
  try {
    const user = await requireUser();
    const tz = user.tenant.timezone;

    const day = await db.day.findFirst({
      where: { id: dayId, tenantId: user.tenantId },
    });
    if (!day) return { ok: false, error: "Dia não encontrado." };
    const dayIso = day.date.toISOString().slice(0, 10);

    const address = String(formData.get("address") ?? "").trim();

    const rawLat = Number(formData.get("lat") ?? NaN);
    const rawLng = Number(formData.get("lng") ?? NaN);
    const hasPickedCoords = Number.isFinite(rawLat) && Number.isFinite(rawLng);

    let startLat: number | null = hasPickedCoords ? rawLat : null;
    let startLng: number | null = hasPickedCoords ? rawLng : null;
    if (address && !hasPickedCoords) {
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
      startTime = timeInTz(dayIso, startTimeRaw, tz);
    }

    const endAddress = String(formData.get("endAddress") ?? "").trim();
    const endRawLat = Number(formData.get("endLat") ?? NaN);
    const endRawLng = Number(formData.get("endLng") ?? NaN);
    const hasEndPicked = Number.isFinite(endRawLat) && Number.isFinite(endRawLng);
    let endLat: number | null = hasEndPicked ? endRawLat : null;
    let endLng: number | null = hasEndPicked ? endRawLng : null;
    if (endAddress && !hasEndPicked) {
      try {
        const point = await geocodeAddress(endAddress);
        if (point) {
          endLat = point.lat;
          endLng = point.lng;
        }
      } catch {
        // segue sem coordenadas
      }
    }

    await updateDaySettings(user.tenantId, dayId, {
      startAddress: address || null,
      startLat,
      startLng,
      startTime,
      endAddress: endAddress || null,
      endLat,
      endLng,
    });

    revalidatePath("/dia");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível salvar as configurações." };
  }
}

export async function rescheduleRemainingAction(
  dayId: string,
): Promise<RescheduleResult> {
  try {
    const user = await requireUser();
    const result = await rescheduleRemainingStops(
      user.tenantId,
      dayId,
      new Date(),
    );
    revalidatePath("/dia");
    return { ok: true, rescheduled: result?.rescheduled ?? 0 };
  } catch {
    return { ok: false, error: "Não foi possível recalcular os horários." };
  }
}

export async function replanRemainingAction(
  sourceDayId: string,
): Promise<RescheduleResult> {
  try {
    const user = await requireUser();
    const tz = user.tenant.timezone;
    const target = await getOrCreateDay(user.tenantId, todayIso(tz));
    const moved = await replanPendingToToday(
      user.tenantId,
      sourceDayId,
      target.id,
    );
    revalidatePath("/dia");
    revalidatePath("/dia/days");
    return { ok: true, moved };
  } catch {
    return { ok: false, error: "Não foi possível replanejar as pendências." };
  }
}

export type ShareDayResult = { ok: boolean; url?: string; error?: string };

export async function shareDayAction(dayId: string): Promise<ShareDayResult> {
  try {
    const user = await requireUser();
    const token = await getOrCreateShareToken(user.tenantId, dayId);
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    return { ok: true, url: `${origin}/share/${token}` };
  } catch {
    return { ok: false, error: "Não foi possível gerar o link." };
  }
}