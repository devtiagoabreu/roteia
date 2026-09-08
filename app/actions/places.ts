"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { db } from "@/lib/db";
import { placeSchema, type PlaceInput } from "@/lib/validations";
import { todayIso } from "@/lib/date";
import { geocodeAddress } from "@/lib/maps/geocode";
import { getOrCreateDay, addActivityToDay } from "@/lib/day/service";
import {
  createSavedPlace,
  deleteSavedPlace,
  getSavedPlace,
  markPlaceUsed,
  saveStopAsPlace,
  toggleFavorite,
  updateSavedPlace,
} from "@/lib/places/service";
import type { SavedPlace } from "@/generated/prisma/client";

export type PlaceActionResult =
  | { ok: true; place: SavedPlace }
  | { ok: false; error: string };

export type SimpleResult = { ok: boolean; error?: string };

function firstField(
  error: { issues: Array<{ message: string }> },
): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

async function resolvePlaceData(
  user: Awaited<ReturnType<typeof requireUser>>,
  formData: FormData,
  fallbackLatLng?: { lat: number | null; lng: number | null },
): Promise<PlaceInput> {
  const parsed = placeSchema.safeParse({
    label: formData.get("label"),
    category: formData.get("category"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) throw new Error(firstField(parsed.error));

  const data = parsed.data;
  let lat = data.lat ?? fallbackLatLng?.lat ?? null;
  let lng = data.lng ?? fallbackLatLng?.lng ?? null;

  if (data.address && (lat == null || lng == null)) {
    try {
      const point = await geocodeAddress(data.address);
      if (point) {
        lat = point.lat;
        lng = point.lng;
      }
    } catch {
      // segue sem coordenadas; o usuário pode ajustar depois
    }
  }

  return { ...data, lat, lng };
}

export async function createPlaceAction(
  formData: FormData,
): Promise<PlaceActionResult> {
  try {
    const user = await requireUser();
    const data = await resolvePlaceData(user, formData);
    const place = await createSavedPlace(user.tenantId, user.id, data);
    revalidatePath("/");
    revalidatePath("/places");
    return { ok: true, place };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível salvar o local.",
    };
  }
}

export async function updatePlaceAction(
  placeId: string,
  formData: FormData,
): Promise<PlaceActionResult> {
  try {
    const user = await requireUser();
    const existing = await getSavedPlace(user.tenantId, placeId);
    if (!existing) return { ok: false, error: "Local não encontrado." };

    const address = String(formData.get("address") ?? "");
    const data = await resolvePlaceData(user, formData, {
      lat:
        address.trim() === existing.address ? existing.lat : null,
      lng:
        address.trim() === existing.address ? existing.lng : null,
    });

    const place = await updateSavedPlace(
      user.tenantId,
      user.id,
      placeId,
      data,
    );
    revalidatePath("/");
    revalidatePath("/places");
    return { ok: true, place };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível atualizar.",
    };
  }
}

export async function deletePlaceAction(
  placeId: string,
): Promise<SimpleResult> {
  try {
    const user = await requireUser();
    await deleteSavedPlace(user.tenantId, user.id, placeId);
    revalidatePath("/places");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir o local." };
  }
}

export async function toggleFavoriteAction(
  placeId: string,
): Promise<SimpleResult> {
  try {
    const user = await requireUser();
    await toggleFavorite(user.tenantId, placeId);
    revalidatePath("/places");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar." };
  }
}

export async function saveStopAsPlaceAction(input: {
  title: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
}): Promise<PlaceActionResult> {
  try {
    const user = await requireUser();
    const address = (input.address ?? "").trim();
    if (!address) return { ok: false, error: "Essa parada não tem endereço." };

    const place = await saveStopAsPlace(user.tenantId, user.id, {
      label: input.title.trim() || address,
      address,
      lat: input.lat,
      lng: input.lng,
      notes: input.notes,
    });
    revalidatePath("/places");
    return { ok: true, place };
  } catch {
    return { ok: false, error: "Não foi possível salvar o local." };
  }
}

export async function addPlaceToTodayAction(
  placeId: string,
): Promise<SimpleResult> {
  try {
    const user = await requireUser();
    const tz = user.tenant.timezone;
    const dateIso = todayIso(tz);

    const place = await getSavedPlace(user.tenantId, placeId);
    if (!place) return { ok: false, error: "Local não encontrado." };

    const day = await getOrCreateDay(user.tenantId, dateIso);
    const activity = await db.activity.create({
      data: {
        tenantId: user.tenantId,
        placeId: place.id,
        title: place.label,
        category: place.category,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        priority: "NORMAL",
        timeType: "FLEXIVEL",
        durationMinutes: 30,
        marginMinutes: 10,
        notes: place.notes,
      },
    });
    await addActivityToDay(user.tenantId, day.id, activity.id);
    await markPlaceUsed(user.tenantId, place.id);

    revalidatePath("/");
    revalidatePath("/places");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível usar o local hoje." };
  }
}

export async function markPlaceUsedAction(
  placeId: string,
): Promise<void> {
  const user = await requireUser();
  await markPlaceUsed(user.tenantId, placeId);
}