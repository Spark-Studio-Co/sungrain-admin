"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [selectedItem, setSelectedItem] = useState<AttentionItem | null>(null);
  const SelectedIcon = selectedItem
    ? icons[selectedItem.key as keyof typeof icons] || AlertCircle
    : AlertCircle;
  const selectedDetails = selectedItem
    ? selectedItem.details?.length
      ? selectedItem.details
      : selectedItem.preview
    : [];
  const selectedStyles = selectedItem
    ? severityStyles[selectedItem.severity]
    : severityStyles.ok;

  return (
    <>
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

                {item.count > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="mt-auto inline-flex w-fit items-center gap-1 text-xs font-black text-[#53605a] transition group-hover:text-[#d5740b]"
                  >
                    Показать все
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="mt-auto text-xs font-bold text-[#2f6b4f]">
                    Проверено
                  </span>
                )}
              </article>
            );
          })}
        </div>
      )}
      </section>

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="bottom-0 left-0 top-auto flex max-h-[86dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none rounded-t-xl border-x-0 border-b-0 bg-white p-0 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-[680px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md sm:border">
          {selectedItem ? (
            <>
              <DialogHeader className="shrink-0 border-b border-[#e5ece4] px-5 py-5 pr-14 text-left sm:px-6">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-md",
                      selectedStyles.icon,
                    )}
                  >
                    <SelectedIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="text-lg font-black leading-tight text-[#223137] sm:text-xl">
                      {selectedItem.title}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-xs text-[#7b857f] sm:text-sm">
                      {selectedItem.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex items-center justify-between gap-3 border-b border-[#edf1ec] bg-[#fafbf9] px-5 py-3 text-xs sm:px-6">
                <span className="font-bold text-[#607069]">
                  Найдено: {selectedItem.count}
                </span>
                {formatTotals(selectedItem) ? (
                  <span className="text-right font-black text-[#c96b08]">
                    {formatTotals(selectedItem)}
                  </span>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="space-y-2">
                  {selectedDetails.map((detail, index) => (
                    <Link
                      key={`${selectedItem.key}-${detail.id}-${index}`}
                      to={detail.href}
                      onClick={() => setSelectedItem(null)}
                      className="group/row grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-[#e3eae2] bg-white px-3.5 py-3 transition hover:border-[#f1c995] hover:bg-[#fffaf4]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#2b393d]">
                          {detail.label}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-[#7b857f]">
                          {detail.meta}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#9aa39e] transition group-hover/row:translate-x-0.5 group-hover/row:text-[#d5740b]" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="shrink-0 border-t border-[#e5ece4] bg-white px-4 py-3 sm:px-6">
                <Link
                  to={selectedItem.href}
                  onClick={() => setSelectedItem(null)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#f38810] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(243,136,16,0.18)] transition hover:bg-[#df7909]"
                >
                  Перейти в раздел
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
