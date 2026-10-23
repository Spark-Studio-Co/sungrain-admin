"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Plus,
  Save,
  X,
  Warehouse,
  UserRound,
  Wheat,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { WorkspaceHeading } from "@/components/ui/workspace-heading";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";
import {
  EMPTY_FARM_DRAFT as empty,
  FARM_FIELDS as fields,
  parseFarmDraft,
  type FarmDraft as Draft,
} from "@/entities/procurement/model/farm-form";
import {
  useProcurementFarm,
  useSaveProcurementFarm,
} from "@/entities/procurement/hooks/use-procurement";
import "./purchases.css";

export default function FarmPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const id = params.id ? Number(params.id) : undefined;
  const query = useProcurementFarm(id ?? 0);
  const save = useSaveProcurementFarm(id);
  const [draft, setDraft] = useState<Draft>(empty);
  const [editing, setEditing] = useState(!id);
  const [error, setError] = useState("");
  const farm = query.data;

  const resetDraft = useCallback(() => {
    if (!farm) return;
    setDraft({
      organizationName: farm.organizationName,
      leaderName: farm.leaderName ?? "",
      phone: farm.phone ?? "",
      regionName: farm.regionName ?? "",
      district: farm.district ?? "",
      ruralDistrict: farm.ruralDistrict ?? "",
      totalAreaHa: farm.totalAreaHa == null ? "" : String(farm.totalAreaHa),
    });
  }, [farm]);

  useEffect(() => {
    if (!farm) return;
    resetDraft();
  }, [farm, resetDraft]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFarmDraft(draft);
    if (parsed.ok === false) {
      setError(Object.values(parsed.errors)[0] || "Проверьте данные хозяйства");
      return;
    }
    setError("");
    try {
      const result = await save.mutateAsync({
        ...parsed.values,
        version: farm?.version,
      });
      toast.success(id ? "Хозяйство сохранено" : "Хозяйство создано");
      setEditing(false);
      if (!id) router.replace(`/admin/procurement/farmers/${result.id}`);
    } catch (saveError) {
      const conflict =
        typeof saveError === "object" &&
        saveError !== null &&
        "response" in saveError &&
        (saveError as { response?: { status?: number } }).response?.status ===
          409;
      setError(
        conflict
          ? "Хозяйство уже изменено. Обновите страницу перед сохранением."
          : "Не удалось сохранить хозяйство. Проверьте данные и попробуйте ещё раз.",
      );
    }
  };

  if (id && (!Number.isInteger(id) || id < 1)) {
    return <p role="alert">Некорректный номер хозяйства</p>;
  }
  if (id && query.isPending) return <CrmRouteLoading />;
  if (id && query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p>Хозяйство не найдено или не удалось загрузить карточку.</p>
        <Button variant="outline" onClick={() => query.refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div className="purchase-workspace record-workspace farm-workspace">
      <Link href="/admin/procurement?tab=farmers" className="purchase-back">
        <ArrowLeft className="size-4" /> Хозяйства
      </Link>
      <WorkspaceHeading
        icon={Warehouse}
        title={id ? farm?.organizationName : "Новое хозяйство"}
        description={
          farm?.import
            ? `Источник: ${farm.import.attachmentName}`
            : "Карточка хозяйства"
        }
        actions={
          id && (
            <>
              {!farm?.import && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editing) resetDraft();
                    setEditing((current) => !current);
                    setError("");
                  }}
                >
                  {editing ? (
                    <X className="size-4" />
                  ) : (
                    <Pencil className="size-4" />
                  )}
                  {editing ? "Отмена" : "Изменить"}
                </Button>
              )}
              <Button asChild>
                <Link href={`/admin/procurement/new?farmerId=${id}`}>
                  <Plus className="size-4" /> Создать закупку
                </Link>
              </Button>
            </>
          )
        }
      />

      <section aria-label="Данные хозяйства" className="purchase-section">
        <h2>
          <UserRound size={18} />
          Контакты и реквизиты
        </h2>
        {editing ? (
          <form onSubmit={submit} className="space-y-5">
            <div className="farm-details-grid">
              {fields.map((field) => (
                <label key={field.key} className="purchase-field">
                  <span>
                    {field.label}
                    {field.required ? " *" : ""}
                  </span>
                  <Input
                    value={draft[field.key]}
                    required={field.required}
                    maxLength={field.maxLength}
                    inputMode={
                      field.key === "totalAreaHa"
                        ? "decimal"
                        : field.key === "phone"
                          ? "tel"
                          : "text"
                    }
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    className="h-11 border-[#dfe7de] bg-white"
                  />
                </label>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-sm font-semibold text-red-700">
                {error}
              </p>
            )}
            <Button type="submit" disabled={save.isPending}>
              <Save className="size-4" />{" "}
              {save.isPending ? "Сохраняем…" : "Сохранить"}
            </Button>
          </form>
        ) : (
          <dl className="farm-details-grid">
            {fields.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>
                  {field.key === "phone" && draft.phone ? (
                    <a
                      href={`tel:${draft.phone.replace(/[^+\d]/g, "")}`}
                      className="text-[#2f6b4f] hover:underline"
                    >
                      {draft.phone}
                    </a>
                  ) : (
                    draft[field.key] || "—"
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {id && (
        <>
          {!!farm?.cropAreas.length && (
            <section className="purchase-section">
              <h2>
                <Wheat size={18} />
                Посевные площади
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {farm.cropAreas.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 border-b border-[#e7ece7] py-2 text-sm"
                  >
                    <span>{item.cultureName}</span>
                    <strong>{item.areaHa.toLocaleString("ru-RU")} га</strong>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="purchase-section">
            <h2>
              <FileText size={18} />
              Закупки{" "}
              <span className="purchase-status">
                {farm?.purchases.length ?? 0}
              </span>
            </h2>
            {farm?.purchases.length ? (
              <div className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">
                {farm.purchases.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/procurement/${item.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-[#2f6b4f]"
                  >
                    <span className="font-bold">
                      {item.agreementNumber} · {item.cultureName}
                    </span>
                    <span>
                      {format(
                        parseISO(item.agreementDate.slice(0, 10)),
                        "dd.MM.yyyy",
                      )}{" "}
                      · {item.quantity} т ·{" "}
                      {Number(item.totalAmount).toLocaleString("ru-RU")}{" "}
                      {item.currency}
                    </span>
                    <ExternalLink className="size-4" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#718079]">Закупок пока нет.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
