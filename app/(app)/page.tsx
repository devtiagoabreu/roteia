import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { todayIso, formatDateShort } from "@/lib/date";
import { getDayWithStops, listOpenActivities } from "@/lib/day/service";
import { DayPlanner } from "@/components/day/day-planner";
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

export default async function HomePage() {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const tz = user.tenant.timezone;
  const dateIso = todayIso(tz);
  const { day, stops } = await getDayWithStops(user.tenantId, dateIso);
  const activities = await listOpenActivities(user.tenantId);

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

  return (
    <DayPlanner
      day={dayDto}
      stops={stopsDto}
      activities={activitiesDto}
      tz={tz}
      dateIso={dateIso}
    />
  );
}