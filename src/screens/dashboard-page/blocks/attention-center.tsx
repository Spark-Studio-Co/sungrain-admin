"use client";

import {
  AlertCircle,
  ArrowRight,
  Clock,
  DollarSign,
  FileText,
  Package,
  Train,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAttentionCenter } from "@/entities/contracts/hooks/query/use-get-attention-center.query";
import type { AttentionItem } from "@/entities/contracts/api/get/get-attention-center.api";
import { cn } from "@/lib/utils";

const icons = {
  stale_dislocations: Clock,
  idle_wagons: Train,
  applications_without_documents: FileText,
  invoices_with_balance: DollarSign,
  unmatched_wagons: AlertCircle,
  volume_exceeded: Package,
};

const severityStyles = {
  ok: {
    border: "border-[#dce8dc]",
    badge: "bg-[#eef5ef] text-[#2f6b4f]",
    icon: "bg-[#eef5ef] text-[#2f6b4f]",
  },
  warning: {
    border: "border-[#f1dfc7]",
    badge: "bg-[#fff3e5] text-[#c96b08]",
    icon: "bg-[#fff3e5] text-[#d5740b]",
  },
  danger: {
    border: "border-[#efd5cf]",
    badge: "bg-[#fff1ed] text-[#b9472d]",
    icon: "bg-[#fff1ed] text-[#b9472d]",
  },
};

const formatTotals = (item: AttentionItem) =>
  Object.entries(item.totals || {})
    .map(
      ([currency, value]) =>
        `${Number(value).toLocaleString("ru-RU", {
          maximumFractionDigits: 2,
        })} ${currency}`,
    )
    .join(" · ");

export const AttentionCenter = () => {
  const { data, isLoading, isError } = useGetAttentionCenter();

  return (
    <section className="overflow-hidden rounded-md border border-[#dfe7de] bg-white shadow-[0_14px_36px_rgba(34,49,55,0.06)]">
      <div className="flex flex-col gap-3 border-b border-[#e8ede7] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-black text-[#223137]">
                Центр внимания
              </h2>
              <p className="text-xs text-[#7b857f]">
                Сигналы, которые требуют проверки сегодня
              </p>
            </div>
          </div>
        </div>
        {!isLoading && data?.summary ? (
          <div className="flex items-center gap-2 text-xs font-bold text-[#607069]">
            <span className="rounded-md bg-[#f5f7f4] px-2.5 py-1.5">
              {data.summary.total} сигналов
            </span>
            <span className="rounded-md bg-[#f5f7f4] px-2.5 py-1.5">
              {data.summary.affectedContracts} договоров
            </span>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[148px] rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <div className="px-5 py-8 text-center text-sm font-semibold text-[#b9472d]">
          Не удалось загрузить оперативные сигналы
        </div>
      ) : (
        <div className="grid gap-2.5 p-3 sm:grid-cols-2 xl:grid-cols-3">
          {data?.items.map((item) => {
            const Icon = icons[item.key as keyof typeof icons] || AlertCircle;
            const styles = severityStyles[item.severity];
            const totals = formatTotals(item);

            return (
              <article
                key={item.key}
                className={cn(
                  "group flex min-h-[148px] flex-col rounded-md border bg-[#fcfdfb] p-3.5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(34,49,55,0.08)]",
                  styles.border,
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md",
                        styles.icon,
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-[#223137]">
                        {item.title}
                      </h3>
                      <p className="truncate text-[11px] text-[#7b857f]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "flex min-w-8 items-center justify-center rounded-md px-2 py-1 text-sm font-black",
                      styles.badge,
                    )}
                  >
                    {item.count}
                  </span>
                </div>

                <div className="mt-3 min-h-10 space-y-1">
                  {totals ? (
                    <p className="truncate text-xs font-black text-[#c96b08]">
                      {totals}
                    </p>
                  ) : null}
                  {item.preview.slice(0, 2).map((preview) => (
                    <Link
                      key={`${item.key}-${preview.id}`}
                      to={preview.href}
                      className="flex items-center justify-between gap-2 text-xs text-[#53605a] hover:text-[#2f6b4f]"
                    >
                      <span className="truncate font-bold">
                        {preview.label}
                      </span>
                      <span className="max-w-[46%] truncate text-[11px] text-[#8a948f]">
                        {preview.meta}
                      </span>
                    </Link>
                  ))}
                  {item.count === 0 ? (
                    <p className="text-xs font-semibold text-[#2f6b4f]">
                      Все в порядке
                    </p>
                  ) : null}
                </div>

                <Link
                  to={item.href}
                  className="mt-auto inline-flex items-center gap-1 text-xs font-black text-[#53605a] transition group-hover:text-[#d5740b]"
                >
                  Открыть
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
