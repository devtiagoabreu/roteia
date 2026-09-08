import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import type { SavedPlace } from "@/generated/prisma/client";

export type PlaceData = {
  label: string;
  category?: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
};

export async function listSavedPlaces(
  tenantId: string,
): Promise<SavedPlace[]> {
  return db.savedPlace.findMany({
    where: { tenantId },
    orderBy: [{ isFavorite: "desc" }, { lastUsedAt: "desc" }, { label: "asc" }],
    take: 200,
  });
}

export async function getSavedPlace(
  tenantId: string,
  placeId: string,
): Promise<SavedPlace | null> {
  return db.savedPlace.findFirst({ where: { id: placeId, tenantId } });
}

export async function createSavedPlace(
  tenantId: string,
  userId: string | null,
  data: PlaceData,
): Promise<SavedPlace> {
  const place = await db.savedPlace.create({
    data: {
      tenantId,
      label: data.label,
      category: data.category || null,
      address: data.address,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      notes: data.notes || null,
    },
  });

  await db.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "CREATE",
      entityType: "SavedPlace",
      entityId: place.id,
    },
  });

  return place;
}

export async function updateSavedPlace(
  tenantId: string,
  userId: string | null,
  placeId: string,
  data: PlaceData,
): Promise<SavedPlace> {
  const existing = await getSavedPlace(tenantId, placeId);
  if (!existing) throw new ApiError("PLACE_NOT_FOUND", 404, "Local não encontrado.");

  const place = await db.savedPlace.update({
    where: { id: placeId },
    data: {
      label: data.label,
      category: data.category || null,
      address: data.address,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      notes: data.notes || null,
    },
  });

  await db.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "UPDATE",
      entityType: "SavedPlace",
      entityId: placeId,
    },
  });

  return place;
}

export async function deleteSavedPlace(
  tenantId: string,
  userId: string | null,
  placeId: string,
): Promise<void> {
  await db.savedPlace.deleteMany({ where: { id: placeId, tenantId } });
  await db.auditLog.create({
    data: {
      tenantId,
      userId,
      action: "DELETE",
      entityType: "SavedPlace",
      entityId: placeId,
    },
  });
}

export async function toggleFavorite(
  tenantId: string,
  placeId: string,
): Promise<SavedPlace> {
  const existing = await getSavedPlace(tenantId, placeId);
  if (!existing) throw new ApiError("PLACE_NOT_FOUND", 404, "Local não encontrado.");
  return db.savedPlace.update({
    where: { id: placeId },
    data: { isFavorite: !existing.isFavorite },
  });
}

export async function markPlaceUsed(
  tenantId: string,
  placeId: string,
): Promise<void> {
  await db.savedPlace.updateMany({
    where: { id: placeId, tenantId },
    data: { lastUsedAt: new Date() },
  });
}

export async function saveStopAsPlace(
  tenantId: string,
  userId: string | null,
  data: PlaceData,
): Promise<SavedPlace> {
  const existing = await db.savedPlace.findFirst({
    where: {
      tenantId,
      address: { equals: data.address, mode: "insensitive" },
    },
  });
  if (existing) {
    await markPlaceUsed(tenantId, existing.id);
    return existing;
  }
  return createSavedPlace(tenantId, userId, data);
}