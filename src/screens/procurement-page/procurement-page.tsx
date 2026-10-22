"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Leaf,
  MapPinned,
  Phone,
  Plus,
  Search,
  UploadCloud,
  Users,
  ChevronDown,
  ArrowUpRight,
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
  return Number.isNaN(date.getTime())
    ? "Дата не указана"
    : dateFormatter.format(date);
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
    <div className="farm-metric">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="record-label">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#223137]">{value}</p>
          <p className="mt-1 text-xs text-[#7a8580]">{description}</p>
        </div>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-md",
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
    <div className="farm-registry-table">
      <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr className="bg-[#f6f8f5] text-xs font-bold uppercase tracking-[0.04em] text-[#708078]">
            <th className="border-y border-l border-[#e1e8e0] px-4 py-3 first:rounded-l-xl">
              Хозяйство
            </th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">
              Руководитель
            </th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">Телефон</th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">Район</th>
            <th className="border-y border-[#e1e8e0] px-4 py-3">Округ</th>
            <th className="border-y border-r border-[#e1e8e0] px-4 py-3 text-right last:rounded-r-xl">
              {cultureName ? `${cultureName}, га` : "Общая площадь, га"}
            </th>
            <th className="px-4 py-3">
              <span className="sr-only">Действие</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((farm) => (
            <tr
              key={farm.id}
              className="group text-sm text-[#41504b] hover:bg-[#fbfcfa]"
            >
              <td className="border-b border-[#edf1ec] px-4 py-3.5 font-bold text-[#263630]">
                <Link
                  href={`/admin/procurement/farmers/${farm.id}`}
                  className="hover:text-[#2f7657] hover:underline"
                >
                  {farm.organizationName}
                </Link>
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
              <td className="border-b border-[#edf1ec] px-4 py-3.5">
                {compact(farm.district)}
              </td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5">
                {compact(farm.ruralDistrict)}
              </td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5 text-right font-black text-[#243831]">
                {formatArea(farm.selectedAreaHa ?? farm.totalAreaHa)}
              </td>
              <td className="border-b border-[#edf1ec] px-4 py-3.5">
                <Link
                  className="whitespace-nowrap font-semibold text-[#2f7657] hover:underline"
                  href={`/admin/procurement/farmers/${farm.id}`}
                >
                  Открыть
                </Link>
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
  const [selectedImportId, setSelectedImportId] = useState<
    number | undefined
  >();
  const [region, setRegion] = useState<string>();
  const [district, setDistrict] = useState<string>();
  const [ruralDistrict, setRuralDistrict] = useState<string>();
  const [cultureKey, setCultureKey] = useState<string>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [withPhone, setWithPhone] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  const importsQuery = useProcurementImports(50);
  const filters = useMemo<ProcurementFarmFilters>(
    () => ({
      importId: selectedImportId,
      region,
      district,
      ruralDistrict,
      cultureKey,
      search: debouncedSearch || undefined,
      withPhone: withPhone || undefined,
    }),
    [
      cultureKey,
      debouncedSearch,
      district,
      region,
      ruralDistrict,
      selectedImportId,
      withPhone,
    ],
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
    setDebouncedSearch("");
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
    <div className="farm-registry">
      <div className="farm-registry-heading">
        <h2>
          <Users size={18} />
          Реестр хозяйств
        </h2>
        <Button asChild>
          <Link href="/admin/procurement/farmers/new">
            <Plus className="size-4" />
            Добавить хозяйство
          </Link>
        </Button>
      </div>
      <details className="farm-import">
        <summary>
          <UploadCloud size={17} />
          Импорт и источники данных
          <ChevronDown size={16} />
        </summary>
        <section className="farm-import-body">
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold">Областной свод</h3>
                <p className="mt-1 text-xs text-[#77817d]">XLSX · до 20 МБ</p>
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

          <div>
            <p className="record-label">Источник данных</p>
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
                  <SelectItem
                    key={item.id}
                    value={String(item.id)}
                    disabled={item.status !== "COMPLETED"}
                  >
                    {item.regionName ?? item.sheetName} ·{" "}
                    {item.cropYear ?? formatDate(item.createdAt)} ·{" "}
                    {item.farmsTotal} хоз.
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
      </details>

      <section className="farm-metrics">
        <MetricCard
          icon={Users}
          label="Хозяйств"
          value={integerFormatter.format(rows.length)}
          description="в текущей выборке"
        />
        <MetricCard
          icon={Leaf}
          label={selectedCulture ? selectedCulture.name : "Общая площадь"}
          value={formatArea(
            selectedCulture
              ? selectedCropArea
              : rows.reduce((sum, farm) => sum + (farm.totalAreaHa ?? 0), 0),
          )}
          description={
            selectedCulture
              ? "площадь выбранной культуры"
              : "по всем хозяйствам"
          }
          tone="orange"
        />
        <MetricCard
          icon={Phone}
          label="Контакты"
          value={integerFormatter.format(
            rows.filter((farm) => farm.phone).length,
          )}
          description="хозяйств с телефоном"
        />
        <MetricCard
          icon={MapPinned}
          label="География"
          value={integerFormatter.format(
            new Set(rows.map((farm) => farm.district).filter(Boolean)).size,
          )}
          description="районов в выборке"
        />
      </section>

      <section className="farm-filters">
        <div className="flex flex-col gap-3 border-b border-[#edf1ec] pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#263630]">Фильтры</h2>
          </div>
          <Button
            variant="outline"
            className="border-[#dfe7de] text-[#53635d] hover:bg-[#f6f8f5]"
            onClick={resetFilters}
          >
            Сбросить
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Select
            value={region ?? ALL}
            onValueChange={(value) => {
              setRegion(value === ALL ? undefined : value);
              setDistrict(undefined);
              setRuralDistrict(undefined);
            }}
          >
            <SelectTrigger aria-label="Область" className="h-11 w-full min-w-0">
              <SelectValue placeholder="Все области" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все области</SelectItem>
              {(registry?.filters.regions ?? []).map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={district ?? ALL}
            onValueChange={(value) => {
              setDistrict(value === ALL ? undefined : value);
              setRuralDistrict(undefined);
            }}
          >
            <SelectTrigger aria-label="Район" className="h-11 w-full min-w-0">
              <SelectValue placeholder="Все районы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все районы</SelectItem>
              {(registry?.filters.districts ?? []).map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={ruralDistrict ?? ALL}
            onValueChange={(value) =>
              setRuralDistrict(value === ALL ? undefined : value)
            }
          >
            <SelectTrigger aria-label="Округ" className="h-11 w-full min-w-0">
              <SelectValue placeholder="Все округа" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все округа</SelectItem>
              {(registry?.filters.ruralDistricts ?? []).map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={cultureKey ?? ALL}
            onValueChange={(value) =>
              setCultureKey(value === ALL ? undefined : value)
            }
          >
            <SelectTrigger
              aria-label="Культура хозяйства"
              className="h-11 w-full min-w-0"
            >
              <SelectValue placeholder="Все культуры" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Все культуры</SelectItem>
              {(registry?.filters.cultures ?? []).map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="relative block min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#82908a]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 w-full border-[#dfe7de] pl-9"
              placeholder="Фермер, ИП, телефон…"
            />
          </label>
        </div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#52625c]">
          <input
            type="checkbox"
            checked={withPhone}
            onChange={(event) => setWithPhone(event.target.checked)}
            className="size-4 rounded border-[#b8c8bd] accent-[#2f7657]"
          />
          Только хозяйства с телефоном
        </label>
      </section>

      <section className="farm-results">
        <div className="flex flex-col gap-3 border-b border-[#edf1ec] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-bold text-[#263630]">
              Хозяйства · {rows.length}
            </h2>
            <p className="mt-1 text-sm text-[#7a8580]">
              {selectedCulture
                ? `От большего к меньшему по культуре «${selectedCulture.name}».`
                : "От большей общей площади к меньшей."}
            </p>
            {registryQuery.isFetching && !registryQuery.isLoading ? (
              <p role="status" className="mt-1 text-xs text-[#7a8580]">
                Обновляем выборку…
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {registry?.import ? (
              <Badge
                variant="outline"
                className="w-fit border-[#cfe0d1] bg-[#f2f8f2] px-3 py-1 text-[#2f7657]"
              >
                {registry.import.farmsTotal} хозяйств в снимке
              </Badge>
            ) : null}
          </div>
        </div>
        {rows.length ? (
          <>
            <RegistryTable rows={rows} cultureName={selectedCulture?.name} />
            <div className="farm-mobile-list">
              {rows.map((farm) => (
                <article key={farm.id}>
                  <Link
                    className="purchase-farm-link"
                    href={`/admin/procurement/farmers/${farm.id}`}
                  >
                    {farm.organizationName}
                    <ArrowUpRight size={16} />
                  </Link>
                  <p>{compact(farm.leaderName)}</p>
                  <dl>
                    <div>
                      <dt>Район</dt>
                      <dd>{compact(farm.district)}</dd>
                    </div>
                    <div>
                      <dt>{selectedCulture?.name || "Площадь"}</dt>
                      <dd>
                        {formatArea(farm.selectedAreaHa ?? farm.totalAreaHa)}
                      </dd>
                    </div>
                    <div>
                      <dt>Округ</dt>
                      <dd>{compact(farm.ruralDistrict)}</dd>
                    </div>
                    <div>
                      <dt>Телефон</dt>
                      <dd>
                        {farm.phone ? (
                          <a href={`tel:${farm.phone}`}>{farm.phone}</a>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <Users className="mx-auto size-8 text-[#a0ada5]" />
            <p className="mt-3 font-bold text-[#35463e]">
              Хозяйства не найдены
            </p>
            <p className="mt-1 text-sm text-[#7a8580]">
              Добавьте хозяйство, загрузите XLSX или измените фильтр.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
