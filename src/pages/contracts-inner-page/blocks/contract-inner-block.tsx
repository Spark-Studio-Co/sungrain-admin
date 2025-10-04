"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Package, BarChart3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";
import { AddWagonPopup } from "@/entities/wagon/ui/add-wagon-popup";
import { useGetUserContractById } from "@/entities/contracts/hooks/query/use-get-user-contract-by-id.query";
import { useGetContractsId } from "@/entities/contracts/hooks/query/use-get-contract-id.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetWagonContracts } from "@/entities/wagon/hooks/query/use-get-contract-wagon.query";
import { ContractHeader } from "./contract-header";
import { WagonDetails } from "./wagon-details";
import { ApplicationDetail } from "@/pages/application-page/blocks/application-details";
import { ApplicationBlock } from "./contracts-application-block";
import { useParams } from "react-router-dom";

interface ContractInnerBlockProps {
  contractId: string;
}

export const ContractInnerBlock = ({ contractId }: ContractInnerBlockProps) => {
  const { id } = useParams();
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [activeTab, setActiveTab] = useState("details");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const {
    data: contract,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetContractsId(contractId, {
    enabled: isAdmin,
  });

  const {
    data: userContract,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: userRefetch,
  } = useGetUserContractById(contractId, {
    enabled: !isAdmin,
  });

  // Fetch wagon data using the useGetWagonContracts hook
  const {
    data: wagonContractsData,
    isLoading: isWagonsLoading,
    isError: isWagonsError,
    error: wagonsError,
  } = useGetWagonContracts(contractId);

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

  // Combine wagon data from both sources, prioritizing the wagonContractsData
  const wagons =
    wagonContractsData?.length > 0
      ? wagonContractsData
      : (contractData as any)?.wagons || [];

  // const renderedFiles =
  //   wagons
  //     ?.flatMap((wagon: any) => {
  //       return wagon.files && wagon.files.length > 0
  //         ? wagon.files.map((file: any) => ({
  //             file,
  //             wagonNumber: wagon.number,
  //           }))
  //         : [];
  //     })
  //     .filter(Boolean) || [];

  // Calculate volume usage from applications
  const volumeStats = useMemo(() => {
    if (!wagons || wagons.length === 0) {
      return {
        totalVolume: (contractData as any)?.total_volume || 0,
        usedVolume: 0,
        percentUsed: 0,
        remainingVolume: (contractData as any)?.total_volume || 0,
      };
    }

    const totalVolume = (contractData as any)?.total_volume || 0;
    const usedVolume = wagons.reduce(
      (sum: number, wagon: any) => sum + (wagon.capacity || 0),
      0
    );
    const percentUsed = totalVolume > 0 ? (usedVolume / totalVolume) * 100 : 0;
    const remainingVolume = Math.max(0, totalVolume - usedVolume);

    return {
      totalVolume,
      usedVolume,
      percentUsed,
      remainingVolume,
    };
  }, [contractData, wagons]);

  // Calculate wagon capacity statistics
  const wagonCapacityStats = useMemo(() => {
    if (!wagons || wagons.length === 0) {
      return {
        totalCapacity: 0,
        totalRealWeight: 0,
        capacityUtilization: 0,
        wagonCount: 0,
        averageUtilization: 0,
      };
    }

    const wagonCount = wagons.length;
    const totalCapacity = wagons.reduce(
      (sum: number, wagon: any) => sum + (wagon.capacity || 0),
      0
    );
    const totalRealWeight = wagons.reduce(
      (sum: number, wagon: any) => sum + (wagon.capacity || 0),
      0
    );
    const capacityUtilization =
      totalCapacity > 0 ? (totalRealWeight / totalCapacity) * 100 : 0;
    const averageUtilization = wagonCount > 0 ? capacityUtilization : 0;

    return {
      totalCapacity,
      totalRealWeight,
      capacityUtilization,
      wagonCount,
      averageUtilization,
    };
  }, [wagons]);

  const handleDownload = () => {
    if (
      !(contractData as any)?.files ||
      (contractData as any).files.length === 0
    ) {
      alert("Файл не найден!");
      return;
    }

    const fileUrl =
      typeof (contractData as any).files[0] === "string"
        ? (contractData as any).files[0]
        : (contractData as any).files[0].url;

    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute(
      "download",
      `contract-${(contractData as any).number || (contractData as any).id}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", fileName);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle application selection
  const handleSelectApplication = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setActiveTab("applications");
  };

  // Handle back to applications list
  const handleBackToApplications = () => {
    setSelectedApplicationId(null);
  };

  if (isDataLoading || isWagonsLoading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-2 sm:px-4 space-y-4 sm:space-y-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 sm:h-10 w-32 sm:w-40" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="border rounded-lg p-3 sm:p-4">
                <Skeleton className="h-48 sm:h-64 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-3 sm:p-4">
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDataError || isWagonsError) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-2 sm:px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription className="text-sm">
            {isWagonsError
              ? `Не удалось загрузить данные вагонов.`
              : `Не удалось загрузить данные контракта.`}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => handleRefetch()} className="w-full sm:w-auto">
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="container mx-auto py-4 sm:py-6 px-2 sm:px-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Контракт не найден</AlertTitle>
          <AlertDescription className="text-sm">
            Не удалось найти данные контракта.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-4 sm:py-6 px-2 sm:px-4 space-y-4 sm:space-y-6">
        <ContractHeader
          contractData={contractData}
          getCompanyName={getCompanyName}
          handleDownload={handleDownload}
        />
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-3 sm:pb-2">
            <div className="flex items-start sm:items-center gap-3 sm:gap-2">
              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg">
                  <span className="hidden sm:inline">Использование объема</span>
                  <span className="sm:hidden">Объем</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">
                    Общий объем договора:{" "}
                    {formatNumber(volumeStats.totalVolume)} тонн
                  </span>
                  <span className="sm:hidden">
                    Всего: {formatNumber(volumeStats.totalVolume)} т
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-1 sm:pt-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>
                    <span className="hidden sm:inline">Использовано:</span>
                    <span className="sm:hidden">Исп.:</span>{" "}
                    {formatNumber(volumeStats.usedVolume)}
                    <span className="hidden sm:inline"> тонн</span>
                    <span className="sm:hidden"> т</span>
                  </span>
                  <span>
                    <span className="hidden sm:inline">Осталось:</span>
                    <span className="sm:hidden">Ост.:</span>{" "}
                    {formatNumber(volumeStats.remainingVolume)}
                    <span className="hidden sm:inline"> тонн</span>
                    <span className="sm:hidden"> т</span>
                  </span>
                </div>
                <Progress
                  value={volumeStats.percentUsed}
                  className="h-2 sm:h-2.5"
                />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>
                      {volumeStats.percentUsed.toFixed(1)}% использовано
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(contractData as any)?.applications?.length || 0} заявок
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger
              value="details"
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <span className="hidden sm:inline">Детали договора</span>
              <span className="sm:hidden">Детали</span>
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            >
              Заявки
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <WagonDetails
              wagons={wagons}
              handleFileDownload={handleFileDownload}
              capacityStats={wagonCapacityStats}
              contractData={contractData}
            />
          </TabsContent>
          <TabsContent value="applications" className="mt-4">
            {selectedApplicationId ? (
              <ApplicationDetail
                contractId={id as any}
                applicationId={selectedApplicationId}
                onBack={handleBackToApplications}
              />
            ) : (
              <ApplicationBlock
                contractId={contractId}
                onSelectApplication={handleSelectApplication}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
      <AddWagonPopup
        contractId={contractId}
        applicationId={selectedApplicationId || undefined}
      />
    </>
  );
};
