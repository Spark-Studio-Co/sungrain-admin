"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Download,
  FileText,
  LoaderCircle,
  Pencil,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Upload,
  X,
  UserRound,
  Warehouse,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker";
import { WorkspaceHeading } from "@/components/ui/workspace-heading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/components/ui/toast";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import {
  downloadAgreement,
  getPurchase,
  getPurchaseOptions,
  PURCHASES_KEY,
  savePurchase,
  type Purchase,
  type FarmOption,
  type PurchaseValues,
  type VatMode,
} from "@/entities/procurement/api/purchases.api";
import {
  calculatePurchase,
  formatMoney,
  formatQuantity,
  normalizeDecimal,
  validatePurchase,
  VAT_LABELS,
} from "@/entities/procurement/model/purchase-calculation";
import { PurchaseError } from "./purchases-page";
import { FarmCreateDialog } from "./farm-create-dialog";
import "./purchases.css";

type PurchaseDraft = {
  values: PurchaseValues;
  file?: File;
  removeDocument: boolean;
  version?: number;
  savedAt: number;
};
// Keep unsaved edits (including File objects) across SPA Back/Forward, never in permanent storage.
const purchaseDrafts = new Map<string, PurchaseDraft>();

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="purchase-field">
      <label htmlFor={`purchase-${name}`}>{label}</label>
      {children}
      {error && (
        <span id={`error-${name}`} role="alert" className="purchase-error">
          {error}
        </span>
      )}
    </div>
  );
}

function PurchaseForm({
  purchase,
  initialFarmerId,
}: {
  purchase?: Purchase;
  initialFarmerId?: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const draftOwner = useAuthData((state) => state.userId || state.token);
  const draftKey = `${draftOwner || "anonymous"}:${purchase?.id || "new"}`;
  const [savedDraft, setSavedDraft] = useState(() => {
    const draft = purchaseDrafts.get(draftKey);
    return draft && Date.now() - draft.savedAt < 3600000 ? draft : undefined;
  });
  const [baseVersion, setBaseVersion] = useState(purchase?.version);
  const initial: PurchaseValues = useMemo(
    () =>
      purchase
        ? {
            farmId: purchase.sourceFarmId ?? undefined,
            cultureName: purchase.cultureName,
            quantity: purchase.quantity,
            unitPrice: purchase.unitPrice,
            currency: purchase.currency,
            vatMode: purchase.vatMode,
            vatRate: purchase.vatMode === "NONE" ? "16" : purchase.vatRate,
            agreementNumber: purchase.agreementNumber,
            agreementDate: purchase.agreementDate.slice(0, 10),
            notes: purchase.notes,
          }
        : {
            farmId: initialFarmerId,
            cultureName: "",
            quantity: "",
            unitPrice: "",
            currency: "KZT",
            vatMode: "NONE",
            vatRate: "16",
            agreementNumber: "",
            agreementDate: new Date().toLocaleDateString("en-CA"),
            notes: "",
          },
    [purchase, initialFarmerId],
  );
  const [values, setValues] = useState<PurchaseValues>(initial);
  const [editing, setEditing] = useState(!purchase);
  const [errors, setErrors] = useState<
    Partial<Record<keyof PurchaseValues, string>>
  >({});
  const [file, setFile] = useState<File>();
  const [fileError, setFileError] = useState("");
  const [removeDocument, setRemoveDocument] = useState(false);
  const [farmOpen, setFarmOpen] = useState(false);
  const [createFarmOpen, setCreateFarmOpen] = useState(false);
  const [createdFarm, setCreatedFarm] = useState<FarmOption>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [saveError, setSaveError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const farmTrigger = useRef<HTMLButtonElement>(null);
  const createFarmTrigger = useRef<HTMLButtonElement>(null);
  const submitted = useRef(false);
  const request = useRef<{ fingerprint: string; id: string } | undefined>(
    undefined,
  );
  const dirty =
    editing &&
    (JSON.stringify(values) !== JSON.stringify(initial) ||
      !!file ||
      removeDocument);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    if (dirty) {
      if (purchaseDrafts.size > 20)
        purchaseDrafts.delete(purchaseDrafts.keys().next().value);
      purchaseDrafts.set(draftKey, {
        values: { ...values },
        file,
        removeDocument,
        version: baseVersion,
        savedAt: Date.now(),
      });
    }
  }, [dirty, draftKey, values, file, removeDocument, baseVersion]);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);
  const options = useQuery({
    queryKey: ["purchase-options", debouncedSearch, values.farmId],
    queryFn: () => getPurchaseOptions(debouncedSearch, values.farmId),
    enabled: editing,
  });
  const selectedFarm =
    options.data?.farms.find((farm) => farm.id === values.farmId) ||
    (createdFarm?.id === values.farmId ? createdFarm : undefined);
  const useSnapshot =
    purchase && values.farmId === (purchase.sourceFarmId ?? undefined);
  const farmerName = useSnapshot
    ? purchase.farmerName
    : selectedFarm?.organizationName;
  const farmerDetails = useSnapshot
    ? [purchase.farmerLeader, purchase.farmerPhone, purchase.farmerDistrict]
    : [selectedFarm?.leaderName, selectedFarm?.phone, selectedFarm?.district];
  const amounts = useMemo(() => {
    try {
      return calculatePurchase(
        values.quantity,
        values.unitPrice,
        values.vatMode,
        values.vatRate,
      );
    } catch {
      return null;
    }
  }, [values.quantity, values.unitPrice, values.vatMode, values.vatRate]);

  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const navigation = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        dirtyRef.current &&
        anchor &&
        anchor.href !== location.href &&
        anchor.target !== "_blank" &&
        !anchor.hasAttribute("download") &&
        !window.confirm("Изменения не сохранены. Покинуть страницу?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigation, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigation, true);
    };
  }, []);

  const mutation = useMutation({ mutationFn: savePurchase });
  const set = <K extends keyof PurchaseValues>(
    key: K,
    value: PurchaseValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaveError("");
  };
  const inputProps = (key: keyof PurchaseValues) => ({
    id: `purchase-${key}`,
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `error-${key}` : undefined,
  });
  const openCreateFarm = (event: ReactMouseEvent<HTMLButtonElement>) => {
    createFarmTrigger.current = event.currentTarget.closest(
      '[data-slot="popover-content"]',
    )
      ? farmTrigger.current
      : event.currentTarget;
    setFarmOpen(false);
    setCreateFarmOpen(true);
  };
  const textInput = (
    key: keyof PurchaseValues,
    extra: Record<string, unknown> = {},
  ) =>
    editing ? (
      <Input
        {...inputProps(key)}
        value={String(values[key] ?? "")}
        onChange={(event) => set(key, event.target.value as never)}
        {...extra}
      />
    ) : (
      <div className="purchase-read-value">
        {key === "quantity"
          ? formatQuantity(values.quantity)
          : key === "unitPrice"
            ? formatMoney(values.unitPrice, values.currency)
            : key === "agreementDate"
              ? values.agreementDate.split("-").reverse().join(".")
              : String(values[key] || "Не указано")}
      </div>
    );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitted.current || !editing || savedDraft || createFarmOpen) return;
    const nextErrors = validatePurchase(values, !!purchase);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document
        .getElementById(`purchase-${Object.keys(nextErrors)[0]}`)
        ?.focus();
      return;
    }
    submitted.current = true;
    const normalized = {
      ...values,
      quantity: normalizeDecimal(values.quantity),
      unitPrice: normalizeDecimal(values.unitPrice),
      vatRate:
        values.vatMode === "NONE" ? "0" : normalizeDecimal(values.vatRate),
    };
    const fingerprint =
      JSON.stringify(normalized) +
      (file ? `${file.name}:${file.size}:${file.lastModified}` : "");
    if (request.current?.fingerprint !== fingerprint)
      request.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const saved = await mutation.mutateAsync({
        values: normalized,
        file,
        removeDocument,
        id: purchase?.id,
        version: baseVersion,
        requestId: purchase ? undefined : request.current.id,
      });
      dirtyRef.current = false;
      purchaseDrafts.delete(draftKey);
      queryClient.setQueryData([...PURCHASES_KEY, saved.id], saved);
      await queryClient.invalidateQueries({ queryKey: PURCHASES_KEY });
      toast.success(purchase ? "Закупка обновлена" : "Закупка создана");
      router.replace(`/admin/procurement/${saved.id}`);
    } catch (error) {
      const detail = (
        error as { response?: { data?: { message?: string | string[] } } }
      ).response?.data?.message;
      setSaveError(
        Array.isArray(detail)
          ? detail.join(". ")
          : detail ||
              "Не удалось сохранить закупку. Проверьте соединение и повторите попытку.",
      );
    } finally {
      submitted.current = false;
    }
  };

  const cancel = () => {
    if (dirty && !window.confirm("Отменить несохранённые изменения?")) return;
    dirtyRef.current = false;
    purchaseDrafts.delete(draftKey);
    if (purchase) {
      setValues(initial);
      setFile(undefined);
      setRemoveDocument(false);
      setErrors({});
      setSaveError("");
      setFileError("");
      setEditing(false);
    } else router.push("/admin/procurement");
  };

  return (
    <div
      className={`purchase-workspace record-workspace ${editing ? "purchase-is-editing" : "purchase-is-reading"}`}
    >
      <Link className="purchase-back" href="/admin/procurement">
        <ArrowLeft className="size-4" />
        Все закупки
      </Link>
      <WorkspaceHeading
        icon={FileText}
        title={
          purchase ? `Закупка № ${purchase.agreementNumber}` : "Новая закупка"
        }
        description={
          purchase ? (
            <div className="record-meta">
              <span>
                <CalendarDays size={14} />
                {format(
                  parseISO(purchase.agreementDate.slice(0, 10)),
                  "dd.MM.yyyy",
                )}
              </span>
              <span className="purchase-status">
                {editing ? "Редактирование" : "Договор закупки"}
              </span>
            </div>
          ) : (
            "Договор закупки сельхозпродукции"
          )
        }
        actions={
          purchase &&
          !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Редактировать
            </Button>
          )
        }
      />
      {savedDraft && (
        <div
          role="status"
          className="mb-6 flex flex-wrap items-center gap-3 border-y border-amber-200 bg-amber-50 px-4 py-3 text-sm"
        >
          <span className="flex-1">
            Есть несохранённый черновик
            {savedDraft.version !== purchase?.version
              ? " другой версии закупки"
              : ""}
            .
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValues(savedDraft.values);
              setFile(savedDraft.file);
              setRemoveDocument(savedDraft.removeDocument);
              setBaseVersion(savedDraft.version);
              setEditing(true);
              setSavedDraft(undefined);
            }}
          >
            Восстановить
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              purchaseDrafts.delete(draftKey);
              setSavedDraft(undefined);
            }}
          >
            Удалить черновик
          </Button>
        </div>
      )}
      <form noValidate onSubmit={submit} className="purchase-editor">
        <fieldset
          disabled={mutation.isPending || !!savedDraft || createFarmOpen}
          className="min-w-0"
        >
          <section className="purchase-section">
            <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3 [&>h2]:mb-0">
              <h2>
                <Warehouse size={18} />
                Хозяйство
              </h2>
              {editing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openCreateFarm}
                >
                  <Plus className="size-4" />
                  Добавить хозяйство
                </Button>
              )}
            </div>
            <Field name="farmId" label="Хозяйство" error={errors.farmId}>
              {editing ? (
                <Popover open={farmOpen} onOpenChange={setFarmOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      ref={farmTrigger}
                      {...inputProps("farmId")}
                      variant="outline"
                      role="combobox"
                      aria-expanded={farmOpen}
                      className="h-auto min-h-10 w-full justify-between text-left font-normal"
                    >
                      <span className="min-w-0 whitespace-normal">
                        {farmerName || "Выберите фермера"}
                      </span>
                      <ChevronsUpDown className="ml-2 size-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-32px)] overflow-hidden p-0"
                    onCloseAutoFocus={(event) => {
                      if (createFarmOpen) event.preventDefault();
                    }}
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Название или телефон"
                        value={search}
                        onValueChange={setSearch}
                      />
                      <CommandList className="max-h-[min(18.75rem,calc(var(--radix-popover-content-available-height)-7rem))]">
                        {options.isFetching ? (
                          <p
                            role="status"
                            className="p-4 text-sm text-gray-500"
                          >
                            Поиск хозяйств…
                          </p>
                        ) : options.isError ? (
                          <Button
                            variant="ghost"
                            onClick={() => options.refetch()}
                          >
                            Повторить загрузку
                          </Button>
                        ) : (
                          <>
                            <CommandEmpty>Хозяйства не найдены</CommandEmpty>
                            {options.data?.farms.map((farm) => (
                              <CommandItem
                                key={farm.id}
                                value={String(farm.id)}
                                onSelect={() => {
                                  set("farmId", farm.id);
                                  setFarmOpen(false);
                                  setSearch("");
                                }}
                              >
                                <span className="min-w-0 flex-1 whitespace-normal">
                                  {farm.organizationName}
                                  <small className="block font-normal text-gray-500">
                                    {[farm.district, farm.phone]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </small>
                                </span>
                                {values.farmId === farm.id && (
                                  <Check className="size-4" />
                                )}
                              </CommandItem>
                            ))}
                          </>
                        )}
                      </CommandList>
                    </Command>
                    <div className="border-t border-[var(--crm-line)] p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={openCreateFarm}
                      >
                        <Plus className="size-4" />
                        Создать новое хозяйство
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="purchase-read-value">
                  {purchase?.sourceFarmId ? (
                    <Link
                      href={`/admin/procurement/farmers/${purchase.sourceFarmId}`}
                      className="purchase-farm-link"
                    >
                      {purchase.farmerName}
                      <ArrowUpRight size={16} />
                    </Link>
                  ) : (
                    purchase?.farmerName
                  )}
                </div>
              )}
            </Field>
            <div className="purchase-farmer-info">
              {farmerDetails.map((text, index) => {
                const Icon = [UserRound, Phone, MapPin][index];
                return text ? (
                  <span key={index}>
                    <Icon size={14} />
                    {index === 1 ? (
                      <a href={`tel:${text.replace(/[^+\d]/g, "")}`}>{text}</a>
                    ) : (
                      text
                    )}
                  </span>
                ) : null;
              })}
            </div>
            {editing &&
              !options.isPending &&
              !options.isError &&
              !options.data?.farms.length &&
              !search && (
                <Link
                  href="/admin/procurement?tab=farmers"
                  className="mt-3 inline-block text-sm font-semibold text-[#2f6b4f]"
                >
                  Открыть реестр и загрузить хозяйства
                </Link>
              )}
          </section>
          <section className="purchase-section">
            <h2>
              <Wheat size={18} />
              Условия закупки
            </h2>
            <div className="purchase-fields">
              <Field
                name="cultureName"
                label="Культура"
                error={errors.cultureName}
              >
                {editing ? (
                  <Select
                    value={values.cultureName}
                    onValueChange={(value) => set("cultureName", value)}
                  >
                    <SelectTrigger
                      {...inputProps("cultureName")}
                      className="w-full"
                    >
                      <SelectValue placeholder="Выберите культуру" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        new Set([
                          ...(options.data?.cultures || []),
                          ...(purchase ? [purchase.cultureName] : []),
                        ]),
                      ).map((name) => (
                        <SelectItem value={name} key={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="purchase-read-value">
                    {values.cultureName}
                  </div>
                )}
              </Field>
              <Field name="currency" label="Валюта">
                {editing ? (
                  <Select
                    value={values.currency}
                    onValueChange={(value) => set("currency", value)}
                  >
                    <SelectTrigger {...inputProps("currency")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KZT">KZT · Тенге</SelectItem>
                      <SelectItem value="USD">USD · Доллар</SelectItem>
                      <SelectItem value="RUB">RUB · Рубль</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="purchase-read-value">{values.currency}</div>
                )}
              </Field>
              <Field name="quantity" label="Объём, т" error={errors.quantity}>
                {textInput("quantity", {
                  inputMode: "decimal",
                  placeholder: "0,000",
                })}
              </Field>
              <Field
                name="unitPrice"
                label={`Цена за тонну, ${values.currency}`}
                error={errors.unitPrice}
              >
                {textInput("unitPrice", {
                  inputMode: "decimal",
                  placeholder: "0,00",
                })}
              </Field>
              <Field name="vatMode" label="НДС">
                {editing ? (
                  <Select
                    value={values.vatMode === "NONE" ? "NONE" : "INCLUSIVE"}
                    onValueChange={(value) => set("vatMode", value as VatMode)}
                  >
                    <SelectTrigger {...inputProps("vatMode")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCLUSIVE">С НДС</SelectItem>
                      <SelectItem value="NONE">Без НДС</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="purchase-read-value">
                    {VAT_LABELS[values.vatMode]}
                  </div>
                )}
                {values.vatMode === "EXCLUSIVE" && (
                  <p className="text-xs font-normal text-[#6d7976]">
                    В этой закупке НДС начислен сверх цены по прежнему способу
                    расчёта.
                  </p>
                )}
              </Field>
              {values.vatMode !== "NONE" && (
                <Field
                  name="vatRate"
                  label="Ставка НДС, %"
                  error={errors.vatRate}
                >
                  {textInput("vatRate", { inputMode: "decimal" })}
                </Field>
              )}
            </div>
          </section>
          <section className="purchase-section">
            <h2>
              <FileText size={18} />
              Договор и документы
            </h2>
            <div className="purchase-fields">
              <Field
                name="agreementNumber"
                label="Номер договора"
                error={errors.agreementNumber}
              >
                {textInput("agreementNumber", { maxLength: 80 })}
              </Field>
              <Field
                name="agreementDate"
                label="Дата договора"
                error={errors.agreementDate}
              >
                {editing ? (
                  <DatePickerInput
                    id="purchase-agreementDate"
                    value={values.agreementDate}
                    onChange={(value) => set("agreementDate", value)}
                    min="1900-01-01"
                    max="2200-12-31"
                    aria-invalid={!!errors.agreementDate}
                    aria-describedby={
                      errors.agreementDate ? "error-agreementDate" : undefined
                    }
                    aria-required
                  />
                ) : (
                  <div className="purchase-read-value">
                    {values.agreementDate
                      ? format(parseISO(values.agreementDate), "dd.MM.yyyy")
                      : "—"}
                  </div>
                )}
              </Field>
            </div>
            {(file || (purchase?.document && !removeDocument)) && (
              <div className="purchase-file">
                <FileText className="size-5 shrink-0 text-[#2f6b4f]" />
                <div className="purchase-file-name">
                  {file?.name || purchase.document.name}
                  <small>
                    {Math.max(
                      1,
                      Math.round((file?.size || purchase.document.size) / 1024),
                    )}{" "}
                    КБ
                  </small>
                </div>
                {!file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={downloading}
                    title="Скачать договор"
                    aria-label="Скачать договор"
                    onClick={async () => {
                      setDownloading(true);
                      try {
                        await downloadAgreement(purchase);
                      } catch {
                        toast.error("Не удалось скачать договор");
                      } finally {
                        setDownloading(false);
                      }
                    }}
                  >
                    {downloading ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                  </Button>
                )}
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Убрать файл"
                    aria-label="Убрать файл"
                    onClick={() => {
                      setFile(undefined);
                      setRemoveDocument(true);
                      if (fileInput.current) fileInput.current.value = "";
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            )}
            {editing && (
              <div className="purchase-upload mt-5">
                <input
                  ref={fileInput}
                  type="file"
                  className="sr-only"
                  tabIndex={-1}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => {
                    const chosen = event.target.files?.[0];
                    if (!chosen) return;
                    if (
                      !/\.(pdf|jpe?g|png)$/i.test(chosen.name) ||
                      chosen.size > 10 * 1024 * 1024 ||
                      !chosen.size
                    ) {
                      setFileError("Выберите PDF, JPG или PNG до 10 МБ");
                      event.target.value = "";
                      return;
                    }
                    setFile(chosen);
                    setRemoveDocument(false);
                    setFileError("");
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload className="size-4" />
                  {file || purchase?.document
                    ? "Заменить файл"
                    : "Прикрепить договор"}
                </Button>
                <span>PDF, JPG или PNG · до 10 МБ</span>
                {fileError && (
                  <p role="alert" className="purchase-error">
                    {fileError}
                  </p>
                )}
              </div>
            )}
            {!editing && !purchase?.document && (
              <p className="mt-5 text-sm text-gray-500">
                Файл договора не прикреплён
              </p>
            )}
          </section>
          <section className="purchase-section">
            <h2>
              <MessageSquare size={18} />
              Примечание
            </h2>
            <Field name="notes" label="Примечание">
              {editing ? (
                <textarea
                  id="purchase-notes"
                  className="min-h-24 w-full resize-y rounded-md border border-[#dfe5e2] p-3 text-sm"
                  maxLength={2000}
                  value={values.notes}
                  onChange={(event) => set("notes", event.target.value)}
                />
              ) : (
                <p className="purchase-read-value whitespace-pre-wrap">
                  {values.notes || "Нет примечаний"}
                </p>
              )}
            </Field>
          </section>
        </fieldset>
        <aside className="purchase-summary" aria-label="Расчёт закупки">
          <div className="purchase-summary-heading">
            <h2>Расчёт закупки</h2>
            <span className="purchase-status">{values.currency}</span>
          </div>
          <dl>
            <div>
              <dt>Объём</dt>
              <dd>
                {amounts
                  ? `${formatQuantity(values.quantity.replace(",", "."))} т`
                  : "Не указан"}
              </dd>
            </div>
            <div>
              <dt>Без НДС</dt>
              <dd>
                {amounts
                  ? formatMoney(amounts.netAmount, values.currency)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>
                {values.vatMode === "NONE" ? "НДС" : `НДС ${values.vatRate}%`}
              </dt>
              <dd>
                {values.vatMode === "NONE"
                  ? "Без НДС"
                  : amounts
                    ? formatMoney(amounts.vatAmount, values.currency)
                    : "—"}
              </dd>
            </div>
            <div className="purchase-total" aria-live="polite">
              <dt>К оплате</dt>
              <dd>
                {amounts
                  ? formatMoney(amounts.totalAmount, values.currency)
                  : "—"}
              </dd>
            </div>
          </dl>
          {editing && (
            <div className="mt-6 grid gap-3">
              {saveError && (
                <p role="alert" className="purchase-error">
                  {saveError}
                </p>
              )}
              <Button
                type="submit"
                className={purchase ? "purchase-primary w-full" : "w-full"}
                disabled={mutation.isPending || createFarmOpen}
              >
                {mutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {mutation.isPending
                  ? "Сохраняем…"
                  : purchase
                    ? "Сохранить изменения"
                    : "Создать закупку"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending || createFarmOpen}
                onClick={cancel}
              >
                Отмена
              </Button>
            </div>
          )}
          {purchase && !editing && (
            <p className="mt-6 text-xs leading-5 text-gray-500">
              Обновлено {new Date(purchase.updatedAt).toLocaleString("ru-RU")}
            </p>
          )}
        </aside>
      </form>
      {createFarmOpen && (
        <FarmCreateDialog
          onClose={() => setCreateFarmOpen(false)}
          onReturnFocus={() => {
            const trigger = createFarmTrigger.current?.isConnected
              ? createFarmTrigger.current
              : farmTrigger.current;
            trigger?.focus();
          }}
          onCreated={(farm) => {
            setCreatedFarm(farm);
            set("farmId", farm.id);
            setSearch("");
            void queryClient.invalidateQueries({ queryKey: ["purchase-options"] });
          }}
        />
      )}
    </div>
  );
}

export default function PurchaseEditor() {
  const params = useParams<{ id?: string }>();
  const search = useSearchParams();
  const id = params.id;
  const query = useQuery({
    queryKey: [...PURCHASES_KEY, id],
    queryFn: () => getPurchase(id),
    enabled: !!id,
  });
  if (id && query.isPending)
    return (
      <p role="status" className="py-12 text-center">
        Загружаем закупку…
      </p>
    );
  if (id && query.isError)
    return (
      <>
        <Link href="/admin/procurement">Все закупки</Link>
        <PurchaseError retry={() => query.refetch()} />
      </>
    );
  const farmerId = Number(search.get("farmerId"));
  return (
    <PurchaseForm
      key={query.data ? `${query.data.id}:${query.data.version}` : "new"}
      purchase={id ? query.data : undefined}
      initialFarmerId={
        Number.isInteger(farmerId) && farmerId > 0 ? farmerId : undefined
      }
    />
  );
}
