export type PlaceDto = {
  id: string;
  label: string;
  category: string | null;
  address: string;
  notes: string | null;
  isFavorite: boolean;
  lastUsedAt: string | null;
  lat: number | null;
  lng: number | null;
};