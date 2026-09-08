import type {
  DayStatus,
  Priority,
  StopStatus,
  TimeType,
} from "@/generated/prisma/client";

export type StopDto = {
  id: string;
  activityId: string | null;
  position: number;
  title: string;
  notes: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  priority: Priority;
  timeType: TimeType;
  status: StopStatus;
  durationMinutes: number;
  travelMinutes: number | null;
  distanceFromPreviousMeters: number | null;
  startAt: string | null;
  windowStartAt: string | null;
  windowEndAt: string | null;
  plannedStartAt: string | null;
  plannedEndAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  conflict: string | null;
};

export type ActivityDto = {
  id: string;
  title: string;
  category: string | null;
  priority: Priority;
  timeType: TimeType;
  address: string | null;
};

export type DayDto = {
  id: string;
  date: string;
  displayDate: string;
  status: DayStatus;
  startAddress: string | null;
  startLat: number | null;
  startLng: number | null;
  startTime: string | null;
  endAddress: string | null;
  endLat: number | null;
  endLng: number | null;
  marginMinutes: number;
  totalDistanceMeters: number | null;
  totalDurationMinutes: number | null;
  nowIso: string | null;
};