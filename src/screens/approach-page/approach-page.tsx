"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowDownUp,
  ArrowDownToLine,
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  FileSpreadsheet,
  FilterX,
  History,
  Layers3,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  TrainFront,
  UploadCloud,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type {
  ApproachDashboardSelection,
  ApproachGroup,
  ApproachPreview,
  ApproachRow,
} from "@/entities/approach/api/approach.api";
import {
  useApproachDashboard,
  useApproachImports,
  useImportApproach,
  usePreviewApproach,
} from "@/entities/approach/hooks/use-approach";
import { cn } from "@/lib/utils";
import {
  buildCultureDestinationGroups,
  type CultureDestinationGroup,
} from "./approach-analytics";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_BATCH_FILES = 20;
const ALL = "__all__";
type ImportDateOrder = "desc" | "asc";
type ApproachPreviewItem = {
  file: File;
  preview: ApproachPreview;
};
type BatchProgress = {
  current: number;
  total: number;
};

const numberFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});
const integerFormatter = new Intl.NumberFormat("ru-RU");
const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatDate = (
  value: string | Date | null | undefined,
  withTime = false,
) => {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";
  return withTime ? dateTimeFormatter.format(date) : dateFormatter.format(date);
};

const formatTons = (value: number) => `${numberFormatter.format(value || 0)} т`;

const compact = (value: string | null | undefined) =>
  value?.trim() || "Не указано";

const chartTooltipWrapperStyle = {
  zIndex: 20,
  pointerEvents: "none" as const,
};

const chartTooltipContentStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #dfe7de",
  borderRadius: "6px",
  boxShadow: "0 14px 34px rgba(34, 49, 55, 0.14)",
  color: "#223137",
  fontSize: "12px",
};

function PageSkeleton() {
  return (
    <div className="w-full space-y-4 pb-8">
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
      <Skeleton className="h-[520px] w-full" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof TrainFront;
  tone?: "green" | "orange";
}) {
  return (
    <div className="min-h-28 border border-[#e1e8e0] bg-white p-4 shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase text-[#7b857f]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tabular-nums text-[#223137]">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-[#8a938e]">{detail}</p>
        </div>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md",
            tone === "green"
              ? "bg-[#edf5ee] text-[#2f6b4f]"
              : "bg-[#fff2e2] text-[#e77808]",
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </div>
    </div>
  );
}

function AnalyticsGroupsDialog({
  open,
  onOpenChange,
  title,
  groups,
  color,
  onGroupSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  groups: ApproachGroup[];
  color: string;
  onGroupSelect?: (group: ApproachGroup) => void;
}) {
  const totalTons = groups.reduce((sum, group) => sum + group.tons, 0);
  const totalWagons = groups.reduce((sum, group) => sum + group.wagons, 0);
  const maxTons = Math.max(...groups.map((group) => group.tons), 1);
  const averageTons = groups.length ? totalTons / groups.length : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(92dvh,900px)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden border-[#dfe7de] bg-[#f8faf7] p-0 shadow-[0_28px_90px_rgba(22,42,35,0.24)] sm:w-[94vw] sm:max-w-[1120px]">
        <div className="relative overflow-hidden border-b border-[#e2e9e1] bg-white px-5 py-5 pr-16 sm:px-7 sm:py-6">
          <div
            className="absolute inset-y-0 left-0 w-1"
            style={{ backgroundColor: color }}
          />
          <DialogHeader>
            <div className="mb-2 inline-flex h-7 w-fit items-center gap-2 rounded-md border border-[#d8e7da] bg-[#f1f7f2] px-2.5 text-[10px] font-black uppercase text-[#2f6b4f]">
              <BarChart3 className="size-3.5" />
              Полный рейтинг
            </div>
            <DialogTitle className="text-xl font-black text-[#223137] sm:text-2xl">
              {title}
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-xs leading-5 sm:text-sm">
              {onGroupSelect
                ? "Нажмите на культуру, чтобы увидеть текущие станции, получателей и вагоны."
                : "Все позиции выбранного отчета без сокращений и скрытых строк."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-[#e2e9e1] bg-[#f8faf7] px-4 py-4 sm:grid-cols-4 sm:px-7">
          {[
            ["Позиций", integerFormatter.format(groups.length)],
            ["Вагонов", integerFormatter.format(totalWagons)],
            ["Объем", formatTons(totalTons)],
            ["Средний объем", formatTons(averageTons)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 border border-[#dfe7de] bg-white px-3 py-3.5 shadow-[0_5px_16px_rgba(34,49,55,0.035)] sm:px-4"
            >
              <p className="text-[10px] font-black uppercase text-[#8a938e]">
                {label}
              </p>
              <p className="mt-1.5 truncate text-base font-black tabular-nums text-[#223137] sm:text-xl">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
          <div className="overflow-hidden border border-[#dfe7de] bg-white shadow-[0_10px_28px_rgba(34,49,55,0.04)]">
            <div className="sticky top-0 z-10 grid grid-cols-[38px_minmax(0,1fr)_auto] gap-3 border-b border-[#dfe7de] bg-[#f1f5f1] px-3 py-3 text-[10px] font-black uppercase text-[#768079] sm:grid-cols-[56px_minmax(220px,0.9fr)_minmax(280px,1.25fr)_140px_100px] sm:px-5">
              <span>№</span>
              <span>Наименование</span>
              <span className="hidden sm:block">Соотношение</span>
              <span className="text-right">Объем</span>
              <span className="hidden text-right sm:block">Вагоны</span>
            </div>
            <div className="divide-y divide-[#edf1eb]">
              {groups.map((group, index) => (
                <button
                  type="button"
                  key={group.name}
                  className={cn(
                    "grid w-full grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3.5 text-left transition-colors sm:grid-cols-[56px_minmax(220px,0.9fr)_minmax(280px,1.25fr)_140px_100px] sm:px-5",
                    onGroupSelect
                      ? "cursor-pointer hover:bg-[#fff8ef] focus-visible:bg-[#fff8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ef850b]"
                      : "cursor-default hover:bg-[#fafcf9]",
                  )}
                  onClick={() => onGroupSelect?.(group)}
                >
                  <span className="grid size-7 place-items-center rounded-md bg-[#f1f5f1] text-[10px] font-black tabular-nums text-[#7b877f]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="break-words text-sm font-black leading-5 text-[#33453d]">
                        {group.name}
                      </p>
                      {onGroupSelect && (
                        <ArrowRight className="size-3.5 shrink-0 text-[#e77808]" />
                      )}
                    </div>
                    <p className="mt-1 text-[10px] font-bold tabular-nums text-[#8a938e] sm:hidden">
                      {integerFormatter.format(group.wagons)} ваг. ·{" "}
                      {numberFormatter.format(group.share)}%
                    </p>
                  </div>
                  <div className="hidden min-w-0 sm:block">
                    <div className="flex items-center justify-between gap-3 text-[10px] font-bold tabular-nums text-[#7d8882]">
                      <span>Доля в отчете</span>
                      <span className="text-[#3d5148]">
                        {numberFormatter.format(group.share)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8eee9]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max((group.tons / maxTons) * 100, 1)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-right text-xs font-black tabular-nums text-[#223137] sm:text-sm">
                    {formatTons(group.tons)}
                  </span>
                  <span className="hidden text-right text-xs font-black tabular-nums text-[#596760] sm:block">
                    {integerFormatter.format(group.wagons)} ваг.
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CultureDestinationDialog({
  open,
  onOpenChange,
  culture,
  rows,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  culture: string | null;
  rows: ApproachRow[];
}) {
  const groups = useMemo(
    () => (culture ? buildCultureDestinationGroups(rows, culture) : []),
    [culture, rows],
  );
  const totalWagons = groups.reduce((sum, group) => sum + group.wagons, 0);
  const totalTons = groups.reduce((sum, group) => sum + group.tons, 0);
  const stations = new Set(groups.map((group) => group.station)).size;
  const recipients = new Set(groups.map((group) => group.recipient)).size;

  const wagonBadges = (group: CultureDestinationGroup) => {
    const visible = group.wagonNumbers.slice(0, 5);
    const hidden = group.wagonNumbers.length - visible.length;

    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visible.map((wagonNumber) => (
          <span
            key={wagonNumber}
            className="rounded border border-[#e2e9e1] bg-[#f8faf7] px-1.5 py-1 text-[9px] font-bold tabular-nums text-[#68756e]"
          >
            № {wagonNumber}
          </span>
        ))}
        {hidden > 0 && (
          <span className="rounded border border-[#f2d7b7] bg-[#fff6eb] px-1.5 py-1 text-[9px] font-black text-[#d66f05]">
            +{hidden}
          </span>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[min(92dvh,900px)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden border-[#dfe7de] bg-[#f8faf7] p-0 shadow-[0_28px_90px_rgba(22,42,35,0.28)] sm:w-[94vw] sm:max-w-[1180px]">
        <div className="relative overflow-hidden border-b border-[#e2e9e1] bg-white px-5 py-5 pr-16 sm:px-7 sm:py-6">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#ef850b]" />
          <DialogHeader>
            <div className="mb-2 inline-flex h-7 w-fit items-center gap-2 rounded-md border border-[#f2d7b7] bg-[#fff6eb] px-2.5 text-[10px] font-black uppercase text-[#d66f05]">
              <MapPin className="size-3.5" />
              Направления культуры
            </div>
            <DialogTitle className="text-xl font-black text-[#223137] sm:text-2xl">
              {culture}: куда пришли вагоны
            </DialogTitle>
            <DialogDescription className="max-w-3xl text-xs leading-5 sm:text-sm">
              Текущие станции, получатели и состав вагонов выбранной культуры.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-2 gap-2 border-b border-[#e2e9e1] bg-[#f8faf7] px-4 py-4 sm:grid-cols-4 sm:px-7">
          {[
            ["Вагонов", integerFormatter.format(totalWagons)],
            ["Объем", formatTons(totalTons)],
            ["Станций", integerFormatter.format(stations)],
            ["Получателей", integerFormatter.format(recipients)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="min-w-0 border border-[#dfe7de] bg-white px-3 py-3.5 shadow-[0_5px_16px_rgba(34,49,55,0.035)] sm:px-4"
            >
              <p className="text-[10px] font-black uppercase text-[#8a938e]">
                {label}
              </p>
              <p className="mt-1.5 truncate text-base font-black tabular-nums text-[#223137] sm:text-xl">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-7 sm:py-5">
          {groups.length ? (
            <>
              <div className="space-y-2 sm:hidden">
                {groups.map((group, index) => (
                  <article
                    key={`${group.station}-${group.recipient}`}
                    className="border border-[#dfe7de] bg-white p-3.5 shadow-[0_8px_20px_rgba(34,49,55,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-black text-[#263a31]">
                          <MapPin className="size-3.5 shrink-0 text-[#e77808]" />
                          <span className="break-words">{group.station}</span>
                        </p>
                        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-bold leading-5 text-[#65736c]">
                          <Users className="mt-0.5 size-3.5 shrink-0 text-[#2f6b4f]" />
                          <span className="break-words">{group.recipient}</span>
                        </p>
                      </div>
                      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#fff2e2] text-[10px] font-black text-[#d66f05]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-[#f5f8f4] px-2.5 py-2">
                        <p className="text-[9px] font-black uppercase text-[#8a938e]">
                          Объем
                        </p>
                        <p className="mt-1 text-sm font-black tabular-nums text-[#223137]">
                          {formatTons(group.tons)}
                        </p>
                      </div>
                      <div className="bg-[#f5f8f4] px-2.5 py-2">
                        <p className="text-[9px] font-black uppercase text-[#8a938e]">
                          Вагоны
                        </p>
                        <p className="mt-1 text-sm font-black tabular-nums text-[#223137]">
                          {integerFormatter.format(group.wagons)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-[10px] font-bold text-[#7d8882]">
                      <span>Доля культуры</span>
                      <span className="tabular-nums text-[#3d5148]">
                        {numberFormatter.format(group.share)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e8eee9]">
                      <div
                        className="h-full rounded-full bg-[#ef850b]"
                        style={{ width: `${Math.max(group.share, 1)}%` }}
                      />
                    </div>
                    {wagonBadges(group)}
                  </article>
                ))}
              </div>

              <div className="hidden overflow-hidden border border-[#dfe7de] bg-white shadow-[0_10px_28px_rgba(34,49,55,0.04)] sm:block">
                <div className="sticky top-0 z-10 grid grid-cols-[48px_minmax(150px,0.85fr)_minmax(190px,1.15fr)_minmax(210px,1.25fr)_110px_80px] gap-3 border-b border-[#dfe7de] bg-[#f1f5f1] px-4 py-3 text-[10px] font-black uppercase text-[#768079]">
                  <span>№</span>
                  <span>Текущая станция</span>
                  <span>Получатель</span>
                  <span>Доля и вагоны</span>
                  <span className="text-right">Объем</span>
                  <span className="text-right">Вагоны</span>
                </div>
                <div className="divide-y divide-[#edf1eb]">
                  {groups.map((group, index) => (
                    <div
                      key={`${group.station}-${group.recipient}`}
                      className="grid grid-cols-[48px_minmax(150px,0.85fr)_minmax(190px,1.15fr)_minmax(210px,1.25fr)_110px_80px] items-center gap-3 px-4 py-4 transition-colors hover:bg-[#fffaf4]"
                    >
                      <span className="grid size-7 place-items-center rounded-md bg-[#fff2e2] text-[10px] font-black tabular-nums text-[#d66f05]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="flex min-w-0 items-start gap-2 text-xs font-black leading-5 text-[#2d4037]">
                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#e77808]" />
                        <span className="break-words">{group.station}</span>
                      </p>
                      <p className="flex min-w-0 items-start gap-2 text-xs font-bold leading-5 text-[#56665e]">
                        <Users className="mt-0.5 size-3.5 shrink-0 text-[#2f6b4f]" />
                        <span className="break-words">{group.recipient}</span>
                      </p>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-[#7d8882]">
                          <span>Доля</span>
                          <span className="tabular-nums text-[#3d5148]">
                            {numberFormatter.format(group.share)}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e8eee9]">
                          <div
                            className="h-full rounded-full bg-[#ef850b]"
                            style={{ width: `${Math.max(group.share, 1)}%` }}
                          />
                        </div>
                        {wagonBadges(group)}
                      </div>
                      <span className="whitespace-nowrap text-right text-xs font-black tabular-nums text-[#223137]">
                        {formatTons(group.tons)}
                      </span>
                      <span className="text-right text-xs font-black tabular-nums text-[#596760]">
                        {integerFormatter.format(group.wagons)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-64 place-items-center border border-dashed border-[#dfe7de] bg-white text-center">
              <div className="max-w-sm px-5">
                <TrainFront className="mx-auto size-8 text-[#bcc5bf]" />
                <p className="mt-3 text-sm font-black text-[#596760]">
                  Вагоны этой культуры не найдены
                </p>
                <p className="mt-1 text-xs leading-5 text-[#8a938e]">
                  В выбранном отчете нет строк, которые можно связать со
                  станцией и получателем.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnalyticsBarChart({
  title,
  subtitle,
  groups,
  color = "green",
}: {
  title: string;
  subtitle: string;
  groups: ApproachGroup[];
  color?: "green" | "orange";
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const visibleGroups = groups.slice(0, 7);
  const chartColor = color === "green" ? "#2f6b4f" : "#ef850b";

  return (
    <>
      <section className="border border-[#e1e8e0] bg-white shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#e7ece6] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h3 className="text-base font-black text-[#223137]">{title}</h3>
            <p className="mt-1 text-xs text-[#818985]">{subtitle}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2.5 text-[11px]"
            onClick={() => setDetailsOpen(true)}
            disabled={!groups.length}
          >
            Смотреть все
            <Badge className="ml-1 h-5 min-w-5 border-0 bg-[#edf5ee] px-1.5 text-[10px] text-[#2f6b4f] shadow-none">
              {groups.length}
            </Badge>
          </Button>
        </div>
        <div className="p-4 sm:p-5">
          {visibleGroups.length ? (
            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={visibleGroups}
                  layout="vertical"
                  margin={{ top: 4, right: 14, bottom: 4, left: 4 }}
                >
                  <CartesianGrid
                    horizontal={false}
                    stroke="#e7ece7"
                    strokeDasharray="4 6"
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={118}
                    tick={{ fill: "#596760", fontSize: 11, fontWeight: 700 }}
                    tickFormatter={(value) => {
                      const label = String(value);
                      return label.length > 19
                        ? `${label.slice(0, 18)}…`
                        : label;
                    }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f5f8f4" }}
                    contentStyle={chartTooltipContentStyle}
                    wrapperStyle={chartTooltipWrapperStyle}
                    formatter={(value, _name, item) => [
                      `${formatTons(Number(value ?? 0))} · ${integerFormatter.format(
                        Number(item.payload?.wagons ?? 0),
                      )} ваг.`,
                      "Объём",
                    ]}
                  />
                  <Bar
                    dataKey="tons"
                    fill={chartColor}
                    maxBarSize={24}
                    radius={[0, 5, 5, 0]}
                    animationDuration={650}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="grid min-h-56 place-items-center text-center">
              <div>
                <BarChart3 className="mx-auto size-8 text-[#bcc5bf]" />
                <p className="mt-3 text-sm font-bold text-[#768079]">
                  Для графика пока нет данных
                </p>
              </div>
            </div>
          )}
          {groups.length > visibleGroups.length && (
            <p className="mt-2 text-right text-[10px] font-bold text-[#8a938e]">
              На графике показано {visibleGroups.length} из {groups.length}
            </p>
          )}
        </div>
      </section>
      <AnalyticsGroupsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={title}
        groups={groups}
        color={chartColor}
      />
    </>
  );
}

function AnalyticsDonutChart({
  title,
  subtitle,
  groups,
  rows,
}: {
  title: string;
  subtitle: string;
  groups: ApproachGroup[];
  rows: ApproachRow[];
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState<string | null>(null);
  const cultureGroups = groups.filter((group) => group.tons > 0);
  const totalTons = cultureGroups.reduce((sum, group) => sum + group.tons, 0);
  const totalWagons = cultureGroups.reduce(
    (sum, group) => sum + group.wagons,
    0,
  );
  const colors = [
    "#ef850b",
    "#2f6b4f",
    "#5b879b",
    "#d8a934",
    "#819965",
    "#a75f49",
    "#776d9c",
    "#4f9a88",
    "#c77a45",
    "#7896c4",
    "#9a755c",
    "#557965",
  ];

  return (
    <>
      <section className="border border-[#e1e8e0] bg-white shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#e7ece6] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h3 className="text-base font-black text-[#223137]">{title}</h3>
            <p className="mt-1 text-xs text-[#818985]">{subtitle}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2.5 text-[11px]"
            onClick={() => setDetailsOpen(true)}
            disabled={!cultureGroups.length}
          >
            Смотреть все
            <Badge className="ml-1 h-5 min-w-5 border-0 bg-[#fff2e2] px-1.5 text-[10px] text-[#d66f05] shadow-none">
              {cultureGroups.length}
            </Badge>
          </Button>
        </div>
        {cultureGroups.length ? (
          <div className="grid min-h-[350px] gap-5 p-4 sm:grid-cols-[minmax(210px,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:p-5">
            <div className="relative mx-auto h-60 w-full max-w-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cultureGroups}
                    dataKey="tons"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={102}
                    paddingAngle={1.5}
                    cornerRadius={4}
                    stroke="#ffffff"
                    strokeWidth={2}
                    animationDuration={650}
                  >
                    {cultureGroups.map((group, index) => (
                      <Cell
                        key={group.name}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={chartTooltipContentStyle}
                    wrapperStyle={chartTooltipWrapperStyle}
                    formatter={(value, _name, item) => [
                      `${formatTons(Number(value ?? 0))} · ${integerFormatter.format(
                        Number(item.payload?.wagons ?? 0),
                      )} ваг.`,
                      String(item.payload?.name ?? "Культура"),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center">
                <div className="text-center">
                  <p className="text-2xl font-black tabular-nums text-[#223137]">
                    {numberFormatter.format(totalTons)}
                  </p>
                  <p className="text-[10px] font-black uppercase text-[#89938d]">
                    тонн
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-[#9aa39e]">
                    {integerFormatter.format(totalWagons)} вагонов
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-[#edf1eb]">
              {cultureGroups.map((group, index) => (
                <button
                  type="button"
                  key={group.name}
                  className="block w-full py-2.5 text-left transition-colors hover:bg-[#fff8ef] focus-visible:bg-[#fff8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ef850b] first:pt-0 last:pb-0"
                  onClick={() => setSelectedCulture(group.name)}
                  aria-label={`Показать станции и получателей культуры ${group.name}`}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="truncate text-xs font-black text-[#35473f]">
                      {group.name}
                    </span>
                    <span className="text-right text-xs font-black tabular-nums text-[#223137]">
                      {numberFormatter.format(group.share)}%
                    </span>
                    <ArrowRight className="size-3.5 text-[#e77808]" />
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf1ed]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(group.share, 1)}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] font-semibold tabular-nums text-[#8a938e]">
                    <span>{formatTons(group.tons)}</span>
                    <span>{integerFormatter.format(group.wagons)} ваг.</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid min-h-[350px] place-items-center text-center">
            <div>
              <BarChart3 className="mx-auto size-8 text-[#bcc5bf]" />
              <p className="mt-3 text-sm font-bold text-[#768079]">
                Для графика пока нет данных
              </p>
            </div>
          </div>
        )}
      </section>
      <AnalyticsGroupsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={title}
        groups={cultureGroups}
        color="#ef850b"
        onGroupSelect={(group) => setSelectedCulture(group.name)}
      />
      <CultureDestinationDialog
        open={Boolean(selectedCulture)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setSelectedCulture(null);
        }}
        culture={selectedCulture}
        rows={rows}
      />
    </>
  );
}

function PreviewDialog({
  items,
  open,
  importing,
  importProgress,
  onOpenChange,
  onConfirm,
}: {
  items: ApproachPreviewItem[];
  open: boolean;
  importing: boolean;
  importProgress: BatchProgress | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const totalWagons = items.reduce(
    (sum, item) => sum + item.preview.stats.wagons,
    0,
  );
  const totalTons = items.reduce(
    (sum, item) => sum + item.preview.stats.totalTons,
    0,
  );
  const totalIssues = items.reduce(
    (sum, item) => sum + item.preview.issues.length,
    0,
  );
  const singleItem = items.length === 1 ? items[0] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(88svh,820px)] max-w-4xl overflow-y-auto p-0">
        <div className="border-b border-[#e7ece6] px-5 py-5 pr-16 sm:px-6">
          <DialogHeader>
            <div className="mb-2 inline-flex h-7 w-fit items-center gap-2 rounded-md border border-[#d8e7da] bg-[#f1f7f2] px-2.5 text-[11px] font-black uppercase text-[#2f6b4f]">
              <FileSpreadsheet className="size-3.5" />
              Проверка пакета
            </div>
            <DialogTitle className="text-2xl font-black text-[#223137]">
              {items.length > 1 ? "Проверка таблиц" : "Проверка таблицы"}
            </DialogTitle>
            <DialogDescription className="leading-5">
              Данные еще не сохранены. Проверьте пакет перед импортом.
            </DialogDescription>
          </DialogHeader>
        </div>

        {items.length > 0 && (
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Таблицы", integerFormatter.format(items.length)],
                ["Вагоны", integerFormatter.format(totalWagons)],
                ["Объем", formatTons(totalTons)],
                ["Замечания", integerFormatter.format(totalIssues)],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={cn(
                    "border p-3",
                    index === 2
                      ? "border-[#f1dcc1] bg-[#fff9f1]"
                      : "border-[#e2e9e1] bg-[#fafcf9]",
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-black uppercase",
                      index === 2 ? "text-[#a9651f]" : "text-[#8a938e]",
                    )}
                  >
                    {label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-lg font-black tabular-nums",
                      index === 2 ? "text-[#bf670b]" : "text-[#223137]",
                    )}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-hidden border border-[#e2e9e1]">
              <div className="flex items-center justify-between gap-3 border-b border-[#e7ece6] bg-[#fafcf9] px-4 py-3">
                <div>
                  <p className="text-xs font-black uppercase text-[#59655f]">
                    Файлы к импорту
                  </p>
                  <p className="mt-1 text-[11px] text-[#8a938e]">
                    Каждый файл сохранится отдельным снимком
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-[#dce8dc] bg-white text-[#2f6b4f]"
                >
                  {items.length} шт.
                </Badge>
              </div>
              <div className="max-h-72 divide-y divide-[#edf1eb] overflow-y-auto">
                {items.map(({ file, preview }, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span className="grid size-9 place-items-center rounded-md bg-[#edf5ee] text-[#2f6b4f]">
                      <FileSpreadsheet className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-[10px] font-black tabular-nums text-[#9aa39e]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="truncate text-sm font-black text-[#263831]">
                          {file.name}
                        </p>
                      </div>
                      <p className="mt-1 truncate text-[11px] text-[#818985]">
                        {preview.sheetName} · {formatDate(preview.reportDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Badge
                        variant="outline"
                        className="border-[#dce8dc] bg-[#f4f8f4] text-[#2f6b4f]"
                      >
                        {integerFormatter.format(preview.stats.wagons)} ваг.
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-[#f1dcc1] bg-[#fff9f1] text-[#b96508]"
                      >
                        {formatTons(preview.stats.totalTons)}
                      </Badge>
                      {preview.issues.length > 0 && (
                        <Badge
                          variant="outline"
                          className="border-[#f0d0c5] bg-[#fff5f1] text-[#b95738]"
                        >
                          {preview.issues.length} замеч.
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {totalIssues > 0 && (
              <div className="border border-[#f1d8c4] bg-[#fff8f1] p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#d46d17]" />
                  <div>
                    <p className="text-sm font-black text-[#9a5218]">
                      Найдено замечаний: {totalIssues}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#9b7457]">
                      Проблемные строки будут пропущены, остальные данные можно
                      сохранить.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {singleItem && (
              <div className="overflow-hidden border border-[#e2e9e1]">
                <div className="border-b border-[#e7ece6] bg-[#fafcf9] px-4 py-3">
                  <p className="text-xs font-black uppercase text-[#59655f]">
                    Первые строки
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="bg-[#f6f8f5] text-[10px] font-black uppercase text-[#7b857f]">
                      <tr>
                        <th className="px-4 py-3">Станция</th>
                        <th className="px-4 py-3">Вагон</th>
                        <th className="px-4 py-3">Культура</th>
                        <th className="px-4 py-3 text-right">Тонн</th>
                        <th className="px-4 py-3">Получатель</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1eb] text-xs text-[#34423d]">
                      {singleItem.preview.sample.map((row) => (
                        <tr key={`${row.sourceRow}-${row.wagonNumber}`}>
                          <td className="px-4 py-3 font-bold">
                            {row.currentStation}
                          </td>
                          <td className="px-4 py-3 font-black tabular-nums">
                            {row.wagonNumber}
                          </td>
                          <td className="px-4 py-3">
                            {compact(row.cargoName)}
                          </td>
                          <td className="px-4 py-3 text-right font-black tabular-nums">
                            {formatTons(row.tons)}
                          </td>
                          <td className="max-w-52 truncate px-4 py-3">
                            {compact(row.recipient)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-[#e7ece6] px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Отмена
          </Button>
          <Button type="button" onClick={onConfirm} disabled={importing}>
            {importing ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                Сохраняем{" "}
                {importProgress
                  ? `${importProgress.current}/${importProgress.total}`
                  : ""}
              </>
            ) : (
              <>
                <ArrowDownToLine className="size-4" />
                Импортировать
                {items.length > 1 ? ` ${items.length} таблиц` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadPanel({
  isDragging,
  previewing,
  previewProgress,
  onBrowse,
  onDrop,
  onDragEnter,
  onDragLeave,
}: {
  isDragging: boolean;
  previewing: boolean;
  previewProgress: BatchProgress | null;
  onBrowse: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <section className="border border-[#e1e8e0] bg-white shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
      <div className="flex items-start gap-3 border-b border-[#e7ece6] px-4 py-4 sm:px-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#fff2e2] text-[#e77808]">
          <UploadCloud className="size-4.5" />
        </div>
        <div>
          <h3 className="text-base font-black text-[#223137]">
            Загрузить отчеты
          </h3>
          <p className="mt-1 text-xs leading-5 text-[#818985]">
            До {MAX_BATCH_FILES} XLSX за раз, каждый до 20 МБ. В аналитику
            попадают только зерновые культуры.
          </p>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "grid min-h-52 place-items-center border border-dashed p-6 text-center transition-colors",
            isDragging
              ? "border-[#ef850b] bg-[#fff7ec]"
              : "border-[#cfdacf] bg-[#fafcf9]",
          )}
        >
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-md bg-white text-[#e77808] shadow-[0_10px_24px_rgba(34,49,55,0.08)]">
              <FileSpreadsheet className="size-5" />
            </div>
            <p className="mt-4 text-sm font-black text-[#2e3c37]">
              Перетащите таблицы сюда
            </p>
            <p className="mt-1 text-xs text-[#8a938e]">
              или выберите одну или несколько на компьютере
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={onBrowse}
              disabled={previewing}
            >
              {previewing ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  Проверяем{" "}
                  {previewProgress
                    ? `${previewProgress.current}/${previewProgress.total}`
                    : ""}
                </>
              ) : (
                <>
                  <UploadCloud className="size-4" />
                  Выбрать XLSX
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ImportHistory({
  imports,
  selectedId,
  dateOrder,
  onDateOrderChange,
  onSelect,
}: {
  imports: ReturnType<typeof useApproachImports>["data"];
  selectedId?: ApproachDashboardSelection;
  dateOrder: ImportDateOrder;
  onDateOrderChange: (value: ImportDateOrder) => void;
  onSelect: (id: Exclude<ApproachDashboardSelection, undefined>) => void;
}) {
  const items = useMemo(() => {
    const direction = dateOrder === "desc" ? -1 : 1;

    return [...(imports ?? [])].sort((left, right) => {
      const leftDate = new Date(left.reportDate ?? left.createdAt).getTime();
      const rightDate = new Date(right.reportDate ?? right.createdAt).getTime();
      const byReportDate = (leftDate - rightDate) * direction;
      if (byReportDate) return byReportDate;

      return (
        (new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()) *
        direction
      );
    });
  }, [dateOrder, imports]);

  return (
    <section className="border border-[#e1e8e0] bg-white shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
      <div className="flex flex-col gap-3 border-b border-[#e7ece6] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#edf5ee] text-[#2f6b4f]">
            <History className="size-4.5" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#223137]">
              История загрузок
            </h3>
            <p className="mt-1 text-xs text-[#818985]">
              Каждый файл хранится отдельным снимком.
            </p>
          </div>
        </div>
        <Select
          value={dateOrder}
          onValueChange={(value) => onDateOrderChange(value as ImportDateOrder)}
        >
          <SelectTrigger className="h-9 w-full text-xs sm:w-44">
            <ArrowDownUp className="mr-2 size-3.5 text-[#758079]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Сначала новые</SelectItem>
            <SelectItem value="asc">Сначала старые</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        onClick={() => onSelect("all")}
        aria-pressed={selectedId === "all"}
        className={cn(
          "group relative mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 overflow-hidden rounded-lg border p-3 text-left transition-all sm:mx-5 sm:w-[calc(100%-2.5rem)] sm:p-3.5",
          selectedId === "all"
            ? "border-[#ef850b] bg-[#fff8ef] shadow-[0_10px_24px_rgba(239,133,11,0.13)]"
            : "border-[#dfe8df] bg-[#fbfdfb] hover:border-[#b9ceb9] hover:bg-white hover:shadow-[0_8px_20px_rgba(34,49,55,0.07)]",
        )}
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1 transition-colors",
            selectedId === "all" ? "bg-[#ef850b]" : "bg-[#2f6b4f]",
          )}
        />
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-md border transition-colors",
            selectedId === "all"
              ? "border-[#ef850b] bg-[#ef850b] text-white"
              : "border-[#d9e7da] bg-[#edf5ee] text-[#2f6b4f] group-hover:border-[#efc187] group-hover:bg-[#fff2e2] group-hover:text-[#df7507]",
          )}
        >
          <Layers3 className="size-4.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-[10px] font-black uppercase tracking-normal",
              selectedId === "all" ? "text-[#c96c0d]" : "text-[#7c8982]",
            )}
          >
            Сводная аналитика
          </span>
          <span className="mt-0.5 block truncate text-sm font-black text-[#24362f]">
            Общий отчёт
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[#7d8882]">
            Последнее состояние каждого вагона
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "hidden rounded-md border bg-white px-2 py-1 text-[10px] font-black sm:inline-flex",
              selectedId === "all"
                ? "border-[#f2c48f] text-[#c96c0d]"
                : "border-[#dce7dc] text-[#2f6b4f]",
            )}
          >
            Все таблицы
          </span>
          <span
            className={cn(
              "grid size-8 place-items-center rounded-md transition-transform group-hover:translate-x-0.5",
              selectedId === "all"
                ? "bg-[#ef850b] text-white"
                : "bg-[#edf3ed] text-[#2f6b4f]",
            )}
          >
            <ArrowRight className="size-4" />
          </span>
        </span>
      </button>
      <div className="max-h-[300px] divide-y divide-[#edf1eb] overflow-y-auto">
        {items.length ? (
          items.map((item) => {
            const active = selectedId === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 text-left transition-colors sm:px-5",
                  active ? "bg-[#eef6ef]" : "hover:bg-[#fafcf9]",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#2d3d37]">
                    {formatDate(item.reportDate)}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-[#8a938e]">
                    {item.attachmentName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black tabular-nums text-[#2f6b4f]">
                    {integerFormatter.format(item.rowsTotal)} ваг.
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-[#8a938e]">
                    {formatDate(item.createdAt, true)}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="grid min-h-52 place-items-center p-6 text-center">
            <div>
              <History className="mx-auto size-8 text-[#c2cac5]" />
              <p className="mt-3 text-sm font-bold text-[#768079]">
                Загрузок пока нет
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RowTable({
  rows,
  visibleLimit,
  onVisibleLimitChange,
}: {
  rows: ApproachRow[];
  visibleLimit: number;
  onVisibleLimitChange: (value: number) => void;
}) {
  const visibleRows = rows.slice(0, visibleLimit);

  return (
    <section className="overflow-hidden border border-[#e1e8e0] bg-white shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left">
          <thead className="border-y border-[#e5ebe4] bg-[#f6f8f5] text-[10px] font-black uppercase text-[#748079]">
            <tr>
              <th className="px-4 py-3">Текущая станция</th>
              <th className="px-4 py-3">№ вагона</th>
              <th className="px-4 py-3">Код</th>
              <th className="px-4 py-3">Культура</th>
              <th className="px-4 py-3 text-right">Тонн</th>
              <th className="px-4 py-3">Получатель</th>
              <th className="px-4 py-3">Станция отправления</th>
              <th className="px-4 py-3">Состав</th>
              <th className="px-4 py-3">Контейнер</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1eb] text-xs text-[#394842]">
            {visibleRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-[#fafcf9]">
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 font-black text-[#2f6b4f]">
                    <MapPin className="size-3.5 shrink-0" />
                    {row.currentStation}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-black tabular-nums text-[#223137]">
                  {row.wagonNumber}
                </td>
                <td className="px-4 py-3.5">{compact(row.code)}</td>
                <td className="max-w-56 truncate px-4 py-3.5 font-bold">
                  {compact(row.cargoName)}
                </td>
                <td className="px-4 py-3.5 text-right font-black tabular-nums">
                  {formatTons(row.tons)}
                </td>
                <td className="max-w-64 truncate px-4 py-3.5">
                  {compact(row.recipient)}
                </td>
                <td className="max-w-56 truncate px-4 py-3.5">
                  {compact(row.departureStation)}
                </td>
                <td className="px-4 py-3.5">{compact(row.trainIndex)}</td>
                <td className="px-4 py-3.5">{compact(row.containerNumber)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-[#e7ece6] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-[#78827d]">
          Показано{" "}
          <span className="font-black text-[#2d3d37]">
            {integerFormatter.format(visibleRows.length)}
          </span>{" "}
          из{" "}
          <span className="font-black text-[#2d3d37]">
            {integerFormatter.format(rows.length)}
          </span>{" "}
          вагонов
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#78827d]">Показать</span>
          <Select
            value={String(visibleLimit)}
            onValueChange={(value) => onVisibleLimitChange(Number(value))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[50, 100, 250, 1000].map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value === 1000 ? "Все" : value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs font-semibold text-[#78827d]">сразу</span>
        </div>
      </div>
    </section>
  );
}

export default function ApproachPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewItems, setPreviewItems] = useState<ApproachPreviewItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isBatchPreviewing, setIsBatchPreviewing] = useState(false);
  const [previewProgress, setPreviewProgress] = useState<BatchProgress | null>(
    null,
  );
  const [importProgress, setImportProgress] = useState<BatchProgress | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [selectedImportId, setSelectedImportId] =
    useState<ApproachDashboardSelection>();
  const [search, setSearch] = useState("");
  const [station, setStation] = useState(ALL);
  const [recipient, setRecipient] = useState(ALL);
  const [cargo, setCargo] = useState(ALL);
  const [visibleLimit, setVisibleLimit] = useState(50);
  const [importDateOrder, setImportDateOrder] =
    useState<ImportDateOrder>("desc");

  const importsQuery = useApproachImports(30);
  const dashboardQuery = useApproachDashboard(selectedImportId);
  const previewMutation = usePreviewApproach();
  const importMutation = useImportApproach();
  const dashboard = dashboardQuery.data;
  const imports = importsQuery.data ?? [];

  const options = useMemo(() => {
    const rows = dashboard?.rows ?? [];
    const unique = (values: Array<string | null>) =>
      Array.from(
        new Set(values.filter((value): value is string => Boolean(value))),
      ).sort((left, right) => left.localeCompare(right, "ru"));

    return {
      stations: unique(rows.map((row) => row.currentStation)),
      recipients: unique(rows.map((row) => row.recipient)),
      cargoes: unique(rows.map((row) => row.cargoName)),
    };
  }, [dashboard?.rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("ru-RU");

    return (dashboard?.rows ?? [])
      .filter((row) => {
        if (station !== ALL && row.currentStation !== station) return false;
        if (recipient !== ALL && row.recipient !== recipient) return false;
        if (cargo !== ALL && row.cargoName !== cargo) return false;
        if (!normalizedSearch) return true;

        return [
          row.wagonNumber,
          row.currentStation,
          row.code,
          row.cargoName,
          row.recipient,
          row.departureStation,
          row.trainIndex,
          row.containerNumber,
        ].some((value) =>
          value?.toLocaleLowerCase("ru-RU").includes(normalizedSearch),
        );
      })
      .sort(
        (left, right) =>
          left.currentStation.localeCompare(right.currentStation, "ru") ||
          left.wagonNumber.localeCompare(right.wagonNumber),
      );
  }, [cargo, dashboard?.rows, recipient, search, station]);

  const hasFilters =
    Boolean(search.trim()) ||
    station !== ALL ||
    recipient !== ALL ||
    cargo !== ALL;

  const resetFilters = () => {
    setSearch("");
    setStation(ALL);
    setRecipient(ALL);
    setCargo(ALL);
    setVisibleLimit(50);
  };

  const selectFiles = async (incomingFiles: File[]) => {
    if (!incomingFiles.length || isBatchPreviewing) return;

    const uniqueFiles = Array.from(
      new Map(
        incomingFiles.map((file) => [
          `${file.name}-${file.size}-${file.lastModified}`,
          file,
        ]),
      ).values(),
    ).slice(0, MAX_BATCH_FILES);
    const validFiles = uniqueFiles.filter(
      (file) => /\.xlsx$/i.test(file.name) && file.size <= MAX_FILE_SIZE,
    );
    const invalidFormatCount = uniqueFiles.filter(
      (file) => !/\.xlsx$/i.test(file.name),
    ).length;
    const oversizedCount = uniqueFiles.filter(
      (file) => /\.xlsx$/i.test(file.name) && file.size > MAX_FILE_SIZE,
    ).length;

    if (incomingFiles.length > MAX_BATCH_FILES) {
      toast.info(
        "Ограничение пакета",
        `Будут проверены первые ${MAX_BATCH_FILES} таблиц.`,
      );
    }
    if (invalidFormatCount || oversizedCount) {
      toast.error(
        "Часть файлов пропущена",
        [
          invalidFormatCount ? `${invalidFormatCount} не в формате XLSX` : null,
          oversizedCount ? `${oversizedCount} больше 20 МБ` : null,
        ]
          .filter(Boolean)
          .join(", "),
      );
    }
    if (!validFiles.length) return;

    setIsBatchPreviewing(true);
    setPreviewProgress({ current: 0, total: validFiles.length });
    const prepared: ApproachPreviewItem[] = [];
    let failedCount = 0;

    for (let index = 0; index < validFiles.length; index += 1) {
      const file = validFiles[index];
      setPreviewProgress({
        current: index + 1,
        total: validFiles.length,
      });
      try {
        const result = await previewMutation.mutateAsync(file);
        prepared.push({ file, preview: result });
      } catch {
        failedCount += 1;
      }
    }

    setIsBatchPreviewing(false);
    setPreviewProgress(null);
    setPreviewItems(prepared);
    setPreviewOpen(prepared.length > 0);

    if (failedCount) {
      toast.error(
        "Не все таблицы прочитаны",
        `${failedCount} из ${validFiles.length} файлов не прошли проверку.`,
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void selectFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const handleImport = async () => {
    if (!previewItems.length || importProgress) return;

    const failedItems: ApproachPreviewItem[] = [];
    const importedIds: number[] = [];
    let importedCount = 0;
    let duplicateCount = 0;

    setImportProgress({ current: 0, total: previewItems.length });
    for (let index = 0; index < previewItems.length; index += 1) {
      const item = previewItems[index];
      setImportProgress({
        current: index + 1,
        total: previewItems.length,
      });
      try {
        const result = await importMutation.mutateAsync(item.file);
        importedIds.push(result.import.id);
        if (result.duplicate) duplicateCount += 1;
        else importedCount += 1;
      } catch {
        failedItems.push(item);
      }
    }
    setImportProgress(null);

    if (importedIds.length) {
      setSelectedImportId(importedIds.length > 1 ? "all" : importedIds[0]);
    }

    if (failedItems.length) {
      setPreviewItems(failedItems);
      toast.error(
        "Пакет сохранен не полностью",
        `${failedItems.length} из ${previewItems.length} таблиц не удалось импортировать. Их можно повторить.`,
      );
      return;
    }

    setPreviewOpen(false);
    setPreviewItems([]);
    if (duplicateCount && !importedCount) {
      toast.info(
        "Таблицы уже загружены",
        `${duplicateCount} файлов открыты без повторного импорта.`,
      );
    } else {
      toast.success(
        "Пакет сохранен",
        [
          `${importedCount} новых таблиц`,
          duplicateCount ? `${duplicateCount} дубликатов пропущено` : null,
        ]
          .filter(Boolean)
          .join(", "),
      );
    }
  };

  if (dashboardQuery.isLoading || importsQuery.isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="w-full space-y-4 pb-8 sm:space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={handleFileChange}
      />

      <PreviewDialog
        items={previewItems}
        open={previewOpen}
        importing={Boolean(importProgress)}
        importProgress={importProgress}
        onOpenChange={(open) => {
          if (!open && importProgress) return;
          setPreviewOpen(open);
          if (!open) {
            setPreviewItems([]);
          }
        }}
        onConfirm={() => void handleImport()}
      />

      <section className="overflow-hidden border border-[#dfe7de] bg-white shadow-[0_14px_35px_rgba(34,49,55,0.07)]">
        <div className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex h-7 items-center gap-2 rounded-md border border-[#d8e7da] bg-[#f1f7f2] px-2.5 text-[11px] font-black uppercase text-[#2f6b4f]">
              <ShieldCheck className="size-3.5" />
              Только для руководителя
            </div>
            <h1 className="text-2xl font-black leading-tight text-[#223137] sm:text-3xl">
              Подход вагонов
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707a75]">
              Независимый реестр подхода: текущие станции, объемы, получатели и
              сравнение ежедневных отчетов.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0 border border-[#e1e8e0] bg-[#fafcf9] px-3 py-2.5 sm:min-w-[150px]">
              <p className="text-[10px] font-black uppercase text-[#8a938e]">
                Снимок
              </p>
              <p className="mt-1 truncate text-sm font-black text-[#223137]">
                {dashboard
                  ? dashboard.scope === "all"
                    ? "Общий отчёт"
                    : formatDate(dashboard.import.reportDate)
                  : "Нет данных"}
              </p>
            </div>
            <div className="min-w-0 border border-[#f2d7b4] bg-[#fff8ef] px-3 py-2.5 sm:min-w-[150px]">
              <p className="text-[10px] font-black uppercase text-[#a9651f]">
                Изменение
              </p>
              <p className="mt-1 truncate text-sm font-black text-[#ce6c08]">
                {dashboard?.scope === "all"
                  ? `${dashboard.sourceImportCount} таблиц`
                  : dashboard?.previousImport
                    ? `+${dashboard.comparison.appeared.length} / −${dashboard.comparison.removed.length}`
                    : "Первый отчет"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {dashboard ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Вагонов в подходе"
              value={integerFormatter.format(dashboard.stats.wagons)}
              detail={
                dashboard.previousImport
                  ? `${dashboard.comparison.persisted} из прошлого снимка`
                  : "Базовый снимок без сравнения"
              }
              icon={TrainFront}
            />
            <MetricCard
              label="Общий объем"
              value={formatTons(dashboard.stats.totalTons)}
              detail={`в среднем ${formatTons(
                dashboard.stats.totalTons / Math.max(dashboard.stats.wagons, 1),
              )} на вагон`}
              icon={Package}
              tone="orange"
            />
            <MetricCard
              label="Текущих станций"
              value={integerFormatter.format(dashboard.stats.stations)}
              detail={`${dashboard.stats.departureStations} станций отправления`}
              icon={MapPin}
            />
            <MetricCard
              label="Получателей"
              value={integerFormatter.format(dashboard.stats.recipients)}
              detail={`${dashboard.stats.cargoes} зерновых культур`}
              icon={Users}
              tone="orange"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
            <UploadPanel
              isDragging={isDragging}
              previewing={isBatchPreviewing}
              previewProgress={previewProgress}
              onBrowse={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget === event.target) {
                  setIsDragging(false);
                }
              }}
            />
            <ImportHistory
              imports={imports}
              selectedId={selectedImportId ?? dashboard.import.id}
              dateOrder={importDateOrder}
              onDateOrderChange={setImportDateOrder}
              onSelect={setSelectedImportId}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AnalyticsBarChart
              title="Текущие станции"
              subtitle="Распределение вагонов и тоннажа по месту нахождения"
              groups={dashboard.groups.stations}
              color="green"
            />
            <AnalyticsBarChart
              title="Получатели"
              subtitle="Крупнейшие получатели в выбранном отчете"
              groups={dashboard.groups.recipients}
              color="orange"
            />
            <AnalyticsDonutChart
              title="Зерновые культуры"
              subtitle="Структура объема по культурам"
              groups={dashboard.groups.cargoes}
              rows={dashboard.rows}
            />
            <AnalyticsBarChart
              title="Станции отправления"
              subtitle="Откуда сформирован текущий подход"
              groups={dashboard.groups.departureStations}
              color="green"
            />
          </div>

          <section className="border border-[#e1e8e0] bg-white shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
            <div className="flex flex-col gap-3 border-b border-[#e7ece6] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#edf5ee] text-[#2f6b4f]">
                  <FileSpreadsheet className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#223137]">
                    Реестр подхода
                  </h2>
                  <p className="mt-1 text-xs text-[#818985]">
                    Поиск и фильтрация внутри выбранного снимка
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-8 gap-1.5 border-[#dce8dc] bg-[#f1f7f2] px-2.5 text-[#2f6b4f]"
                >
                  <CalendarDays className="size-3.5" />
                  {dashboard.scope === "all"
                    ? `Общий отчёт · ${dashboard.sourceImportCount} таблиц`
                    : formatDate(dashboard.import.reportDate)}
                </Badge>
                {dashboard.previousImport && (
                  <Badge
                    variant="outline"
                    className="h-8 gap-1.5 border-[#f1dcc1] bg-[#fff9f1] px-2.5 text-[#b96508]"
                  >
                    <ArrowRightLeft className="size-3.5" />+
                    {dashboard.comparison.appeared.length} / −
                    {dashboard.comparison.removed.length}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_220px_220px_220px_auto] sm:p-5">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b958f]" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                  placeholder="Вагон, станция, культура, получатель..."
                />
              </div>
              <Select value={station} onValueChange={setStation}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все станции" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Все станции</SelectItem>
                  {options.stations.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все получатели" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Все получатели</SelectItem>
                  {options.recipients.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все культуры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Все культуры</SelectItem>
                  {options.cargoes.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={resetFilters}
                disabled={!hasFilters}
                aria-label="Сбросить фильтры"
              >
                <FilterX className="size-4" />
                <span className="lg:hidden 2xl:inline">Сбросить</span>
              </Button>
            </div>
          </section>

          <RowTable
            rows={filteredRows}
            visibleLimit={visibleLimit}
            onVisibleLimitChange={setVisibleLimit}
          />
        </>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <UploadPanel
            isDragging={isDragging}
            previewing={isBatchPreviewing}
            previewProgress={previewProgress}
            onBrowse={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
          />
          <section className="grid min-h-80 place-items-center border border-[#e1e8e0] bg-white p-8 text-center shadow-[0_12px_30px_rgba(34,49,55,0.055)]">
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-md bg-[#edf5ee] text-[#2f6b4f]">
                <CheckCircle2 className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-black text-[#223137]">
                Начните с первого отчета
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7c8580]">
                После загрузки здесь появятся KPI, сравнение снимков, графики и
                полный реестр вагонов.
              </p>
            </div>
          </section>
        </div>
      )}

      {dashboardQuery.isError && (
        <div className="flex items-start gap-3 border border-[#f0d3cc] bg-[#fff4f1] p-4 text-[#a64631]">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-sm font-black">Не удалось загрузить аналитику</p>
            <p className="mt-1 text-xs">
              Обновите страницу или повторите попытку позже.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
