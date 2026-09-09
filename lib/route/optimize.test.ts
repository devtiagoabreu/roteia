import { describe, expect, it } from "vitest";
import {
  nearestReasons,
  optimizeRouteOrder,
  planRouteInOrder,
} from "@/lib/route/optimize";

const origin = { lat: -23.55, lng: -46.63 };

const a = { key: "a", lat: -23.56, lng: -46.62 };
const b = { key: "b", lat: -23.58, lng: -46.65 };
const c = { key: "c", lat: -23.52, lng: -46.61 };

const start = new Date("2026-09-09T11:00:00Z");

describe("motor de rota (nearest-neighbor)", () => {
  it("otimiza partindo da origem e mantém paradas sem coordenadas ao final", () => {
    const noCoord = { key: "d", lat: null, lng: null };
    const plan = optimizeRouteOrder([c, a, b, noCoord], origin, start);

    expect(plan.ordered.map((p) => p.key)).toEqual(["a", "b", "c", "d"]);
    expect(plan.totalDistanceMeters).toBeGreaterThan(0);
    expect(plan.totalDurationMinutes).toBeGreaterThan(0);
  });

  it("explica a ordem escolhida (mais próxima da parada anterior)", () => {
    const plan = optimizeRouteOrder([a, b], origin, start);
    const order = plan.ordered.map((p) => p.key);

    const reasons = nearestReasons(
      order.map((key) => (key === "a" ? a : b)),
      origin,
    );
    expect(reasons[order[0]]).toBe(true);
    expect(reasons[order[1]]).toBe(true);

    const semCoord = { key: "x", lat: null, lng: null };
    const reas = nearestReasons([a, semCoord], origin);
    expect(reas.a).toBe(true);
    expect(reas.x).toBe(false);
  });

  it("planRouteInOrder preserva a ordem humana e re-agenda horários", () => {
    const plan = planRouteInOrder([b, a, c], origin, start);
    expect(plan.ordered.map((p) => p.key)).toEqual(["b", "a", "c"]);
    expect(plan.ordered[0]!.plannedStart >= start).toBe(true);
  });

  it("respeita PRIMEIRA no início e ULTIMA no fim, reordenando o meio", () => {
    // b é o mais distante da origem, mas é PRIMEIRA → deve ficar em primeiro.
    const plan = optimizeRouteOrder(
      [
        { ...a, priority: "AUTO" },
        { ...b, priority: "PRIMEIRA" },
        { ...c, priority: "ULTIMA" },
      ],
      origin,
      start,
    );
    expect(plan.ordered[0]!.key).toBe("b");
    expect(plan.ordered[plan.ordered.length - 1]!.key).toBe("c");
  });

  it("espera a abertura da janela e sinaliza conflito quando o serviço estoura a janela", () => {
    const lateDay = new Date(start.getTime() + 12 * 3600 * 1000);
    const windowStartAt = lateDay;
    const windowEndAt = new Date(lateDay.getTime() + 60 * 60000);
    const windowConflictStop = {
      ...b,
      serviceMinutes: 90,
      windowStart: windowStartAt,
      windowEnd: new Date(lateDay.getTime() + 30 * 60000),
    };

    const plan = planRouteInOrder([windowConflictStop], null, start);
    const planned = plan.ordered[0]!;
    expect(planned.plannedStart.getTime()).toBe(windowStartAt.getTime());
    expect(planned.conflict).toMatch(/Fora da janela/);

    const okPlan = planRouteInOrder(
      [{ ...a, serviceMinutes: 30, windowStart: windowStartAt, windowEnd: windowEndAt }],
      null,
      start,
    );
    expect(okPlan.ordered[0]!.conflict).toBeNull();
    expect(okPlan.ordered[0]!.plannedEnd.getTime()).toBe(
      windowStartAt.getTime() + 30 * 60000,
    );
  });

  it("inclui o tempo de serviço na duração total", () => {
    const withService = planRouteInOrder([{ ...a, serviceMinutes: 45 }], origin, start);
    const without = planRouteInOrder([{ ...a }], origin, start);
    expect(withService.ordered[0]!.plannedEnd.getTime()).toBe(
      without.ordered[0]!.plannedEnd.getTime() + 45 * 60000,
    );
  });
});