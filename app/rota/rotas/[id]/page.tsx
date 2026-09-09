import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";
import { getRoute } from "@/lib/route/service";
import { listCustomers } from "@/lib/customers/service";
import { RouteBuilder } from "@/components/route/route-builder";
import type {
  RouteCustomerOption,
  RouteDto,
  RouteStopDto,
} from "@/components/route/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Builder de rota · Programa a Rota · Roteia",
};

export default async function RoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const route = await getRoute(user.tenantId, id);
  if (!route) notFound();

  const customers = await listCustomers(user.tenantId);

  const tz = user.tenant.timezone;
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const routeDto: RouteDto = {
    id: route.id,
    date: route.date.toISOString().slice(0, 10),
    displayDate: fmt.format(route.date),
    name: route.name,
    status: route.status,
    startAddress: route.startAddress,
    startLat: route.startLat,
    startLng: route.startLng,
    startTime: route.startTime?.toISOString() ?? null,
    totalDistanceMeters: route.totalDistanceMeters,
    totalDurationMinutes: route.totalDurationMinutes,
    stopCount: route.stops.length,
  };

  const stopsDto: RouteStopDto[] = route.stops.map((s) => ({
    id: s.id,
    customerId: s.customerId,
    position: s.position,
    title: s.title,
    notes: s.notes,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    plannedStartAt: s.plannedStartAt?.toISOString() ?? null,
    travelMinutes: s.travelMinutes,
    distanceFromPreviousMeters: s.distanceFromPreviousMeters,
  }));

  const customersDto: RouteCustomerOption[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    address: c.primaryAddress?.raw ?? null,
    lat: c.primaryAddress?.lat ?? null,
    lng: c.primaryAddress?.lng ?? null,
  }));

  return (
    <RouteBuilder
      route={routeDto}
      stops={stopsDto}
      customers={customersDto}
      tz={tz}
    />
  );
}