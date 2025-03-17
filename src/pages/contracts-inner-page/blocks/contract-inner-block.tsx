"use client";

import { Download, AlertCircle } from "lucide-react";
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
import { useGetContractsId } from "@/entities/contracts/api/get/use-get-contract-id";

interface ContractInnerBlockProps {
  contractId: string;
}

export const ContractInnerBlock = ({ contractId }: ContractInnerBlockProps) => {
  const {
    data: contract,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetContractsId(contractId);

  const { open } = usePopupStore("addWagon");

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            Не удалось загрузить данные контракта.{" "}
            {error?.message || "Пожалуйста, попробуйте позже."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => refetch()}>Попробовать снова</Button>
        </div>
      </div>
    );
  }

  const renderedFiles = contract?.wagons
    .flatMap((wagon: any) => {
      return wagon.files && wagon.files.length > 0 ? wagon.files.map((file: any) => ({
        file,
        wagonNumber: wagon.number
      })) : [];
    })
    .filter(Boolean) || [];

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Договор закупа #{contract?.id}</CardTitle>
            <CardDescription>
              {contract?.crop} - {contract?.totalVolume} тонн |{" "}
              {contract?.departureStation} → {contract?.destinationStation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Грузоотправитель
                </p>
                <p>{contract?.sender}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Грузополучатель
                </p>
                <p>{contract?.receiver}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Компания
                </p>
                <p>{contract?.company}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (contract?.documentUrl) {
                  const link = document.createElement('a');
                  link.href = contract.documentUrl;
                  link.target = '_blank';
                  link.download = '';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else {
                  alert('Документ договора недоступен');
                }
              }}
            >
              <Download className="h-4 w-4" />
              Скачать договор
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Отгрузочные документы</CardTitle>
            <CardDescription>Управление документами отгрузки</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderedFiles.length > 0 ? (
                      renderedFiles.map((doc: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{
                            (() => {
                              const filename = doc.file.toString();
                              if (filename.includes('/uploads/')) {
                                const filenameAfterUploads = filename.split('/uploads/')[1];
                                const match = filenameAfterUploads.match(/^([^-]+)/);
                                if (match && match[1]) {
                                  return match[1];
                                }
                              }

                              const lastPart = filename.split('/').pop() || '';
                              const baseName = lastPart.split('-')[0];
                              return baseName || 'Документ вагона';
                            })()
                          }</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                // Create a temporary anchor element to trigger the download
                                const link = document.createElement('a');
                                link.href = doc.file.toString();
                                link.target = '_blank';
                                link.download = ''; // Browser will use the filename from the URL
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="w-full">
              <CardTitle className="!w-full !flex items-center justify-between">
                Реестр вагонов <Button onClick={open}>Добавить вагон</Button>
              </CardTitle>
              <CardDescription>
                Управление вагонами и их статусами
              </CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contract?.wagons?.length > 0 ? (
                    contract?.wagons?.map((wagon: any) => (
                      <TableRow
                        key={wagon.id}
                        className={
                          wagon.status === "shipped" ? "bg-green-50" : ""
                        }
                      >
                        <TableCell>{wagon.id}</TableCell>
                        <TableCell>{wagon.number}</TableCell>
                        <TableCell>{wagon.capacity.toLocaleString()}</TableCell>
                        <TableCell>{wagon.owner}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
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
