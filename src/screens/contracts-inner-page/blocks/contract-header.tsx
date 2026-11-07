"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Download,
  FileText,
  MapPin,
  ShieldCheck,
  TrainFront,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getMainContractFile } from "@/entities/contracts/model/contract-documents";
import {
  getContractStationNames,
  formatContractMoney,
  resolveBackendFileUrl,
} from "@/shared/contracts/contract-ops";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Almaty",
});
const formatDate = (value?: string) => {
  if (!value) return "Не указана";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? dateFormatter.format(date)
    : "Не указана";
};

interface ContractHeaderProps {
  contractData: any;
  getCompanyName: (companyId: number) => string;
  isAdmin: boolean;
  status: { label: string; tone: string; badgeClassName?: string };
}

export const ContractHeader = ({
  contractData,
  getCompanyName,
  isAdmin,
  status,
}: ContractHeaderProps) => {
  const mainFileUrl = resolveBackendFileUrl(
    getMainContractFile(contractData?.files),
  );
  const departureStations = getContractStationNames(contractData, "departure");
  const destinationStations = getContractStationNames(
    contractData,
    "destination",
  );
  const companyName =
    contractData?.company?.name ||
    (contractData?.companyId
      ? getCompanyName(contractData.companyId)
      : "Компания не указана");
  const currency = contractData?.currency || "USD";

  return (
    <section
      aria-label="Сводка договора"
      className="overflow-hidden rounded-xl border border-[#244f3c] bg-[#193e30] text-white shadow-[0_12px_30px_rgba(25,62,48,0.12)]"
    >
      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={isAdmin ? "/admin/contracts" : "/contracts"}
            className="inline-flex items-center gap-2 rounded text-xs font-semibold text-[#c6d9cc] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <ArrowLeft className="size-3.5" />
            Все договоры
          </Link>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
              status.badgeClassName,
            )}
            title={status.tone}
          >
            {status.label}
          </span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#bed1c2]">
              <FileText className="size-3.5" />
              Договор № {contractData?.number || contractData?.id}
              <span className="mx-1 text-white/25">/</span>
              <span className="text-[#f7bb70]">
                {contractData?.crop || "Культура не указана"}
              </span>
            </div>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-white sm:text-[28px]">
              {contractData?.name || "Без названия"}
            </h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#c6d9cc]">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {companyName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDate(contractData?.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                УНК {contractData?.unk || "не указан"}
              </span>
              {contractData?.updated_at && (
                <span className="text-[#a9c5b3]">
                  Обновлён {formatDate(contractData.updated_at)}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
            <div className="sm:text-right">
              <div className="text-[11px] text-[#bed1c2]">
                Стоимость договора
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-white">
                {formatContractMoney(contractData?.estimated_cost, currency)}
              </div>
            </div>
            <Button
              variant="outline"
              className="h-9 gap-2 border-white/20 bg-white/10 text-xs text-white shadow-none hover:bg-white/20 hover:text-white"
              disabled={!mainFileUrl}
              onClick={() =>
                window.open(mainFileUrl, "_blank", "noopener,noreferrer")
              }
            >
              <Download className="size-3.5" />
              Скачать договор
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-3 border-t border-white/10 bg-black/10 px-4 py-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/5">
            <TrainFront className="size-4 text-[#b9d6c2]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#a9c5b3]">
              Станции отправления
            </div>
            <div className="mt-1 break-words text-sm font-bold">
              {departureStations.join(" · ") || "Не указаны"}
            </div>
            <div className="mt-0.5 break-words text-xs text-[#a9c5b3]">
              {contractData?.sender || "Грузоотправитель не указан"}
            </div>
          </div>
        </div>
        <ArrowRight className="hidden size-4 text-[#f7bb70] sm:block" />
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-[#e8b670]/20 bg-[#e8b670]/10">
            <MapPin className="size-4 text-[#f7bb70]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#a9c5b3]">
              Станции назначения
            </div>
            <div className="mt-1 break-words text-sm font-bold">
              {destinationStations.join(" · ") || "Не указаны"}
            </div>
            <div className="mt-0.5 break-words text-xs text-[#a9c5b3]">
              {contractData?.receiver || "Грузополучатель не указан"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
