"use client";

import {
  Download,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  Truck,
  MapPin,
  Package,
  User,
  RefreshCw,
  Train,
  DollarSign,
  FileBarChart,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AddWagonPopup } from "@/entities/wagon/ui/add-wagon-popup";
import { usePopupStore } from "@/shared/model/popup-store";
import { useGetUserContractById } from "@/entities/contracts/api/get/use-get-user-contract-by-id";
import { useGetContractsId } from "@/entities/contracts/api/get/use-get-contract-id";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useGetCompanies } from "@/entities/companies/api/use-get-company";

interface ContractInnerBlockProps {
  contractId: string;
}

export const ContractInnerBlock = ({ contractId }: ContractInnerBlockProps) => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const { open } = usePopupStore("addWagon");

  const {
    data: contract,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetContractsId(contractId);

  const {
    data: userContract,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: userRefetch,
  } = useGetUserContractById(contractId);

  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);

  const contractData = isAdmin ? contract : userContract;
  const isDataLoading = isAdmin ? isLoading : isUserLoading;
  const isDataError = isAdmin ? isError : isUserError;
  const dataError = isAdmin ? error : userError;
  const handleRefetch = isAdmin ? refetch : userRefetch;

  // Get company name from ID
  const getCompanyName = (companyId: number) => {
    if (isCompaniesLoading || !companiesData?.data) return "Загрузка...";
    const company = companiesData.data.find((c) => c.id === companyId);
    return company ? company.name : "Неизвестная компания";
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  if (isDataLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDataError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            Не удалось загрузить данные контракта.{" "}
            {dataError?.message || "Пожалуйста, попробуйте позже."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => handleRefetch()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  const renderedFiles =
    contractData?.wagons
      ?.flatMap((wagon: any) => {
        return wagon.files && wagon.files.length > 0
          ? wagon.files.map((file: any) => ({
              file,
              wagonNumber: wagon.number,
            }))
          : [];
      })
      .filter(Boolean) || [];

  const handleDownload = () => {
    if (!contractData?.files || contractData.files.length === 0) {
      alert("Файл не найден!");
      return;
    }

    const fileUrl =
      typeof contractData.files[0] === "string"
        ? contractData.files[0]
        : contractData.files[0].url;

    if (!fileUrl) {
      alert("URL файла не найден!");
      return;
    }

    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute(
      "download",
      `contract-${contractData.number || contractData.id}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Договор закупа #{contractData?.number || contractData?.id}
                  </CardTitle>
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
                      : contractData?.company || "Не указана"}
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Объем
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium">
                      {contractData?.total_volume || contractData?.totalVolume}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      тонн
                    </span>
                    <DollarSign className="h-4 w-4 text-green-600 ml-2" />
                    <span className="text-green-600">
                      {contractData?.currency}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={handleDownload}
              disabled={!contractData?.files || contractData.files.length === 0}
            >
              <Download className="h-4 w-4" />
              Скачать договор
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-full">
                <FileBarChart className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle>Отгрузочные документы</CardTitle>
                <CardDescription>
                  Управление документами отгрузки
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Вагон</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderedFiles.length > 0 ? (
                      renderedFiles.map((doc: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {(() => {
                              const filename = doc.file.toString();
                              if (filename.includes("/uploads/")) {
                                const filenameAfterUploads =
                                  filename.split("/uploads/")[1];
                                const match =
                                  filenameAfterUploads.match(/^([^-]+)/);
                                if (match && match[1]) {
                                  return match[1];
                                }
                              }

                              const lastPart = filename.split("/").pop() || "";
                              const baseName = lastPart.split("-")[0];
                              return baseName || "Документ вагона";
                            })()}
                          </TableCell>
                          <TableCell>
                            {doc.wagonNumber || "Не указан"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = doc.file;
                                link.setAttribute("download", "document.pdf");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Скачать
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6">
                          Документы не найдены
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-full">
                  <Truck className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <CardTitle>Реестр вагонов</CardTitle>
                  <CardDescription>
                    Управление вагонами и их статусами
                  </CardDescription>
                </div>
              </div>
              {isAdmin && (
                <Button
                  onClick={open}
                  className="gap-2 bg-amber-500 hover:bg-amber-600"
                >
                  <Plus className="h-4 w-4" />
                  Добавить вагон
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№</TableHead>
                    <TableHead>№ вагона</TableHead>
                    <TableHead>Г/П, кг</TableHead>
                    <TableHead>Собственник</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractData?.wagons?.length > 0 ? (
                    contractData.wagons.map((wagon: any) => (
                      <TableRow
                        key={wagon.id}
                        className={
                          wagon.status === "shipped" ? "bg-green-50" : ""
                        }
                      >
                        <TableCell>{wagon.id}</TableCell>
                        <TableCell>{wagon.number}</TableCell>
                        <TableCell>
                          {wagon.capacity?.toLocaleString() || "Не указана"}
                        </TableCell>
                        <TableCell>{wagon.owner || "Не указан"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              wagon.status === "shipped"
                                ? "success"
                                : wagon.status === "in_transit"
                                ? "warning"
                                : "default"
                            }
                            className={`flex w-fit items-center gap-1 ${
                              wagon.status === "shipped"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : wagon.status === "in_transit"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-100"
                            }`}
                          >
                            {wagon.status === "shipped" ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : wagon.status === "in_transit" ? (
                              <Truck className="h-3.5 w-3.5" />
                            ) : wagon.status === "at_elevator" ? (
                              <Building2 className="h-3.5 w-3.5" />
                            ) : (
                              <Circle className="h-3.5 w-3.5" />
                            )}
                            {wagon.status === "shipped"
                              ? "Отгружен"
                              : wagon.status === "in_transit"
                              ? "В пути"
                              : wagon.status === "at_elevator"
                              ? "На элеваторе"
                              : wagon.status || "Не указан"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        Вагоны не найдены
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <AddWagonPopup contractId={contractId} />
    </>
  );
};
