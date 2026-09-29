"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  FileSpreadsheet,
  Leaf,
  MapPinned,
  Phone,
  Search,
  UploadCloud,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  type ProcurementFarmFilters,
  type ProcurementFarmRecord,
} from "@/entities/procurement/api/procurement.api";
import {
  useImportProcurement,
  useProcurementFarmRegistry,
  useProcurementImports,
} from "@/entities/procurement/hooks/use-procurement";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const areaFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 1,
});
const integerFormatter = new Intl.NumberFormat("ru-RU");
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const compact = (value: string | null | undefined) => value?.trim() || "—";
const formatArea = (value: number | null | undefined) =>
  `${areaFormatter.format(value ?? 0)} га`;
const formatDate = (value: string | null | undefined) => {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Дата не указана" : dateFormatter.format(date);
};

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "green",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  description: string;
  tone?: "green" | "orange";
}) {
  return (
    <div className="rounded-2xl border border-[#dfe7de] bg-white p-4 shadow-[0_12px_30px_rgba(34,49,55,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7a8580]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#223137]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#7a8580]">{description}</p>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            tone === "green"
              ? "bg-[#eef5ef] text-[#2f7657]"
              : "bg-[#fff2e2] text-[#e17b09]",
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function RegistryTable({
  rows,
  cultureName,
}: {
  rows: ProcurementFarmRecord[];
  cultureName?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr className="bg-[#f6f8f5] text-xs font-bold uppercase tracking-[0.04em] text-[#708078]">
            <th className="border-y border-l border-[#e1e8e0] px-4 py-3 first:rounded-l-xl">
              Хозяйство
            </th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">Руководитель</th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">Телефон</th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">Район</th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">Округ</th>
            <th className="border-y border-r border-[#e1e8e0] px-4 py-3 text-right last:rounded-r-xl">
              {cultureName ? `${cultureName}, га` : "Общая площадь, га"}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((farm) => (
            <tr key={farm.id} className="group text-sm text-[#41504b] hover:bg-[#fbfcfa]">
              <td className="border-b border-[#edf1ec] px-4 py-3.5 font-bold text-[#263630]">
                {farm.organizationName}
              </td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5">
                {compact(farm.leaderName)}
              </td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5">
                {farm.phone ? (
                  <a
                    className="font-semibold text-[#2f7657] hover:text-[#e17b09]"
                    href={`tel:${farm.phone}`}
                  >
                    {farm.phone}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5">{compact(farm.district)}</td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5">{compact(farm.ruralDistrict)}</td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5 text-right font-black text-[#243831]">
                {formatArea(farm.selectedAreaHa ?? farm.totalAreaHa)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProcurementPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();
  const [selectedImportId, setSelectedImportId] = useState<number | undefined>();
  const [region, setRegion] = useState<string>();
  const [district, setDistrict] = useState<string>();
  const [ruralDistrict, setRuralDistrict] = useState<string>();
  const [cultureKey, setCultureKey] = useState<string>();
  const [search, setSearch] = useState("");
  const [withPhone, setWithPhone] = useState(false);

  const importsQuery = useProcurementImports(50);
  const filters = useMemo<ProcurementFarmFilters>(
    () => ({
      importId: selectedImportId,
      region,
      district,
      ruralDistrict,
      cultureKey,
      search: search.trim() || undefined,
      withPhone: withPhone || undefined,
    }),
    [cultureKey, district, region, ruralDistrict, search, selectedImportId, withPhone],
  );
  const registryQuery = useProcurementFarmRegistry(filters);
  const importMutation = useImportProcurement();
  const registry = registryQuery.data;
  const rows = registry?.rows ?? [];
  const selectedCulture = registry?.filters.cultures.find(
    (culture) => culture.key === cultureKey,
  );
  const selectedCropArea = rows.reduce(
    (sum, farm) => sum + (farm.selectedAreaHa ?? 0),
    0,
  );

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      error("Нужен файл XLSX", "Загрузите Excel-файл с посевными площадями.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      error("Файл слишком большой", "Максимальный размер загрузки — 20 МБ.");
      return;
    }

    try {
      const result = await importMutation.mutateAsync(file);
      setSelectedImportId(result.import.id);
      setRegion(undefined);
      setDistrict(undefined);
      setRuralDistrict(undefined);
      setCultureKey(undefined);
      success(
        result.duplicate ? "Этот файл уже загружен" : "Снимок закупа загружен",
        `${result.import.farmsTotal} хозяйств · ${result.import.regionName ?? "регион не определен"}`,
      );
    } catch {
      // API interceptor already shows the concrete server error.
    }
  };

  const resetFilters = () => {
    setRegion(undefined);
    setDistrict(undefined);
    setRuralDistrict(undefined);
    setCultureKey(undefined);
    setSearch("");
    setWithPhone(false);
  };

  if (importsQuery.isLoading || registryQuery.isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[520px] w-full" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-8">
      <section className="overflow-hidden rounded-2xl border border-[#dce6dc] bg-[radial-gradient(circle_at_top_right,rgba(243,136,16,0.17),transparent_22rem),linear-gradient(135deg,#17372e,#23533f)] p-5 text-white shadow-[0_18px_44px_rgba(20,50,42,0.16)] sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white/75">
              <Leaf className="size-3.5 text-[#ffad45]" />
              Закуп сельхозпродукции
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Реестр фермеров</h1>
            <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">
              Загружайте областные своды посева, выбирайте район и культуру — хозяйства сразу ранжируются по площади.
            </p>
          </div>
          <div className="rounded-xl border border-white/13 bg-[#102b23]/45 px-4 py-3 text-sm text-white/75">
            <span className="block text-xs font-bold uppercase tracking-[0.08em] text-white/45">Активный снимок</span>
            <span className="mt-1 block font-bold text-white">
              {registry?.import
                ? `${registry.import.regionName ?? "Регион"} · ${registry.import.cropYear ?? registry.import.sheetName}`
                : "Загрузите первый XLSX"}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-[#dfe7de] bg-white p-5 shadow-[0_12px_30px_rgba(34,49,55,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-black text-[#263630]">
                <span className="grid size-10 place-items-center rounded-xl bg-[#fff2e2] text-[#e17b09]"><UploadCloud className="size-5" /></span>
                Загрузить областной свод
              </div>
              <p className="mt-2 max-w-xl text-sm leading-5 text-[#77817d]">
                Поддерживается XLSX со структурой района → сельского округа → хозяйства и посевными площадями по культурам.
              </p>
            </div>
            <div className="shrink-0">
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFile}
              />
              <Button
                type="button"
                className="h-11 bg-[#f38810] px-5 font-bold text-white hover:bg-[#dc7708]"
                disabled={importMutation.isPending}
                onClick={() => inputRef.current?.click()}
              >
                <FileSpreadsheet className="mr-2 size-4" />
                {importMutation.isPending ? "Загрузка…" : "Выбрать XLSX"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dfe7de] bg-white p-4 shadow-[0_12px_30px_rgba(34,49,55,0.06)]">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#7a8580]">Снимки закупа</p>
          <Select
            value={selectedImportId ? String(selectedImportId) : ALL}
            onValueChange={(value) => {
              setSelectedImportId(value === ALL ? undefined : Number(value));
              resetFilters();
            }}
          >
            <SelectTrigger className="mt-2 h-11 w-full min-w-0 border-[#dfe7de] bg-[#fbfcfa] font-bold text-[#34433e]">
              <SelectValue placeholder="Последний снимок" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Последний загруженный</SelectItem>
              {(importsQuery.data ?? []).map((item) => (
                <SelectItem key={item.id} value={String(item.id)} disabled={item.status !== "COMPLETED"}>
                  {item.regionName ?? item.sheetName} · {item.cropYear ?? formatDate(item.createdAt)} · {item.farmsTotal} хоз.
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Users} label="Хозяйств" value={integerFormatter.format(rows.length)} description="в текущей выборке" />
        <MetricCard icon={Leaf} label={selectedCulture ? selectedCulture.name : "Общая площадь"} value={formatArea(selectedCulture ? selectedCropArea : rows.reduce((sum, farm) => sum + (farm.totalAreaHa ?? 0), 0))} description={selectedCulture ? "площадь выбранной культуры" : "по всем хозяйствам"} tone="orange" />
        <MetricCard icon={Phone} label="Контакты" value={integerFormatter.format(rows.filter((farm) => farm.phone).length)} description="хозяйств с телефоном" />
        <MetricCard icon={MapPinned} label="География" value={integerFormatter.format(new Set(rows.map((farm) => farm.district).filter(Boolean)).size)} description="районов в выборке" />
      </section>

      <section className="rounded-2xl border border-[#dfe7de] bg-white p-4 shadow-[0_12px_30px_rgba(34,49,55,0.06)] sm:p-5">
        <div className="flex flex-col gap-3 border-b border-[#edf1ec] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#263630]">Фильтр закупа</h2>
            <p className="mt-1 text-sm text-[#7a8580]">Выберите территорию и культуру, чтобы найти приоритетные хозяйства.</p>
          </div>
          <Button variant="outline" className="border-[#dfe7de] text-[#53635d] hover:bg-[#f6f8f5]" onClick={resetFilters}>Сбросить</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select value={region ?? ALL} onValueChange={(value) => { setRegion(value === ALL ? undefined : value); setDistrict(undefined); setRuralDistrict(undefined); }}>
            <SelectTrigger className="h-11 w-full min-w-0"><SelectValue placeholder="Все области" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Все области</SelectItem>{(registry?.filters.regions ?? []).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={district ?? ALL} onValueChange={(value) => { setDistrict(value === ALL ? undefined : value); setRuralDistrict(undefined); }}>
            <SelectTrigger className="h-11 w-full min-w-0"><SelectValue placeholder="Все районы" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Все районы</SelectItem>{(registry?.filters.districts ?? []).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={ruralDistrict ?? ALL} onValueChange={(value) => setRuralDistrict(value === ALL ? undefined : value)}>
            <SelectTrigger className="h-11 w-full min-w-0"><SelectValue placeholder="Все округа" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Все округа</SelectItem>{(registry?.filters.ruralDistricts ?? []).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={cultureKey ?? ALL} onValueChange={(value) => setCultureKey(value === ALL ? undefined : value)}>
            <SelectTrigger className="h-11 w-full min-w-0"><SelectValue placeholder="Все культуры" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Все культуры</SelectItem>{(registry?.filters.cultures ?? []).map((item) => <SelectItem key={item.key} value={item.key}>{item.name}</SelectItem>)}</SelectContent>
          </Select>
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#82908a]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full border-[#dfe7de] pl-9" placeholder="Фермер, ИП, телефон…" />
          </label>
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#52625c]">
          <input type="checkbox" checked={withPhone} onChange={(event) => setWithPhone(event.target.checked)} className="size-4 rounded border-[#b8c8bd] accent-[#2f7657]" />
          Только хозяйства с телефоном
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#dfe7de] bg-white shadow-[0_12px_30px_rgba(34,49,55,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#edf1ec] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#263630]">Хозяйства</h2>
            <p className="mt-1 text-sm text-[#7a8580]">
              {selectedCulture ? `От большего к меньшему по культуре «${selectedCulture.name}».` : "От большей общей площади к меньшей."}
            </p>
          </div>
          {registry?.import ? <Badge variant="outline" className="w-fit border-[#cfe0d1] bg-[#f2f8f2] px-3 py-1 text-[#2f7657]">{registry.import.farmsTotal} хозяйств в снимке</Badge> : null}
        </div>
        {rows.length ? <RegistryTable rows={rows} cultureName={selectedCulture?.name} /> : <div className="px-5 py-16 text-center"><Users className="mx-auto size-8 text-[#a0ada5]" /><p className="mt-3 font-bold text-[#35463e]">Хозяйства не найдены</p><p className="mt-1 text-sm text-[#7a8580]">Загрузите XLSX или измените параметры фильтра.</p></div>}
      </section>
    </div>
  );
}
