import { describe, expect, it } from "vitest";
import { buildDayPlan, planInOrder, TRANSPORT_KMH } from "@/lib/day/optimize";
import type { OptimizableStop } from "@/lib/day/optimize";
import { dayStartInTz } from "@/lib/date";

const TZ = "America/Sao_Paulo";

function stop(partial: Partial<OptimizableStop> & { key: string }): OptimizableStop {
  return {
    lat: -23.55,
    lng: -46.63,
    priority: "NORMAL",
    timeType: "FLEXIVEL",
    durationMinutes: 30,
    ...partial,
  };
}

describe("lib/day/optimize", () => {
  it("TRANSPORT_KMH tem os modos esperados", () => {
    expect(TRANSPORT_KMH).toEqual({
      CARRO: 30,
      MOTO: 35,
      BICICLETA: 16,
      PEDESTRE: 5,
    });
  });

  it("fixos saem primeiro em ordem de horário", () => {
    const start = dayStartInTz("2026-09-08", TZ);
    const plan = buildDayPlan(
      [
        stop({
          key: "a",
          timeType: "FIXO",
          startAt: new Date("2026-09-08T14:00:00Z"),
          priority: "BAIXA",
        }),
        stop({
          key: "b",
          timeType: "FIXO",
          startAt: new Date("2026-09-08T09:00:00Z"),
          priority: "ALTA",
        }),
        stop({ key: "c", priority: "ESSENCIAL" }),
      ],
      null,
      start,
    );
    expect(plan.ordered.map((s) => s.key)).toEqual(["b", "a", "c"]);
    expect(plan.totalDistanceMeters).toBeGreaterThanOrEqual(0);
  });

  it("sem coords não gera deslocamento nem conflitos", () => {
    const start = dayStartInTz("2026-09-08", TZ);
    const plan = buildDayPlan(
      [
        stop({ key: "x", lat: null, lng: null }),
        stop({ key: "y", lat: null, lng: null }),
      ],
      null,
      start,
    );
    expect(plan.totalDistanceMeters).toBe(0);
    expect(plan.ordered.every((s) => s.travelMinutes === 0)).toBe(true);
    expect(plan.ordered.every((s) => !s.conflict)).toBe(true);
  });

  it("velocidade menor aumenta o tempo de deslocamento", () => {
    const start = dayStartInTz("2026-09-08", TZ);
    const stops = [
      stop({ key: "a", lat: -23.55, lng: -46.63 }),
      stop({ key: "b", lat: -23.56, lng: -46.64 }),
    ];
    const carro = buildDayPlan(stops, stops[0]!, start, TRANSPORT_KMH.CARRO);
    const pedestre = buildDayPlan(
      stops,
      stops[0]!,
      start,
      TRANSPORT_KMH.PEDESTRE,
    );
    expect(pedestre.ordered[1]!.travelMinutes).toBeGreaterThan(
      carro.ordered[1]!.travelMinutes,
    );
  });

  it("planInOrder repete a ordem sem reordenar", () => {
    const start = dayStartInTz("2026-09-08", TZ);
    const plan = planInOrder(
      [
        stop({ key: "b", priority: "ESSENCIAL" }),
        stop({ key: "a", priority: "BAIXA" }),
      ],
      null,
      start,
    );
    expect(plan.ordered.map((s) => s.key)).toEqual(["b", "a"]);
  });
});