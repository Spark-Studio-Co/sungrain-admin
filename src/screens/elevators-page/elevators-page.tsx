"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Choice,
  Field,
  QueryError,
  TextField,
  NumberField,
  StationChoice,
} from "@/screens/calculator-page/controls";
import {
  errorText,
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
import { ElevatorDetail, ElevatorRateHistory } from "./elevator-detail";
import { ElevatorDirectory } from "./elevator-directory";

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
  onBusyChange,
}: {
  elevator?: Elevator;
  onSaved: (item: Elevator) => void;
  onBusyChange?: (busy: boolean) => void;
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
    onBusyChange?.(true);
    setError("");
    try {
      await onSaved(
        elevator
          ? await tradeApi.updateElevator(elevator.id, input)
          : await tradeApi.createElevator(input),
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
      onBusyChange?.(false);
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
  mode,
  onSaved,
}: {
  elevator: Elevator;
  service?: ElevatorService;
  mode: "create" | "edit" | "rate";
  onSaved: () => void;
}) {
  const cultures = useQuery({
    queryKey: ["cultures", 1, 1000],
    queryFn: () => getCultures(1, 1000),
    enabled: mode !== "rate",
    retry: 1,
  });
  const [template, setTemplate] = useState("none");
  const [input, setInput] = useState<ServiceInput>({
    name: service?.name || "",
    culture: service?.culture || "",
    unit: service?.unit || "TONNE",
    price: mode === "edit" ? "" : service?.rates[0]?.price || "",
    effectiveFrom: todayKz(),
    overtimeEligible: service?.overtimeEligible || false,
    alternativeGroup: service?.alternativeGroup || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const termsChanged =
    mode === "edit" &&
    service &&
    (input.culture !== (service.culture || "") ||
      input.unit !== service.unit ||
      input.overtimeEligible !== service.overtimeEligible ||
      input.alternativeGroup !== service.alternativeGroup);
  const set = (key: keyof ServiceInput, value: string | boolean) => {
    setInput((current) => ({
      ...current,
      ...(mode === "edit" && key === "unit" ? { price: "" } : {}),
      [key]: value,
    }));
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "rate" && service)
        await tradeApi.addRate(elevator.id, service.id, {
          price: input.price,
          effectiveFrom: input.effectiveFrom,
        });
      else if (mode === "edit" && service)
        await tradeApi.updateService(elevator.id, service.id, {
          name: input.name,
          culture: input.culture || null,
          unit: input.unit,
          overtimeEligible: input.overtimeEligible,
          alternativeGroup: input.alternativeGroup,
          ...(termsChanged ? { newVersionPrice: input.price } : {}),
          expected: {
            name: service.name,
            culture: service.culture || null,
            unit: service.unit,
            overtimeEligible: service.overtimeEligible,
            alternativeGroup: service.alternativeGroup,
          },
        });
      else if (mode === "create")
        await tradeApi.addService(elevator.id, {
          ...input,
          culture: input.culture || null,
        });
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
        {mode !== "rate" && (
          <>
            {mode === "create" && (
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
            )}
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
                value={input.culture ? `culture:${input.culture}` : "all"}
                onChange={(value) =>
                  set(
                    "culture",
                    value === "all" ? "" : value.slice("culture:".length),
                  )
                }
                options={[
                  { value: "all", label: "Все культуры" },
                  ...(cultures.data?.data || []).map(({ name }) => ({
                    value: `culture:${name}`,
                    label: name,
                  })),
                ]}
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
        {(mode !== "edit" || termsChanged) && (
          <>
            <NumberField
              label={
                termsChanged ? "Начальный тариф новой версии, KZT" : "Цена, KZT"
              }
              value={input.price}
              onChange={(v) => set("price", v)}
            />
            {mode !== "edit" && (
              <Field label="Действует с">
                <DatePickerInput
                  value={input.effectiveFrom}
                  onChange={(v) => set("effectiveFrom", v)}
                  aria-label="Дата начала тарифа"
                  aria-required
                />
              </Field>
            )}
          </>
        )}
        {mode !== "rate" && (
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
      {termsChanged && (
        <p className="trade-alert" role="status">
          Новая версия с {todayKz().split("-").reverse().join(".")}. Прежние
          условия и тарифы сохранятся в архиве.
        </p>
      )}
      {error && (
        <p role="alert" className="trade-alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={
          busy ||
          (mode !== "edit" && !input.effectiveFrom) ||
          (termsChanged && !input.price)
        }
        className="trade-primary"
      >
        {busy
          ? "Сохранение…"
          : mode === "rate"
            ? "Сохранить новый тариф"
            : mode === "edit"
              ? termsChanged
                ? "Создать новую версию"
                : "Сохранить услугу"
              : "Добавить услугу"}
      </Button>
    </form>
  );
}

export default function ElevatorsPage({ id }: { id?: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const [dialog, setDialog] = useState<
    "elevator" | "service" | "edit-service" | "rate" | "history" | null
  >(null);
  const [selected, setSelected] = useState<ElevatorService>();
  const [editingElevator, setEditingElevator] = useState<Elevator>();
  const [savingElevator, setSavingElevator] = useState(false);
  const [deletingElevator, setDeletingElevator] = useState<Elevator>();
  const [elevatorDeleteBusy, setElevatorDeleteBusy] = useState(false);
  const [elevatorDeleteError, setElevatorDeleteError] = useState("");
  const elevatorDeleteFocus = useRef<HTMLButtonElement | null>(null);
  const dialogReturnFocus = useRef<HTMLButtonElement | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [busyService, setBusyService] = useState<string>();
  const mutationInFlight = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState<ElevatorService>();
  const [deleteError, setDeleteError] = useState("");
  const deleteReturnFocus = useRef<HTMLButtonElement | null>(null);
  const list = useQuery({
    queryKey: ["elevators"],
    queryFn: tradeApi.elevators,
    enabled: !id,
    retry: 1,
  });
  const detail = useQuery({
    queryKey: ["elevators", id],
    queryFn: () => tradeApi.elevator(id!),
    enabled: !!id,
  });
  const query = id ? detail : list;
  const elevator = detail.data;
  function openDialog(
    next: NonNullable<typeof dialog>,
    trigger: HTMLButtonElement,
    service?: ElevatorService,
  ) {
    dialogReturnFocus.current = trigger;
    setSelected(service);
    setDialog(next);
  }
  const invalidate = async () => {
    setDialog(null);
    await client.invalidateQueries({ queryKey: ["elevators"] });
  };
  async function archive(service: ElevatorService) {
    if (!elevator || mutationInFlight.current) return;
    mutationInFlight.current = true;
    setBusyService(service.id);
    setActionError("");
    setActionNotice("");
    try {
      await tradeApi.archiveService(elevator.id, service.id, !service.archived);
      await invalidate();
    } catch (error) {
      setActionError(errorText(error));
    } finally {
      mutationInFlight.current = false;
      setBusyService(undefined);
    }
  }
  async function removeService() {
    if (!elevator || !deleteTarget || mutationInFlight.current) return;
    mutationInFlight.current = true;
    const target = deleteTarget;
    setBusyService(target.id);
    setDeleteError("");
    try {
      const updated = await tradeApi.deleteService(elevator.id, target.id);
      client.setQueryData(["elevators", elevator.id], updated);
      client.setQueryData<Elevator[]>(["elevators"], (items) =>
        items?.map((item) => (item.id === updated.id ? updated : item)),
      );
      setDeleteTarget(undefined);
      setActionNotice(`Услуга «${target.name}» удалена.`);
      await client.invalidateQueries({ queryKey: ["elevators"] });
    } catch (error) {
      setDeleteError(errorText(error));
    } finally {
      mutationInFlight.current = false;
      setBusyService(undefined);
    }
  }
  function editElevator(
    item: Elevator | undefined,
    trigger: HTMLButtonElement,
  ) {
    setEditingElevator(item);
    setActionNotice("");
    openDialog("elevator", trigger);
  }
  async function removeElevator() {
    if (!deletingElevator || mutationInFlight.current) return;
    mutationInFlight.current = true;
    const target = deletingElevator;
    setElevatorDeleteBusy(true);
    setElevatorDeleteError("");
    try {
      await tradeApi.deleteElevator(target.id, target.version);
      client.setQueryData<Elevator[]>(["elevators"], (items) =>
        items?.filter((item) => item.id !== target.id),
      );
      client.removeQueries({ queryKey: ["elevators", target.id], exact: true });
      setDeletingElevator(undefined);
      setActionNotice(`Элеватор «${target.name}» удалён.`);
      await client.invalidateQueries({ queryKey: ["elevators"] });
    } catch (error) {
      setElevatorDeleteError(errorText(error));
    } finally {
      mutationInFlight.current = false;
      setElevatorDeleteBusy(false);
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
      {!id ? (
        <ElevatorDirectory
          elevators={list.data}
          isLoading={list.isLoading}
          isError={list.isError}
          onRetry={() => {
            void list.refetch();
          }}
          onAdd={(trigger) => editElevator(undefined, trigger)}
          onEdit={editElevator}
          busy={savingElevator || elevatorDeleteBusy}
          notice={actionNotice}
          onDelete={(item, trigger) => {
            elevatorDeleteFocus.current = trigger;
            setActionNotice("");
            setElevatorDeleteError("");
            setDeletingElevator(item);
          }}
        />
      ) : query.isLoading ? (
        <CrmRouteLoading />
      ) : query.isError ? (
        <QueryError retry={() => query.refetch()} />
      ) : (
        elevator && (
          <ElevatorDetail
            elevator={elevator}
            date={todayKz()}
            actionError={actionError}
            actionNotice={actionNotice}
            busyService={busyService}
            onEdit={(trigger) => editElevator(elevator, trigger)}
            onAddService={(trigger) => openDialog("service", trigger)}
            onEditService={(service, trigger) =>
              openDialog("edit-service", trigger, service)
            }
            onAddRate={(service, trigger) =>
              openDialog("rate", trigger, service)
            }
            onHistory={(service, trigger) =>
              openDialog("history", trigger, service)
            }
            onArchive={archive}
            onDelete={(service, trigger) => {
              deleteReturnFocus.current = trigger;
              setActionError("");
              setActionNotice("");
              setDeleteError("");
              setDeleteTarget(service);
            }}
          />
        )
      )}
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open && !(dialog === "elevator" && savingElevator))
            setDialog(null);
        }}
      >
        <DialogContent
          className="trade-dialog record-dialog elevator-dialog"
          aria-describedby={undefined}
          onEscapeKeyDown={(event) => {
            if (dialog === "elevator" && savingElevator) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = dialogReturnFocus.current;
            requestAnimationFrame(() => {
              const target = trigger?.isConnected ? trigger : document.getElementById("elevator-directory") || document.getElementById("elevator-services-title");
              target?.focus({ preventScroll: true });
            });
          }}
        >
          <DialogHeader>
            <DialogTitle
              className={
                dialog === "rate" ||
                dialog === "history" ||
                dialog === "edit-service"
                  ? "elevator-service-dialog-title"
                  : undefined
              }
            >
              {dialog === "elevator" ? (
                editingElevator ? (
                  "Редактировать элеватор"
                ) : (
                  "Новый элеватор"
                )
              ) : dialog === "rate" ||
                dialog === "history" ||
                dialog === "edit-service" ? (
                <>
                  <span className="elevator-dialog-label">
                    {dialog === "rate"
                      ? "Новый тариф"
                      : dialog === "edit-service"
                        ? "Редактировать услугу"
                        : "История тарифов"}
                    :
                  </span>{" "}
                  <span className="elevator-dialog-service">
                    {selected?.name}
                  </span>
                </>
              ) : (
                "Новая услуга"
              )}
            </DialogTitle>
          </DialogHeader>
          {dialog === "rate" && selected && (
            <p className="text-sm text-muted-foreground">
              Культура: {selected.culture || "Все культуры"}
            </p>
          )}
          {dialog === "history" ? (
            selected && (
              <ElevatorRateHistory service={selected} date={todayKz()} />
            )
          ) : dialog === "elevator" ? (
            <ElevatorEditor
              key={editingElevator?.id || "new-elevator"}
              elevator={editingElevator}
              onBusyChange={setSavingElevator}
              onSaved={async (item) => {
                client.setQueryData(["elevators", item.id], item);
                client.setQueryData<Elevator[]>(["elevators"], (items) =>
                  items?.map((existing) =>
                    existing.id === item.id ? item : existing,
                  ),
                );
                setActionNotice(
                  editingElevator
                    ? "Изменения элеватора сохранены."
                    : "Элеватор создан.",
                );
                await invalidate();
                if (!id && !editingElevator)
                  router.push(`/admin/elevators/${item.id}`);
              }}
            />
          ) : (
            (dialog === "service" ||
              dialog === "edit-service" ||
              dialog === "rate") &&
            elevator && (
              <ServiceEditor
                key={`${dialog}-${selected?.id || "new"}`}
                elevator={elevator}
                service={dialog === "service" ? undefined : selected}
                mode={
                  dialog === "service"
                    ? "create"
                    : dialog === "edit-service"
                      ? "edit"
                      : "rate"
                }
                onSaved={invalidate}
              />
            )
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !mutationInFlight.current) setDeleteTarget(undefined);
        }}
      >
        <AlertDialogContent
          className="elevator-delete-dialog"
          aria-busy={!!busyService}
          onEscapeKeyDown={(event) => {
            if (mutationInFlight.current) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            const trigger = deleteReturnFocus.current;
            requestAnimationFrame(() => {
              const target = trigger?.isConnected
                ? trigger
                : document.getElementById("elevator-services-title");
              target?.focus({ preventScroll: true });
            });
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="pr-8">
              Удалить услугу?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              «{deleteTarget?.name}» исчезнет из списка и будет недоступна для
              новых расчётов. Сохранённые расчёты и история тарифов останутся
              без изменений.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="trade-alert" role="alert">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!busyService}>
              Отмена
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!!busyService}
              onClick={removeService}
            >
              <Trash2 size={16} />
              {busyService ? "Удаление…" : "Удалить услугу"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={!!deletingElevator}
        onOpenChange={(open) => {
          if (!open && !mutationInFlight.current)
            setDeletingElevator(undefined);
        }}
      >
        <AlertDialogContent
          aria-busy={elevatorDeleteBusy}
          onEscapeKeyDown={(event) => {
            if (mutationInFlight.current) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            requestAnimationFrame(() => {
              const trigger = elevatorDeleteFocus.current;
              (trigger?.isConnected
                ? trigger
                : document.getElementById("elevator-directory")
              )?.focus({ preventScroll: true });
            });
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="pr-8">
              Удалить элеватор?
            </AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              «{deletingElevator?.name}» исчезнет из справочника и будет
              недоступен для новых расчётов. Сохранённые расчёты не изменятся.
              Услуги и тарифы будут сохранены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {elevatorDeleteError && (
            <p className="trade-alert" role="alert">
              {elevatorDeleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={elevatorDeleteBusy}>
              Отмена
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={elevatorDeleteBusy}
              onClick={removeElevator}
            >
              <Trash2 size={16} />
              {elevatorDeleteBusy ? "Удаление…" : "Удалить элеватор"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
