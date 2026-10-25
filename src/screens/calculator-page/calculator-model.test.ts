import { describe, expect, it } from "vitest";
import {
  copyCalculation,
  costPerTonne,
  emptyInput,
  rowAmount,
  serviceMatchesCulture,
  wagonCount,
} from "./calculator-model";
import type { Calculation, CalculationLine } from "@/entities/calculator/api";

const wagon = (count: string): CalculationLine => ({
  id: crypto.randomUUID(),
  name: "Вагоны",
  unit: "WAGON",
  category: "TRANSPORT",
  price: "100000",
  factor: count,
  overtime: false,
});
describe("cost estimate editor", () => {
  it("matches crop-specific services without restricting legacy general services", () => {
    expect(serviceMatchesCulture({ culture: " Пшеница " }, "пшеница")).toBe(
      true,
    );
    expect(serviceMatchesCulture({ culture: "Пшеница" }, "Ячмень")).toBe(false);
    expect(serviceMatchesCulture({ culture: "Пшеница" }, "")).toBe(false);
    expect(serviceMatchesCulture({ culture: null }, "Ячмень")).toBe(true);
    expect(serviceMatchesCulture({}, "Пшеница")).toBe(true);
  });
  it("starts without sales or implicit TechPD", () => {
    const input = emptyInput("2026-10-21");
    expect(input.schemaVersion).toBe(2);
    expect(input).not.toHaveProperty("salePrice");
    expect(input).not.toHaveProperty("techPdPerWagon");
    expect(input.wagons).toBe(0);
  });
  it("totals wagon groups without counting elevator services as wagons", () => {
    expect(
      wagonCount([
        wagon("2"),
        wagon("3"),
        { ...wagon("1"), serviceId: "techpd" },
      ]),
    ).toBe(5);
    expect(rowAmount("100000", "WAGON", "300", 5, "2", false, true)).toBe(
      "200000.00",
    );
    expect(rowAmount("50000", "WAGON", "300", 5, "1")).toBe("250000.00");
  });
  it("previews fractional service quantities with decimal rounding", () => {
    expect(rowAmount("790", "TONNE_MONTH", "10.5", 0, "1.5")).toBe("12442.50");
    expect(rowAmount("1", "TONNE", "0.005", 0, "1")).toBe("0.01");
    expect(rowAmount("", "WAGON", "", 1, "1", false, true)).toBeNull();
    expect(costPerTonne("100", "0")).toBeNull();
  });
  it("copies a v2 record without mutating its snapshot", () => {
    const input = {
      ...emptyInput("2026-10-21"),
      title: "Saved",
      lines: [{ ...wagon("2"), capacityTonnesPerWagon: "68.125" }],
      wagons: 2,
    };
    const record = { id: "source", title: "Saved", input } as Calculation;
    const copy = copyCalculation(record, "2026-10-21");
    expect(copy.omitted).toEqual([]);
    expect(copy.input.wagons).toBe(2);
    expect(copy.input.sourceId).toBe("source");
    expect(copy.input.lines[0].id).not.toBe(input.lines[0].id);
    expect(copy.input.lines[0].capacityTonnesPerWagon).toBe("68.125");
    expect(record.input).toBe(input);
  });
  it("identifies legacy manual charges that require reconciliation", () => {
    const service = { ...wagon("1"), serviceId: "elevator-service" };
    const record = {
      id: "legacy",
      title: "Legacy",
      input: {
        ...emptyInput("2026-10-21"),
        schemaVersion: undefined,
        salePrice: "1000",
        techPdPerWagon: "200",
        wagons: 2,
        lines: [wagon("1"), service],
      },
    } as Calculation;
    const copy = copyCalculation(record, "2026-10-21");
    expect(copy.input.lines).toHaveLength(1);
    expect(copy.omitted).toEqual(["Вагоны", "ТехПД"]);
    expect(copy.input).not.toHaveProperty("salePrice");
    expect(copy.input.schemaVersion).toBe(2);
  });
});
