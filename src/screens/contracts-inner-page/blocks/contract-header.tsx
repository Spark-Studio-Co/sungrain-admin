"use client";

import {
  ArrowRight,
  Building2,
  Calendar,
  Coins,
  Download,
  FileText,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Train,
  TrainFront,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { formatMoney, formatNumber } from "@/lib/utils";

interface ContractHeaderProps {
  contractData: any;
  getCompanyName: (companyId: number) => string;
  handleDownload: () => void;
}

export const ContractHeader = ({
  contractData,
  getCompanyName,
}: ContractHeaderProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch {
      return dateString;
    }
  };

  const handleOpenFile = () => {
    if (!contractData?.files || contractData.files.length === 0) return;

    const file = contractData.files[0];

    let fileUrl = "";

    if (typeof file === "string") {
      if (file.startsWith("http")) {
        fileUrl = file;
      } else {
        const backendUrl = "https://agro-pv-backend-production.up.railway.app";
        fileUrl = `${backendUrl}/uploads/${file}`;
      }
    } else if (file?.location) {
      fileUrl = file.location;
    } else if (file?.url) {
      fileUrl = file.url;
    }

    if (fileUrl) {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <Card className="sungrain-analytics-card overflow-hidden">
      <CardHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-4 py-4 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810] shadow-[0_10px_22px_rgba(243,136,16,0.14)]">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-[#dce8dc] bg-[#f5faf5] px-2.5 py-1 text-[#2f6b4f]"
                >
                  Контракт {contractData?.number || `#${contractData?.id}`}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#f2dfca] bg-[#fff3e5] px-2.5 py-1 text-[#d5740b]"
                >
                  <Package className="h-3.5 w-3.5" />
                  {contractData?.crop || "Культура не указана"}
                </Badge>
              </div>
              <CardTitle className="max-w-5xl text-2xl font-black tracking-tight text-[#223137] lg:text-3xl">
                {contractData?.name || "Без названия"}
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row xl:pt-1">
            <Badge
              variant="outline"
              className="h-10 justify-center gap-2 rounded-md border-[#dce8dc] bg-white px-3 text-sm font-bold text-[#223137] shadow-sm"
            >
              <ShieldCheck className="h-4 w-4 text-[#2f6b4f]" />
              УНК: {contractData?.unk || "Не указан"}
            </Badge>
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-md border-[#dce4da] bg-white font-bold text-[#223137] shadow-sm hover:bg-[#fff3e5] hover:text-[#d5740b]"
              onClick={handleOpenFile}
              disabled={!contractData?.files || contractData.files.length === 0}
            >
              <Download className="h-4 w-4" />
              Скачать договор
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="rounded-md border border-[#dfe7de] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                <Train className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase text-[#7b857f]">
                  Станция отправления
                </div>
                <div className="mt-1 truncate text-lg font-black text-[#223137]">
                  {contractData?.departure_station ||
                    contractData?.departureStation ||
                    "Не указана"}
                </div>
              </div>
            </div>
          </div>
          <div className="hidden size-11 items-center justify-center rounded-full border border-[#f2dfca] bg-[#fff3e5] text-[#f38810] lg:flex">
            <ArrowRight className="h-5 w-5" />
          </div>
          <div className="rounded-md border border-[#dfe7de] bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase text-[#7b857f]">
                  Станция назначения
                </div>
                <div className="mt-1 truncate text-lg font-black text-[#223137]">
                  {contractData?.destination_station ||
                    contractData?.destinationStation ||
                    "Не указана"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
              <Building2 className="h-4 w-4 text-[#2f6b4f]" />
              Компания
            </div>
            <div className="text-base font-black text-[#223137]">
              {contractData?.companyId
                ? getCompanyName(contractData.companyId)
                : contractData?.company?.name || "Не указана"}
            </div>
          </div>
          <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
              <Calendar className="h-4 w-4 text-[#f38810]" />
              Дата
            </div>
            <div className="text-base font-black text-[#223137]">
              {contractData?.date ? formatDate(contractData.date) : "Не указана"}
            </div>
          </div>
          <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
              <Package className="h-4 w-4 text-[#2f6b4f]" />
              Объем
            </div>
            <div className="text-base font-black text-[#223137]">
              {formatNumber(contractData?.total_volume || contractData?.totalVolume)} т
            </div>
          </div>
          <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
              <Coins className="h-4 w-4 text-[#f38810]" />
              Стоимость
            </div>
            <div className="text-base font-black text-[#223137]">
              {formatMoney(contractData?.estimated_cost, contractData?.currency)}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <div className="rounded-md border border-[#dfe7de] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
              <TrainFront className="h-4 w-4 text-[#f38810]" />
              Грузоотправитель
            </div>
            <div className="text-sm font-bold text-[#223137]">
              {contractData?.sender || "Не указан"}
            </div>
          </div>
          <div className="rounded-md border border-[#dfe7de] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
              <User className="h-4 w-4 text-[#2f6b4f]" />
              Грузополучатель
            </div>
            <div className="text-sm font-bold text-[#223137]">
              {contractData?.receiver || "Не указан"}
            </div>
          </div>
          <div className="rounded-md border border-[#dfe7de] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
              <RefreshCw className="h-4 w-4 text-[#7b857f]" />
              Последнее обновление
            </div>
            <div className="text-sm font-bold text-[#223137]">
              {contractData?.updated_at
                ? formatDate(contractData.updated_at)
                : "Не указана"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
