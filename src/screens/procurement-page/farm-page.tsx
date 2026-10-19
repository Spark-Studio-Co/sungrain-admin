"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, ExternalLink, Pencil, Plus, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { ProcurementFarmValues } from "@/entities/procurement/api/procurement.api";
import { useProcurementFarm, useSaveProcurementFarm } from "@/entities/procurement/hooks/use-procurement";

type Draft = Omit<ProcurementFarmValues, "totalAreaHa"> & { totalAreaHa: string };
const empty: Draft = {
  organizationName: "",
  leaderName: "",
  phone: "",
  regionName: "",
  district: "",
  ruralDistrict: "",
  totalAreaHa: "",
};
const fields: Array<{ key: keyof Draft; label: string; required?: boolean }> = [
  { key: "organizationName", label: "Название хозяйства", required: true },
  { key: "leaderName", label: "Руководитель" },
  { key: "phone", label: "Телефон" },
  { key: "regionName", label: "Область" },
  { key: "district", label: "Район" },
  { key: "ruralDistrict", label: "Сельский округ" },
  { key: "totalAreaHa", label: "Общая площадь, га" },
];

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
    const name = draft.organizationName.trim();
    const area = draft.totalAreaHa.trim().replace(",", ".");
    if (!name) { setError("Укажите название хозяйства"); return; }
    if (area && (!Number.isFinite(Number(area)) || Number(area) < 0)) {
      setError("Площадь должна быть неотрицательным числом");
      return;
    }
    setError("");
    try {
      const result = await save.mutateAsync({
        version: farm?.version,
        organizationName: name,
        leaderName: draft.leaderName.trim(),
        phone: draft.phone.trim(),
        regionName: draft.regionName.trim(),
        district: draft.district.trim(),
        ruralDistrict: draft.ruralDistrict.trim(),
        totalAreaHa: area ? Number(area) : null,
      });
      toast.success(id ? "Хозяйство сохранено" : "Хозяйство создано");
      setEditing(false);
      if (!id) router.replace(`/admin/procurement/farmers/${result.id}`);
    } catch (saveError) {
      const conflict = typeof saveError === "object" && saveError !== null && "response" in saveError &&
        (saveError as { response?: { status?: number } }).response?.status === 409;
      setError(conflict ? "Хозяйство уже изменено. Обновите страницу перед сохранением." : "Не удалось сохранить хозяйство. Проверьте данные и попробуйте ещё раз.");
    }
  };

  if (id && (!Number.isInteger(id) || id < 1)) {
    return <p role="alert">Некорректный номер хозяйства</p>;
  }
  if (id && query.isPending) return <p role="status">Загружаем хозяйство…</p>;
  if (id && query.isError) {
    return <div role="alert" className="space-y-3"><p>Хозяйство не найдено или не удалось загрузить карточку.</p><Button variant="outline" onClick={() => query.refetch()}>Повторить</Button></div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10 text-[#223137]">
      <Link href="/admin/procurement?tab=farmers" className="inline-flex items-center gap-2 text-sm font-semibold text-[#61716a] hover:text-[#2f6b4f]"><ArrowLeft className="size-4" /> Хозяйства</Link>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dfe7de] pb-5">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-[#d26d07]">{farm?.import ? "Из XLSX" : "Хозяйство"}</p>
          <h1 className="mt-1 break-words text-2xl font-black sm:text-3xl">{id ? farm?.organizationName : "Новое хозяйство"}</h1>
          {farm?.import && <p className="mt-1 text-sm text-[#708078]">Источник: {farm.import.attachmentName}</p>}
        </div>
        {id && <div className="flex flex-wrap gap-2">
          {!farm?.import && <Button variant="outline" onClick={() => { if (editing) resetDraft(); setEditing((current) => !current); setError(""); }}>
            {editing ? <X className="size-4" /> : <Pencil className="size-4" />}{editing ? "Отмена" : "Изменить"}
          </Button>}
          <Button asChild><Link href={`/admin/procurement/new?farmerId=${id}`}><Plus className="size-4" /> Создать закупку</Link></Button>
        </div>}
      </header>

      <section aria-label="Данные хозяйства" className="space-y-5">
        {editing ? <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => <label key={field.key} className="grid gap-1.5 text-sm font-semibold text-[#3b4c45]">
              <span>{field.label}{field.required ? " *" : ""}</span>
              <Input
                value={draft[field.key]}
                required={field.required}
                maxLength={field.key === "phone" ? 80 : 200}
                inputMode={field.key === "totalAreaHa" ? "decimal" : field.key === "phone" ? "tel" : "text"}
                onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                className="h-11 border-[#dfe7de] bg-white"
              />
            </label>)}
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <Button type="submit" disabled={save.isPending} className="bg-[#2f6b4f] text-white hover:bg-[#25543f]"><Save className="size-4" /> {save.isPending ? "Сохраняем…" : "Сохранить"}</Button>
        </form> : <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => <div key={field.key} className="min-w-0 border-b border-[#e7ece7] pb-3"><dt className="text-xs font-bold uppercase text-[#809087]">{field.label}</dt><dd className="mt-1 break-words text-base font-semibold">{field.key === "phone" && draft.phone ? <a href={`tel:${draft.phone.replace(/[^+\d]/g, "")}`} className="text-[#2f6b4f] hover:underline">{draft.phone}</a> : draft[field.key] || "—"}</dd></div>)}
        </dl>}
      </section>

      {id && <>
        {!!farm?.cropAreas.length && <section className="space-y-3 border-t border-[#dfe7de] pt-6"><h2 className="text-lg font-bold">Посевные площади</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{farm.cropAreas.map((item) => <div key={item.id} className="flex justify-between gap-4 border-b border-[#e7ece7] py-2 text-sm"><span>{item.cultureName}</span><strong>{item.areaHa.toLocaleString("ru-RU")} га</strong></div>)}</div></section>}
        <section className="space-y-3 border-t border-[#dfe7de] pt-6">
          <h2 className="text-lg font-bold">Закупки <span className="text-sm font-normal text-[#718079]">{farm?.purchases.length ?? 0}</span></h2>
          {farm?.purchases.length ? <div className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">{farm.purchases.map((item) => <Link key={item.id} href={`/admin/procurement/${item.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-[#2f6b4f]"><span className="font-bold">{item.agreementNumber} · {item.cultureName}</span><span>{format(parseISO(item.agreementDate.slice(0, 10)), "dd.MM.yyyy")} · {item.quantity} т · {Number(item.totalAmount).toLocaleString("ru-RU")} {item.currency}</span><ExternalLink className="size-4" /></Link>)}</div> : <p className="text-sm text-[#718079]">Закупок пока нет.</p>}
        </section>
      </>}
    </div>
  );
}
