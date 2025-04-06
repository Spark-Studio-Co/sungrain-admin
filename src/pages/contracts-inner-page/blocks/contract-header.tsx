"use client";

import { Download, FileText, Package, ShieldCheck } from "lucide-react";
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
  Truck,
  MapPin,
  User,
  RefreshCw,
  Train,
  DollarSign,
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
  handleDownload,
}: ContractHeaderProps) => {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Add download logic
  const handleDownloadFile = () => {
    if (!contractData?.files || contractData.files.length === 0) {
      console.error("No files available for download");
      return;
    }

    // Get the first file from the files array
    const file = contractData.files[0];

    // Determine the file URL based on the data structure
    let fileUrl;
    if (typeof file === "string") {
      fileUrl = file;
    } else if (file.location) {
      fileUrl = file.location;
    } else if (file.url) {
      fileUrl = file.url;
    } else {
      console.error("File URL not found");
      return;
    }

    // Create a filename for the download
    const fileName = `contract-${
      contractData?.number || contractData?.id || "download"
    }.pdf`;

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", fileName);
    link.setAttribute("target", "_blank");

    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <p className="text-sm font-medium text-muted-foreground">
                Дата создания
              </p>
              <p>
                {contractData?.created_at
                  ? formatDate(contractData.created_at)
                  : "Не указана"}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Truck className="h-5 w-5 text-primary mt-0.5" />
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
                <DollarSign className="h-4 w-4 text-green-600 ml-2" />
                <span className="text-green-600">{contractData?.currency}</span>
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => {
            // Use the internal download function but also call the prop function for compatibility
            handleDownloadFile();
            handleDownload();
          }}
          disabled={!contractData?.files || contractData.files.length === 0}
        >
          <Download className="h-4 w-4" />
          Скачать договор
        </Button>
      </CardContent>
    </Card>
  );
};
