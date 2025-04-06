"use client";

import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Package,
  DollarSign,
  Calendar,
  Upload,
  Download,
  Loader2,
  Plus,
  Trash2,
  X,
  CalendarIcon,
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
import { usePopupStore } from "@/shared/model/popup-store";
import { useUpdateWagon } from "@/entities/wagon/api/patch/use-update-wagon";
import { useDeleteWagon } from "@/entities/wagon/api/delete/use-delete-wagon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetApplication } from "@/entities/applications/api/use-get-application";
import { useUpdateApplication } from "@/entities/applications/api/use-update-application";
import { useUploadApplicationFiles } from "@/entities/applications/api/use-upload-application-files";
import { useDeleteApplicationFile } from "@/entities/applications/api/use-delete-application-file";
import { WagonRegistry } from "@/pages/contracts-inner-page/blocks/wagon-registry";

interface ApplicationDetailProps {
  applicationId: string;
  contractId: string;
  onBack: () => void;
}

export const ApplicationDetail = ({
  applicationId,
  contractId,
  onBack,
}: ApplicationDetailProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const { open } = usePopupStore("addWagon");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: "",
    number: "",
    date: "",
    file: null as File | null,
  });

  const {
    data: applicationData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetApplication(applicationId);

  // Extract the first application from the array if it's an array
  const application = Array.isArray(applicationData)
    ? applicationData[0]
    : applicationData;

  // Add mutation hooks for updating and deleting wagons
  const updateWagonMutation = useUpdateWagon();
  const deleteWagonMutation = useDeleteWagon();
  const updateApplicationMutation = useUpdateApplication();
  const uploadFilesMutation = useUploadApplicationFiles();
  const deleteFileMutation = useDeleteApplicationFile();
  const deleteFileByNumberMutation = useDeleteApplicationFile();

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Handle file download
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    if (!fileUrl) {
      console.error("File URL is missing");

      return;
    }

    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle document upload
  const handleDocumentUpload = async () => {
    if (!newDocument.file || !newDocument.name) return;

    try {
      // Create the files_info array with the required structure
      const filesInfo = [
        {
          name: newDocument.name,
          number: newDocument.number || "",
          date: newDocument.date || "",
        },
      ];

      // Use the new Tanstack Query hook for file upload
      await uploadFilesMutation.mutateAsync({
        applicationId,
        files: [newDocument.file],
        filesInfo,
      });

      setIsUploadDialogOpen(false);
      setNewDocument({
        name: "",
        number: "",
        date: "",
        file: null,
      });

      // Refresh the application data
      refetch();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Ошибка загрузки",
        description:
          "Не удалось загрузить документ. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      });
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (
    documentId: string,
    filename?: string,
    docNumber?: string
  ) => {
    try {
      if (docNumber) {
        // If we have a document number, use the number-based deletion endpoint
        await deleteFileByNumberMutation.mutateAsync({
          applicationId: application?.id || applicationId,
          docNumber,
        });
      }

      refetch();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  // Handle wagon update
  const handleUpdateWagon = async (wagonId: string | number, data: any) => {
    try {
      await updateWagonMutation.mutateAsync({ id: wagonId, data });
      refetch();
    } catch (error) {
      console.error("Failed to update wagon:", error);
      throw error;
    }
  };

  // Handle wagon deletion
  const handleDeleteWagon = async (wagonId: string | number) => {
    try {
      await deleteWagonMutation.mutateAsync(wagonId);
      refetch();
    } catch (error) {
      console.error("Failed to delete wagon:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Загрузка данных заявки...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p className="text-lg">Ошибка загрузки данных заявки</p>
            <p className="text-sm mt-2">
              {(error as Error)?.message || "Неизвестная ошибка"}
            </p>
            <Button variant="outline" className="mt-4" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Вернуться к списку заявок
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к списку заявок
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
                Заявка #{application?.id}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {application?.created_at
                  ? formatDate(application?.created_at)
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
                  {application?.volume
                    ? application.volume.toLocaleString()
                    : 0}{" "}
                  тонн
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Культура
                </p>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 mt-1"
                >
                  {application?.culture === "wheat"
                    ? "Пшеница"
                    : application?.culture === "barley"
                    ? "Ячмень"
                    : application?.culture === "corn"
                    ? "Кукуруза"
                    : application?.culture === "sunflower"
                    ? "Подсолнечник"
                    : application?.culture === "flax"
                    ? "Лен"
                    : application?.culture === "rapeseed"
                    ? "Рапс"
                    : application?.culture || "Не указана"}
                </Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Цена за тонну
                </p>
                <p className="font-medium">
                  {application?.price_per_ton
                    ? application.price_per_ton.toLocaleString()
                    : 0}{" "}
                  {application?.currency ||
                    application?.contract?.currency ||
                    "₸"}
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
                  {application?.total_amount
                    ? application.total_amount.toLocaleString()
                    : 0}{" "}
                  {application?.currency ||
                    application?.contract?.currency ||
                    "₸"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Детали заявки</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="wagons">Вагоны</TabsTrigger>
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
                        <span className="text-sm">ID заявки:</span>
                        <span className="font-medium">{application?.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Дата создания:</span>
                        <span>
                          {application?.created_at
                            ? formatDate(application?.created_at)
                            : "Не указана"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Объем:</span>
                        <span>
                          {application?.volume
                            ? application.volume.toLocaleString()
                            : 0}{" "}
                          тонн
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Культура:</span>
                        <span>
                          {application?.culture === "wheat"
                            ? "Пшеница"
                            : application?.culture === "barley"
                            ? "Ячмень"
                            : application?.culture === "corn"
                            ? "Кукуруза"
                            : application?.culture === "sunflower"
                            ? "Подсолнечник"
                            : application?.culture === "flax"
                            ? "Лен"
                            : application?.culture === "rapeseed"
                            ? "Рапс"
                            : application?.culture || "Не указана"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Цена за тонну:</span>
                        <span>
                          {application?.price_per_ton
                            ? application.price_per_ton.toLocaleString()
                            : 0}{" "}
                          {application?.currency || "₸"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Валюта:</span>
                        <span className="font-medium">
                          {application?.currency ||
                            application?.contract?.currency ||
                            "KZT"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Общая сумма:</span>
                        <span className="font-medium text-green-600">
                          {application?.total_amount
                            ? application.total_amount.toLocaleString()
                            : 0}{" "}
                          {application?.currency ||
                            application?.contract?.currency ||
                            "₸"}
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
                        <span className="text-sm">ID договора:</span>
                        <span className="font-medium">
                          {application?.contract?.id || contractId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Номер договора:</span>
                        <span>
                          {application?.contract?.number || "Не указан"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Культура:</span>
                        <span>
                          {application?.contract?.crop || "Не указана"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Компания:</span>
                        <span>
                          {application?.contract?.company?.name || "Не указана"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <Button
                  className="gap-2 bg-amber-500 hover:bg-amber-600"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4" />
                  Загрузить документ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {application?.files && application.files.length > 0 ? (
                <div className="bg-amber-50 p-3 rounded-md">
                  <div className="bg-white p-4 rounded-md border border-amber-100">
                    <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <div className="col-span-1">№</div>
                      <div className="col-span-3">Наименование</div>
                      <div className="col-span-2">Номер</div>
                      <div className="col-span-3">Дата документа</div>
                      <div className="col-span-2">Файл</div>
                      <div className="col-span-1"></div>
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
                        <div className="col-span-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              handleFileDownload(
                                file.location || file.file,
                                file.name || `document-${index + 1}.pdf`
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                            Скачать
                          </Button>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                            onClick={() => {
                              // Extract filename from location URL if available
                              const filename = file.location
                                ? file.location.split("/").pop()
                                : undefined;
                              // Pass the document number if available
                              handleDeleteDocument(
                                file.id,
                                filename,
                                file.number
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Документы не найдены</p>
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Добавить первый документ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wagons" className="mt-4">
          <WagonRegistry
            wagons={application?.wagons || []}
            isAdmin={true}
            onAddWagon={open}
            onUpdateWagon={handleUpdateWagon}
            onDeleteWagon={handleDeleteWagon}
          />
        </TabsContent>
      </Tabs>

      {/* Document Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Загрузить документ</DialogTitle>
            <DialogDescription>
              Заполните информацию о документе и загрузите файл
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doc-name"
                value={newDocument.name}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-number" className="text-right">
                Номер
              </Label>
              <Input
                id="doc-number"
                value={newDocument.number}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, number: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-date" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="doc-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newDocument.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDocument.date ? (
                        formatDate(newDocument.date)
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        newDocument.date
                          ? new Date(newDocument.date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setNewDocument({
                            ...newDocument,
                            date: format(date, "yyyy-MM-dd"),
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-file" className="text-right">
                Файл <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="doc-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewDocument({
                        ...newDocument,
                        file: e.target.files[0],
                      });
                    }
                  }}
                />
                {newDocument.file && (
                  <div className="flex items-center mt-2 text-sm">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="truncate max-w-[300px]">
                      {newDocument.file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={() =>
                        setNewDocument({ ...newDocument, file: null })
                      }
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleDocumentUpload}
              disabled={
                uploadFilesMutation.isPending ||
                !newDocument.name ||
                !newDocument.file
              }
            >
              {uploadFilesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Загрузить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
