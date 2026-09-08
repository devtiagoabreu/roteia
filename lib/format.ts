export function formatDistance(meters: number | null | undefined): string {
  if (meters == null) return "";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function formatDuration(
  minutes: number | null | undefined,
): string {
  if (minutes == null) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  return `${h}h${(minutes % 60).toString().padStart(2, "0")}`;
}

export function formatDateLabel(
  date: Date,
  tz: string,
  todayIso?: string,
): string {
  const local = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  if (todayIso) {
    const iso = date.toISOString().slice(0, 10);
    if (iso === todayIso) return `hoje, ${local.toLowerCase()}`;
  }
  return local.toLowerCase();
}