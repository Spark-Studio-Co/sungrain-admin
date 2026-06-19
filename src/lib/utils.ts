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

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return "0";
  }

  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
