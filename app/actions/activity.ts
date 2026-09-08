"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { activitySchema } from "@/lib/validations";
import { timeInTz } from "@/lib/date";
import { geocodeAddress } from "@/lib/maps/geocode";
import type { Activity } from "@/generated/prisma/client";

export type ActivityActionResult =
  | { ok: true; activity: Activity }
  | { ok: false; error: string };

function firstField(
  error: { issues: Array<{ message: string }> },
): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export async function createActivityAction(
  dayDateIso: string,
  _prev: ActivityActionResult,
  formData: FormData,
): Promise<ActivityActionResult> {
  const user = await requireUser();
  const parsed = activitySchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    address: formData.get("address"),
    priority: formData.get("priority") || "NORMAL",
    timeType: formData.get("timeType") || "FLEXIVEL",
    startTime: formData.get("startTime"),
    windowStartTime: formData.get("windowStartTime"),
    windowEndTime: formData.get("windowEndTime"),
    durationMinutes: Number(formData.get("durationMinutes") ?? 30),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { ok: false, error: firstField(parsed.error) };
  }

  const data = parsed.data;
  const tz = user.tenant.timezone;

  const rawLat = Number(formData.get("lat") ?? NaN);
  const rawLng = Number(formData.get("lng") ?? NaN);
  const hasPickedCoords = Number.isFinite(rawLat) && Number.isFinite(rawLng);

  let lat: number | null = hasPickedCoords ? rawLat : null;
  let lng: number | null = hasPickedCoords ? rawLng : null;
  if (data.address && !hasPickedCoords) {
    try {
      const point = await geocodeAddress(data.address);
      if (point) {
        lat = point.lat;
        lng = point.lng;
      }
    } catch {
      // segue sem coordenadas — usuário pode adicionar depois
    }
  }

  const activity = await db.activity.create({
    data: {
      tenantId: user.tenantId,
      title: data.title,
      category: data.category || null,
      address: data.address || null,
      lat,
      lng,
      priority: data.priority,
      timeType: data.timeType,
      startAt:
        data.timeType === "FIXO" && data.startTime
          ? timeInTz(dayDateIso, data.startTime, tz)
          : null,
      windowStart:
        data.timeType === "JANELA" && data.windowStartTime
          ? timeInTz(dayDateIso, data.windowStartTime, tz)
          : null,
      windowEnd:
        data.timeType === "JANELA" && data.windowEndTime
          ? timeInTz(dayDateIso, data.windowEndTime, tz)
          : null,
      durationMinutes: data.durationMinutes,
      marginMinutes: 10,
      notes: data.notes || null,
    },
  });

  await db.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      action: "CREATE",
      entityType: "Activity",
      entityId: activity.id,
    },
  });

  revalidatePath("/dia");
  return { ok: true, activity };
}

export async function deleteActivityAction(
  activityId: string,
): Promise<void> {
  const user = await requireUser();
  await db.activity.deleteMany({ where: { id: activityId, tenantId: user.tenantId } });
  await db.auditLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.id,
      action: "DELETE",
      entityType: "Activity",
      entityId: activityId,
    },
  });
  revalidatePath("/dia");
}