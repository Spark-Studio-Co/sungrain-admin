"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Plus,
  RotateCcw,
  Search,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPurchases,
  PURCHASES_KEY,
  type PurchaseFilters,
} from "@/entities/procurement/api/purchases.api";
import {
  formatMoney,
  formatQuantity,
  VAT_LABELS,
} from "@/entities/procurement/model/purchase-calculation";
import { shouldUseMockApi } from "@/shared/api/mock-api";
import FarmerRegistry from "./procurement-page";
import "./purchases.css";

export function PurchaseError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="py-12 text-center">
      <p className="mb-3 font-semibold">Не удалось загрузить данные закупок</p>
      <Button variant="outline" onClick={retry}>
        <RotateCcw className="size-4" />
        Повторить
      </Button>
    </div>
  );
}

export default function PurchasesPage() {
  const params = useSearchParams();
  const farmers = params.get("tab") === "farmers";
  const [filters, setFilters] = useState<PurchaseFilters>({ page: 1 });
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((current) => ({ ...current, search, page: 1 })),
      250,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const invalidDates = !!(
    filters.from &&
    filters.to &&
    filters.from > filters.to
  );
  const query = useQuery({
    queryKey: [...PURCHASES_KEY, filters],
    queryFn: () => getPurchases(filters),
    enabled: !farmers && !invalidDates,
  });
  const set = (key: keyof PurchaseFilters, value: string) =>
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
      page: 1,
    }));
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 20));

  return (
    <div className="purchase-workspace">
      <header className="purchase-heading">
        <div>
          <div className="flex items-center gap-3">
            <h1>Закуп</h1>
            {shouldUseMockApi() && <span className="purchase-demo">Демо</span>}
          </div>
          <p>Договоры закупки и фермерские хозяйства</p>
        </div>
        <Button asChild>
          <Link href="/admin/procurement/new">
            <Plus className="size-4" />
            Создать закупку
          </Link>
        </Button>
      </header>
      <nav className="purchase-tabs" aria-label="Разделы закупа">
        <Link
          href="/admin/procurement"
          aria-current={!farmers ? "page" : undefined}
        >
          <ShoppingBasket className="size-4" />
          Закупки
        </Link>
        <Link
          href="/admin/procurement?tab=farmers"
          aria-current={farmers ? "page" : undefined}
        >
          <Users className="size-4" />
          Хозяйства
        </Link>
      </nav>
      {farmers ? (
        <FarmerRegistry />
      ) : (
        <>
          <div className="purchase-filters">
            <label>
              <span>Поиск</span>
              <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder="Фермер или номер договора"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </label>
            <label>
              <span>Культура</span>
              <Select
                value={filters.culture || "all"}
                onValueChange={(value) =>
                  set("culture", value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все культуры" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все культуры</SelectItem>
                  {(
                    query.data?.cultures ||
                    (filters.culture ? [filters.culture] : [])
                  ).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label>
              <span>Дата от</span>
              <DatePickerInput
                value={filters.from || ""}
                onChange={(value) => set("from", value)}
                aria-label="Начало периода закупок"
              />
            </label>
            <label>
              <span>Дата до</span>
              <DatePickerInput
                value={filters.to || ""}
                onChange={(value) => set("to", value)}
                aria-label="Конец периода закупок"
              />
            </label>
            <Button
              variant="outline"
              size="icon"
              title="Сбросить фильтры"
              aria-label="Сбросить фильтры"
              onClick={() => {
                setSearch("");
                setFilters({ page: 1 });
              }}
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
          {invalidDates ? (
            <p role="alert" className="purchase-error">
              Дата начала не может быть позже даты окончания.
            </p>
          ) : query.isPending ? (
            <p role="status" className="py-12 text-center text-gray-500">
              Загружаем закупки…
            </p>
          ) : query.isError ? (
            <PurchaseError retry={() => query.refetch()} />
          ) : !query.data?.rows.length ? (
            <div className="purchase-empty">
              <ShoppingBasket className="size-8" />
              <h2>
                {filters.search || filters.culture || filters.from || filters.to
                  ? "Закупки не найдены"
                  : "Пока нет закупок"}
              </h2>
              <p>
                {filters.search || filters.culture || filters.from || filters.to
                  ? "Измените параметры поиска."
                  : "Создайте первый договор закупки."}
              </p>
              <Button asChild>
                <Link href="/admin/procurement/new">
                  <Plus className="size-4" />
                  Создать закупку
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="purchase-table-wrap">
                <table className="purchase-table">
                  <thead>
                    <tr>
                      <th>Договор / фермер</th>
                      <th>Культура</th>
                      <th className="text-right">Объём</th>
                      <th className="text-right">Цена / т</th>
                      <th>НДС</th>
                      <th className="text-right">К оплате</th>
                      <th>
                        <span className="sr-only">Открыть</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.rows.map((purchase) => (
                      <tr key={purchase.id}>
                        <td>
                          <Link
                            className="purchase-row-title"
                            href={`/admin/procurement/${purchase.id}`}
                          >
                            № {purchase.agreementNumber}
                          </Link>
                          <p>{purchase.farmerName}</p>
                          <small>
                            {purchase.agreementDate
                              .slice(0, 10)
                              .split("-")
                              .reverse()
                              .join(".")}
                            {purchase.document && (
                              <FileText
                                className="ml-2 inline size-3.5"
                                aria-label="Договор прикреплён"
                              />
                            )}
                          </small>
                        </td>
                        <td>{purchase.cultureName}</td>
                        <td className="text-right tabular-nums">
                          {formatQuantity(purchase.quantity)} т
                        </td>
                        <td className="text-right tabular-nums">
                          {formatMoney(purchase.unitPrice, purchase.currency)}
                        </td>
                        <td>
                          <span className="purchase-tax">
                            {purchase.vatMode === "NONE"
                              ? "Без НДС"
                              : `${purchase.vatRate}%`}
                          </span>
                          <small>
                            {purchase.vatMode !== "NONE" &&
                              VAT_LABELS[purchase.vatMode]}
                          </small>
                        </td>
                        <td className="text-right font-bold tabular-nums">
                          {formatMoney(purchase.totalAmount, purchase.currency)}
                        </td>
                        <td>
                          <Link
                            href={`/admin/procurement/${purchase.id}`}
                            title="Открыть закупку"
                            aria-label={`Открыть закупку ${purchase.agreementNumber}`}
                          >
                            <ArrowRight className="size-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="purchase-mobile-list">
                {query.data.rows.map((purchase) => (
                  <Link
                    key={purchase.id}
                    href={`/admin/procurement/${purchase.id}`}
                    className="purchase-mobile-row"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <strong>№ {purchase.agreementNumber}</strong>
                      <ArrowRight className="size-4 shrink-0" />
                    </div>
                    <p>{purchase.farmerName}</p>
                    <div className="text-sm text-gray-500">
                      {purchase.cultureName} ·{" "}
                      {formatQuantity(purchase.quantity)} т
                    </div>
                    <div className="mt-3 font-bold">
                      {formatMoney(purchase.totalAmount, purchase.currency)}
                    </div>
                    <small>
                      {VAT_LABELS[purchase.vatMode]}
                      {purchase.vatMode !== "NONE" && ` · ${purchase.vatRate}%`}
                    </small>
                  </Link>
                ))}
              </div>
              <footer className="purchase-pagination">
                <span>Всего: {query.data.total}</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Предыдущая страница"
                    title="Предыдущая страница"
                    disabled={filters.page === 1}
                    onClick={() =>
                      setFilters((value) => ({
                        ...value,
                        page: value.page - 1,
                      }))
                    }
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <span>
                    {filters.page} / {pages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Следующая страница"
                    title="Следующая страница"
                    disabled={filters.page >= pages}
                    onClick={() =>
                      setFilters((value) => ({
                        ...value,
                        page: value.page + 1,
                      }))
                    }
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </footer>
            </>
          )}
        </>
      )}
    </div>
  );
}
