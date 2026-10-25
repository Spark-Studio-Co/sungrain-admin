import Decimal from "decimal.js";
import {
  applicableRate,
  type CalculationInput,
  type CalculationResult,
  type Currency,
  type Elevator,
} from "@/entities/calculator/api";

export type PreviewSnapshot = {
  result: CalculationResult;
  requestId: string;
  currency: Currency;
  tonnes: string;
  wagons: number;
  date: string;
  catalogKey: string;
};

export function previewCatalogKey(
  elevator: Elevator | undefined,
  input: CalculationInput,
) {
  const selected = new Set(input.lines.map((line) => line.serviceId));
  return JSON.stringify([
    elevator?.id,
    elevator?.archived,
    elevator?.services.filter((service) => selected.has(service.id)),
  ]);
}

export function isPreviewCurrent(
  preview: PreviewSnapshot | null,
  input: CalculationInput,
  catalogKey: string,
) {
  return !!(
    preview &&
    input.requestId &&
    preview.requestId === input.requestId &&
    preview.catalogKey === catalogKey
  );
}

export function previewRatesMatch(
  result: CalculationResult,
  elevator: Elevator | undefined,
  date: string,
) {
  return result.expenses
    .filter((line) => line.serviceId)
    .every((line) => {
      const service = elevator?.services.find(
        (item) => item.id === line.serviceId,
      );
      const rate = service && applicableRate(service, date);
      if (!rate) return false;
      if (line.rateId) return line.rateId === rate.id;
      try {
        return (
          new Decimal(line.price).eq(rate.price) &&
          (!line.effectiveFrom ||
            line.effectiveFrom.slice(0, 10) === rate.effectiveFrom.slice(0, 10))
        );
      } catch {
        return false;
      }
    });
}

export function calculatorIssues(input: CalculationInput, today: string) {
  const issues: Record<string, string> = {};
  if (!input.title.trim()) issues.title = "Не указано название расчёта";
  if (!input.date) issues.date = "Не указана дата расчёта";
  else if (input.currency !== "KZT" && input.date > today)
    issues.date = "Курс на будущую дату недоступен";
  if (!input.culture.trim()) issues.culture = "Не выбрана культура";
  if (
    !input.tonnes ||
    !Number.isFinite(Number(input.tonnes)) ||
    Number(input.tonnes) <= 0
  )
    issues.tonnes = "Объём партии должен быть больше нуля";
  if (
    !input.purchasePrice ||
    !Number.isFinite(Number(input.purchasePrice)) ||
    Number(input.purchasePrice) < 0
  )
    issues.purchasePrice = "Не указана корректная закупочная цена";
  if (!input.departureStation.trim())
    issues.departureStation = "Не выбрана станция отправления";
  if (!input.destinationStation.trim())
    issues.destinationStation = "Не выбрана станция назначения";
  input.lines.forEach((line) => {
    if (
      line.capacityTonnesPerWagon !== undefined &&
      (!/^\d{1,9}(\.\d{1,3})?$/.test(line.capacityTonnesPerWagon) ||
        Number(line.capacityTonnesPerWagon) <= 0)
    )
      issues[`capacity:${line.id}`] =
        "Вместимость должна быть больше нуля, до 3 знаков после запятой";
    if (
      !line.price ||
      !Number.isFinite(Number(line.price)) ||
      Number(line.price) < 0
    )
      issues[`price:${line.id}`] = "Не указана корректная цена";
    const quantity = Number(line.factor);
    if (
      !line.factor ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      (!line.serviceId && !Number.isInteger(quantity))
    )
      issues[`factor:${line.id}`] = line.serviceId
        ? "Значение должно быть больше нуля"
        : "Количество вагонов должно быть целым и больше нуля";
  });
  return issues;
}
