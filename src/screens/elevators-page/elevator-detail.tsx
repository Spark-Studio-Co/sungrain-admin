"use client";

import Link from "next/link";
import {
  Archive,
  Calculator,
  CalendarDays,
  Clock3,
  History,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Receipt,
  RotateCcw,
  Warehouse,
  Wheat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrmEmptyState } from "@/components/ui/crm-state";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  applicableRate,
  dateText,
  moneyText,
  UNITS,
  type Elevator,
  type ElevatorService,
} from "@/entities/calculator/api";
import "./elevator-detail.css";

type ElevatorDetailProps = {
  elevator: Elevator;
  date: string;
  actionError: string;
  busyService?: string;
  onEdit: (trigger: HTMLButtonElement) => void;
  onAddService: (trigger: HTMLButtonElement) => void;
  onAddRate: (service: ElevatorService, trigger: HTMLButtonElement) => void;
  onHistory: (service: ElevatorService, trigger: HTMLButtonElement) => void;
  onArchive: (service: ElevatorService) => void;
};

export function ElevatorDetail({
  elevator,
  date,
  actionError,
  busyService,
  onEdit,
  onAddService,
  onAddRate,
  onHistory,
  onArchive,
}: ElevatorDetailProps) {
  return (
    <div className="elevator-detail">
      <header className="elevator-overview" aria-labelledby="elevator-name">
        <div className="elevator-overview-heading">
          <div className="elevator-identity">
            <span className="elevator-identity-icon" aria-hidden="true">
              <Warehouse size={24} />
            </span>
            <div className="min-w-0">
              <div className="elevator-badges">
                <Badge variant="outline" className="elevator-kind">
                  Элеватор
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    elevator.archived
                      ? "elevator-status is-archived"
                      : "elevator-status"
                  }
                >
                  <span aria-hidden="true" />
                  {elevator.archived ? "В архиве" : "Действующий"}
                </Badge>
              </div>
              <h1 id="elevator-name">{elevator.name}</h1>
            </div>
          </div>
          <div className="elevator-heading-actions">
            {!elevator.archived && (
              <Button variant="outline" asChild>
                <Link href={`/admin/calculator/new?elevator=${elevator.id}`}>
                  <Calculator size={16} />
                  Создать расчёт
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={(event) => onEdit(event.currentTarget)}
            >
              <Pencil size={16} />
              Редактировать
            </Button>
          </div>
        </div>
        <dl className="elevator-metadata">
          <div>
            <dt>
              <MapPin size={15} />
              Станция
            </dt>
            <dd>
              {elevator.station || (
                <span className="elevator-missing">Не указана</span>
              )}
            </dd>
          </div>
          <div>
            <dt>
              <Phone size={15} />
              Контакты
            </dt>
            <dd>
              {elevator.contact || (
                <span className="elevator-missing">Не указаны</span>
              )}
            </dd>
          </div>
          <div>
            <dt>
              <Warehouse size={15} />
              Адрес
            </dt>
            <dd>
              {elevator.address || (
                <span className="elevator-missing">Не указан</span>
              )}
            </dd>
          </div>
          {elevator.notes && (
            <div className="elevator-notes">
              <dt>
                <MessageSquare size={15} />
                Комментарий
              </dt>
              <dd>{elevator.notes}</dd>
            </div>
          )}
        </dl>
      </header>

      <section
        className="elevator-services"
        aria-labelledby="elevator-services-title"
      >
        <div className="elevator-services-heading">
          <div className="elevator-section-identity">
            <span className="elevator-section-icon" aria-hidden="true">
              <Receipt size={21} />
            </span>
            <div>
              <div className="elevator-services-title">
                <h2 id="elevator-services-title">Услуги и тарифы</h2>
                <Badge
                  variant="outline"
                  aria-label={`Услуг: ${elevator.services.length}`}
                >
                  {elevator.services.length}
                </Badge>
              </div>
              <p>
                <CalendarDays size={13} />
                Тарифы на <time dateTime={date}>{dateText(date)}</time>
              </p>
            </div>
          </div>
          <Button
            className="trade-primary"
            disabled={elevator.archived}
            onClick={(event) => onAddService(event.currentTarget)}
          >
            <Plus size={16} />
            Добавить услугу
          </Button>
        </div>
        {actionError && (
          <p role="alert" className="trade-alert">
            {actionError}
          </p>
        )}
        {elevator.services.length ? (
          <div className="elevator-service-table-wrap">
            <table className="elevator-service-table">
              <caption className="sr-only">
                Услуги, культуры и действующие тарифы элеватора {elevator.name}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Услуга</th>
                  <th scope="col">Культура</th>
                  <th scope="col">Единица</th>
                  <th scope="col" className="elevator-tariff-column">
                    Тариф, KZT
                  </th>
                  <th scope="col">
                    <span className="sr-only">Действия</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {elevator.services.map((service) => {
                  const rate = applicableRate(service, date);
                  const pending = busyService === service.id;
                  const cannotAddRate =
                    elevator.archived || service.archived || pending;
                  return (
                    <tr key={service.id}>
                      <td className="elevator-service-name-cell">
                        <div className="elevator-service-identity">
                          <span
                            className="elevator-service-icon"
                            aria-hidden="true"
                          >
                            <Receipt size={18} />
                          </span>
                          <div className="min-w-0">
                            <strong>{service.name}</strong>
                            {service.archived && (
                              <Badge
                                variant="outline"
                                className="elevator-archived-service"
                              >
                                В архиве
                              </Badge>
                            )}
                            {service.overtimeEligible && (
                              <span className="elevator-service-note">
                                <Clock3 size={12} />
                                Неурочное время ×1,5
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Культура">
                        <Badge
                          variant="outline"
                          className={
                            service.culture
                              ? "elevator-culture"
                              : "elevator-culture is-general"
                          }
                        >
                          <Wheat size={13} />
                          {service.culture || "Все культуры"}
                        </Badge>
                      </td>
                      <td data-label="Единица" className="elevator-unit">
                        {UNITS[service.unit]}
                      </td>
                      <td
                        data-label="Тариф, KZT"
                        className="elevator-tariff-cell"
                      >
                        {rate ? (
                          <>
                            <strong className="elevator-tariff">
                              {moneyText(rate.price)} <span>KZT</span>
                            </strong>
                            <time
                              className="elevator-rate-date"
                              dateTime={rate.effectiveFrom.slice(0, 10)}
                            >
                              с {dateText(rate.effectiveFrom)}
                            </time>
                          </>
                        ) : (
                          <span className="elevator-no-tariff">Нет тарифа</span>
                        )}
                      </td>
                      <td className="elevator-service-actions-cell">
                        <div className="elevator-service-actions">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="elevator-history-button"
                                aria-label={`История тарифов: ${service.name}`}
                                onClick={(event) =>
                                  onHistory(service, event.currentTarget)
                                }
                              >
                                <History size={16} />
                                <span>{service.rates.length}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>История тарифов</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="elevator-add-rate"
                                aria-label={`Новый тариф: ${service.name}`}
                                disabled={cannotAddRate}
                                onClick={(event) =>
                                  onAddRate(service, event.currentTarget)
                                }
                              >
                                <Plus size={16} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Новый тариф</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`${service.archived ? "Восстановить" : "Архивировать"}: ${service.name}`}
                                disabled={pending}
                                onClick={() => onArchive(service)}
                              >
                                {service.archived ? (
                                  <RotateCcw size={16} />
                                ) : (
                                  <Archive size={16} />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {service.archived
                                ? "Восстановить услугу"
                                : "Архивировать услугу"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <CrmEmptyState icon={Receipt} title="Услуги пока не добавлены" />
        )}
      </section>
    </div>
  );
}

export function ElevatorRateHistory({
  service,
  date,
}: {
  service: ElevatorService;
  date: string;
}) {
  const current = applicableRate(service, date);
  return (
    <div className="elevator-rate-history">
      <div className="elevator-history-context">
        <Badge variant="outline">
          <Wheat size={13} />
          {service.culture || "Все культуры"}
        </Badge>
        <span>{UNITS[service.unit]}</span>
      </div>
      {service.rates.length ? (
        <div className="elevator-history-table-wrap">
          <table>
            <caption className="sr-only">
              История тарифов услуги {service.name}
            </caption>
            <thead>
              <tr>
                <th scope="col">Действует с</th>
                <th scope="col">Тариф, KZT</th>
                <th scope="col">Статус</th>
              </tr>
            </thead>
            <tbody>
              {service.rates.map((rate) => (
                <tr
                  key={rate.id}
                  className={rate.id === current?.id ? "is-current" : undefined}
                >
                  <td data-label="Действует с">
                    <time dateTime={rate.effectiveFrom.slice(0, 10)}>
                      {dateText(rate.effectiveFrom)}
                    </time>
                  </td>
                  <td
                    data-label="Тариф, KZT"
                    className="elevator-history-price"
                  >
                    {moneyText(rate.price)}
                  </td>
                  <td>
                    <Badge
                      variant="outline"
                      className={
                        rate.id === current?.id ? "is-current" : undefined
                      }
                    >
                      {rate.id === current?.id
                        ? "Действует"
                        : rate.effectiveFrom.slice(0, 10) > date
                          ? "Запланирован"
                          : "Предыдущий"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <CrmEmptyState icon={History} title="Тарифы пока не добавлены" />
      )}
    </div>
  );
}
