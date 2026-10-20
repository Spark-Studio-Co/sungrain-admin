"use client";

import { type ReactNode } from "react";
import {
  dateText,
  moneyText,
  type CalculationResult,
  type Currency,
} from "@/entities/calculator/api";

export function CalculationSummary({
  result,
  currency,
  children,
}: {
  result?: CalculationResult | null;
  currency: Currency;
  children?: ReactNode;
}) {
  const value = (text?: string) =>
    text == null ? "—" : `${moneyText(text)} ₸`;
  return (
    <aside className="trade-summary" aria-label="Итог расчёта">
      <h2>Результат сделки</h2>
      <dl>
        <div>
          <dt>Закупка</dt>
          <dd>{value(result?.purchaseKzt)}</dd>
        </div>
        <div>
          <dt>Расходы</dt>
          <dd>{value(result?.expensesKzt)}</dd>
        </div>
        <div>
          <dt>Себестоимость</dt>
          <dd>{value(result?.totalCostKzt)}</dd>
        </div>
        <div>
          <dt>На тонну</dt>
          <dd>{value(result?.costPerTonneKzt)}</dd>
        </div>
        <div>
          <dt>Выручка</dt>
          <dd>{value(result?.revenueKzt)}</dd>
        </div>
      </dl>
      <div className="trade-profit">
        <span>Расчётная прибыль</span>
        <strong
          className={result?.profitKzt.startsWith("-") ? "trade-negative" : ""}
        >
          {value(result?.profitKzt)}
        </strong>
        <span className="trade-subline">
          {result
            ? `${moneyText(result.profitPerTonneKzt)} ₸/т · Маржа ${result.marginPercent == null ? "—" : `${moneyText(result.marginPercent)}%`}`
            : "—"}
        </span>
      </div>
      {currency !== "KZT" && result && (
        <div className="trade-fx">
          <dl>
            <div>
              <dt>Себестоимость / т</dt>
              <dd>
                {moneyText(result.costPerTonneCurrency)} {currency}
              </dd>
            </div>
            <div>
              <dt>Прибыль</dt>
              <dd>
                {moneyText(result.profitCurrency)} {currency}
              </dd>
            </div>
            <div>
              <dt>Прибыль / т</dt>
              <dd>
                {moneyText(result.profitPerTonneCurrency)} {currency}
              </dd>
            </div>
          </dl>
          <p className="mt-4">
            1 {currency} = {moneyText(result.fx.perUnit)} ₸<br />
            НБК, {dateText(result.fx.date)}
          </p>
          {result.fx.sourceUrl && (
            <a href={result.fx.sourceUrl} target="_blank" rel="noreferrer">
              Официальный источник
            </a>
          )}
        </div>
      )}
      {children}
    </aside>
  );
}
