"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import {
  addActivityToDay,
  deleteDay,
  optimizeDay,
  removeDayStop,
  reorderDayStops,
  setStopStatus,
} from "@/lib/day/service";
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
    revalidatePath("/");
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
    revalidatePath("/");
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
    revalidatePath("/");
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
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar." };
  }
}

export async function optimizeDayAction(dayId: string): Promise<OptimizeResult> {
  try {
    const user = await requireUser();
    const day = await optimizeDay(user.tenantId, dayId);
    revalidatePath("/");
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
    revalidatePath("/");
    revalidatePath("/days");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir o dia." };
  }
}