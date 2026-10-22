import Decimal from "decimal.js";
import {
  type Calculation,
  type CalculationInput,
  type CalculationLine,
  type CostUnit,
} from "@/entities/calculator/api";

export function emptyInput(date: string, elevatorId?: string): CalculationInput {
  return {
    schemaVersion: 2,
    requestId: crypto.randomUUID(),
    title: "",
    mode: "DOMESTIC",
    date,
    culture: "",
    departureStation: "",
    destinationStation: "",
    wagons: 0,
    tonnes: "",
    purchasePrice: "",
    currency: "KZT",
    notes: "",
    lines: [],
    ...(elevatorId ? { elevatorId } : {}),
  };
}

export function wagonCount(lines: CalculationLine[]) {
  return lines
    .filter((line) => !line.serviceId)
    .reduce((total, line) => total + (Number(line.factor) || 0), 0);
}

export function rowAmount(
  price: string,
  unit: CostUnit,
  tonnes: string,
  wagons: number,
  factor: string,
  overtime = false,
  directWagon = false,
) {
  try {
    const rate = new Decimal(price);
    const quantity =
      unit === "FIXED"
        ? new Decimal(1)
        : unit === "WAGON"
          ? new Decimal(directWagon ? factor : wagons)
          : unit === "ITEM"
            ? new Decimal(factor)
            : new Decimal(tonnes).mul(unit === "TONNE" ? 1 : factor);
    if (
      !rate.isFinite() ||
      !quantity.isFinite() ||
      rate.isNegative() ||
      quantity.isNegative()
    )
      return null;
    return rate
      .mul(quantity)
      .mul(overtime ? "1.5" : 1)
      .toFixed(2, Decimal.ROUND_HALF_UP);
  } catch {
    return null;
  }
}

export function costPerTonne(total: string, tonnes: string) {
  try {
    return new Decimal(tonnes).gt(0)
      ? new Decimal(total).div(tonnes).toFixed(2)
      : null;
  } catch {
    return null;
  }
}

export function copyCalculation(record: Calculation, date: string) {
  const legacy = record.input.schemaVersion !== 2;
  // Legacy manual charges are not necessarily physical wagon groups. Keep their
  // names visible for reconciliation instead of silently changing their meaning.
  const omitted = legacy
    ? record.input.lines
        .filter((line) => !line.serviceId)
        .map((line) => line.name)
    : [];
  if (legacy && Number(record.input.techPdPerWagon)) omitted.push("ТехПД");
  const source = { ...record.input };
  delete source.salePrice;
  delete source.techPdPerWagon;
  const lines = record.input.lines
    .filter((line) => !legacy || line.serviceId)
    .map((line) => ({ ...line, id: crypto.randomUUID() }));
  const input: CalculationInput = {
    ...source,
    schemaVersion: 2,
    requestId: crypto.randomUUID(),
    sourceId: record.id,
    title: `${record.title.slice(0, 150)} (копия)`,
    date,
    lines,
    wagons: wagonCount(lines),
  };
  return { input, omitted };
}
