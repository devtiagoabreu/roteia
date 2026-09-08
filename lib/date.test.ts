import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  dayStartInTz,
  isValidDateIso,
  timeInTz,
  toDate,
} from "@/lib/date";

describe("lib/date", () => {
  it("toDate monta o instante corretamente", () => {
    const d = toDate("2026-09-08");
    expect(d.toISOString()).toBe("2026-09-08T00:00:00.000Z");
  });

  it("addDaysIso cruza fim de mês e ano bissexto", () => {
    expect(addDaysIso("2026-09-08", 1)).toBe("2026-09-09");
    expect(addDaysIso("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDaysIso("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2026-01-01", -1)).toBe("2025-12-31");
  });

  it("isValidDateIso rejeita datas inválidas", () => {
    expect(isValidDateIso("2026-09-08")).toBe(true);
    expect(isValidDateIso("2026-02-29")).toBe(false);
    expect(isValidDateIso("2026-13-01")).toBe(false);
    expect(isValidDateIso("2026-09-31")).toBe(false);
    expect(isValidDateIso("08/09/2026")).toBe(false);
  });

  it("timeInTz usa o offset esperado para America/Sao_Paulo", () => {
    const d = timeInTz("2026-09-08", "08:00", "America/Sao_Paulo");
    expect(d.toISOString()).toBe("2026-09-08T11:00:00.000Z");
    expect(dayStartInTz("2026-09-08", "America/Sao_Paulo").toISOString()).toBe(
      "2026-09-08T03:00:00.000Z",
    );
  });
});