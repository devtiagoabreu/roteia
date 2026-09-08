import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { todayIso, isValidDateIso, formatDateShort } from "@/lib/date";
import { getDayWithStops, listOpenActivities } from "@/lib/day/service";
import { listSavedPlaces } from "@/lib/places/service";
import { DayPlanner } from "@/components/day/day-planner";
import type { PlaceDto } from "@/components/places/types";
import type {
  ActivityDto,
  DayDto,
  StopDto,
} from "@/components/day/types";

function toStopDto(
  stop: Awaited<ReturnType<typeof getDayWithStops>>["stops"][number],
): StopDto {
  return {
    id: stop.id,
    activityId: stop.activityId,
    position: stop.position,
    title: stop.title,
    notes: stop.notes,
    address: stop.address,
    lat: stop.lat,
    lng: stop.lng,
    priority: stop.priority,
    timeType: stop.timeType,
    status: stop.status,
    durationMinutes: stop.durationMinutes,
    travelMinutes: stop.travelMinutes,
    distanceFromPreviousMeters: stop.distanceFromPreviousMeters,
    startAt: stop.startAt?.toISOString() ?? null,
    windowStartAt: stop.windowStartAt?.toISOString() ?? null,
    windowEndAt: stop.windowEndAt?.toISOString() ?? null,
    plannedStartAt: stop.plannedStartAt?.toISOString() ?? null,
    plannedEndAt: stop.plannedEndAt?.toISOString() ?? null,
    conflict: stop.conflict,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  const tz = user.tenant.timezone;
  const today = todayIso(tz);
  const requested = params.date;
  const dateIso =
    requested && isValidDateIso(requested) ? requested : today;
  const { day, stops } = await getDayWithStops(user.tenantId, dateIso);
  const activities = await listOpenActivities(user.tenantId);
  const savedPlaces = await listSavedPlaces(user.tenantId);

  const dayDto: DayDto = {
    id: day.id,
    date: dateIso,
    displayDate: formatDateShort(day.date, tz),
    status: day.status,
    startLat: day.startLat,
    startLng: day.startLng,
    totalDistanceMeters: day.totalDistanceMeters,
    totalDurationMinutes: day.totalDurationMinutes,
  };

  const stopsDto = stops.map(toStopDto);

  const activitiesDto: ActivityDto[] = activities.map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    priority: a.priority,
    timeType: a.timeType,
    address: a.address,
  }));

  const savedPlacesDto: PlaceDto[] = savedPlaces.map((p) => ({
    id: p.id,
    label: p.label,
    category: p.category,
    address: p.address,
    notes: p.notes,
    isFavorite: p.isFavorite,
    lastUsedAt: p.lastUsedAt?.toISOString() ?? null,
    lat: p.lat,
    lng: p.lng,
  }));

  return (
    <DayPlanner
      day={dayDto}
      stops={stopsDto}
      activities={activitiesDto}
      savedPlaces={savedPlacesDto}
      tz={tz}
      dateIso={dateIso}
      today={today}
    />
  );
}