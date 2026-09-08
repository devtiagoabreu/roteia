import { describe, expect, it } from "vitest";
import { formatDateLabel, formatDistance, formatDuration } from "@/lib/format";
import { toDate } from "@/lib/date";

describe("lib/format", () => {
  it("formatDistance", () => {
    expect(formatDistance(null)).toBe("");
    expect(formatDistance(undefined)).toBe("");
    expect(formatDistance(850)).toBe("850 m");
    expect(formatDistance(1499)).toBe("1.5 km");
    expect(formatDistance(2500)).toBe("2.5 km");
  });

  it("formatDuration", () => {
    expect(formatDuration(null)).toBe("");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1h00");
    expect(formatDuration(90)).toBe("1h30");
    expect(formatDuration(7 * 60 + 5)).toBe("7h05");
  });

  it("formatDateLabel marca Hoje e normaliza para lowercase", () => {
    const label = formatDateLabel(toDate("2026-09-08"), "UTC", "2026-09-08");
    expect(label.startsWith("hoje,")).toBe(true);

    const other = formatDateLabel(
      toDate("2026-09-09"),
      "UTC",
      "2026-09-08",
    );
    expect(other).not.toContain("hoje,");
    expect(other).toContain("09/09");
  });
});