import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует число с разделителями тысяч (точками)
 * @param value - число для форматирования
 * @returns отформатированная строка, например: "1.234.567"
 */
export function formatNumber(
  value: number | string | null | undefined
): string {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const num =
    typeof value === "string"
      ? Number(value.trim().replace(/\s/g, "").replace(",", "."))
      : value;

  if (isNaN(num)) {
    return "0";
  }

  const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
  const [integerPart, fractionalPart] = rounded.toFixed(2).split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const formattedFraction = fractionalPart.replace(/0+$/, "");

  return formattedFraction
    ? `${formattedInteger},${formattedFraction}`
    : formattedInteger;
}

/**
 * Форматирует цену с валютой
 * @param value - цена для форматирования
 * @param currency - валюта (по умолчанию ₸)
 * @returns отформатированная строка с валютой
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = "₸"
): string {
  return `${formatNumber(value)} ${currency}`;
}

export function normalizeCurrencyLabel(
  currency: string | null | undefined,
  fallback: string = "KZT"
): string {
  const normalized = (currency || fallback).trim().toUpperCase();

  if (!normalized || normalized === "KZT" || normalized === "₸") {
    return "₸";
  }

  return normalized;
}

export function formatMoney(
  value: number | string | null | undefined,
  currency: string | null | undefined,
  fallback: string = "KZT"
): string {
  return `${formatNumber(value)} ${normalizeCurrencyLabel(currency, fallback)}`;
}
