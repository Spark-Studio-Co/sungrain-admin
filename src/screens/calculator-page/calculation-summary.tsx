"use client";

import { type ReactNode } from "react";
import { Check, Clock3 } from "lucide-react";
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
  tonnes,
  wagons,
  legacy = false,
}: {
  result?: CalculationResult | null;
  currency: Currency;
  children?: ReactNode;
  tonnes?: string;
  wagons?: number;
  legacy?: boolean;
}) {
  const value = (text?: string | null) =>
    text == null ? "—" : `${moneyText(text)} ₸`;
  return (
    <aside
      id="cost-summary"
      className="trade-summary cost-summary"
      aria-label="Итог расчёта"
    >
      <div className="cost-summary-heading">
        <h2>Себестоимость</h2>
        <span className={`cost-status ${result ? "is-ready" : ""}`}>
          {result ? <Check size={13} /> : <Clock3 size={13} />}
          {result ? "Рассчитано" : "Черновик"}
        </span>
      </div>
      <div className="cost-total">
        <span>На одну тонну</span>
        <strong>{value(result?.costPerTonneKzt)}</strong>
        {currency !== "KZT" && result && (
          <span className="cost-currency-total">
            {moneyText(result.costPerTonneCurrency)} {currency} / т
          </span>
        )}
      </div>
      <dl className="cost-breakdown">
        <div>
          <dt>Закупка зерна</dt>
          <dd>{value(result?.purchaseKzt)}</dd>
        </div>
        {legacy ? (
          <div>
            <dt>Расходы</dt>
            <dd>{value(result?.expensesKzt)}</dd>
          </div>
        ) : (
          <>
            <div>
              <dt>
                <i className="cost-dot cost-dot-wagons" />
                Вагоны
              </dt>
              <dd>{value(result?.wagonExpensesKzt)}</dd>
            </div>
            <div>
              <dt>
                <i className="cost-dot cost-dot-services" />
                Услуги элеватора
              </dt>
              <dd>{value(result?.elevatorExpensesKzt)}</dd>
            </div>
          </>
        )}
        <div className="cost-grand-total">
          <dt>Итого на партию</dt>
          <dd>{value(result?.totalCostKzt)}</dd>
        </div>
      </dl>
      {(tonnes || wagons != null) && (
        <div className="cost-summary-volume">
          <span>{tonnes ? `${moneyText(tonnes)} т` : "Объём не указан"}</span>
          <span>Вагонов: {wagons ?? 0}</span>
        </div>
      )}
      {currency !== "KZT" && result && (
        <div className="trade-fx">
          {result.totalCostCurrency && (
            <p>
              Итого:{" "}
              <strong>
                {moneyText(result.totalCostCurrency)} {currency}
              </strong>
            </p>
          )}
          <p>
            1 {currency} = {moneyText(result.fx.perUnit)} ₸ ·{" "}
            {dateText(result.fx.date)}
          </p>
          {result.fx.sourceUrl && (
            <a href={result.fx.sourceUrl} target="_blank" rel="noreferrer">
              Курс Национального банка РК
            </a>
          )}
        </div>
      )}
      {legacy && result && (
        <details className="cost-legacy">
          <summary>Финансы исходного расчёта</summary>
          <dl>
            <div>
              <dt>Выручка</dt>
              <dd>{value(result.revenueKzt)}</dd>
            </div>
            <div>
              <dt>Прибыль</dt>
              <dd>{value(result.profitKzt)}</dd>
            </div>
            <div>
              <dt>Маржа</dt>
              <dd>
                {result.marginPercent == null
                  ? "—"
                  : `${moneyText(result.marginPercent)}%`}
              </dd>
            </div>
          </dl>
        </details>
      )}
      {children}
    </aside>
  );
}
