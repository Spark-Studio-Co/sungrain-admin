import { describe, expect, it, vi } from "vitest";
import type {
  CalculationInput,
  CalculationResult,
  Elevator,
} from "@/entities/calculator/api";
import {
  calculatorIssues,
  isPreviewCurrent,
  previewCatalogKey,
  previewRatesMatch,
  type PreviewSnapshot,
} from "./calculator-workflow";

vi.mock("@/shared/api/apiClient", () => ({ apiClient: {} }));

const input: CalculationInput = {
  schemaVersion: 2,
  requestId: "draft-a",
  title: "Партия",
  mode: "DOMESTIC",
  date: "2026-10-24",
  culture: "Пшеница",
  departureStation: "Павлодар",
  destinationStation: "Шарбакты",
  wagons: 0,
  tonnes: "1000",
  purchasePrice: "0",
  currency: "KZT",
  notes: "",
  lines: [],
};
const snapshot = {
  requestId: input.requestId,
  currency: "KZT",
  tonnes: "1000",
  wagons: 0,
  date: input.date,
  catalogKey: "catalog",
} as PreviewSnapshot;

describe("calculator preview workflow", () => {
  it("only accepts a preview tied to the complete current draft revision", () => {
    expect(isPreviewCurrent(snapshot, input, "catalog")).toBe(true);
    expect(
      isPreviewCurrent(
        snapshot,
        { ...input, requestId: "draft-b", title: "Новое название" },
        "catalog",
      ),
    ).toBe(false);
    expect(
      isPreviewCurrent(snapshot, { ...input, requestId: undefined }, "catalog"),
    ).toBe(false);
    expect(isPreviewCurrent(null, input, "catalog")).toBe(false);
  });
  it("rejects a preview when the tariff catalog changes without editing the draft", () => {
    expect(isPreviewCurrent(snapshot, input, "new-catalog")).toBe(false);
  });
  it("keeps old presentation metadata separate from the new form", () => {
    const changed = {
      ...input,
      requestId: "changed",
      currency: "USD" as const,
      tonnes: "2000",
      wagons: 20,
    };
    expect(isPreviewCurrent(snapshot, changed, "catalog")).toBe(false);
    expect(snapshot).toMatchObject({
      currency: "KZT",
      tonnes: "1000",
      wagons: 0,
    });
  });
  it("tracks selected services and archival changes, not unrelated services", () => {
    const elevator = {
      id: "e",
      archived: false,
      services: [
        { id: "selected", name: "Отгрузка", rates: [{ price: "3000" }] },
        { id: "other", rates: [] },
      ],
    } as unknown as Elevator;
    const selected = {
      ...input,
      lines: [{ id: "line", serviceId: "selected" }],
    } as CalculationInput;
    const key = previewCatalogKey(elevator, selected);
    expect(
      previewCatalogKey(
        {
          ...elevator,
          services: [
            { ...elevator.services[0], name: "Новое название" },
            elevator.services[1],
          ],
        },
        selected,
      ),
    ).not.toBe(key);
    expect(
      previewCatalogKey({ ...elevator, archived: true }, selected),
    ).not.toBe(key);
    expect(
      previewCatalogKey(
        {
          ...elevator,
          services: [
            elevator.services[0],
            { ...elevator.services[1], name: "Другая" },
          ],
        },
        selected,
      ),
    ).toBe(key);
  });
});

describe("calculator inline issues", () => {
  it("accepts zero purchase price and historical nonempty cultures", () => {
    expect(calculatorIssues(input, "2026-10-24")).toEqual({});
    expect(
      calculatorIssues(
        { ...input, culture: "Историческая культура" },
        "2026-10-24",
      ),
    ).toEqual({});
  });
  it("identifies missing party and route fields", () => {
    const issues = calculatorIssues(
      {
        ...input,
        title: "",
        culture: "",
        tonnes: "",
        purchasePrice: "",
        departureStation: "",
        destinationStation: "",
        date: "",
      },
      "2026-10-24",
    );
    expect(Object.keys(issues)).toHaveLength(7);
    expect(issues.departureStation).toBeTruthy();
    expect(issues.destinationStation).toBeTruthy();
  });
  it("keeps the existing KZT future-date policy and rejects future FX dates", () => {
    expect(
      calculatorIssues({ ...input, date: "2027-01-01" }, "2026-10-24"),
    ).toEqual({});
    expect(
      calculatorIssues(
        { ...input, date: "2027-01-01", currency: "USD" },
        "2026-10-24",
      ).date,
    ).toBeTruthy();
  });
  it("validates wagon quantity and row prices without calculating money", () => {
    const row = {
      id: "wagon",
      name: "Вагоны",
      category: "TRANSPORT" as const,
      unit: "WAGON" as const,
      factor: "1.5",
      price: "",
      overtime: false,
    };
    const issues = calculatorIssues({ ...input, lines: [row] }, "2026-10-24");
    expect(issues["factor:wagon"]).toBeTruthy();
    expect(issues["price:wagon"]).toBeTruthy();
    expect(
      calculatorIssues(
        { ...input, lines: [{ ...row, factor: "2", price: "0" }] },
        "2026-10-24",
      ),
    ).toEqual({});
  });
});

describe("preview tariff compatibility", () => {
  const elevator = {
    services: [
      {
        id: "service",
        rates: [{ id: "rate", price: "3000", effectiveFrom: "2026-10-01" }],
      },
    ],
  } as Elevator;
  const result = (line: object) =>
    ({
      expenses: [{ serviceId: "service", price: "3000.00", ...line }],
    }) as CalculationResult;
  it("checks immutable rate ids when the preview provides them", () => {
    expect(
      previewRatesMatch(result({ rateId: "rate" }), elevator, "2026-10-24"),
    ).toBe(true);
    expect(
      previewRatesMatch(result({ rateId: "old-rate" }), elevator, "2026-10-24"),
    ).toBe(false);
  });
  it("accepts compatible older previews without rate ids", () => {
    expect(
      previewRatesMatch(
        result({ effectiveFrom: "2026-10-01T00:00:00Z" }),
        elevator,
        "2026-10-24",
      ),
    ).toBe(true);
    expect(previewRatesMatch(result({}), elevator, "2026-10-24")).toBe(true);
  });
  it("rejects mismatched or malformed fallback tariff metadata", () => {
    expect(
      previewRatesMatch(result({ price: "3500" }), elevator, "2026-10-24"),
    ).toBe(false);
    expect(
      previewRatesMatch(
        result({ effectiveFrom: "2026-10-02" }),
        elevator,
        "2026-10-24",
      ),
    ).toBe(false);
    expect(
      previewRatesMatch(result({ price: "invalid" }), elevator, "2026-10-24"),
    ).toBe(false);
  });
  it("does not require a tariff catalog for manual wagon expenses", () => {
    expect(
      previewRatesMatch(
        { expenses: [{ name: "Вагоны" }] } as CalculationResult,
        undefined,
        "2026-10-24",
      ),
    ).toBe(true);
    expect(previewRatesMatch(result({}), undefined, "2026-10-24")).toBe(false);
  });
});
