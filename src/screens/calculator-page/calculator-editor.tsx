"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Calculator,
  Check,
  ChevronDown,
  Globe2,
  Link2,
  Loader2,
  MapPin,
  Plus,
  Save,
  TrainFront,
  Trash2,
  Warehouse,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerInput } from "@/components/ui/date-picker";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";
import { WorkspaceHeading } from "@/components/ui/workspace-heading";
import {
  Choice,
  Field,
  NumberField,
  QueryError,
  StationChoice,
  TextField,
} from "./controls";
import { CalculationSummary } from "./calculation-summary";
import {
  copyCalculation,
  emptyInput,
  rowAmount,
  serviceMatchesCulture,
  wagonCount,
} from "./calculator-model";
import {
  applicableRate,
  dateText,
  errorText,
  moneyText,
  todayKz,
  tradeApi,
  UNIT_SHORT,
  type CalculationInput,
  type CalculationLine,
  type CalculationResult,
  type Currency,
  type ElevatorService,
} from "@/entities/calculator/api";
import "./trade.css";
import "./cost-calculator.css";

export default function CalculatorEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const copy = params.get("copy");
  const [input, setInput] = useState<CalculationInput>(() =>
    emptyInput(todayKz(), params.get("elevator") || undefined),
  );
  const inputRef = useRef(input);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const loadedCopy = useRef<string | null>(null);
  const [omitted, setOmitted] = useState<string[]>([]);
  const [reconciled, setReconciled] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const options = useQuery({
    queryKey: ["calculator-options"],
    queryFn: tradeApi.options,
  });
  const cultureNames = Array.from(
    new Set(
      [
        ...(options.data?.cultures.map((culture) => culture.name) || []),
        input.culture,
      ].filter(Boolean),
    ),
  );
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
    const next = copyCalculation(original.data, todayKz());
    inputRef.current = next.input;
    setInput(next.input);
    setOmitted(next.omitted);
    setResult(null);
  }, [original.data]);
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function change(patch: Partial<CalculationInput>) {
    const next = {
      ...inputRef.current,
      ...patch,
      requestId: crypto.randomUUID(),
    };
    next.wagons = wagonCount(next.lines);
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
  const wagonLines = input.lines.filter((line) => !line.serviceId);
  const serviceLines = input.lines.filter((line) => line.serviceId);
  const services =
    elevator?.services.filter(
      (service) =>
        (!service.archived && serviceMatchesCulture(service, input.culture)) ||
        serviceLines.some((line) => line.serviceId === service.id),
    ) || [];
  const filteredServices = services.filter((service) =>
    service.name
      .toLocaleLowerCase("ru")
      .includes(serviceSearch.toLocaleLowerCase("ru")),
  );
  const unavailableLines = serviceLines.filter(
    (line) => !services.some((service) => service.id === line.serviceId),
  );
  const copiedCultureMismatch =
    copy &&
    input.culture === original.data?.input.culture &&
    services.some(
      (service) =>
        serviceLines.some((line) => line.serviceId === service.id) &&
        !serviceMatchesCulture(service, input.culture),
    );
  const servicesInvalid =
    !!unavailableLines.length ||
    serviceLines.some((line) => {
      const service = services.find((s) => s.id === line.serviceId);
      return (
        !service ||
        service.archived ||
        !serviceMatchesCulture(service, input.culture) ||
        !applicableRate(service, input.date)
      );
    }) ||
    !!elevator?.archived;
  function toggleService(service: ElevatorService, checked: boolean) {
    const remaining = inputRef.current.lines.filter(
      (line) =>
        line.serviceId !== service.id &&
        (!checked ||
          !service.alternativeGroup ||
          !elevator?.services.some(
            (s) =>
              s.id === line.serviceId &&
              s.alternativeGroup === service.alternativeGroup,
          )),
    );
    const rate = applicableRate(service, input.date);
    if (
      checked &&
      (!rate ||
        service.archived ||
        !serviceMatchesCulture(service, input.culture))
    )
      return;
    change({
      lines: checked
        ? [
            ...remaining,
            {
              id: crypto.randomUUID(),
              serviceId: service.id,
              name: service.name,
              category: "ELEVATOR",
              unit: service.unit,
              price: rate!.price,
              factor: "1",
              overtime: false,
            },
          ]
        : remaining,
    });
  }
  function addWagons() {
    change({
      lines: [
        ...inputRef.current.lines,
        {
          id: crypto.randomUUID(),
          name: "Вагоны",
          category: "TRANSPORT",
          unit: "WAGON",
          price: "",
          factor: "1",
          overtime: false,
        },
      ],
    });
  }
  async function calculate(event: FormEvent) {
    event.preventDefault();
    if (
      !inputRef.current.departureStation ||
      !inputRef.current.destinationStation
    ) {
      setError(
        !inputRef.current.departureStation
          ? "Выберите станцию отправления."
          : "Выберите станцию назначения.",
      );
      return;
    }
    if (servicesInvalid) {
      setError(
        "Проверьте выбранные услуги: культура или дата расчёта не соответствует тарифам.",
      );
      return;
    }
    if (omitted.length && !reconciled) {
      setError("Сверьте расходы, которые не перенеслись из старого расчёта.");
      return;
    }
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
    if (!result || !formRef.current?.reportValidity()) return;
    setSaving(true);
    setError("");
    try {
      const record = await tradeApi.save(inputRef.current, result.fingerprint);
      await client.invalidateQueries({ queryKey: ["calculations"] });
      router.push(`/admin/calculator/${record.id}`);
    } catch (error) {
      setError(errorText(error));
      setResult(null);
      setSaving(false);
    }
  }
  if (options.isLoading || elevators.isLoading || (copy && original.isLoading))
    return <CrmRouteLoading />;
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
    <div className="trade-workspace cost-workspace cost-editor-screen record-workspace">
      <Link href="/admin/calculator" className="trade-back">
        <ArrowLeft size={15} />
        Все расчёты
      </Link>
      <WorkspaceHeading
        icon={Calculator}
        eyebrow="Экономика сделки"
        title={copy ? "Копия расчёта" : "Новый расчёт"}
        description="Себестоимость партии"
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/elevators">
              <Warehouse size={16} />
              Элеваторы и тарифы
              <ArrowUpRight size={15} />
            </Link>
          </Button>
        }
      />
      <div className="trade-editor-layout cost-editor-layout">
        <form id="trade-calculation-form" ref={formRef} onSubmit={calculate}>
          <fieldset disabled={saving} className="cost-form-fieldset">
            {copiedCultureMismatch && (
              <p className="trade-alert" role="alert">
                Услуги исходного расчёта теперь привязаны к другой культуре.
                Выберите актуальную культуру партии или исключите неподходящие
                услуги.
              </p>
            )}
            {omitted.length > 0 && (
              <div className="cost-copy-notice" role="note">
                <strong>Проверьте расходы исходного расчёта</strong>
                <p>
                  Не перенесены: {omitted.join(", ")}. Вагоны добавьте
                  отдельными строками, остальные расходы выберите в услугах
                  элеватора.
                </p>
                <label className="trade-checkbox">
                  <Checkbox
                    checked={reconciled}
                    onCheckedChange={(v) => {
                      setReconciled(v === true);
                      setResult(null);
                    }}
                  />
                  Расходы сверены
                </label>
              </div>
            )}
            <section className="cost-section">
              <div className="cost-section-title">
                <Wheat size={19} />
                <h2>Партия</h2>
              </div>
              <div className="cost-context-row">
                <div
                  className="trade-mode cost-mode"
                  role="group"
                  aria-label="Направление расчёта"
                >
                  {(["DOMESTIC", "EXPORT"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={input.mode === mode}
                      onClick={() => {
                        if (input.mode !== mode)
                          change({
                            mode,
                            currency: mode === "DOMESTIC" ? "KZT" : "USD",
                          });
                      }}
                    >
                      {mode === "DOMESTIC" ? (
                        <MapPin size={15} />
                      ) : (
                        <Globe2 size={15} />
                      )}
                      {mode === "DOMESTIC" ? "Казахстан" : "Экспорт"}
                    </button>
                  ))}
                </div>
                <Field label="Дата расчёта">
                  <DatePickerInput
                    value={input.date}
                    onChange={(date) => change({ date })}
                    max={input.currency !== "KZT" ? todayKz() : undefined}
                    aria-label="Дата расчёта"
                    aria-required
                  />
                </Field>
              </div>
              <div className="trade-form-grid cost-party-grid">
                <TextField
                  label="Название расчёта"
                  value={input.title}
                  onChange={(title) => change({ title })}
                  required
                  wide
                />
                <Choice
                  label="Культура"
                  value={input.culture}
                  onChange={(culture) => change({ culture })}
                  options={cultureNames.map((name) => ({
                    value: name,
                    label: name,
                  }))}
                  placeholder="Выберите культуру"
                  required
                />
                <NumberField
                  label="Объём партии, т"
                  value={input.tonnes}
                  step="0.001"
                  min="0.001"
                  onChange={(tonnes) => change({ tonnes })}
                />
                <NumberField
                  label="Закупочная цена, ₸/т"
                  value={input.purchasePrice}
                  onChange={(purchasePrice) => change({ purchasePrice })}
                />
                {input.mode === "EXPORT" && (
                  <Choice
                    label="Валюта расчёта"
                    value={input.currency}
                    onChange={(currency) =>
                      change({ currency: currency as Currency })
                    }
                    options={["USD", "EUR", "RUB", "CNY", "KZT"].map(
                      (value) => ({ value, label: value }),
                    )}
                  />
                )}
              </div>
              <div className="trade-form-grid cost-route-grid">
                <StationChoice
                  label="Станция отправления"
                  value={input.departureStation}
                  onChange={(departureStation) => change({ departureStation })}
                  stations={options.data?.stations || []}
                />
                <StationChoice
                  label="Станция назначения"
                  value={input.destinationStation}
                  onChange={(destinationStation) =>
                    change({ destinationStation })
                  }
                  stations={options.data?.stations || []}
                />
              </div>
              <details className="cost-links">
                <summary>
                  <Link2 size={15} />
                  Связать с закупкой или приложением
                  <ChevronDown size={15} />
                  {(input.purchaseId || input.applicationId) && (
                    <Check size={14} />
                  )}
                </summary>
                <div className="trade-form-grid">
                  <Choice
                    label="Закупка"
                    value={input.purchaseId || "none"}
                    onChange={(value) => {
                      const p = options.data?.purchases.find(
                        (item) => item.id === value,
                      );
                      change(
                        p
                          ? {
                              purchaseId: p.id,
                              culture: p.cultureName,
                              tonnes: p.quantity,
                              purchasePrice: p.unitPrice,
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
                      const a = options.data?.applications.find(
                        (item) => item.id === Number(value),
                      );
                      change(
                        a
                          ? {
                              applicationId: a.id,
                              culture: a.culture,
                              departureStation: a.departure_stations.join(", "),
                              destinationStation:
                                a.destination_stations.join(", "),
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
                </div>
              </details>
            </section>
            <section className="cost-section">
              <div className="cost-section-heading">
                <div className="cost-section-title">
                  <TrainFront size={19} />
                  <h2>Вагоны</h2>
                  <span className="cost-count">{input.wagons}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addWagons}
                  disabled={input.lines.length >= 100}
                >
                  <Plus size={15} />
                  Добавить вагоны
                </Button>
              </div>
              {!wagonLines.length ? (
                <div className="cost-empty-row">
                  <TrainFront size={23} />
                  <span>Расходы на вагоны не добавлены</span>
                </div>
              ) : (
                <div className="cost-wagon-list">
                  {wagonLines.map((row, i) => (
                    <div className="cost-wagon-row" key={row.id}>
                      <Field label={`Вагоны ${i + 1}`}>
                        <Input
                          aria-label={`Название вагонов ${i + 1}`}
                          maxLength={160}
                          value={row.name === "Вагоны" ? "" : row.name}
                          placeholder="Собственник или примечание"
                          onChange={(e) =>
                            lineChange(row.id, {
                              name: e.target.value.trim()
                                ? e.target.value
                                : "Вагоны",
                            })
                          }
                        />
                      </Field>
                      <NumberField
                        label="Количество"
                        ariaLabel={`Количество, строка ${i + 1}`}
                        value={row.factor}
                        step="1"
                        min="1"
                        onChange={(factor) => lineChange(row.id, { factor })}
                      />
                      <NumberField
                        label="Цена, ₸/вагон"
                        ariaLabel={`Цена за вагон, ₸, строка ${i + 1}`}
                        value={row.price}
                        onChange={(price) => lineChange(row.id, { price })}
                      />
                      <div className="cost-row-amount">
                        <span>Сумма</span>
                        <strong>
                          {moneyText(
                            rowAmount(
                              row.price,
                              "WAGON",
                              input.tonnes,
                              input.wagons,
                              row.factor,
                              false,
                              true,
                            ),
                          )}{" "}
                          ₸
                        </strong>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Удалить вагоны"
                        aria-label={`Удалить вагоны ${i + 1}`}
                        onClick={() =>
                          change({
                            lines: input.lines.filter(
                              (line) => line.id !== row.id,
                            ),
                          })
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="cost-section">
              <div className="cost-section-heading">
                <div className="cost-section-title">
                  <Warehouse size={19} />
                  <h2>Услуги элеватора</h2>
                  {!!serviceLines.length && (
                    <span className="cost-count">{serviceLines.length}</span>
                  )}
                </div>
                {elevator && (
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/admin/elevators/${elevator.id}`}
                      target="_blank"
                    >
                      Тарифы
                      <ArrowUpRight size={14} />
                    </Link>
                  </Button>
                )}
              </div>
              <Choice
                label="Элеватор"
                value={input.elevatorId || "none"}
                onChange={(value) => {
                  change({
                    elevatorId: value === "none" ? undefined : value,
                    lines: input.lines.filter((row) => !row.serviceId),
                  });
                  setServiceSearch("");
                }}
                options={[
                  { value: "none", label: "Выберите элеватор" },
                  ...(elevators.data
                    ?.filter((e) => !e.archived || e.id === input.elevatorId)
                    .map((e) => ({
                      value: e.id,
                      label: `${e.name}${e.archived ? " · архив" : ""}`,
                    })) || []),
                ]}
              />
              {!elevator ? (
                <div className="cost-empty-row">
                  <Warehouse size={23} />
                  <span>Элеватор не выбран</span>
                </div>
              ) : (
                <>
                  {elevator.archived && (
                    <p className="trade-alert">
                      Элеватор в архиве. Выберите действующий элеватор.
                    </p>
                  )}
                  {services.length > 6 && (
                    <Input
                      className="cost-service-search"
                      aria-label="Поиск услуги"
                      placeholder="Найти услугу"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                    />
                  )}
                  {!services.length && (
                    <div className="cost-empty-row">
                      <span>
                        {!input.culture
                          ? "Выберите культуру партии"
                          : !elevator.services.some(
                                (service) => !service.archived,
                              )
                            ? "Услуги пока не добавлены"
                            : `Нет услуг для культуры «${input.culture}»`}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/admin/elevators/${elevator.id}`}
                          target="_blank"
                        >
                          <Plus size={14} />
                          Добавить в элеватор
                        </Link>
                      </Button>
                    </div>
                  )}
                  {services.length > 0 && !filteredServices.length && (
                    <p className="cost-empty-row">Услуги не найдены</p>
                  )}
                  <div className="cost-services">
                    {filteredServices.map((service) => {
                      const row = serviceLines.find(
                        (line) => line.serviceId === service.id,
                      );
                      const rate = applicableRate(service, input.date);
                      const matchesCulture = serviceMatchesCulture(
                        service,
                        input.culture,
                      );
                      const invalid =
                        service.archived ||
                        !rate ||
                        elevator.archived ||
                        !matchesCulture;
                      const amount =
                        row && rate && !invalid
                          ? rowAmount(
                              rate.price,
                              service.unit,
                              input.tonnes,
                              input.wagons,
                              row.factor,
                              row.overtime,
                            )
                          : null;
                      return (
                        <div
                          key={service.id}
                          className={`cost-service ${row ? "is-selected" : ""} ${invalid ? "is-unavailable" : ""}`}
                        >
                          <div className="cost-service-main">
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={!!row}
                              disabled={
                                !row && (invalid || input.lines.length >= 100)
                              }
                              onCheckedChange={(v) =>
                                toggleService(service, v === true)
                              }
                            />
                            <label
                              htmlFor={`service-${service.id}`}
                              className="cost-service-name"
                            >
                              <strong>{service.name}</strong>
                              <span>{service.culture || "Все культуры"}</span>
                              <span
                                title={
                                  rate
                                    ? `Тариф от ${dateText(rate.effectiveFrom)}`
                                    : undefined
                                }
                              >
                                {service.archived
                                  ? "Услуга в архиве"
                                  : !matchesCulture
                                    ? `Другая культура: ${service.culture}`
                                    : !rate
                                      ? "Нет тарифа на выбранную дату"
                                      : `${moneyText(rate.price)} ₸ / ${UNIT_SHORT[service.unit]}`}
                              </span>
                            </label>
                            <div className="cost-service-amount">
                              {row ? (
                                <strong>{moneyText(amount)} ₸</strong>
                              ) : (
                                <span>—</span>
                              )}
                            </div>
                          </div>
                          {row &&
                            (service.overtimeEligible ||
                              ["ITEM", "TONNE_MONTH", "TONNE_PERCENT"].includes(
                                service.unit,
                              )) && (
                              <div className="cost-service-options">
                                {[
                                  "ITEM",
                                  "TONNE_MONTH",
                                  "TONNE_PERCENT",
                                ].includes(service.unit) && (
                                  <NumberField
                                    label={
                                      service.unit === "ITEM"
                                        ? "Количество"
                                        : service.unit === "TONNE_MONTH"
                                          ? "Месяцев хранения"
                                          : "Снимаемые п.п."
                                    }
                                    ariaLabel={`${service.unit === "ITEM" ? "Количество" : service.unit === "TONNE_MONTH" ? "Месяцев хранения" : "Снимаемые п.п."}: ${service.name}`}
                                    value={row.factor}
                                    min="0.001"
                                    step="0.001"
                                    onChange={(factor) =>
                                      lineChange(row.id, { factor })
                                    }
                                  />
                                )}
                                {service.overtimeEligible && (
                                  <label className="trade-checkbox">
                                    <Checkbox
                                      checked={row.overtime}
                                      onCheckedChange={(v) =>
                                        lineChange(row.id, {
                                          overtime: v === true,
                                        })
                                      }
                                    />
                                    Неурочное время ×1,5
                                  </label>
                                )}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {unavailableLines.map((line) => (
                <div key={line.id} className="cost-unavailable-line">
                  <span>Услуга недоступна: {line.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Удалить недоступную услугу ${line.name}`}
                    onClick={() =>
                      change({
                        lines: input.lines.filter((row) => row.id !== line.id),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </section>
            <section className="cost-section cost-comment">
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
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="trade-alert"
            >
              {error}
            </div>
          )}
        </form>
        <CalculationSummary
          result={result}
          currency={input.currency}
          tonnes={input.tonnes}
          wagons={input.wagons}
        >
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
              disabled={
                !result ||
                calculating ||
                saving ||
                servicesInvalid ||
                (omitted.length > 0 && !reconciled)
              }
              onClick={save}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Сохранение…" : "Сохранить расчёт"}
            </Button>
          </div>
        </CalculationSummary>
      </div>
      {typeof document !== "undefined" &&
        createPortal(
          <div className="cost-mobile-actions">
            <button
              type="button"
              className="cost-mobile-total"
              aria-label="Перейти к итогу расчёта"
              onClick={() =>
                document
                  .getElementById("cost-summary")
                  ?.scrollIntoView({ block: "start" })
              }
            >
              <span>Себестоимость / т</span>
              <strong>
                {result ? `${moneyText(result.costPerTonneKzt)} ₸` : "—"}
              </strong>
            </button>
            <Button
              type="submit"
              form="trade-calculation-form"
              aria-label="Рассчитать себестоимость"
              disabled={calculating || saving || !input.date}
              className="trade-primary"
            >
              <Calculator size={16} />
              {calculating ? "Расчёт…" : "Рассчитать"}
            </Button>
          </div>,
          document.body,
        )}
    </div>
  );
}
