"use client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AddWagonPopup } from "@/entities/wagon/ui/add-wagon-popup";
import { usePopupStore } from "@/shared/model/popup-store";
import { useGetUserContractById } from "@/entities/contracts/api/get/use-get-user-contract-by-id";
import { useGetContractsId } from "@/entities/contracts/api/get/use-get-contract-id";
import { useGetCompanies } from "@/entities/companies/api/use-get-company";
import { useGetWagonContracts } from "@/entities/wagon/api/get/use-get-contract-wagon";
import { ContractHeader } from "./contract-header";
import { WagonDetails } from "./wagon-details";
import { ShippingDocuments } from "./shipping-document";
import { WagonRegistry } from "./wagon-registry";
import { useUpdateWagon } from "@/entities/wagon/api/patch/use-update-wagon";
import { useDeleteWagon } from "@/entities/wagon/api/delete/use-delete-wagon";

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

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle wagon update
  const handleUpdateWagon = async (wagonId: string | number, data: any) => {
    try {
      await updateWagonMutation.mutateAsync({ id: wagonId, data });
      refetchWagons();
    } catch (error) {
      console.error("Failed to update wagon:", error);
      throw error;
    }
  };

  // Handle wagon deletion
  const handleDeleteWagon = async (wagonId: string | number) => {
    try {
      await deleteWagonMutation.mutateAsync(wagonId);
      refetchWagons();
    } catch (error) {
      console.error("Failed to delete wagon:", error);
      throw error;
    }
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
        {/* Contract Header Component */}
        <ContractHeader
          contractData={contractData}
          getCompanyName={getCompanyName}
          handleDownload={handleDownload}
        />

        {/* Wagon Details Component */}
        <WagonDetails wagons={wagons} handleFileDownload={handleFileDownload} />

        {/* Shipping Documents Component */}
        <ShippingDocuments renderedFiles={renderedFiles} />

        {/* Wagon Registry Component with edit/delete functionality */}
        <WagonRegistry
          wagons={wagons}
          isAdmin={isAdmin}
          onAddWagon={open}
          onUpdateWagon={handleUpdateWagon}
          onDeleteWagon={handleDeleteWagon}
        />
      </div>
      <AddWagonPopup contractId={contractId} />
    </>
  );
};
