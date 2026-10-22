"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Copy,
  Download,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceHeading } from "@/components/ui/workspace-heading";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";
import { Choice, Field, QueryError } from "./controls";
import { CalculationSummary } from "./calculation-summary";
import { costPerTonne } from "./calculator-model";
import {
  dateText,
  errorText,
  moneyText,
  tradeApi,
  UNIT_SHORT,
} from "@/entities/calculator/api";
import "./trade.css";
import "./cost-calculator.css";

export default function CalculatorPage({ id }: { id?: string }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const list = useQuery({
    queryKey: ["calculations", search, mode, page],
    queryFn: () => tradeApi.list(search, mode, page),
    enabled: !id,
  });
  const detail = useQuery({
    queryKey: ["calculation", id],
    queryFn: () => tradeApi.get(id!),
    enabled: !!id,
  });
  const query = id ? detail : list;
  const record = detail.data;
  async function download(format: "xlsx" | "pdf") {
    if (!id) return;
    setExporting(true);
    setError("");
    try {
      await tradeApi.download(id, format);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className="trade-workspace cost-workspace record-workspace">
      {id && (
        <Link href="/admin/calculator" className="trade-back">
          <ArrowLeft size={16} />
          Все расчёты
        </Link>
      )}
      <WorkspaceHeading
        icon={Calculator}
        title={id ? record?.title || "Расчёт себестоимости" : "Калькулятор"}
        description={
          id && record
            ? `${dateText(record.date)} · ${record.mode === "EXPORT" ? "Экспорт" : "Продажи по Казахстану"}`
            : `${list.data?.total ?? 0} сохранённых расчётов`
        }
        actions={
          <>
            {id ? (
              <>
                <Button
                  variant="outline"
                  disabled={!record || exporting}
                  onClick={() => download("xlsx")}
                >
                  <Download size={16} />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  disabled={!record || exporting}
                  onClick={() => download("pdf")}
                >
                  <Download size={16} />
                  PDF
                </Button>
                <Button className="trade-primary" asChild>
                  <Link href={`/admin/calculator/new?copy=${id}`}>
                    <Copy size={16} />
                    Создать копию
                  </Link>
                </Button>
              </>
            ) : (
              <Button className="trade-primary" asChild>
                <Link href="/admin/calculator/new">
                  <Plus size={16} />
                  Новый расчёт
                </Link>
              </Button>
            )}
          </>
        }
      />
      {error && (
        <p className="trade-alert" role="alert">
          {error}
        </p>
      )}
      {query.isLoading ? (
        <CrmRouteLoading />
      ) : query.isError ? (
        <QueryError retry={() => query.refetch()} />
      ) : !id ? (
        <>
          <div className="trade-toolbar">
            <Field label="Поиск">
              <Input
                aria-label="Поиск расчёта"
                placeholder="Название или культура"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </Field>
            <Choice
              label="Режим"
              value={mode || "all"}
              onChange={(v) => {
                setMode(v === "all" ? "" : v);
                setPage(1);
              }}
              options={[
                { value: "all", label: "Все расчёты" },
                { value: "DOMESTIC", label: "Продажи по Казахстану" },
                { value: "EXPORT", label: "Экспорт" },
              ]}
            />
          </div>
          {list.data?.items.length ? (
            <div className="trade-table-wrap">
              <table className="trade-table trade-responsive-table">
                <thead>
                  <tr>
                    <th>Расчёт</th>
                    <th>Дата</th>
                    <th>Режим</th>
                    <th className="trade-number">Объём, т</th>
                    <th className="trade-number">Себестоимость, ₸</th>
                    <th className="trade-number">На тонну, ₸</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/admin/calculator/${item.id}`}>
                          {item.title}
                        </Link>
                        <span className="trade-subline">{item.culture}</span>
                      </td>
                      <td data-label="Дата">{dateText(item.date)}</td>
                      <td data-label="Режим">
                        <span className="trade-tag">
                          {item.mode === "EXPORT" ? "Экспорт" : "Казахстан"}
                        </span>
                      </td>
                      <td data-label="Объём, т" className="trade-number">
                        {moneyText(item.tonnes)}
                      </td>
                      <td
                        data-label="Себестоимость, ₸"
                        className="trade-number"
                      >
                        {moneyText(item.totalCostKzt)}
                      </td>
                      <td data-label="На тонну, ₸" className="trade-number">
                        {moneyText(
                          costPerTonne(item.totalCostKzt, item.tonnes),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="trade-empty">
              <Calculator className="mx-auto mb-3" size={32} />
              <p>
                {search || mode
                  ? "Расчёты не найдены"
                  : "Сохранённых расчётов пока нет"}
              </p>
            </div>
          )}
          <div className="trade-pagination">
            <Button
              variant="outline"
              size="icon"
              aria-label="Предыдущая страница"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ArrowLeft size={16} />
            </Button>
            <span>
              {page} / {list.data?.pages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Следующая страница"
              disabled={page >= (list.data?.pages || 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              <ArrowRight size={16} />
            </Button>
          </div>
        </>
      ) : (
        record && (
          <div className="trade-editor-layout cost-editor-layout">
            <div>
              <dl className="trade-details">
                <div>
                  <dt>Культура</dt>
                  <dd>{record.input.culture}</dd>
                </div>
                <div>
                  <dt>Маршрут</dt>
                  <dd>
                    {record.input.departureStation} →{" "}
                    {record.input.destinationStation}
                  </dd>
                </div>
                <div>
                  <dt>Элеватор</dt>
                  <dd>{record.result.elevatorName || "Не выбран"}</dd>
                </div>
                <div>
                  <dt>Объём / вагоны</dt>
                  <dd>
                    {moneyText(record.tonnes)} т / {record.input.wagons}
                  </dd>
                </div>
                <div>
                  <dt>Закупочная цена</dt>
                  <dd>{moneyText(record.input.purchasePrice)} ₸/т</dd>
                </div>
                {record.input.schemaVersion !== 2 && (
                  <div>
                    <dt>Цена продажи</dt>
                    <dd>
                      {moneyText(record.input.salePrice)} {record.currency}/т
                    </dd>
                  </div>
                )}
                {record.result.purchaseReference && (
                  <div>
                    <dt>Исходная закупка</dt>
                    <dd>
                      <Link
                        href={`/admin/procurement/${record.result.purchaseReference.id}`}
                      >
                        {record.result.purchaseReference.number}
                      </Link>
                      <span className="trade-subline">
                        {moneyText(record.result.purchaseReference.price)}{" "}
                        {record.result.purchaseReference.currency}/т ·{" "}
                        {moneyText(record.result.purchaseReference.tonnes)} т
                      </span>
                    </dd>
                  </div>
                )}
                {record.result.applicationReference && (
                  <div>
                    <dt>Исходный контракт / приложение</dt>
                    <dd>
                      {record.result.applicationReference.contract} /{" "}
                      {record.result.applicationReference.name}
                      <span className="trade-subline">
                        {moneyText(record.result.applicationReference.tonnes)} т
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
              <h2 className="mb-4 text-base font-bold">Состав расходов</h2>
              <div className="trade-table-wrap">
                <table className="trade-table trade-responsive-table">
                  <thead>
                    <tr>
                      <th>Расход</th>
                      <th>Количество</th>
                      <th className="trade-number">Цена, ₸</th>
                      <th className="trade-number">Сумма, ₸</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.result.expenses.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.name}
                          {row.effectiveFrom && (
                            <span className="trade-subline">
                              Тариф от {dateText(row.effectiveFrom)}
                            </span>
                          )}
                        </td>
                        <td data-label="Количество">
                          {moneyText(row.quantity)} {UNIT_SHORT[row.unit]}
                          {row.overtime && (
                            <span className="trade-subline">
                              Коэффициент ×1,5
                            </span>
                          )}
                        </td>
                        <td data-label="Цена, ₸" className="trade-number">
                          {moneyText(row.price)}
                        </td>
                        <td data-label="Сумма, ₸" className="trade-number">
                          {moneyText(row.amountKzt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {record.input.notes && (
                <section className="trade-section">
                  <h2>Комментарий</h2>
                  <p className="whitespace-pre-wrap text-sm">
                    {record.input.notes}
                  </p>
                </section>
              )}
              {record.sourceId && (
                <Link
                  className="trade-back mt-5"
                  href={`/admin/calculator/${record.sourceId}`}
                >
                  Исходный расчёт <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <CalculationSummary
              result={record.result}
              currency={record.currency}
              tonnes={record.input.tonnes}
              wagons={record.input.wagons}
              legacy={record.input.schemaVersion !== 2}
            />
          </div>
        )
      )}
    </div>
  );
}
