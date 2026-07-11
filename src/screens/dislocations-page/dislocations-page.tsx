"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSpreadsheet,
  History,
  Inbox,
  Link2,
  Loader2,
  MailCheck,
  RefreshCw,
  Route,
  TrainFront,
  UploadCloud,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import type {
  DislocationImport,
  DislocationImportStatus,
} from "@/entities/dislocations/api/dislocation.api";
import {
  useDislocationImports,
  useImportDislocation,
  useSyncDislocationsFromEmail,
  useUnmatchedDislocations,
} from "@/entities/dislocations/hooks/use-dislocations";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const numberFormatter = new Intl.NumberFormat("ru-RU");
const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusConfig: Record<
  DislocationImportStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  COMPLETED: {
    label: "Обработан",
    className: "border-[#d8e8da] bg-[#eef7ef] text-[#2f6b4f]",
    icon: CheckCircle2,
  },
  PROCESSING: {
    label: "Обрабатывается",
    className: "border-[#f4dfbf] bg-[#fff7ea] text-[#b96508]",
    icon: Clock3,
  },
  FAILED: {
    label: "Ошибка",
    className: "border-[#f0d3cc] bg-[#fff0ed] text-[#b9472d]",
    icon: AlertCircle,
  },
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateTimeFormatter.format(date);
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
};

const isXlsxFile = (file: File) => /\.xlsx$/i.test(file.name);

function ImportStatusBadge({ status }: { status: DislocationImportStatus }) {
  const config = statusConfig[status] ?? statusConfig.PROCESSING;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 gap-1.5 rounded-md px-2.5 text-[11px] font-black",
        config.className,
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  );
}

function MatchProgress({ item }: { item: DislocationImport }) {
  const percent = item.rowsTotal
    ? Math.round((item.matchedRows / item.rowsTotal) * 100)
    : 0;

  return (
    <div className="min-w-[150px] space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-black text-[#2f6b4f]">
          {numberFormatter.format(item.matchedRows)} привязано
        </span>
        <span className="font-semibold tabular-nums text-[#7b857f]">
          {percent}%
        </span>
      </div>
      <Progress value={percent} className="h-1.5 bg-[#e8eee8]" />
      <p
        className={cn(
          "text-[11px] font-semibold",
          item.unmatchedRows ? "text-[#b96508]" : "text-[#8a938e]",
        )}
      >
        {item.unmatchedRows
          ? `${numberFormatter.format(item.unmatchedRows)} без совпадения`
          : "Все вагоны найдены"}
      </p>
    </div>
  );
}

function ImportsSkeleton() {
  return (
    <div className="space-y-2 p-4 sm:p-5">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-md border border-[#e7ece6] p-4 sm:grid-cols-[1.5fr_1fr_1fr_140px] sm:items-center"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-28 rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function DislocationsPage() {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const importsQuery = useDislocationImports(50);
  const importMutation = useImportDislocation();
  const syncMutation = useSyncDislocationsFromEmail();

  const imports = Array.isArray(importsQuery.data) ? importsQuery.data : [];
  const latestImport = imports[0];
  const unmatchedQuery = useUnmatchedDislocations(latestImport?.id);
  const unmatchedWagons = Array.isArray(unmatchedQuery.data)
    ? unmatchedQuery.data
    : [];
  const stats = useMemo(
    () => ({
      imports: imports.length,
      rows: imports.reduce((sum, item) => sum + item.rowsTotal, 0),
      matched: imports.reduce((sum, item) => sum + item.matchedRows, 0),
      unmatched: latestImport?.unmatchedRows ?? 0,
    }),
    [imports, latestImport],
  );

  const selectFile = (file?: File) => {
    if (!file) return;

    if (!isXlsxFile(file)) {
      toast.error("Неверный формат", "Для дислокации нужен файл XLSX.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Файл слишком большой", "Максимальный размер файла — 20 МБ.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.info("Выберите таблицу", "Добавьте XLSX-файл дислокации.");
      return;
    }

    importMutation.mutate(selectedFile, {
      onSuccess: (result) => {
        if (result.duplicate) {
          toast.info(
            "Файл уже загружен",
            "Повторная копия не была добавлена в историю.",
          );
        } else if (
          result.parsedRows &&
          result.skippedRows === result.parsedRows
        ) {
          toast.info(
            "Таблица прочитана",
            "Все строки старее текущей дислокации, данные вагонов не изменены.",
          );
        } else {
          const updatedRows =
            typeof result.parsedRows === "number"
              ? result.parsedRows - (result.skippedRows || 0)
              : result.import.rowsTotal;
          toast.success(
            "Дислокация загружена",
            `${numberFormatter.format(updatedRows)} вагонов актуализировано, ${numberFormatter.format(result.import.matchedRows)} привязано к CRM.`,
          );
        }
        setSelectedFile(null);
      },
    });
  };

  const handleEmailSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.skipped) {
          toast.info("Синхронизация уже идет", result.reason);
          return;
        }

        const errors = result.results?.filter((item) => item.error).length ?? 0;
        const processed = result.processed ?? 0;
        toast.success(
          "Почта проверена",
          processed
            ? `${processed} вложений найдено${errors ? `, ошибок: ${errors}` : ""}.`
            : "Новых таблиц дислокации не найдено.",
        );
      },
    });
  };

  return (
    <div className="w-full space-y-4 pb-8 sm:space-y-5">
      <section className="overflow-hidden rounded-md border border-[#dfe7de] bg-white shadow-[0_14px_35px_rgba(34,49,55,0.07)]">
        <div className="grid gap-5 border-b border-[#e7ece6] px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex h-7 items-center gap-2 rounded-md border border-[#d8e7da] bg-[#f1f7f2] px-2.5 text-[11px] font-black uppercase text-[#2f6b4f]">
              <TrainFront className="size-3.5" />
              Контроль вагонов
            </div>
            <h2 className="text-2xl font-black leading-tight text-[#223137] sm:text-3xl">
              Дислокации
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707a75]">
              Ежедневные координаты, операции и расстояния до станции назначения.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="min-w-[130px] rounded-md border border-[#e1e8e0] bg-[#fafcf9] px-3 py-2.5">
              <p className="text-[10px] font-black uppercase text-[#8a938e]">
                Последний файл
              </p>
              <p className="mt-1 truncate text-sm font-black text-[#223137]">
                {latestImport ? formatDate(latestImport.sourceCreatedAt || latestImport.createdAt) : "Нет данных"}
              </p>
            </div>
            <div className="min-w-[130px] rounded-md border border-[#f2d7b4] bg-[#fff8ef] px-3 py-2.5">
              <p className="text-[10px] font-black uppercase text-[#a9651f]">
                Требует внимания
              </p>
              <p className="mt-1 text-sm font-black tabular-nums text-[#ce6c08]">
                {numberFormatter.format(stats.unmatched)} вагонов
              </p>
            </div>
          </div>
        </div>

        <div className="grid divide-y divide-[#e7ece6] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {[
            {
              label: "Загрузок в журнале",
              value: stats.imports,
              detail: "последние 50 файлов",
              icon: History,
              tone: "green",
            },
            {
              label: "Строк обработано",
              value: stats.rows,
              detail: "снимков дислокации",
              icon: FileCheck2,
              tone: "orange",
            },
            {
              label: "Привязано к CRM",
              value: stats.matched,
              detail: "совпало по № вагона",
              icon: Link2,
              tone: "green",
            },
            {
              label: "Без совпадения",
              value: stats.unmatched,
              detail: "в последнем файле",
              icon: AlertCircle,
              tone: "orange",
            },
          ].map((item) => (
            <div key={item.label} className="flex min-h-28 items-start gap-3 p-4 sm:p-5">
              <div
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-md",
                  item.tone === "green"
                    ? "bg-[#edf5ee] text-[#2f6b4f]"
                    : "bg-[#fff2e2] text-[#e77808]",
                )}
              >
                <item.icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase text-[#7b857f]">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-[#223137]">
                  {numberFormatter.format(item.value)}
                </p>
                <p className="mt-0.5 text-xs text-[#8a938e]">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {stats.unmatched > 0 ? (
        <section className="overflow-hidden rounded-md border border-[#efcfaa] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#f2dfca] bg-[#fffaf4] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#ffecd6] text-[#d96f08]">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#223137]">
                  Вагоны без совпадения
                </h3>
                <p className="mt-1 text-xs text-[#7b857f]">
                  Не найдены в CRM после импорта {latestImport?.attachmentName}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="h-8 w-fit rounded-md border-[#efc28f] bg-white px-3 text-xs font-black text-[#c96608]"
            >
              {numberFormatter.format(stats.unmatched)} вагонов
            </Badge>
          </div>

          {unmatchedQuery.isLoading ? (
            <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: Math.min(stats.unmatched, 6) }, (_, index) => (
                <Skeleton key={index} className="h-24 rounded-md" />
              ))}
            </div>
          ) : unmatchedWagons.length ? (
            <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {unmatchedWagons.map((wagon) => (
                <div
                  key={wagon.id}
                  className="min-w-0 rounded-md border border-[#e5ebe4] bg-white p-3.5 transition-colors hover:border-[#efc28f] hover:bg-[#fffdf9]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-[#929a96]">
                        № вагона
                      </p>
                      <p className="mt-1 text-lg font-black tabular-nums text-[#223137]">
                        {wagon.wagonNumber}
                      </p>
                    </div>
                    <div className="grid size-9 shrink-0 place-items-center rounded-md bg-[#fff2e2] text-[#e77808]">
                      <TrainFront className="size-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex min-w-0 items-center gap-2 text-xs font-bold text-[#53605a]">
                    <Route className="size-3.5 shrink-0 text-[#2f6b4f]" />
                    <span className="truncate">
                      {wagon.departureStation || "—"} → {wagon.destinationStation || "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-[#7b857f]">
                    <span className="truncate">
                      {wagon.lastOperationStation || wagon.operation || "Дислокация не указана"}
                    </span>
                    {typeof wagon.distanceToDestinationKm === "number" ? (
                      <span className="shrink-0 font-black tabular-nums text-[#2f6b4f]">
                        {numberFormatter.format(wagon.distanceToDestinationKm)} км
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm font-semibold text-[#7b857f]">
              Номера пока не удалось получить. Обновите журнал через несколько секунд.
            </div>
          )}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.65fr)]">
        <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#fff2e2] text-[#e77808]">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#223137]">
                Загрузить таблицу
              </h3>
              <p className="mt-1 text-sm text-[#7b857f]">Формат XLSX, до 20 МБ</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
            className="sr-only"
          />

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
            className={cn(
              "mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center outline-none transition focus-visible:ring-3 focus-visible:ring-[#f38810]/20",
              isDragging
                ? "border-[#f38810] bg-[#fff8ef]"
                : selectedFile
                  ? "border-[#a9c7af] bg-[#f5faf5]"
                  : "border-[#cfd9ce] bg-[#fafcf9] hover:border-[#f0a451] hover:bg-[#fffaf4]",
            )}
          >
            {selectedFile ? (
              <>
                <div className="grid size-12 place-items-center rounded-md bg-white text-[#2f6b4f] shadow-sm">
                  <FileSpreadsheet className="size-6" />
                </div>
                <p className="mt-3 max-w-full truncate text-sm font-black text-[#223137]">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#7b857f]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </>
            ) : (
              <>
                <div className="grid size-12 place-items-center rounded-md bg-white text-[#e77808] shadow-sm">
                  <FileSpreadsheet className="size-6" />
                </div>
                <p className="mt-3 text-sm font-black text-[#223137]">
                  Перетащите XLSX сюда
                </p>
                <p className="mt-1 text-xs text-[#7b857f]">или выберите файл</p>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {selectedFile ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedFile(null)}
                disabled={importMutation.isPending}
                className="h-11"
              >
                <X className="size-4" />
                Убрать файл
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="h-11"
            >
              {importMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              {importMutation.isPending ? "Обрабатываем…" : "Загрузить дислокацию"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col rounded-md border border-[#dfe7de] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#edf5ee] text-[#2f6b4f]">
              <MailCheck className="size-5" />
            </div>
            <Badge
              variant="outline"
              className="rounded-md border-[#d8e8da] bg-[#f3f8f3] text-[10px] font-black uppercase text-[#2f6b4f]"
            >
              Автоматически
            </Badge>
          </div>
          <h3 className="mt-5 text-base font-black text-[#223137]">
            Получение с почты
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#7b857f]">
            Сервер забирает новые XLSX-вложения по расписанию и исключает дубликаты.
          </p>
          <div className="mt-4 rounded-md border border-[#e6ece5] bg-[#fafcf9] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#53605a]">
              <Inbox className="size-4 text-[#2f6b4f]" />
              Последняя запись
            </div>
            <p className="mt-2 text-sm font-black text-[#223137]">
              {latestImport
                ? formatDate(latestImport.receivedAt || latestImport.createdAt)
                : "Пока нет импортов"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleEmailSync}
            disabled={syncMutation.isPending}
            className="mt-auto h-11 w-full sm:mt-5"
          >
            <RefreshCw
              className={cn("size-4", syncMutation.isPending && "animate-spin")}
            />
            {syncMutation.isPending ? "Проверяем почту…" : "Проверить почту сейчас"}
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-[#dfe7de] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#e7ece6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-[#edf5ee] text-[#2f6b4f]">
              <History className="size-4.5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#223137]">Журнал импортов</h3>
              <p className="mt-0.5 text-xs text-[#7b857f]">
                Ручные загрузки и вложения, полученные с почты
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => importsQuery.refetch()}
            disabled={importsQuery.isFetching}
          >
            <RefreshCw
              className={cn("size-3.5", importsQuery.isFetching && "animate-spin")}
            />
            Обновить
          </Button>
        </div>

        {importsQuery.isLoading ? (
          <ImportsSkeleton />
        ) : imports.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-4 py-10 text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-md bg-[#f1f5f0] text-[#6f7d75]">
                <FileSpreadsheet className="size-6" />
              </div>
              <h4 className="mt-4 text-sm font-black text-[#223137]">
                Импортов пока нет
              </h4>
              <p className="mt-1 text-sm text-[#7b857f]">
                После первой загрузки она появится в журнале.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 sm:hidden">
              {imports.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-[#e3e9e2] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#223137]">
                        {item.attachmentName}
                      </p>
                      <p className="mt-1 text-xs text-[#7b857f]">
                        {formatDate(item.sourceCreatedAt || item.createdAt)}
                      </p>
                    </div>
                    <ImportStatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-[#f7f9f6] p-3">
                      <p className="text-[10px] font-black uppercase text-[#8a938e]">
                        Строк
                      </p>
                      <p className="mt-1 text-lg font-black tabular-nums text-[#223137]">
                        {numberFormatter.format(item.rowsTotal)}
                      </p>
                    </div>
                    <div className="rounded-md bg-[#f7f9f6] p-3">
                      <p className="text-[10px] font-black uppercase text-[#8a938e]">
                        Источник
                      </p>
                      <p className="mt-1 truncate text-sm font-black text-[#223137]">
                        {item.sender ? "Почта" : "Вручную"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <MatchProgress item={item} />
                  </div>
                  {item.errorMessage ? (
                    <p className="mt-3 rounded-md bg-[#fff0ed] p-2.5 text-xs font-semibold text-[#a9412d]">
                      {item.errorMessage}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="crm-scrollbar hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[980px]">
                <thead className="bg-[#f7f9f6]">
                  <tr className="border-b border-[#e5ebe4]">
                    <th className="h-11 px-5 text-left text-[11px] font-black uppercase text-[#7b857f]">
                      Файл и источник
                    </th>
                    <th className="h-11 px-4 text-left text-[11px] font-black uppercase text-[#7b857f]">
                      Дата данных
                    </th>
                    <th className="h-11 px-4 text-left text-[11px] font-black uppercase text-[#7b857f]">
                      Строк
                    </th>
                    <th className="h-11 px-4 text-left text-[11px] font-black uppercase text-[#7b857f]">
                      Сопоставление
                    </th>
                    <th className="h-11 px-5 text-right text-[11px] font-black uppercase text-[#7b857f]">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#edf1ec] align-middle transition-colors hover:bg-[#fbfcfa]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex min-w-[260px] items-center gap-3">
                          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[#fff2e2] text-[#e77808]">
                            <FileSpreadsheet className="size-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[320px] truncate text-sm font-black text-[#223137]">
                              {item.attachmentName}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-[#7b857f]">
                              {item.sender ? <MailCheck className="size-3.5" /> : <UploadCloud className="size-3.5" />}
                              <span className="max-w-[280px] truncate">
                                {item.sender || "Ручная загрузка"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-sm font-bold text-[#3f4d46]">
                          {formatDate(item.sourceCreatedAt || item.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-[#8a938e]">
                          загружен {formatDate(item.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-lg font-black tabular-nums text-[#223137]">
                          {numberFormatter.format(item.rowsTotal)}
                        </p>
                        <p className="mt-0.5 text-xs text-[#8a938e]">вагонов в файле</p>
                      </td>
                      <td className="px-4 py-4">
                        <MatchProgress item={item} />
                        {item.errorMessage ? (
                          <p className="mt-2 max-w-[280px] text-xs font-semibold text-[#b9472d]">
                            {item.errorMessage}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <ImportStatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
