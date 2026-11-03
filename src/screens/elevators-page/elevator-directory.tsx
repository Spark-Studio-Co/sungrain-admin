"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WorkspaceHeading } from "@/components/ui/workspace-heading";
import { CrmEmptyState, CrmErrorState } from "@/components/ui/crm-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Elevator } from "@/entities/calculator/api";
import "./elevator-directory.css";

export type ElevatorStatusFilter = "all" | "active" | "archived";

const servicePlural = new Intl.PluralRules("ru");
const serviceNouns: Record<string, string> = {
  one: "услуга",
  few: "услуги",
  many: "услуг",
};
const activeServices = (item: Elevator) =>
  item.services.filter((service) => !service.archived && !service.deletedAt)
    .length;

export function filterElevators(
  items: Elevator[],
  search: string,
  status: ElevatorStatusFilter,
) {
  const terms = search
    .trim()
    .toLocaleLowerCase("ru")
    .split(/\s+/)
    .filter(Boolean);
  return items.filter((item) => {
    if (status === "active" && item.archived) return false;
    if (status === "archived" && !item.archived) return false;
    const text =
      `${item.name} ${item.station} ${item.contact}`.toLocaleLowerCase("ru");
    return terms.every((term) => text.includes(term));
  });
}

export function elevatorPhoneLink(contact: string) {
  const phone = contact.trim();
  if (!/^[+\d\s()-]+$/.test(phone)) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15
    ? `tel:${phone.startsWith("+") ? "+" : ""}${digits}`
    : undefined;
}

export function ElevatorDirectory({
  elevators: cachedElevators,
  isLoading = false,
  isError = false,
  onRetry,
  onAdd,
}: {
  elevators?: Elevator[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry: () => void;
  onAdd: (trigger: HTMLButtonElement) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ElevatorStatusFilter>("all");
  const input = useRef<HTMLInputElement>(null);
  const elevators = cachedElevators ?? [];
  const activeCount = elevators.filter((item) => !item.archived).length;
  const stationCount = new Set(
    elevators
      .map((item) => item.station.trim().toLocaleLowerCase("ru"))
      .filter(Boolean),
  ).size;
  const serviceCount = elevators
    .filter((item) => !item.archived)
    .reduce((total, item) => total + activeServices(item), 0);
  const filtered = filterElevators(elevators, search, status);
  const hasFilters = !!search.trim() || status !== "all";
  const initialError = isError && !cachedElevators;
  const unavailable = isLoading || initialError;
  function clearFilters() {
    setSearch("");
    setStatus("all");
    input.current?.focus();
  }
  return (
    <section className="elevator-directory" aria-label="Справочник элеваторов">
      <WorkspaceHeading
        icon={Warehouse}
        eyebrow="Логистика и хранение"
        title={
          <>
            Элеваторы
            {!unavailable && (
              <span
                className="elevator-directory-total"
                aria-label={`Всего элеваторов: ${elevators.length}`}
              >
                {elevators.length}
              </span>
            )}
          </>
        }
        description={
          !unavailable && (
            <dl className="elevator-directory-summary">
              <div>
                <dt>
                  <MapPin size={14} aria-hidden="true" />
                  Станции
                </dt>
                <dd>{stationCount}</dd>
              </div>
              <div>
                <dt>
                  <ReceiptText size={14} aria-hidden="true" />
                  Активные услуги
                </dt>
                <dd>{serviceCount}</dd>
              </div>
            </dl>
          )
        }
        actions={
          <Button
            className="trade-primary"
            onClick={(event) => onAdd(event.currentTarget)}
          >
            <Plus size={16} aria-hidden="true" />
            Добавить элеватор
          </Button>
        }
      />

      <div className="elevator-directory-register">
        <div className="elevator-directory-toolbar">
          <ToggleGroup
            type="single"
            value={status}
            onValueChange={(value) => {
              if (value) setStatus(value as ElevatorStatusFilter);
            }}
            aria-label="Статус элеватора"
            className="elevator-directory-filters"
            disabled={unavailable}
          >
            {(
              [
                ["all", "Все", elevators.length],
                ["active", "Действующие", activeCount],
                ["archived", "Архив", elevators.length - activeCount],
              ] as const
            ).map(([value, label, count]) => (
              <ToggleGroupItem key={value} value={value} aria-label={label}>
                {label}
                <span aria-hidden="true">{unavailable ? "—" : count}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="elevator-directory-search">
            <Search size={18} aria-hidden="true" />
            <Input
              ref={input}
              aria-label="Поиск элеватора"
              placeholder="Поиск элеватора"
              value={search}
              disabled={unavailable}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Очистить поиск"
                title="Очистить поиск"
                onClick={() => {
                  setSearch("");
                  input.current?.focus();
                }}
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div
            className="elevator-directory-loading"
            role="status"
            aria-label="Загрузка элеваторов"
            aria-busy="true"
          >
            <span className="sr-only">Загрузка элеваторов</span>
            <div aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <div key={row} className="elevator-directory-loading-row">
                  <Skeleton className="size-10 shrink-0" />
                  <Skeleton className="h-4 w-2/5 max-w-72" />
                  <Skeleton className="ml-auto h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : initialError ? (
          <div role="alert">
            <CrmErrorState
              title="Не удалось загрузить элеваторы"
              action={
                <Button variant="outline" onClick={onRetry}>
                  Повторить
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {isError && (
              <div className="elevator-directory-stale" role="alert">
                <span>
                  Не удалось обновить список. Показаны последние загруженные
                  данные.
                </span>
                <Button variant="outline" size="sm" onClick={onRetry}>
                  Повторить
                </Button>
              </div>
            )}
            <div
              className={hasFilters ? "elevator-directory-results" : "sr-only"}
              role="status"
            >
              <span>
                {hasFilters
                  ? `Найдено: ${filtered.length} из ${elevators.length}`
                  : `Загружено элеваторов: ${elevators.length}`}
              </span>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X size={14} aria-hidden="true" />
                  Сбросить фильтры
                </Button>
              )}
            </div>
            {filtered.length ? (
              <div className="trade-table-wrap elevator-directory-table-wrap">
                <table
                  className="trade-table trade-responsive-table elevator-directory-table"
                  aria-label="Элеваторы"
                >
                  <thead>
                    <tr>
                      <th scope="col">Элеватор</th>
                      <th scope="col">Станция</th>
                      <th scope="col" className="elevator-directory-services">
                        Услуги
                      </th>
                      <th scope="col">Контакты</th>
                      <th scope="col">Статус</th>
                      <th scope="col">
                        <span className="sr-only">Открыть карточку</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const count = activeServices(item);
                      const phone = elevatorPhoneLink(item.contact);
                      return (
                        <tr
                          key={item.id}
                          className={item.archived ? "is-archived" : undefined}
                        >
                          <td className="elevator-directory-name">
                            <div className="record-table-title">
                              <span
                                className="record-row-icon"
                                aria-hidden="true"
                              >
                                <Warehouse size={19} />
                              </span>
                              <Link href={`/admin/elevators/${item.id}`}>
                                {item.name}
                              </Link>
                            </div>
                          </td>
                          <td data-label="Станция">
                            <span className="elevator-directory-meta">
                              <MapPin size={15} aria-hidden="true" />
                              {item.station || (
                                <span className="elevator-directory-missing">
                                  Не указана
                                </span>
                              )}
                            </span>
                          </td>
                          <td
                            data-label="Услуги"
                            className="elevator-directory-services"
                          >
                            <span
                              className={`elevator-directory-service-count${count ? "" : " is-empty"}`}
                              data-count={count}
                            >
                              {count ? (
                                <>
                                  <strong>{count}</strong>
                                  <span>
                                    {serviceNouns[
                                      servicePlural.select(count)
                                    ] || "услуг"}
                                  </span>
                                </>
                              ) : (
                                "Нет услуг"
                              )}
                            </span>
                          </td>
                          <td data-label="Контакты">
                            <span className="elevator-directory-meta">
                              <Phone size={15} aria-hidden="true" />
                              {phone ? (
                                <a href={phone}>{item.contact}</a>
                              ) : (
                                item.contact || (
                                  <span className="elevator-directory-missing">
                                    Не указаны
                                  </span>
                                )
                              )}
                            </span>
                          </td>
                          <td data-label="Статус">
                            <span
                              className={`trade-tag${item.archived ? " trade-tag-muted" : ""}`}
                            >
                              <span
                                className="elevator-directory-status-dot"
                                aria-hidden="true"
                              />
                              {item.archived ? "В архиве" : "Действующий"}
                            </span>
                          </td>
                          <td className="elevator-directory-open">
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                href={`/admin/elevators/${item.id}`}
                                aria-label={`Открыть элеватор: ${item.name}`}
                                title="Открыть карточку"
                              >
                                <ArrowRight size={18} aria-hidden="true" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <CrmEmptyState
                icon={hasFilters ? Search : Warehouse}
                title={
                  hasFilters
                    ? "Элеваторы не найдены"
                    : "Элеваторы пока не добавлены"
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Сбросить фильтры
                    </Button>
                  ) : undefined
                }
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
