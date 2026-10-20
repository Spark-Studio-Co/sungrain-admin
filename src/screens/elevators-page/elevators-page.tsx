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
import { DatePickerInput } from "@/components/ui/date-picker";
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

const templates: Omit<ServiceInput, "effectiveFrom">[] = [
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
        <TextField
          label="Станция"
          value={input.station}
          onChange={(v) => set("station", v)}
        />
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
  const [template, setTemplate] = useState("none");
  const [input, setInput] = useState<ServiceInput>({
    name: service?.name || "",
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
        disabled={busy || !input.effectiveFrom}
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
    <div className="trade-workspace">
      {id && (
        <Link href="/admin/elevators" className="trade-back">
          <ArrowLeft size={16} />
          Элеваторы
        </Link>
      )}
      <header className="trade-heading">
        <div>
          <h1>{id ? elevator?.name || "Элеватор" : "Элеваторы"}</h1>
          <p>
            {id ? elevator?.station : `${list.data?.length ?? 0} в справочнике`}
          </p>
        </div>
        <div className="trade-heading-actions">
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
        </div>
      </header>
      {query.isLoading ? (
        <div className="trade-empty">Загрузка…</div>
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
              <table className="trade-table">
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
                        <Link href={`/admin/elevators/${item.id}`}>
                          {item.name}
                        </Link>
                      </td>
                      <td>{item.station || "—"}</td>
                      <td>{item.services.filter((s) => !s.archived).length}</td>
                      <td>{item.contact || "—"}</td>
                      <td>
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
            <div className="trade-empty">
              <Warehouse size={32} className="mx-auto mb-3" />
              <p>
                {search
                  ? "Элеваторы не найдены"
                  : "Элеваторы пока не добавлены"}
              </p>
            </div>
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
                <table className="trade-table">
                  <thead>
                    <tr>
                      <th>Услуга</th>
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
                          <td>{UNITS[service.unit]}</td>
                          <td className="trade-number">
                            {current ? moneyText(current.price) : "Нет тарифа"}
                            {current && (
                              <span className="trade-subline">
                                с {dateText(current.effectiveFrom)}
                              </span>
                            )}
                          </td>
                          <td>
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
              <div className="trade-empty">Услуги пока не добавлены</div>
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
        <DialogContent className="trade-dialog" aria-describedby={undefined}>
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
