import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CalculationResult } from "@/entities/calculator/api";
import { CalculationSummary } from "./calculation-summary";

vi.mock("@/shared/api/apiClient", () => ({ apiClient: {} }));
const result = {
  costPerTonneKzt: "81500.00",
  totalCostKzt: "81500000.00",
  purchaseKzt: "80000000.00",
  wagonExpensesKzt: "1500000.00",
  elevatorExpensesKzt: "0",
  expensesKzt: "1500000.00",
  costPerTonneCurrency: "163",
  totalCostCurrency: "163000",
  fx: {
    currency: "USD",
    perUnit: "500",
    date: "2026-10-24",
    sourceUrl: "https://nationalbank.kz/",
  },
  revenueKzt: "90000000",
  profitKzt: "8500000",
  marginPercent: "9.44",
} as CalculationResult;
describe("calculation summary presentation", () => {
  it("shows readiness instead of invented subtotals before calculation", () => {
    const html = renderToStaticMarkup(
      createElement(CalculationSummary, {
        currency: "KZT",
        readiness: ["Не выбрана культура"],
      }),
    );
    expect(html).toContain("Нет расчёта");
    expect(html).toContain("Не выбрана культура");
    expect(html).not.toContain("Закупка зерна");
  });
  it("shows a ready state after required fields are complete", () => {
    const html = renderToStaticMarkup(
      createElement(CalculationSummary, { currency: "KZT", readiness: [] }),
    );
    expect(html).toContain("Данные готовы к расчёту");
  });
  it("clearly labels a stale snapshot while retaining amounts and FX metadata", () => {
    const html = renderToStaticMarkup(
      createElement(CalculationSummary, {
        result,
        currency: "USD",
        tonnes: "1000",
        wagons: 5,
        stale: true,
        snapshotDate: "2026-10-24",
      }),
    );
    expect(html).toContain("Требуется пересчёт");
    expect(html).toContain("Последний расчёт на тонну");
    expect(html).toContain("USD / т");
    expect(html).toContain("81 500 000,00");
    expect(html).toContain("1 000 т");
    expect(html).not.toContain(">Рассчитано<");
  });
  it("preserves saved legacy financial details and supports unique sheet ids", () => {
    const html = renderToStaticMarkup(
      createElement(CalculationSummary, {
        result,
        currency: "KZT",
        legacy: true,
        id: "cost-mobile-summary",
      }),
    );
    expect(html).toContain('id="cost-mobile-summary"');
    expect(html).toContain("Выручка");
    expect(html).toContain("Маржа");
    expect(html).toContain("Рассчитано");
  });
});
