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
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{contractData?.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                {contractData?.crop}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="w-fit flex items-center gap-1 px-3 py-1 bg-primary/5"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>УНК: {contractData?.unk || "Не указан"}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Название
              </p>
              <p className="font-medium">{contractData?.name}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Building2 className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Компания
              </p>
              <p>
                {contractData?.companyId
                  ? getCompanyName(contractData.companyId)
                  : contractData?.company?.name || "Не указана"}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата</p>
              <p>
                {contractData?.date
                  ? formatDate(contractData.date)
                  : "Не указана"}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <TrainFront className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Грузоотправитель
              </p>
              <p>{contractData?.sender}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Грузополучатель
              </p>
              <p>{contractData?.receiver}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Последнее обновление
              </p>
              <p>
                {contractData?.updated_at
                  ? formatDate(contractData.updated_at)
                  : "Не указана"}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Train className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Станция отправления
              </p>
              <p>
                {contractData?.departure_station ||
                  contractData?.departureStation}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Станция назначения
              </p>
              <p>
                {contractData?.destination_station ||
                  contractData?.destinationStation}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Package className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Объем</p>
              <p className="flex items-center">
                <span className="font-medium">
                  {contractData?.total_volume || contractData?.totalVolume}
                </span>
                <span className="text-sm text-muted-foreground ml-1">тонн</span>
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Coins className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Ориентировачная стоимость
              </p>
              <p>
                {contractData?.estimated_cost?.toLocaleString("de-DE")}{" "}
                {contractData?.currency}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => {
              handleOpenFile();
            }}
            disabled={!contractData?.files || contractData.files.length === 0}
          >
            <Download className="h-4 w-4" />
            Скачать договор
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
