"use client";

import { useState, useMemo } from "react";
import { AlertCircle, Package, BarChart3, FileText } from "lucide-react";
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
import { ApplicationDetail } from "@/screens/application-page/blocks/application-details";
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
    refetch,
  } = useGetContractsId(contractId, {
    enabled: isAdmin,
  });

  const {
    data: userContract,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: userRefetch,
  } = useGetUserContractById(contractId, {
    enabled: !isAdmin,
  });

  // Fetch wagon data using the useGetWagonContracts hook
  const {
    data: wagonContractsData,
    isLoading: isWagonsLoading,
    isError: isWagonsError,
  } = useGetWagonContracts(contractId);

  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);

  const contractData = isAdmin ? contract : userContract;
  const isDataLoading = isAdmin ? isLoading : isUserLoading;
  const isDataError = isAdmin ? isError : isUserError;
  const handleRefetch = isAdmin ? refetch : userRefetch;

  // Get company name from ID
  const getCompanyName = (companyId: number) => {
    if (isCompaniesLoading || !companiesData?.data) return "Загрузка...";
    const company = companiesData.data.find((c) => c.id === companyId);
    return company ? company.name : "Неизвестная компания";
  };

  // Combine wagon data from both sources, prioritizing the wagonContractsData
  const wagons = useMemo(
    () =>
      wagonContractsData?.length > 0
        ? wagonContractsData
        : (contractData as any)?.wagons || [],
    [contractData, wagonContractsData]
  );

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
      <div className="w-full max-w-none space-y-4 px-0">
        <Card className="sungrain-analytics-card">
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 sm:h-10 w-32 sm:w-40" />
          </CardContent>
        </Card>

        <Card className="sungrain-analytics-card">
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

        <Card className="sungrain-analytics-card">
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
      <div className="w-full max-w-none px-0">
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
      <div className="w-full max-w-none px-0">
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
      <div className="w-full max-w-none space-y-4 px-0">
        <ContractHeader
          contractData={contractData}
          getCompanyName={getCompanyName}
          handleDownload={handleDownload}
        />
        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl font-black text-[#223137]">
                    Использование объема
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-[#6f7774]">
                    План, отгрузка и остаток по текущему контракту
                  </CardDescription>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[620px]">
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Всего
                  </div>
                  <div className="mt-1 text-lg font-black text-[#223137]">
                    {formatNumber(volumeStats.totalVolume)} т
                  </div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Отгружено
                  </div>
                  <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                    {formatNumber(volumeStats.usedVolume)} т
                  </div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Остаток
                  </div>
                  <div className="mt-1 text-lg font-black text-[#d5740b]">
                    {formatNumber(volumeStats.remainingVolume)} т
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 text-sm font-semibold text-[#53605a] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#2f6b4f]" />
                  <span>{volumeStats.percentUsed.toFixed(1)}% использовано</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#f38810]" />
                  <span>{(contractData as any)?.applications?.length || 0} заявок</span>
                </div>
              </div>
              <Progress
                value={volumeStats.percentUsed}
                className="h-3 bg-[#f7eadc] [&>div]:bg-[#f38810]"
              />
            </div>
          </CardContent>
        </Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-md border border-[#dfe7de] bg-white p-1 shadow-[0_12px_28px_rgba(34,49,55,0.05)]">
            <TabsTrigger
              value="details"
              className="rounded-md py-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
            >
              <span className="hidden sm:inline">Детали договора</span>
              <span className="sm:hidden">Детали</span>
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="rounded-md py-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
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
