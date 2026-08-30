"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  LocateFixed,
  MapPinned,
  Maximize2,
  Minimize2,
  Navigation,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Search,
  TrainFront,
  X,
} from "lucide-react";
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
import type {
  DispatchMapWagon,
} from "@/entities/dispatch-map/api/dispatch-map.api";
import { useDispatchMap } from "@/entities/dispatch-map/hooks/use-dispatch-map";
import { cn } from "@/lib/utils";

const WagonMapCanvas = dynamic(
  () => import("./wagon-map-canvas").then((module) => module.WagonMapCanvas),
  { ssr: false },
);

const ALL_STATUSES = "__all__";

const statusTone: Record<string, string> = {
  en_route_to_loading: "bg-[#edf5f7] text-[#476d7e]",
  at_elevator: "bg-[#fff7dc] text-[#8c6814]",
  registered: "bg-[#eef2f6] text-[#52636c]",
  en_route_to_recipient: "bg-[#fff3e3] text-[#b45d08]",
};

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const formatDateTime = (value?: string | null) => {
  if (!value) return "Нет прогноза";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Нет прогноза"
    : dateTimeFormatter.format(date);
};

const formatIdle = (days: number) => {
  if (days < 1) return `${Math.max(0, Math.round(days * 24))} ч без движения`;
  return `${days.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} дн. без движения`;
};

const containsSearch = (wagon: DispatchMapWagon, search: string) => {
  if (!search) return true;
  const haystack = [
    wagon.number,
    wagon.owner,
    wagon.currentStation.name,
    wagon.destinationStation?.name,
    wagon.contract?.number,
    wagon.contract?.name,
    wagon.contract?.receiver,
    wagon.application?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
  return haystack.includes(search.toLocaleLowerCase());
};

function MapSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-[560px] flex-col bg-[#f4f7f3]">
      <Skeleton className="h-20 w-full rounded-none" />
      <Skeleton className="min-h-0 flex-1 rounded-none" />
    </div>
  );
}

function WagonRow({ wagon }: { wagon: DispatchMapWagon }) {
  const content = (
    <div className="group border-b border-[#e4ebe2] px-3.5 py-3 transition-colors last:border-b-0 hover:bg-[#f8faf7]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#223137]">Вагон {wagon.number}</span>
            <span
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-semibold",
                statusTone[wagon.status] || "bg-[#eef5ef] text-[#2f6b4f]",
              )}
            >
              {wagon.statusLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-[#6f7774]">
            {wagon.contract?.number || "Без контракта"}
            {wagon.application?.name ? ` · ${wagon.application.name}` : ""}
          </p>
        </div>
        {wagon.contract && (
          <ArrowRight className="mt-1 size-4 shrink-0 text-[#98a29e] transition-transform group-hover:translate-x-0.5" />
        )}
      </div>

      <div className="mt-2.5 flex items-start gap-2 text-xs text-[#65706c]">
        <Navigation className="mt-0.5 size-3.5 shrink-0 text-[#f38810]" />
        <div className="min-w-0">
          <p className="truncate font-medium text-[#33443f]">
            {wagon.currentStation.name} → {wagon.destinationStation?.name || "назначение не сопоставлено"}
          </p>
          <p className="mt-0.5">
            {wagon.estimatedArrivalAt
              ? `${wagon.etaSource === "reported" ? "Прогноз из файла" : "Расчётный прогноз"}: ${formatDateTime(wagon.estimatedArrivalAt)}`
              : "Прогноз появится после получения расстояния"}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
        <span className={cn("inline-flex items-center gap-1.5 font-semibold text-[#53625d]", wagon.isStalled && "text-[#b43b31]")}> 
          <Clock3 className="size-3.5" />
          {formatIdle(wagon.idleDays)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#53625d]">
          <LocateFixed className="size-3.5" />
          {wagon.distanceToDestinationKm != null
            ? `${wagon.distanceToDestinationKm.toLocaleString("ru-RU")} км`
            : "Расстояние неизвестно"}
        </span>
      </div>
    </div>
  );

  return wagon.contract ? (
    <Link href={`/admin/contracts/${wagon.contract.id}`}>{content}</Link>
  ) : (
    content
  );
}

export default function WagonMapPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDispatchMap();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUSES);
  const [stalledOnly, setStalledOnly] = useState(false);
  const [selectedStationKey, setSelectedStationKey] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [fitRequest, setFitRequest] = useState(0);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    setDetailsOpen(isDesktop);
    setFiltersOpen(isDesktop);
  }, []);

  useEffect(() => {
    if (!focusMode) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusMode]);

  const stations = useMemo(() => {
    if (!data) return [];
    return data.stations
      .map((station) => ({
        ...station,
        wagons: station.wagons.filter(
          (wagon) =>
            containsSearch(wagon, search.trim()) &&
            (status === ALL_STATUSES || wagon.status === status) &&
            (!stalledOnly || wagon.isStalled),
        ),
      }))
      .filter((station) => station.wagons.length > 0)
      .map((station) => ({
        ...station,
        staleCount: station.wagons.filter((wagon) => wagon.isStale).length,
        stalledCount: station.wagons.filter((wagon) => wagon.isStalled).length,
      }));
  }, [data, search, status, stalledOnly]);

  useEffect(() => {
    if (!stations.length) {
      setSelectedStationKey(null);
      return;
    }
    if (!stations.some((station) => station.key === selectedStationKey)) {
      setSelectedStationKey(stations[0].key);
    }
  }, [selectedStationKey, stations]);

  if (isLoading) return <MapSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex min-h-[520px] items-center justify-center bg-[#f7f9f6] p-5">
        <div className="max-w-md border border-[#ead3cf] bg-white p-7 text-center shadow-sm">
          <AlertTriangle className="mx-auto size-8 text-[#c24135]" />
          <h2 className="mt-4 text-xl font-semibold text-[#223137]">Карта временно недоступна</h2>
          <p className="mt-2 text-sm text-[#6f7774]">Не удалось получить последние дислокации вагонов.</p>
          <Button className="mt-5 bg-[#f38810] text-white hover:bg-[#d6730c]" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  const selectedStation =
    stations.find((station) => station.key === selectedStationKey) || null;
  const visibleWagons = stations.reduce(
    (total, station) => total + station.wagons.length,
    0,
  );

  const clearFilters = () => {
    setSearch("");
    setStatus(ALL_STATUSES);
    setStalledOnly(false);
  };

  const activeFilterCount =
    Number(Boolean(search.trim())) +
    Number(status !== ALL_STATUSES) +
    Number(stalledOnly);

  const selectStation = (key: string) => {
    setSelectedStationKey(key);
    setDetailsOpen(true);
  };

  return (
    <div
      className={cn(
        "flex h-[calc(100dvh-4rem)] min-h-[560px] w-full flex-col overflow-hidden bg-[#edf2ec]",
        focusMode && "fixed inset-0 z-[90] h-dvh min-h-0",
      )}
    >
      <div className="relative z-30 border-b border-[#dce5da] bg-white/96 px-3 py-2.5 shadow-sm backdrop-blur-xl sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
              <MapPinned className="size-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-semibold text-[#223137] sm:text-lg">Диспетчерская карта</h2>
                {isFetching && <RefreshCw className="size-3.5 animate-spin text-[#7f8a86]" />}
              </div>
              <p className="hidden truncate text-xs text-[#6f7774] sm:block">
                Текущие станции, простой и направление движения
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              title={statsOpen ? "Скрыть показатели" : "Показать показатели"}
              aria-label={statsOpen ? "Скрыть показатели" : "Показать показатели"}
              onClick={() => setStatsOpen((value) => !value)}
              className="size-9 bg-white"
            >
              {statsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title="Обновить данные"
              aria-label="Обновить данные"
              onClick={() => refetch()}
              className="size-9 bg-white"
            >
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              title={focusMode ? "Выйти из режима карты" : "Развернуть карту"}
              aria-label={focusMode ? "Выйти из режима карты" : "Развернуть карту"}
              onClick={() => setFocusMode((value) => !value)}
              className="size-9 bg-white"
            >
              {focusMode ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </div>
        </div>

        {statsOpen && (
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:ml-auto sm:grid-cols-4 sm:max-w-[620px]">
            {[
              { label: "Активные", value: data.stats.activeWagons, Icon: TrainFront },
              { label: "На карте", value: data.stats.mappedWagons, Icon: LocateFixed },
              { label: "Простой", value: data.stats.stalledWagons, Icon: Clock3 },
              { label: "До 48 часов", value: data.stats.arrivingSoon, Icon: Navigation },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="flex min-w-0 items-center gap-2 rounded-md border border-[#e0e8de] bg-[#f9fbf8] px-2.5 py-1.5">
                <Icon className="size-3.5 shrink-0 text-[#4d7c5d]" />
                <div className="min-w-0">
                  <p className="truncate text-[9px] font-semibold uppercase text-[#7a8581]">{label}</p>
                  <p className="text-sm font-bold leading-4 text-[#223137]">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <WagonMapCanvas
          stations={stations}
          selectedStationKey={selectedStationKey}
          onSelectStation={selectStation}
          detailsOpen={detailsOpen}
          fitRequest={fitRequest}
        />

        <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            title={filtersOpen ? "Скрыть фильтры" : "Показать фильтры"}
            aria-label={filtersOpen ? "Скрыть фильтры" : "Показать фильтры"}
            aria-pressed={filtersOpen}
            onClick={() => setFiltersOpen((value) => !value)}
            className={cn(
              "h-10 border-white bg-white px-3 shadow-[0_10px_28px_rgba(22,45,38,0.18)] hover:bg-[#f8faf7]",
              filtersOpen && "border-[#bfd3c3] text-[#2f6b4f]",
            )}
          >
            <Filter className="size-4" />
            <span className="hidden sm:inline">Фильтры</span>
            {activeFilterCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-[#f38810] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Показать все точки"
            aria-label="Показать все точки"
            onClick={() => setFitRequest((value) => value + 1)}
            className="size-10 border-white bg-white shadow-[0_10px_28px_rgba(22,45,38,0.18)] hover:bg-[#f8faf7]"
          >
            <LocateFixed className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title={detailsOpen ? "Скрыть список вагонов" : "Показать список вагонов"}
            aria-label={detailsOpen ? "Скрыть список вагонов" : "Показать список вагонов"}
            onClick={() => setDetailsOpen((value) => !value)}
            className="size-10 border-white bg-white shadow-[0_10px_28px_rgba(22,45,38,0.18)] hover:bg-[#f8faf7]"
          >
            {detailsOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          </Button>
        </div>

        {filtersOpen && (
          <div
            className={cn(
              "absolute left-3 right-3 top-16 z-20 rounded-md border border-white/80 bg-white/96 p-2.5 shadow-[0_16px_38px_rgba(22,45,38,0.2)] backdrop-blur-xl md:right-auto md:grid md:grid-cols-[minmax(250px,1fr)_190px_auto_auto] md:gap-2",
              detailsOpen
                ? "md:w-[min(700px,calc(100%-410px))]"
                : "md:w-[min(760px,calc(100%-24px))]",
            )}
          >
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#87918d]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Вагон, станция, контракт, получатель"
                className="h-10 rounded-md bg-white pl-10 pr-9 shadow-none"
              />
              {search && (
                <button type="button" aria-label="Очистить поиск" onClick={() => setSearch("")} className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#74807b] hover:bg-[#f0f4ef]">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-2 h-10 w-full rounded-md bg-white md:mt-0">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>Все статусы</SelectItem>
                <SelectItem value="en_route_to_loading">В пути под погрузку</SelectItem>
                <SelectItem value="at_elevator">На элеваторе</SelectItem>
                <SelectItem value="registered">Оформлен</SelectItem>
                <SelectItem value="en_route_to_recipient">Следует к получателю</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStalledOnly((value) => !value)}
              className={cn(
                "mt-2 h-10 bg-white px-3 md:mt-0",
                stalledOnly && "border-[#c24135] bg-[#fff0ee] text-[#b43b31]",
              )}
            >
              <Clock3 className="size-4" />
              Простой
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Сбросить фильтры"
              aria-label="Сбросить фильтры"
              disabled={activeFilterCount === 0}
              onClick={clearFilters}
              className="mt-2 size-10 md:mt-0"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>
        )}

        {!stations.length && (
          <div className="absolute left-1/2 top-1/2 z-10 w-[min(360px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-md border border-[#dfe7de] bg-white/96 p-5 text-center shadow-xl backdrop-blur-xl">
            <MapPinned className="mx-auto size-7 text-[#87918d]" />
            <p className="mt-3 font-semibold text-[#223137]">По фильтрам ничего не найдено</p>
            <Button variant="outline" className="mt-4" onClick={clearFilters}>Сбросить фильтры</Button>
          </div>
        )}

        {detailsOpen && (
          <aside className="animate-in fade-in slide-in-from-right-3 absolute bottom-3 left-3 right-3 z-20 flex max-h-[56%] flex-col overflow-hidden rounded-md border border-[#dfe7de] bg-white/96 shadow-[0_22px_60px_rgba(17,41,34,0.24)] backdrop-blur-xl duration-200 md:bottom-3 md:left-auto md:right-3 md:top-3 md:max-h-none md:w-[370px]">
            {selectedStation ? (
              <>
                <div className="border-b border-[#e2e9e0] px-3.5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase text-[#7a8581]">Текущая станция</p>
                      <h3 className="mt-0.5 truncate text-lg font-semibold text-[#223137]">{selectedStation.name}</h3>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-md bg-[#eef5ef] px-2 py-1 text-xs font-bold text-[#2f6b4f]">
                        {selectedStation.wagons.length} ваг.
                      </span>
                      <button
                        type="button"
                        title="Закрыть список"
                        aria-label="Закрыть список вагонов"
                        onClick={() => setDetailsOpen(false)}
                        className="flex size-8 items-center justify-center rounded-md border border-[#e0e8de] text-[#68736f] transition-colors hover:bg-[#f1f5f0]"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-md bg-[#f2f6f1] px-2 py-1 text-[#53625d]">На карте: {visibleWagons}</span>
                    {selectedStation.stalledCount > 0 && (
                      <span className="rounded-md bg-[#fff0ee] px-2 py-1 font-medium text-[#b43b31]">
                        Простой: {selectedStation.stalledCount}
                      </span>
                    )}
                    {selectedStation.staleCount > 0 && (
                      <span className="rounded-md bg-[#fff7dc] px-2 py-1 font-medium text-[#8c6814]">
                        Устарели: {selectedStation.staleCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="crm-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {selectedStation.wagons.map((wagon) => (
                    <WagonRow key={wagon.id} wagon={wagon} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-40 flex-col items-center justify-center p-6 text-center">
                <MapPinned className="size-7 text-[#87918d]" />
                <p className="mt-3 font-semibold text-[#223137]">Выберите точку на карте</p>
              </div>
            )}

            {data.unresolvedStations.length > 0 && (
              <div className="border-t border-[#f0d6d1] bg-[#fff8f6] px-3.5 py-2.5 text-xs text-[#8f3b33]">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="size-4" />
                  Нужны координаты: {data.unresolvedStations.length}
                </div>
                <p className="mt-1 truncate text-[#9a655f]">
                  {data.unresolvedStations.map((station) => station.name).join(", ")}
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
