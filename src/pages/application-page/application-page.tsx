"use client";

import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Package,
  Coins as DollarSign,
  Calendar,
  Upload,
  Download,
  Loader2,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { usePopupStore } from "@/shared/model/popup-store";
import { AddWagonPopup } from "@/entities/wagon/ui/add-wagon-popup";
import { useNavigate, useParams } from "react-router-dom";
import { useGetApplication } from "@/entities/applications/hooks/query/use-get-application.query";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { WagonRegistry } from "../contracts-inner-page/blocks/wagon-registry";
import { Layout } from "@/shared/ui/layout";

export default function ApplicationPage() {
  const { id, application_id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const { open } = usePopupStore("addWagon");
  const [isAdmin] = useState<boolean | null>(() => {
    const storedAdminStatus = localStorage.getItem("isAdmin");
    return storedAdminStatus ? JSON.parse(storedAdminStatus) : null;
  });

  const {
    data: application,
    isLoading,
    isError,
    error,
  } = useGetApplication(application_id as any);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  const handleBack = () => {
    navigate(`/admin/contracts/${id}`);
  };

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    if (!fileUrl) {
      console.error("File URL is missing");

      return;
    }

    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", fileName);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-6 flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Загрузка данных заявки...</span>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center text-red-500">
                <p className="text-lg">Ошибка загрузки данных заявки</p>
                <p className="text-sm mt-2">
                  {(error as Error)?.message || "Неизвестная ошибка"}
                </p>
                <Button variant="outline" className="mt-4" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться к договору
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к договору
          </Button>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-full">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Заявка #{application.id}
                </CardTitle>
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {application.created_at
                    ? formatDate(application.created_at)
                    : "Дата не указана"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Объем
                  </p>
                  <p className="font-medium">
                    {formatNumber(application.volume)} тонн
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Цена за тонну
                  </p>
                  <p className="font-medium">
                    {formatCurrency(application.price_per_ton)}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Общая сумма
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 font-medium mt-1"
                  >
                    {formatCurrency(application.total_amount)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Детали заявки</TabsTrigger>
            <TabsTrigger value="wagons">Вагоны</TabsTrigger>
            <TabsTrigger value="documents">Документы</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Информация о заявке</CardTitle>
                <CardDescription>
                  Подробная информация о заявке и связанном договоре
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Информация о заявке
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-md space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Дата:</span>
                          <span>
                            {application.created_at
                              ? formatDate(application.created_at)
                              : "Не указана"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Объем:</span>
                          <span>{formatNumber(application.volume)} тонн</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Цена за тонну:</span>
                          <span>
                            {formatCurrency(application.price_per_ton)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Общая сумма:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(application.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Информация о договоре
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-md space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm">Номер договора:</span>
                          <span>
                            {application.contract?.number || "Не указан"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Культура:</span>
                          <span>
                            {application.contract?.crop || "Не указана"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wagons" className="mt-4">
            <WagonRegistry
              wagons={application.wagons || []}
              onAddWagon={open}
              onUpdateWagon={(wagonId, data) => {
                // Implement wagon update logic
                console.log("Update wagon", wagonId, data);
                return Promise.resolve();
              }}
              onDeleteWagon={(wagonId) => {
                // Implement wagon delete logic
                console.log("Delete wagon", wagonId);
                return Promise.resolve();
              }}
            />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Документы заявки</CardTitle>
                    <CardDescription>
                      Управление документами по заявке
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button className="gap-2 !bg-primary">
                      <Upload className="h-4 w-4" />
                      Загрузить документ
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {application.files && application.files.length > 0 ? (
                  <div className="bg-amber-50 p-3 rounded-md">
                    <div className="bg-white p-4 rounded-md border border-amber-100">
                      <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground">
                        <div className="col-span-1">№</div>
                        <div className="col-span-3">Наименование</div>
                        <div className="col-span-2">Номер</div>
                        <div className="col-span-3">Дата документа</div>
                        <>
                          <div className="col-span-3">Действия</div>
                        </>
                      </div>
                      {application.files.map((file: any, index: number) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 mb-3 items-center"
                        >
                          <div className="col-span-1 text-center">
                            {index + 1}
                          </div>
                          <div className="col-span-3">
                            <div className="truncate">
                              {file.name || `Документ ${index + 1}`}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="truncate">{file.number || "—"}</div>
                          </div>
                          <div className="col-span-3">
                            <div className="truncate">
                              {file.date ? formatDate(file.date) : "—"}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                handleFileDownload(
                                  file.location,
                                  file.name || `document-${index + 1}.pdf`
                                )
                              }
                            >
                              <Download className="h-4 w-4" />
                              Скачать
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-md bg-muted/10">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Документы не найдены
                    </p>
                    <Button variant="outline" className="mt-4 gap-2">
                      <Plus className="h-4 w-4" />
                      Добавить первый документ
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <AddWagonPopup
          contractId={id as any}
          applicationId={application_id as any}
        />
      </div>
    </Layout>
  );
}
