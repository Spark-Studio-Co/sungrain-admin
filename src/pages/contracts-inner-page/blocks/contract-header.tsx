"use client";

import {
  Coins,
  Download,
  FileText,
  Package,
  ShieldCheck,
  TrainFront,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  MapPin,
  User,
  RefreshCw,
  Train,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { formatNumber } from "@/lib/utils";

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
    } catch (e) {
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

  const file = contractData?.files?.[0];
  let fileUrl: string = "";

  if (file) {
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
  }

  return (
    <Card>
      <CardHeader className="pb-4 px-3 sm:px-6 sm:pb-2">
        <div className="flex flex-col gap-4 sm:gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2.5 sm:p-2 bg-primary/10 rounded-full flex-shrink-0">
                <FileText className="h-6 w-6 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-xl truncate leading-tight">
                  {contractData?.name}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2 text-sm sm:text-sm">
                  <Package className="h-4 w-4 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{contractData?.crop}</span>
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-2 px-3 py-2 sm:px-3 sm:py-1 bg-primary/5 text-sm sm:text-sm flex-shrink-0 w-fit"
            >
              <ShieldCheck className="h-4 w-4 sm:h-4 sm:w-4 text-primary" />
              <span className="hidden sm:inline">
                УНК: {contractData?.unk || "Не указан"}
              </span>
              <span className="sm:hidden">
                УНК: {contractData?.unk || "Нет"}
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-3 sm:px-6 sm:pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-6 mb-6 sm:mb-6">
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <FileText className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                Название
              </p>
              <p className="font-medium text-base sm:text-base truncate">
                {contractData?.name}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <Building2 className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                Компания
              </p>
              <p className="text-base sm:text-base break-words">
                {contractData?.companyId
                  ? getCompanyName(contractData.companyId)
                  : contractData?.company?.name || "Не указана"}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <Calendar className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                Дата
              </p>
              <p className="text-base sm:text-base">
                {contractData?.date
                  ? formatDate(contractData.date)
                  : "Не указана"}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <TrainFront className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                <span className="hidden sm:inline">Грузоотправитель</span>
                <span className="sm:hidden">Отправитель</span>
              </p>
              <p className="text-base sm:text-base break-words">
                {contractData?.sender}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <User className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                <span className="hidden sm:inline">Грузополучатель</span>
                <span className="sm:hidden">Получатель</span>
              </p>
              <p className="text-base sm:text-base break-words">
                {contractData?.receiver}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <RefreshCw className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                <span className="hidden sm:inline">Последнее обновление</span>
                <span className="sm:hidden">Обновлено</span>
              </p>
              <p className="text-base sm:text-base">
                {contractData?.updated_at
                  ? formatDate(contractData.updated_at)
                  : "Не указана"}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <Train className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                <span className="hidden sm:inline">Станция отправления</span>
                <span className="sm:hidden">От станции</span>
              </p>
              <p className="text-base sm:text-base break-words">
                {contractData?.departure_station ||
                  contractData?.departureStation}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <MapPin className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                <span className="hidden sm:inline">Станция назначения</span>
                <span className="sm:hidden">До станции</span>
              </p>
              <p className="text-base sm:text-base break-words">
                {contractData?.destination_station ||
                  contractData?.destinationStation}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <Package className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                Объем
              </p>
              <p className="flex items-center text-base sm:text-base">
                <span className="font-medium">
                  {contractData?.total_volume || contractData?.totalVolume}
                </span>
                <span className="text-sm sm:text-sm text-muted-foreground ml-1">
                  <span className="hidden sm:inline">тонн</span>
                  <span className="sm:hidden">т</span>
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 sm:p-0 bg-gray-50/50 sm:bg-transparent rounded-lg sm:rounded-none">
            <Coins className="h-5 w-5 sm:h-5 sm:w-5 text-primary mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-sm font-medium text-muted-foreground mb-1">
                <span className="hidden sm:inline">
                  Ориентировочная стоимость
                </span>
                <span className="sm:hidden">Стоимость</span>
              </p>
              <p className="text-base sm:text-base">
                {formatNumber(contractData?.estimated_cost)}{" "}
                {contractData?.currency}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2 py-3 sm:py-2 text-base sm:text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => {
              handleOpenFile();
            }}
            disabled={!contractData?.files || contractData.files.length === 0}
          >
            <Download className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Скачать договор</span>
            <span className="sm:hidden">Скачать</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
