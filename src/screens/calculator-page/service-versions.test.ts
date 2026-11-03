import { describe, expect, it } from "vitest";
import { serviceAvailableOnDate } from "./calculator-model";
import type { ElevatorService } from "@/entities/calculator/api";

const current: ElevatorService = {
  id: "current", name: "Отгрузка", unit: "TONNE", archived: false,
  overtimeEligible: false, alternativeGroup: "", rates: [], validFrom: "2026-11-01T00:00:00.000Z",
};
const previous: ElevatorService = {
  ...current, id: "old", archived: true, validFrom: null, validTo: "2026-11-01T00:00:00.000Z", nextVersion: { id: current.id },
};

describe("service version availability", () => {
  it.each([
    [previous, "2026-10-31", true],
    [previous, "2026-11-01", false],
    [current, "2026-10-31", false],
    [current, "2026-11-01", true],
    [{ ...current, archived: true }, "2026-11-02", false],
    [{ ...previous, nextVersion: null }, "2026-10-31", false],
    [{ ...current, validFrom: null }, "2026-10-31", true],
    [current, "", false],
    [{ ...current, deletedAt: "2026-11-03T10:00:00Z" }, "2026-11-02", false],
    [{ ...previous, deletedAt: "2026-11-03T10:00:00Z" }, "2026-10-31", false],
  ])("uses historical bounds without restoring archived services", (service, date, available) => {
    expect(serviceAvailableOnDate(service as ElevatorService, date as string)).toBe(available);
  });
});
