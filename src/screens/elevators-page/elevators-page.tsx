"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Archive,
  Pencil,
  Plus,
  RotateCcw,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceHeading } from "@/components/ui/workspace-heading";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";
import { CrmEmptyState } from "@/components/ui/crm-state";
import { DatePickerInput } from "@/components/ui/date-picker";
import { getStations } from "@/entities/stations/api/get/get-stations.api";
import { getCultures } from "@/entities/cultures/api/get/get-cultures.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Choice,
  Field,
  QueryError,
  TextField,
  NumberField,
  StationChoice,
} from "@/screens/calculator-page/controls";
import {
  applicableRate,
  dateText,
  errorText,
  moneyText,
  todayKz,
  tradeApi,
  UNITS,
  type Elevator,
  type ElevatorInput,
  type ElevatorService,
  type ServiceInput,
} from "@/entities/calculator/api";
import "@/screens/calculator-page/trade.css";
import "@/screens/calculator-page/cost-calculator.css";

const templates: Omit<ServiceInput, "effectiveFrom" | "culture">[] = [
  {
    name: "ТехПД",
    price: "",
    unit: "WAGON",
    overtimeEligible: false,
    alternativeGroup: "",
  },
  {
    name: "Отгрузка зерна ж/д транспортом",
    price: "2100",
    unit: "TONNE",
    overtimeEligible: true,
    alternativeGroup: "RAIL_LOADING",
  },
  {
    name: "Отгрузка зерна в Китай",
    price: "2625",
    unit: "TONNE",
    overtimeEligible: true,
    alternativeGroup: "RAIL_LOADING",
  },
  {
    name: "Приёмка зерна автотранспортом",
    price: "790",
    unit: "TONNE",
    overtimeEligible: true,
    alternativeGroup: "",
  },
  {
    name: "Очистка зерна",
    price: "200",
    unit: "TONNE_PERCENT",
    overtimeEligible: false,
    alternativeGroup: "",
  },
  {
    name: "Сушка зерна",
    price: "2100",
    unit: "TONNE_PERCENT",
    overtimeEligible: false,
    alternativeGroup: "DRYING",
  },
  {
    name: "Сушка с ГСМ клиента",
    price: "700",
    unit: "TONNE_PERCENT",
    overtimeEligible: false,
    alternativeGroup: "DRYING",
  },
  {
    name: "Отгрузка зерна автотранспортом",
    price: "1000",
    unit: "TONNE",
    overtimeEligible: true,
    alternativeGroup: "",
  },
  {
    name: "Хранение зерна",
    price: "790",
    unit: "TONNE_MONTH",
    overtimeEligible: false,
    alternativeGroup: "",
  },
];

function ElevatorEditor({
  elevator,
  onSaved,
}: {
  elevator?: Elevator;
  onSaved: (item: Elevator) => void;
}) {
  const stations = useQuery({
    queryKey: ["stations", 1, 5000],
    queryFn: () => getStations(1, 5000),
    retry: 1,
  });
  const [input, setInput] = useState<ElevatorInput>({
    name: elevator?.name || "",
    station: elevator?.station || "",
    address: elevator?.address || "",
    contact: elevator?.contact || "",
    notes: elevator?.notes || "",
    archived: elevator?.archived || false,
    ...(elevator ? { version: elevator.version } : {}),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof ElevatorInput, value: string | boolean) =>
    setInput((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onSaved(
        elevator
          ? await tradeApi.updateElevator(elevator.id, input)
          : await tradeApi.createElevator(input),
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="trade-form-grid">
        <TextField
          label="Название элеватора"
          value={input.name}
          onChange={(v) => set("name", v)}
          required
          wide
        />
        <div className="min-w-0">
          <StationChoice
            label="Станция"
            value={input.station}
            onChange={(v) => set("station", v)}
            stations={stations.data?.data || []}
            required={false}
            disabled={stations.isPending}
            placeholder={stations.isPending ? "Загрузка станций…" : undefined}
          />
          {stations.isError && (
            <div role="alert" className="mt-2 text-xs text-destructive">
              Не удалось загрузить станции.{" "}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                disabled={stations.isFetching}
                onClick={() => stations.refetch()}
              >
                Повторить
              </Button>
            </div>
          )}
        </div>
        <TextField
          label="Контакты"
          value={input.contact}
          onChange={(v) => set("contact", v)}
          maxLength={300}
        />
        <TextField
          label="Адрес"
          value={input.address}
          onChange={(v) => set("address", v)}
          wide
          maxLength={300}
        />
        <TextField
          label="Комментарий"
          value={input.notes}
          onChange={(v) => set("notes", v)}
          wide
          maxLength={2000}
        />
        {elevator && (
          <label className="trade-checkbox trade-wide">
            <input
              type="checkbox"
              checked={input.archived}
              onChange={(e) => set("archived", e.target.checked)}
            />
            В архиве
          </label>
        )}
      </fieldset>
      {error && (
        <p className="trade-alert" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy} className="trade-primary">
        {busy ? "Сохранение…" : "Сохранить элеватор"}
      </Button>
    </form>
  );
}

function ServiceEditor({
  elevator,
  service,
  onSaved,
}: {
  elevator: Elevator;
  service?: ElevatorService;
  onSaved: () => void;
}) {
  const cultures = useQuery({
    queryKey: ["cultures", 1, 1000],
    queryFn: () => getCultures(1, 1000),
    enabled: !service,
    retry: 1,
  });
  const [template, setTemplate] = useState("none");
  const [input, setInput] = useState<ServiceInput>({
    name: service?.name || "",
    culture: service?.culture || "",
    unit: service?.unit || "TONNE",
    price: service?.rates[0]?.price || "",
    effectiveFrom: todayKz(),
    overtimeEligible: false,
    alternativeGroup: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof ServiceInput, value: string | boolean) =>
    setInput((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (service)
        await tradeApi.addRate(elevator.id, service.id, {
          price: input.price,
          effectiveFrom: input.effectiveFrom,
        });
      else await tradeApi.addService(elevator.id, input);
      onSaved();
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy} className="trade-form-grid">
        {!service && (
          <>
            <div className="trade-wide">
              <Choice
                label="Шаблон услуги"
                value={template}
                onChange={(value) => {
                  setTemplate(value);
                  if (value !== "none")
                    setInput((current) => ({
                      ...current,
                      ...templates[Number(value)],
                    }));
                }}
                options={[
                  { value: "none", label: "Собственная услуга" },
                  ...templates.map((t, i) => ({
                    value: String(i),
                    label: t.name,
                  })),
                ]}
              />
            </div>
            <TextField
              label="Название услуги"
              value={input.name}
              onChange={(v) => set("name", v)}
              required
              wide
            />
            <div className="trade-wide">
              <Choice
                label="Культура"
                value={input.culture}
                onChange={(value) => set("culture", value)}
                options={(cultures.data?.data || []).map(({ name }) => ({
                  value: name,
                  label: name,
                }))}
                placeholder={
                  cultures.isPending ? "Загрузка культур…" : "Выберите культуру"
                }
                disabled={cultures.isPending || cultures.isError}
                required
              />
              {cultures.isError && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  Не удалось загрузить культуры.{" "}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => cultures.refetch()}
                    disabled={cultures.isFetching}
                  >
                    Повторить
                  </Button>
                </p>
              )}
            </div>
            <Choice
              label="Единица тарифа"
              value={input.unit}
              onChange={(v) => set("unit", v)}
              options={Object.entries(UNITS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </>
        )}
        <NumberField
          label="Цена, KZT"
          value={input.price}
          onChange={(v) => set("price", v)}
        />
        <Field label="Действует с">
          <DatePickerInput
            value={input.effectiveFrom}
            onChange={(v) => set("effectiveFrom", v)}
            aria-label="Дата начала тарифа"
            aria-required
          />
        </Field>
        {!service && (
          <>
            <Choice
              label="Группа альтернатив"
              value={input.alternativeGroup || "none"}
              onChange={(v) => set("alternativeGroup", v === "none" ? "" : v)}
              options={[
                { value: "none", label: "Без группы" },
                { value: "DRYING", label: "Вариант сушки" },
                { value: "RAIL_LOADING", label: "Вариант ж/д отгрузки" },
              ]}
            />
            <label className="trade-checkbox trade-wide">
              <input
                type="checkbox"
                checked={input.overtimeEligible}
                onChange={(e) => set("overtimeEligible", e.target.checked)}
              />
              Повышенный тариф ×1,5 за неурочное время
            </label>
          </>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="trade-alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          busy ||
          !input.effectiveFrom ||
          (!service &&
            (!input.culture || cultures.isError || cultures.isPending))
        }
        className="trade-primary"
      >
        {busy
          ? "Сохранение…"
          : service
            ? "Сохранить новый тариф"
            : "Добавить услугу"}
      </Button>
    </form>
  );
}

export default function ElevatorsPage({ id }: { id?: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<"elevator" | "service" | "rate" | null>(
    null,
  );
  const [selected, setSelected] = useState<ElevatorService>();
  const [actionError, setActionError] = useState("");
  const [busyService, setBusyService] = useState<string>();
  const list = useQuery({
    queryKey: ["elevators"],
    queryFn: tradeApi.elevators,
    enabled: !id,
  });
  const detail = useQuery({
    queryKey: ["elevators", id],
    queryFn: () => tradeApi.elevator(id!),
    enabled: !!id,
  });
  const query = id ? detail : list;
  const elevator = detail.data;
  const invalidate = async () => {
    setDialog(null);
    await client.invalidateQueries({ queryKey: ["elevators"] });
  };
  const filtered =
    list.data?.filter((item) =>
      `${item.name} ${item.station}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];
  async function archive(service: ElevatorService) {
    if (!elevator) return;
    setBusyService(service.id);
    setActionError("");
    try {
      await tradeApi.archiveService(elevator.id, service.id, !service.archived);
      await invalidate();
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      setBusyService(undefined);
    }
  }
  return (
    <div className="trade-workspace cost-workspace record-workspace">
      {id && (
        <Link href="/admin/elevators" className="trade-back">
          <ArrowLeft size={16} />
          Элеваторы
        </Link>
      )}
      <WorkspaceHeading
        icon={Warehouse}
        eyebrow="Логистика и хранение"
        title={id ? elevator?.name || "Элеватор" : "Элеваторы"}
        description={
          id ? elevator?.station : `${list.data?.length ?? 0} в справочнике`
        }
        actions={
          <>
            {id && elevator && !elevator.archived && (
              <Button variant="outline" asChild>
                <Link href={`/admin/calculator/new?elevator=${id}`}>
                  Создать расчёт
                </Link>
              </Button>
            )}
            <Button
              className="trade-primary"
              onClick={() => setDialog("elevator")}
              disabled={!!id && !elevator}
            >
              {id ? <Pencil size={16} /> : <Plus size={16} />}
              {id ? "Редактировать" : "Добавить элеватор"}
            </Button>
          </>
        }
      />
      {query.isLoading ? (
        <CrmRouteLoading />
      ) : query.isError ? (
        <QueryError retry={() => query.refetch()} />
      ) : !id ? (
        <>
          <div className="trade-toolbar">
            <Field label="Поиск">
              <Input
                aria-label="Поиск элеватора"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название или станция"
              />
            </Field>
          </div>
          {filtered.length ? (
            <div className="trade-table-wrap">
              <table className="trade-table trade-responsive-table">
                <thead>
                  <tr>
                    <th>Элеватор</th>
                    <th>Станция</th>
                    <th>Услуги</th>
                    <th>Контакты</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="record-table-title">
                          <span className="record-row-icon" aria-hidden="true">
                            <Warehouse size={18} />
                          </span>
                          <div>
                            <Link href={`/admin/elevators/${item.id}`}>
                              {item.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td data-label="Станция">{item.station || "—"}</td>
                      <td data-label="Услуги">
                        {item.services.filter((s) => !s.archived).length}
                      </td>
                      <td data-label="Контакты">{item.contact || "—"}</td>
                      <td data-label="Статус">
                        <span
                          className={`trade-tag${item.archived ? " trade-tag-muted" : ""}`}
                        >
                          {item.archived ? "Архив" : "Действующий"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CrmEmptyState
              icon={Warehouse}
              title={
                search ? "Элеваторы не найдены" : "Элеваторы пока не добавлены"
              }
            />
          )}
        </>
      ) : (
        elevator && (
          <>
            <dl className="trade-details">
              <div>
                <dt>Адрес</dt>
                <dd>{elevator.address || "—"}</dd>
              </div>
              <div>
                <dt>Контакты</dt>
                <dd>{elevator.contact || "—"}</dd>
              </div>
              <div>
                <dt>Статус</dt>
                <dd>{elevator.archived ? "Архив" : "Действующий"}</dd>
              </div>
              {elevator.notes && (
                <div className="trade-wide">
                  <dt>Комментарий</dt>
                  <dd>{elevator.notes}</dd>
                </div>
              )}
            </dl>
            <div className="trade-section-heading">
              <h2>Услуги и тарифы</h2>
              <Button
                variant="outline"
                disabled={elevator.archived}
                onClick={() => {
                  setSelected(undefined);
                  setDialog("service");
                }}
              >
                <Plus size={16} />
                Добавить услугу
              </Button>
            </div>
            {actionError && (
              <p role="alert" className="trade-alert">
                {actionError}
              </p>
            )}
            {elevator.services.length ? (
              <div className="trade-table-wrap">
                <table className="trade-table trade-responsive-table">
                  <thead>
                    <tr>
                      <th>Услуга</th>
                      <th>Культура</th>
                      <th>Единица</th>
                      <th className="trade-number">Цена, KZT</th>
                      <th>Тарифы</th>
                      <th aria-label="Действия" />
                    </tr>
                  </thead>
                  <tbody>
                    {elevator.services.map((service) => {
                      const current = applicableRate(service, todayKz());
                      return (
                        <tr key={service.id}>
                          <td>
                            <strong>{service.name}</strong>
                            {service.archived && (
                              <span className="trade-subline">В архиве</span>
                            )}
                            {service.overtimeEligible && (
                              <span className="trade-subline">
                                Неурочное время ×1,5
                              </span>
                            )}
                          </td>
                          <td data-label="Культура">
                            {service.culture || "Все культуры"}
                          </td>
                          <td data-label="Единица">{UNITS[service.unit]}</td>
                          <td data-label="Цена, KZT" className="trade-number">
                            {current ? moneyText(current.price) : "Нет тарифа"}
                            {current && (
                              <span className="trade-subline">
                                с {dateText(current.effectiveFrom)}
                              </span>
                            )}
                          </td>
                          <td data-label="Тарифы">
                            <details className="trade-history">
                              <summary>
                                История ({service.rates.length})
                              </summary>
                              <ul>
                                {service.rates.map((rate) => (
                                  <li key={rate.id}>
                                    {dateText(rate.effectiveFrom)}:{" "}
                                    {moneyText(rate.price)} KZT
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </td>
                          <td>
                            <div className="trade-actions">
                              <Button
                                variant="outline"
                                size="icon"
                                title={`Новый тариф: ${service.name}`}
                                aria-label={`Новый тариф: ${service.name}`}
                                disabled={elevator.archived || service.archived}
                                onClick={() => {
                                  setSelected(service);
                                  setDialog("rate");
                                }}
                              >
                                <Plus size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={
                                  service.archived
                                    ? "Восстановить услугу"
                                    : "В архив"
                                }
                                aria-label={`${service.archived ? "Восстановить" : "Архивировать"}: ${service.name}`}
                                disabled={busyService === service.id}
                                onClick={() => archive(service)}
                              >
                                {service.archived ? (
                                  <RotateCcw size={16} />
                                ) : (
                                  <Archive size={16} />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <CrmEmptyState
                icon={Warehouse}
                title="Услуги пока не добавлены"
              />
            )}
          </>
        )
      )}
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent
          className="trade-dialog record-dialog"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {dialog === "elevator"
                ? id
                  ? "Карточка элеватора"
                  : "Новый элеватор"
                : dialog === "rate"
                  ? `Новый тариф: ${selected?.name}`
                  : "Новая услуга"}
            </DialogTitle>
          </DialogHeader>
          {dialog === "rate" && selected && (
            <p className="text-sm text-muted-foreground">
              Культура: {selected.culture || "Все культуры"}
            </p>
          )}
          {dialog === "elevator" ? (
            <ElevatorEditor
              elevator={elevator}
              onSaved={async (item) => {
                await invalidate();
                if (!id) router.push(`/admin/elevators/${item.id}`);
              }}
            />
          ) : (
            dialog &&
            elevator && (
              <ServiceEditor
                elevator={elevator}
                service={dialog === "rate" ? selected : undefined}
                onSaved={invalidate}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
