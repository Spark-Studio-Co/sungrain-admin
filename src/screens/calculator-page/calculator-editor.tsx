"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calculator, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker";
import { Choice, Field, NumberField, QueryError, TextField } from "./controls";
import { CalculationSummary } from "./calculation-summary";
import {
  applicableRate,
  CATEGORIES,
  errorText,
  moneyText,
  todayKz,
  tradeApi,
  UNITS,
  type CalculationInput,
  type CalculationLine,
  type CalculationResult,
  type CostUnit,
  type Currency,
} from "@/entities/calculator/api";
import "./trade.css";

const emptyInput = (elevatorId?: string): CalculationInput => ({
  requestId: crypto.randomUUID(),
  title: "",
  mode: "DOMESTIC",
  date: todayKz(),
  culture: "",
  departureStation: "",
  destinationStation: "",
  wagons: 1,
  tonnes: "60",
  purchasePrice: "",
  salePrice: "",
  currency: "KZT",
  techPdPerWagon: "",
  ...(elevatorId ? { elevatorId } : {}),
  notes: "",
  lines: [],
});

export default function CalculatorEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const copy = params.get("copy");
  const [input, setInput] = useState<CalculationInput>(() =>
    emptyInput(params.get("elevator") || undefined),
  );
  const inputRef = useRef(input);
  const loadedCopy = useRef<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedService, setSelectedService] = useState("none");
  const options = useQuery({
    queryKey: ["calculator-options"],
    queryFn: tradeApi.options,
  });
  const elevators = useQuery({
    queryKey: ["elevators"],
    queryFn: tradeApi.elevators,
  });
  const original = useQuery({
    queryKey: ["calculation", copy],
    queryFn: () => tradeApi.get(copy!),
    enabled: !!copy,
  });
  useEffect(() => {
    if (!original.data || loadedCopy.current === original.data.id) return;
    loadedCopy.current = original.data.id;
    const next: CalculationInput = {
      ...original.data.input,
      requestId: crypto.randomUUID(),
      sourceId: original.data.id,
      title: `${original.data.title.slice(0, 150)} (копия)`,
      date: todayKz(),
      lines: original.data.input.lines.map((row) => ({
        ...row,
        id: crypto.randomUUID(),
      })),
    };
    inputRef.current = next;
    setInput(next);
    setResult(null);
  }, [original.data]);
  function change(patch: Partial<CalculationInput>) {
    const next = {
      ...inputRef.current,
      ...patch,
      requestId: crypto.randomUUID(),
    };
    inputRef.current = next;
    setInput(next);
    setResult(null);
    setError("");
  }
  function lineChange(id: string, patch: Partial<CalculationLine>) {
    change({
      lines: inputRef.current.lines.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    });
  }
  const elevator = elevators.data?.find((item) => item.id === input.elevatorId);
  const availableServices =
    elevator?.services.filter(
      (service) =>
        !service.archived &&
        !input.lines.some((row) => row.serviceId === service.id),
    ) || [];
  const canAddService = availableServices.some(
    (service) =>
      service.id === selectedService && applicableRate(service, input.date),
  );
  function addService() {
    const service = availableServices.find(
      (item) => item.id === selectedService,
    );
    const rate = service && applicableRate(service, input.date);
    if (!service || !rate) return;
    change({
      lines: [
        ...input.lines,
        {
          id: crypto.randomUUID(),
          serviceId: service.id,
          name: service.name,
          unit: service.unit,
          price: rate.price,
          category: "ELEVATOR",
          factor: "1",
          overtime: false,
        },
      ],
    });
    setSelectedService("none");
  }
  async function calculate(event: FormEvent) {
    event.preventDefault();
    setError("");
    setCalculating(true);
    const current = inputRef.current;
    try {
      const next = await tradeApi.preview(current);
      if (inputRef.current.requestId === current.requestId) setResult(next);
    } catch (error) {
      if (inputRef.current.requestId === current.requestId)
        setError(errorText(error));
    } finally {
      setCalculating(false);
    }
  }
  async function save() {
    if (!result) return;
    setSaving(true);
    setError("");
    try {
      const record = await tradeApi.save(input, result.fingerprint);
      await client.invalidateQueries({ queryKey: ["calculations"] });
      router.push(`/admin/calculator/${record.id}`);
    } catch (error) {
      setError(errorText(error));
      setSaving(false);
    }
  }
  if (options.isLoading || elevators.isLoading || (copy && original.isLoading))
    return <div className="trade-empty">Загрузка…</div>;
  if (options.isError || elevators.isError || (copy && original.isError))
    return (
      <QueryError
        retry={() => {
          options.refetch();
          elevators.refetch();
          if (copy) original.refetch();
        }}
      />
    );
  return (
    <div className="trade-workspace">
      <Link href="/admin/calculator" className="trade-back">
        <ArrowLeft size={16} />
        Все расчёты
      </Link>
      <header className="trade-heading">
        <div>
          <h1>{copy ? "Копия расчёта" : "Новый расчёт"}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/elevators">Элеваторы и тарифы</Link>
        </Button>
      </header>
      <div className="trade-mode" aria-label="Режим расчёта">
        {(["DOMESTIC", "EXPORT"] as const).map((mode) => (
          <button
            key={mode}
            disabled={saving}
            type="button"
            aria-pressed={input.mode === mode}
            onClick={() => {
              if (input.mode !== mode)
                change({
                  mode,
                  currency: mode === "DOMESTIC" ? "KZT" : "USD",
                  salePrice: "",
                });
            }}
          >
            {mode === "DOMESTIC" ? "Продажи по Казахстану" : "Экспорт"}
          </button>
        ))}
      </div>
      <div className="trade-editor-layout">
        <form id="trade-calculation-form" onSubmit={calculate}>
          <fieldset disabled={saving}>
            <section className="trade-section">
              <h2>Параметры сделки</h2>
              <div className="trade-form-grid">
                <TextField
                  label="Название расчёта"
                  value={input.title}
                  onChange={(title) => change({ title })}
                  required
                  wide
                />
                <Field label="Дата расчёта">
                  <DatePickerInput
                    value={input.date}
                    onChange={(date) => change({ date })}
                    max={input.mode === "EXPORT" ? todayKz() : undefined}
                    aria-label="Дата расчёта"
                    aria-required
                  />
                </Field>
                <TextField
                  label="Культура"
                  value={input.culture}
                  onChange={(culture) => change({ culture })}
                  required
                />
                <Choice
                  label="Закупка"
                  value={input.purchaseId || "none"}
                  onChange={(value) => {
                    const purchase = options.data?.purchases.find(
                      (item) => item.id === value,
                    );
                    change(
                      purchase
                        ? {
                            purchaseId: value,
                            purchasePrice: purchase.unitPrice,
                            culture: purchase.cultureName,
                            tonnes: purchase.quantity,
                          }
                        : { purchaseId: undefined },
                    );
                  }}
                  options={[
                    { value: "none", label: "Без привязки" },
                    ...(options.data?.purchases
                      .filter((p) => p.currency === "KZT")
                      .map((p) => ({
                        value: p.id,
                        label: `${p.agreementNumber} · ${p.cultureName}`,
                      })) || []),
                  ]}
                />
                <Choice
                  label="Контракт / приложение"
                  value={
                    input.applicationId ? String(input.applicationId) : "none"
                  }
                  onChange={(value) => {
                    const application = options.data?.applications.find(
                      (item) => item.id === Number(value),
                    );
                    const compatibleCurrency = application &&
                      ["USD", "EUR", "RUB", "CNY", "KZT"].includes(application.currency || "") &&
                      (input.mode === "EXPORT" || application.currency === "KZT");
                    change(
                      application
                        ? {
                            applicationId: application.id,
                            culture: application.culture,
                            departureStation:
                              application.departure_stations.join(", "),
                            destinationStation:
                              application.destination_stations.join(", "),
                            salePrice: compatibleCurrency ? String(application.price_per_ton) : "",
                            ...(input.mode === "EXPORT" && compatibleCurrency
                              ? { currency: application.currency as Currency }
                              : {}),
                          }
                        : { applicationId: undefined },
                    );
                  }}
                  options={[
                    { value: "none", label: "Без привязки" },
                    ...(options.data?.applications.map((a) => ({
                      value: String(a.id),
                      label: `${a.contract.number} · ${a.name || a.id}`,
                    })) || []),
                  ]}
                />
                <TextField
                  label="Станция отправления"
                  value={input.departureStation}
                  onChange={(departureStation) => change({ departureStation })}
                  required
                />
                <TextField
                  label="Станция назначения"
                  value={input.destinationStation}
                  onChange={(destinationStation) =>
                    change({ destinationStation })
                  }
                  required
                />
                <NumberField
                  label="Количество вагонов"
                  value={input.wagons || ""}
                  step="1"
                  min="1"
                  onChange={(wagons) => change({ wagons: Number(wagons) })}
                />
                <NumberField
                  label="Общий объём, т"
                  value={input.tonnes}
                  step="0.001"
                  min="0.001"
                  onChange={(tonnes) => change({ tonnes })}
                />
                <NumberField
                  label="Закупочная цена, KZT/т"
                  value={input.purchasePrice}
                  onChange={(purchasePrice) => change({ purchasePrice })}
                />
                <NumberField
                  label={`Цена продажи, ${input.currency}/т`}
                  value={input.salePrice}
                  onChange={(salePrice) => change({ salePrice })}
                />
                {input.mode === "EXPORT" && (
                  <Choice
                    label="Валюта продажи"
                    value={input.currency}
                    onChange={(currency) =>
                      change({ currency: currency as Currency, salePrice: "" })
                    }
                    options={["USD", "EUR", "RUB", "CNY", "KZT"].map(
                      (value) => ({ value, label: value }),
                    )}
                  />
                )}
                <NumberField
                  label="ТехПД, KZT/вагон"
                  value={input.techPdPerWagon}
                  onChange={(techPdPerWagon) => change({ techPdPerWagon })}
                />
              </div>
            </section>
            <section className="trade-section">
              <h2>Элеватор</h2>
              <Choice
                label="Элеватор"
                value={input.elevatorId || "none"}
                onChange={(value) => {
                  change({
                    elevatorId: value === "none" ? undefined : value,
                    lines: input.lines.filter((row) => !row.serviceId),
                  });
                  setSelectedService("none");
                }}
                options={[
                  { value: "none", label: "Не выбран" },
                  ...(elevators.data
                    ?.filter((e) => !e.archived || e.id === input.elevatorId)
                    .map((e) => ({
                      value: e.id,
                      label: `${e.name}${e.archived ? " (архив)" : ""}`,
                    })) || []),
                ]}
              />
              {elevator && (
                <div className="trade-service-add">
                  <Choice
                    label="Услуга элеватора"
                    value={selectedService}
                    onChange={setSelectedService}
                    options={[
                      { value: "none", label: "Выберите услугу" },
                      ...availableServices.map((service) => {
                        const rate = applicableRate(service, input.date);
                        return {
                          value: service.id,
                          label: `${service.name} · ${rate ? `${moneyText(rate.price)} ₸` : "нет тарифа на дату"}`,
                        };
                      }),
                    ]}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canAddService}
                    onClick={addService}
                  >
                    <Plus size={16} />
                    Добавить
                  </Button>
                </div>
              )}
            </section>
            <section className="trade-section">
              <div className="trade-section-heading">
                <h2>Расходы</h2>
                <Button
                  type="button"
                  variant="outline"
                  disabled={input.lines.length >= 100}
                  onClick={() =>
                    change({
                      lines: [
                        ...input.lines,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          category: "OTHER",
                          unit: "WAGON",
                          price: "",
                          factor: "1",
                          overtime: false,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={16} />
                  Добавить расход
                </Button>
              </div>
              {!input.lines.length && (
                <p className="trade-note">Дополнительных расходов нет</p>
              )}
              {input.lines.map((row, index) => {
                const service = elevator?.services.find(
                  (s) => s.id === row.serviceId,
                );
                const rate = service && applicableRate(service, input.date);
                return (
                  <div className="trade-cost-row" key={row.id}>
                    <div className="trade-cost-top">
                      <div>
                        {row.serviceId ? (
                          <strong>{service?.name || row.name}</strong>
                        ) : (
                          <Input
                            aria-label={`Название расхода ${index + 1}`}
                            placeholder="Название расхода"
                            maxLength={160}
                            required
                            value={row.name}
                            onChange={(e) =>
                              lineChange(row.id, { name: e.target.value })
                            }
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Удалить расход"
                        aria-label={`Удалить расход ${index + 1}`}
                        onClick={() =>
                          change({
                            lines: input.lines.filter(
                              (item) => item.id !== row.id,
                            ),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <div className="trade-cost-controls">
                      {row.serviceId ? (
                        <Field label="Единица тарифа">
                          <div className="trade-readonly">
                            {UNITS[service?.unit || row.unit]}
                          </div>
                        </Field>
                      ) : (
                        <Choice
                          label={`Единица расхода ${index + 1}`}
                          value={row.unit}
                          onChange={(unit) =>
                            lineChange(row.id, { unit: unit as CostUnit })
                          }
                          options={Object.entries(UNITS).map(
                            ([value, label]) => ({ value, label }),
                          )}
                        />
                      )}
                      {row.serviceId ? (
                        <Field label="Цена, KZT">
                          <div className="trade-readonly">
                            {rate ? moneyText(rate.price) : "Нет тарифа"}
                          </div>
                        </Field>
                      ) : (
                        <NumberField
                          label={`Цена расхода ${index + 1}, KZT`}
                          value={row.price}
                          onChange={(price) => lineChange(row.id, { price })}
                        />
                      )}
                      {["ITEM", "TONNE_MONTH", "TONNE_PERCENT"].includes(
                        row.unit,
                      ) && (
                        <NumberField
                          label={
                            row.unit === "ITEM"
                              ? `Количество, расход ${index + 1}`
                              : row.unit === "TONNE_MONTH"
                                ? `Месяцев, расход ${index + 1}`
                                : `Снимаемые п.п., расход ${index + 1}`
                          }
                          step="0.001"
                          value={row.factor}
                          onChange={(factor) => lineChange(row.id, { factor })}
                        />
                      )}
                      {!row.serviceId && (
                        <Choice
                          label={`Категория расхода ${index + 1}`}
                          value={row.category}
                          onChange={(category) =>
                            lineChange(row.id, {
                              category: category as CalculationLine["category"],
                            })
                          }
                          options={Object.entries(CATEGORIES).map(
                            ([value, label]) => ({ value, label }),
                          )}
                        />
                      )}
                    </div>
                    {service?.overtimeEligible && (
                      <label className="trade-checkbox mt-3">
                        <input
                          type="checkbox"
                          checked={row.overtime}
                          onChange={(e) =>
                            lineChange(row.id, { overtime: e.target.checked })
                          }
                        />
                        Неурочное время ×1,5
                      </label>
                    )}
                  </div>
                );
              })}
            </section>
            <section className="trade-section">
              <TextField
                label="Комментарий"
                value={input.notes}
                onChange={(notes) => change({ notes })}
                maxLength={2000}
                wide
              />
            </section>
          </fieldset>
          {error && (
            <p role="alert" className="trade-alert">
              {error}
            </p>
          )}
        </form>
        <CalculationSummary result={result} currency={input.currency}>
          <div className="trade-actions">
            <Button
              type="submit"
              form="trade-calculation-form"
              className="trade-primary"
              disabled={calculating || saving || !input.date}
            >
              <Calculator size={16} />
              {calculating ? "Расчёт…" : "Рассчитать"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!result || calculating || saving}
              onClick={save}
            >
              <Save size={16} />
              {saving ? "Сохранение…" : "Сохранить расчёт"}
            </Button>
          </div>
          {result && (
            <details className="trade-history mt-4">
              <summary>Разбивка расходов</summary>
              <ul>
                {result.expenses.map((row) => (
                  <li key={row.id} className="trade-overflow">
                    {row.name}: {moneyText(row.amountKzt)} ₸
                  </li>
                ))}
              </ul>
            </details>
          )}
        </CalculationSummary>
      </div>
    </div>
  );
}
