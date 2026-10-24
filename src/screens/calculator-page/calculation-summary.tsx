"use client";

import { type ReactNode } from "react";
import { Check, CheckCircle2, Clock3, Loader2, RotateCcw } from "lucide-react";
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
  stale = false,
  pending = false,
  readiness,
  snapshotDate,
  id = "cost-summary",
}: {
  result?: CalculationResult | null;
  currency: Currency;
  children?: ReactNode;
  tonnes?: string;
  wagons?: number;
  legacy?: boolean;
  stale?: boolean;
  pending?: boolean;
  readiness?: string[];
  snapshotDate?: string;
  id?: string;
}) {
  const value = (text?: string | null) =>
    text == null ? "—" : `${moneyText(text)} ₸`;
  return (
    <aside
      id={id}
      className={`trade-summary cost-summary ${stale ? "is-stale" : ""}`}
      aria-label="Итог расчёта"
    >
      <div className="cost-summary-heading">
        <h2>Себестоимость</h2>
        <span
          className={`cost-status ${stale ? "is-stale" : result ? "is-ready" : ""}`}
          role="status"
        >
          {pending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : stale ? (
            <RotateCcw size={13} />
          ) : result ? (
            <Check size={13} />
          ) : (
            <Clock3 size={13} />
          )}
          {pending
            ? "Расчёт…"
            : stale
              ? "Требуется пересчёт"
              : result
                ? "Рассчитано"
                : "Черновик"}
        </span>
      </div>
      <div className="cost-total">
        <span>{stale ? "Последний расчёт на тонну" : "На одну тонну"}</span>
        <strong className={!result ? "cost-no-result" : undefined}>
          {result ? value(result.costPerTonneKzt) : "Нет расчёта"}
        </strong>
        {currency !== "KZT" && result && (
          <span className="cost-currency-total">
            {moneyText(result.costPerTonneCurrency)} {currency} / т
          </span>
        )}
      </div>
      {!result && readiness && (
        <div className="cost-readiness">
          {readiness.length ? (
            <>
              <span>Не заполнено: {readiness.length}</span>
              <ul>
                {readiness.slice(0, 3).map((message, index) => (
                  <li key={`${index}:${message}`}>{message}</li>
                ))}
              </ul>
              {readiness.length > 3 && <span>Ещё {readiness.length - 3}</span>}
            </>
          ) : (
            <p>
              <CheckCircle2 size={16} />
              Данные готовы к расчёту
            </p>
          )}
        </div>
      )}
      {result && (
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
      )}
      {(tonnes || wagons != null) && (
        <div className="cost-summary-volume">
          <span>{tonnes ? `${moneyText(tonnes)} т` : "Объём не указан"}</span>
          <span>Вагонов: {wagons ?? 0}</span>
        </div>
      )}
      {stale && snapshotDate && (
        <p className="cost-snapshot-date">
          Данные последнего расчёта от {dateText(snapshotDate)}
        </p>
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
