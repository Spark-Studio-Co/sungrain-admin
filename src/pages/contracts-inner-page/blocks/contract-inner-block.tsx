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
import { AddWagonPopup } from "@/entities/wagon/ui/add-wagon-popup";
import { usePopupStore } from "@/shared/model/popup-store";
import { useGetUserContractById } from "@/entities/contracts/hooks/query/use-get-user-contract-by-id.query";
import { useGetContractsId } from "@/entities/contracts/hooks/query/use-get-contract-id.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetWagonContracts } from "@/entities/wagon/hooks/query/use-get-contract-wagon.query";
import { useUpdateWagon } from "@/entities/wagon/hooks/mutations/use-update-wagon.mutation";
import { useDeleteWagon } from "@/entities/wagon/hooks/mutations/use-delete-wagon.mutation";
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
  const { open } = usePopupStore("addWagon");
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
  } = useGetContractsId(contractId);

  const {
    data: userContract,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
    refetch: userRefetch,
  } = useGetUserContractById(contractId);

  // Fetch wagon data using the useGetWagonContracts hook
  const {
    data: wagonContractsData,
    isLoading: isWagonsLoading,
    isError: isWagonsError,
    error: wagonsError,
    refetch: refetchWagons,
  } = useGetWagonContracts(contractId);

  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);

  // Add mutation hooks for updating and deleting wagons
  const updateWagonMutation = useUpdateWagon();
  const deleteWagonMutation = useDeleteWagon();

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
      : contractData?.wagons || [];

  const renderedFiles =
    wagons
      ?.flatMap((wagon: any) => {
        return wagon.files && wagon.files.length > 0
          ? wagon.files.map((file: any) => ({
              file,
              wagonNumber: wagon.number,
            }))
          : [];
      })
      .filter(Boolean) || [];

  // Calculate volume usage from applications
  const volumeStats = useMemo(() => {
    if (!contractData || !contractData.applications) {
      return {
        totalVolume: 0,
        usedVolume: 0,
        percentUsed: 0,
        remainingVolume: 0,
      };
    }

    const totalVolume = contractData.total_volume || 0;
    const usedVolume = contractData.applications.reduce(
      (sum: number, app: any) => sum + (app.volume || 0),
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
  }, [contractData]);

  const handleDownload = () => {
    if (!contractData?.files || contractData.files.length === 0) {
      alert("Файл не найден!");
      return;
    }

    const fileUrl =
      typeof contractData.files[0] === "string"
        ? contractData.files[0]
        : contractData.files[0].url;

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

  if (isDataError || isWagonsError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            {isWagonsError
              ? `Не удалось загрузить данные вагонов. ${
                  wagonsError?.message || "Пожалуйста, попробуйте позже."
                }`
              : `Не удалось загрузить данные контракта. ${
                  dataError?.message || "Пожалуйста, попробуйте позже."
                }`}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => handleRefetch()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <ContractHeader
          contractData={contractData}
          getCompanyName={getCompanyName}
          handleDownload={handleDownload}
        />

        {/* Volume Usage Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Использование объема</CardTitle>
                <CardDescription>
                  Общий объем договора:{" "}
                  {volumeStats.totalVolume.toLocaleString()} тонн
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Использовано: {volumeStats.usedVolume.toLocaleString()} тонн
                  </span>
                  <span>
                    Осталось: {volumeStats.remainingVolume.toLocaleString()}{" "}
                    тонн
                  </span>
                </div>
                <Progress
                  value={volumeStats.percentUsed}
                  className="h-2.5"
                  indicatorClassName={
                    volumeStats.percentUsed > 90
                      ? "bg-red-500"
                      : volumeStats.percentUsed > 70
                      ? "bg-amber-500"
                      : "bg-green-500"
                  }
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>
                      {volumeStats.percentUsed.toFixed(1)}% использовано
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {volumeStats.applications?.length ||
                      contractData.applications?.length ||
                      0}{" "}
                    заявок
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Детали договора</TabsTrigger>
            <TabsTrigger value="applications">Заявки</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <WagonDetails
              wagons={wagons}
              handleFileDownload={handleFileDownload}
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
                volumeStats={volumeStats}
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
