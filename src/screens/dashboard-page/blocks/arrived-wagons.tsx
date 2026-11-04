"use client";

import { useState } from "react";
import { ArrowRight, Search, Train } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import type { AttentionItem } from "@/entities/contracts/api/get/get-attention-center.api";

const formatStatusDate = (value?: string | null) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Не указано";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Almaty",
  }).format(new Date(value));
};

export function ArrivedWagons({ item }: { item?: AttentionItem }) {
  const [search, setSearch] = useState("");
  const details = item?.details ?? item?.preview ?? [];
  const term = search.trim().toLocaleLowerCase("ru-RU");
  const filtered = details.filter((detail) =>
    [
      detail.label,
      detail.meta,
      detail.arrival?.clientName,
      detail.arrival?.receiver,
      ...(detail.arrival?.destinationStations ?? []),
    ].join(" ").toLocaleLowerCase("ru-RU").includes(term),
  );

  if (!item) {
    return (
      <p className="px-5 py-8 text-center text-sm text-[#7b857f]">
        Данные о прибывших вагонах пока недоступны.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3 px-4 pb-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-[#223137]">Прибывшие вагоны</h3>
          <p className="mt-1 text-xs leading-relaxed text-[#7b857f]">
            Статус «Клиент получил». Последние обновления — сверху.
          </p>
        </div>
        <div className="relative w-full sm:max-w-80">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8a948f]" />
          <Input
            aria-label="Поиск прибывших вагонов"
            placeholder="Вагон, клиент или договор"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      {filtered.length ? (
        <ul aria-label="Прибывшие вагоны" className="max-h-[440px] overflow-y-auto border-t border-[#e8ede7]">
          {filtered.map((detail) => {
            const arrival = detail.arrival;
            return (
              <li key={detail.id} className="border-b border-[#e8ede7] last:border-b-0">
                <Link
                  to={detail.href}
                  className="relative block px-4 py-4 pr-9 transition-colors hover:bg-[#f8faf7] focus-visible:bg-[#fffaf4] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#f38810] sm:px-5 sm:pr-10"
                >
                  <dl className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-4 text-xs lg:grid-cols-[1fr_1.5fr_1.2fr_1fr]">
                    <div className="min-w-0 [overflow-wrap:anywhere]">
                      <dt className="mb-1 text-[11px] text-[#7b857f]">Вагон / договор</dt>
                      <dd>
                        <span className="font-bold tabular-nums text-[#2f6b4f]">
                          {arrival?.wagonNumber || detail.label}
                        </span>
                        <span className="mt-1 block text-[#7b857f]">{arrival?.contractNumber}</span>
                      </dd>
                    </div>
                    <div className="min-w-0 [overflow-wrap:anywhere]">
                      <dt className="mb-1 text-[11px] text-[#7b857f]">Клиент</dt>
                      <dd className="font-semibold text-[#223137]">
                        {arrival?.clientName || arrival?.receiver || "Клиент не указан"}
                        {arrival?.clientName && arrival.receiver && arrival.receiver !== arrival.clientName ? (
                          <span className="mt-1 block font-normal text-[#7b857f]">Получатель: {arrival.receiver}</span>
                        ) : null}
                      </dd>
                    </div>
                    <div className="min-w-0 [overflow-wrap:anywhere]">
                      <dt className="mb-1 text-[11px] text-[#7b857f]">Станция назначения</dt>
                      <dd className="text-[#53605a]">{arrival?.destinationStations.join(", ") || "Не указана"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="mb-1 text-[11px] text-[#7b857f]">Статус обновлён · Алматы</dt>
                      <dd className="tabular-nums text-[#53605a]">
                        {arrival?.statusUpdatedAt ? (
                          <time dateTime={arrival.statusUpdatedAt}>{formatStatusDate(arrival.statusUpdatedAt)}</time>
                        ) : "Не указано"}
                      </dd>
                    </div>
                  </dl>
                  <ArrowRight aria-hidden="true" className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8a948f] sm:right-4" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 border-t border-[#e8ede7] px-5 py-9 text-center">
          <Train aria-hidden="true" className="mb-1 size-6 text-[#8a948f]" />
          <p className="text-sm font-semibold text-[#223137]">
            {term ? "Вагоны не найдены" : item.count ? "Подробности прибытия пока недоступны" : "Прибывших вагонов пока нет"}
          </p>
          <p className="text-xs text-[#7b857f]">
            {term ? "Измените номер вагона, клиента или договор." : "Здесь появятся вагоны со статусом «Клиент получил»."}
          </p>
        </div>
      )}
      <div className="border-t border-[#e8ede7] bg-[#f8faf7] px-4 py-3 text-xs text-[#7b857f] sm:px-5" role="status">
        Показано: {filtered.length} · Всего прибыло: {item.count}
      </div>
    </div>
  );
}
