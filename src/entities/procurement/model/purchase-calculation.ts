import Decimal from "decimal.js";
import type { PurchaseValues, VatMode } from "../api/purchases.api";

export const VAT_LABELS: Record<VatMode, string> = {
  NONE: "Без НДС",
  EXCLUSIVE: "С НДС (начислен сверху)",
  INCLUSIVE: "С НДС",
};
export const normalizeDecimal = (value: string) =>
  value.trim().replace(",", ".");
export function calculatePurchase(
  quantity: string,
  price: string,
  mode: VatMode,
  rate: string,
) {
  const q = new Decimal(normalizeDecimal(quantity));
  const p = new Decimal(normalizeDecimal(price));
  const r =
    mode === "NONE" ? new Decimal(0) : new Decimal(normalizeDecimal(rate));
  if (
    !q.isFinite() ||
    q.lte(0) ||
    q.gt(100000000) ||
    q.decimalPlaces() > 3 ||
    !p.isFinite() ||
    p.lte(0) ||
    p.gt(1000000000) ||
    p.decimalPlaces() > 2 ||
    !r.isFinite() ||
    r.lt(0) ||
    r.gt(100) ||
    r.decimalPlaces() > 2
  )
    throw new Error("Некорректные значения");
  const round = (value: Decimal) =>
    value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const amount = round(q.mul(p));
  if (amount.lte(0)) throw new Error("Сумма должна быть не меньше 0,01");
  const vatRate = mode === "NONE" ? new Decimal(0) : r;
  const vat =
    mode === "INCLUSIVE"
      ? round(amount.mul(vatRate).div(vatRate.add(100)))
      : round(amount.mul(vatRate).div(100));
  const net = mode === "INCLUSIVE" ? amount.sub(vat) : amount;
  return {
    netAmount: net.toFixed(2),
    vatAmount: vat.toFixed(2),
    totalAmount: net.add(vat).toFixed(2),
  };
}

export function validatePurchase(
  values: PurchaseValues,
  hasSavedFarmer = false,
) {
  const errors: Partial<Record<keyof PurchaseValues, string>> = {};
  if (!values.farmId && !hasSavedFarmer) errors.farmId = "Выберите фермера";
  if (!values.cultureName) errors.cultureName = "Выберите культуру";
  if (!values.agreementNumber.trim())
    errors.agreementNumber = "Укажите номер договора";
  if (values.agreementNumber.trim().length > 80)
    errors.agreementNumber = "Не больше 80 символов";
  const date = new Date(`${values.agreementDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.agreementDate) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== values.agreementDate ||
    date.getUTCFullYear() < 1900 ||
    date.getUTCFullYear() > 2200
  )
    errors.agreementDate = "Укажите корректную дату";
  for (const [key, max, places, label] of [
    ["quantity", 100000000, 3, "Объём"],
    ["unitPrice", 1000000000, 2, "Цена"],
    ["vatRate", 100, 2, "Ставка НДС"],
  ] as const) {
    if (key === "vatRate" && values.vatMode === "NONE") continue;
    const raw = normalizeDecimal(values[key]);
    try {
      const value = new Decimal(raw);
      if (
        !new RegExp(`^\\d+(\\.\\d{1,${places}})?$`).test(raw) ||
        !value.isFinite() ||
        value.lt(key === "vatRate" ? 0 : 0.001) ||
        value.gt(max)
      )
        throw new Error();
    } catch {
      errors[key] =
        `${label}: ${key === "vatRate" ? "от 0 до 100" : "положительное число"}, до ${places} знаков после запятой`;
    }
  }
  if (!errors.quantity && !errors.unitPrice && !errors.vatRate) {
    try {
      calculatePurchase(
        values.quantity,
        values.unitPrice,
        values.vatMode,
        values.vatRate,
      );
    } catch {
      errors.unitPrice = "Сумма закупки должна быть не меньше 0,01";
    }
  }
  return errors;
}

export const formatMoney = (value: string | number, currency: string) => {
  const [integer, fraction] = new Decimal(value).toFixed(2).split(".");
  const grouped = new Intl.NumberFormat("ru-RU").format(BigInt(integer));
  const symbol =
    new Intl.NumberFormat("ru-RU", { style: "currency", currency })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value || currency;
  return `${grouped},${fraction}\u00a0${symbol}`;
};
export const formatQuantity = (value: string) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(
    Number(value),
  );
