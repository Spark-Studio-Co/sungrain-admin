"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  Receipt,
  CreditCard,
  Pencil,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { useUploadApplicationFiles } from "@/entities/applications/api/use-upload-application-files";
import { useDeleteApplicationFile } from "@/entities/applications/api/use-delete-application-file";
import { WagonRegistry } from "@/pages/contracts-inner-page/blocks/wagon-registry";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useGetInvoices } from "@/entities/invoices/api/use-get-invoices";
import { useCreateInvoice } from "@/entities/invoices/api/use-create-invoice";
import { useUpdateInvoice } from "@/entities/invoices/api/use-update-invoice";
import { useDeleteInvoice } from "@/entities/invoices/api/use-delete-invoice";

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
  const [isAdmin] = useState<boolean | null>(() => {
    const storedAdminStatus = localStorage.getItem("isAdmin");
    return storedAdminStatus ? JSON.parse(storedAdminStatus) : null;
  });
  const [activeTab, setActiveTab] = useState("details");
  const { open } = usePopupStore("addWagon");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: "",
    number: "",
    date: "",
    file: null as File | null,
  });
  const [newInvoice, setNewInvoice] = useState({
    name: "",
    number: "",
    date: "",
    amount: "",
    status: "pending",
    description: "",
    file: null as File | null,
  });

  const [isEditInvoiceDialogOpen, setIsEditInvoiceDialogOpen] = useState(false);
  const [isDeleteInvoiceDialogOpen, setIsDeleteInvoiceDialogOpen] =
    useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<any>(null);

  const {
    data: applicationData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetApplication(applicationId);

  const {
    data: invoicesData = [],
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
  } = useGetInvoices(applicationId);

  const application = Array.isArray(applicationData)
    ? applicationData[0]
    : applicationData;

  const updateWagonMutation = useUpdateWagon();
  const deleteWagonMutation = useDeleteWagon();
  const uploadFilesMutation = useUploadApplicationFiles();
  const deleteFileByNumberMutation = useDeleteApplicationFile();
  const createInvoiceMutation = useCreateInvoice();

  const updateInvoiceMutation = useUpdateInvoice();
  const deleteInvoiceMutation = useDeleteInvoice();

  // Calculate total amount and paid amount
  const totalAmount = application?.total_amount || 0;
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];
  const paidAmount = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  const paymentProgress =
    totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy");
    } catch (e) {
      return dateString;
    }
  };

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

  const handleDocumentUpload = async () => {
    if (!newDocument.file || !newDocument.name) return;

    try {
      const filesInfo = [
        {
          name: newDocument.name,
          number: newDocument.number || "",
          date: newDocument.date || "",
        },
      ];

      await uploadFilesMutation.mutateAsync(
        {
          applicationId,
          files: [newDocument.file],
          filesInfo,
        },
        {
          onSuccess: () => {
            console.log("✅ File uploaded successfully!");
            refetch();
            setIsUploadDialogOpen(false);
          },
          onError: (error) => {
            console.error("Upload failed:", error);
          },
        }
      );

      setIsUploadDialogOpen(false);
      setNewDocument({
        name: "",
        number: "",
        date: "",
        file: null,
      });

      refetch();
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };

  const handleDeleteDocument = async (docNumber?: string) => {
    try {
      if (docNumber) {
        console.log(docNumber);
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

  // Handle invoice creation
  const handleCreateInvoice = async () => {
    if (!newInvoice.name || !newInvoice.amount || !newInvoice.file) {
      return;
    }

    try {
      const invoiceData = {
        applicationId,
        name: newInvoice.name,
        number: newInvoice.number || newInvoice.name,
        date: newInvoice.date || format(new Date(), "yyyy-MM-dd"),
        amount: Number.parseFloat(newInvoice.amount),
        status: newInvoice.status,
        description: newInvoice.description,
        file: newInvoice.file,
      };

      await createInvoiceMutation.mutateAsync(invoiceData, {
        onSuccess: () => {
          setIsInvoiceDialogOpen(false);
          refetchInvoices();
        },
        onError: (error) => {
          console.error("Invoice creation failed:", error);
        },
      });

      setNewInvoice({
        name: "",
        number: "",
        date: "",
        amount: "",
        status: "pending",
        description: "",
        file: null,
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  // Handle opening the edit invoice dialog
  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice({
      ...invoice,
      name: invoice.name || "",
      number: invoice.number || "",
      date: invoice.date || "",
      amount: invoice.amount?.toString() || "",
      status: invoice.status || "pending",
      description: invoice.description || "",
      file: null,
    });
    setIsEditInvoiceDialogOpen(true);
  };

  // Handle updating an invoice
  const handleUpdateInvoice = async () => {
    if (!editingInvoice || !editingInvoice.id) return;

    try {
      const invoiceData: any = {
        id: editingInvoice.id,
        data: {
          name: editingInvoice.name,
          number: editingInvoice.number,
          date: editingInvoice.date || format(new Date(), "yyyy-MM-dd"),
          amount: Number.parseFloat(editingInvoice.amount),
          status: editingInvoice.status,
          description: editingInvoice.description,
        },
      };

      await updateInvoiceMutation.mutateAsync(invoiceData, {
        onSuccess: () => {
          setIsEditInvoiceDialogOpen(false);
          refetchInvoices();
        },
        onError: (error: any) => {
          console.error("Invoice update failed:", error);
        },
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  };

  // Handle opening the delete confirmation dialog
  const handleDeleteInvoiceClick = (invoice: any) => {
    setDeletingInvoice(invoice);
    setIsDeleteInvoiceDialogOpen(true);
  };

  // Handle deleting an invoice
  const handleDeleteInvoice = async () => {
    if (!deletingInvoice || !deletingInvoice.id) return;

    try {
      await deleteInvoiceMutation.mutateAsync(deletingInvoice.id, {
        onSuccess: () => {
          setIsDeleteInvoiceDialogOpen(false);
          setDeletingInvoice(null);
          refetchInvoices();
        },
        onError: (error: any) => {
          console.error("Invoice deletion failed:", error);
        },
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
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
                  Цена за тонну:{" "}
                  <span className="text-orange-400">
                    {application.price_per_ton} {""}{" "}
                    {application.contract?.currency}
                  </span>
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

          {/* Payment Progress Bar */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Статус оплаты</h3>
              </div>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white hover:bg-blue-100"
                  onClick={() => setIsInvoiceDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Добавить счет
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Оплачено: {paidAmount.toLocaleString()}{" "}
                  {application?.currency ||
                    application?.contract?.currency ||
                    "₸"}
                </span>
                <span>
                  Всего: {totalAmount.toLocaleString()}{" "}
                  {application?.currency ||
                    application?.contract?.currency ||
                    "₸"}
                </span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
              <div className="text-xs text-right text-muted-foreground">
                {paymentProgress.toFixed(0)}% выполнено
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Детали заявки</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="wagons">Вагоны</TabsTrigger>
          <TabsTrigger value="invoices">Счета</TabsTrigger>
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
                          {application?.contract?.currency}
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
                {isAdmin && (
                  <Button
                    className="gap-2 bg-amber-500 hover:bg-amber-600"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Загрузить документ
                  </Button>
                )}
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
                          {isAdmin && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                              onClick={() => {
                                handleDeleteDocument(file.number);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Документы не найдены</p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => setIsUploadDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Добавить первый документ
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wagons" className="mt-4">
          <WagonRegistry
            wagons={application?.wagons || []}
            onAddWagon={open}
            onUpdateWagon={handleUpdateWagon}
            onDeleteWagon={handleDeleteWagon}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Счета</CardTitle>
                  <CardDescription>
                    Управление счетами по заявке
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button
                    className="gap-2 bg-blue-500 hover:bg-blue-600"
                    onClick={() => setIsInvoiceDialogOpen(true)}
                  >
                    <Receipt className="h-4 w-4" />
                    Добавить счет
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isInvoicesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span>Загрузка счетов...</span>
                </div>
              ) : invoices.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead>Файл</TableHead>
                        {isAdmin && (
                          <TableHead className="text-right">Действия</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.name || invoice.number}
                          </TableCell>
                          <TableCell>
                            {invoice.date ? formatDate(invoice.date) : "—"}
                          </TableCell>
                          <TableCell>
                            {invoice.amount?.toLocaleString()}{" "}
                            {application?.currency ||
                              application?.contract?.currency ||
                              "₸"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "success"
                                  : "outline"
                              }
                              className={
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              }
                            >
                              {invoice.status === "paid"
                                ? "Оплачен"
                                : "Ожидает оплаты"}
                            </Badge>
                          </TableCell>
                          <TableCell>{invoice.description || "—"}</TableCell>
                          <TableCell>
                            {invoice.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() =>
                                  handleFileDownload(
                                    invoice.file_url,
                                    `invoice-${
                                      invoice.name ||
                                      invoice.number ||
                                      invoice.id
                                    }.pdf`
                                  )
                                }
                              >
                                <Download className="h-4 w-4" />
                                Скачать
                              </Button>
                            )}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditInvoice(invoice)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleDeleteInvoiceClick(invoice)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Счета не найдены</p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => setIsInvoiceDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Добавить первый счет
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Статус оплаты:</span>
                  <span className="text-sm">
                    {paidAmount.toLocaleString()} /{" "}
                    {totalAmount.toLocaleString()}{" "}
                    {application?.currency ||
                      application?.contract?.currency ||
                      "₸"}
                  </span>
                </div>
                <Progress value={paymentProgress} className="h-2" />
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{paymentProgress.toFixed(0)}% выполнено</span>
                  <span>
                    Осталось: {(totalAmount - paidAmount).toLocaleString()}{" "}
                    {application?.currency ||
                      application?.contract?.currency ||
                      "₸"}
                  </span>
                </div>
              </div>
            </CardFooter>
          </Card>
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

      {/* Invoice Creation Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить счет</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом счете
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoice-name"
                value={newInvoice.name}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice-number" className="text-right">
                Номер
              </Label>
              <Input
                id="invoice-number"
                value={newInvoice.number}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, number: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice-date" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="invoice-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newInvoice.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newInvoice.date ? (
                        formatDate(newInvoice.date)
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        newInvoice.date ? new Date(newInvoice.date) : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setNewInvoice({
                            ...newInvoice,
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
              <Label htmlFor="invoice-amount" className="text-right">
                Сумма <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoice-amount"
                type="number"
                value={newInvoice.amount}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, amount: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice-status" className="text-right">
                Статус
              </Label>
              <Select
                value={newInvoice.status}
                onValueChange={(value) =>
                  setNewInvoice({ ...newInvoice, status: value })
                }
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="pending">Ожидает оплаты</SelectItem>
                  <SelectItem value="paid">Оплачен</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice-description" className="text-right">
                Описание
              </Label>
              <Input
                id="invoice-description"
                value={newInvoice.description}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, description: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invoice-file" className="text-right">
                Файл <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="invoice-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewInvoice({
                        ...newInvoice,
                        file: e.target.files[0],
                      });
                    }
                  }}
                />
                {newInvoice.file && (
                  <div className="flex items-center mt-2 text-sm">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="truncate max-w-[300px]">
                      {newInvoice.file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={() =>
                        setNewInvoice({ ...newInvoice, file: null })
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
              onClick={() => setIsInvoiceDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleCreateInvoice}
              disabled={
                createInvoiceMutation.isPending ||
                !newInvoice.name ||
                !newInvoice.amount ||
                !newInvoice.file
              }
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать счет"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog
        open={isEditInvoiceDialogOpen}
        onOpenChange={setIsEditInvoiceDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать счет</DialogTitle>
            <DialogDescription>Измените информацию о счете</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-invoice-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-invoice-name"
                value={editingInvoice?.name || ""}
                onChange={(e) =>
                  setEditingInvoice({ ...editingInvoice, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-invoice-number" className="text-right">
                Номер
              </Label>
              <Input
                id="edit-invoice-number"
                value={editingInvoice?.number || ""}
                onChange={(e) =>
                  setEditingInvoice({
                    ...editingInvoice,
                    number: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-invoice-date" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-invoice-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingInvoice?.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingInvoice?.date ? (
                        formatDate(editingInvoice.date)
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        editingInvoice?.date
                          ? new Date(editingInvoice.date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setEditingInvoice({
                            ...editingInvoice,
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
              <Label htmlFor="edit-invoice-amount" className="text-right">
                Сумма <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-invoice-amount"
                type="number"
                value={editingInvoice?.amount || ""}
                onChange={(e) =>
                  setEditingInvoice({
                    ...editingInvoice,
                    amount: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-invoice-status" className="text-right">
                Статус
              </Label>
              <Select
                value={editingInvoice?.status || "pending"}
                onValueChange={(value) =>
                  setEditingInvoice({ ...editingInvoice, status: value })
                }
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="pending">Ожидает оплаты</SelectItem>
                  <SelectItem value="paid">Оплачен</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-invoice-description" className="text-right">
                Описание
              </Label>
              <Input
                id="edit-invoice-description"
                value={editingInvoice?.description || ""}
                onChange={(e) =>
                  setEditingInvoice({
                    ...editingInvoice,
                    description: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditInvoiceDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateInvoice}
              disabled={
                updateInvoiceMutation.isPending ||
                !editingInvoice?.name ||
                !editingInvoice?.amount
              }
            >
              {updateInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invoice Confirmation Dialog */}
      <AlertDialog
        open={isDeleteInvoiceDialogOpen}
        onOpenChange={setIsDeleteInvoiceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить счет</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить счет{" "}
              {deletingInvoice?.name ||
                deletingInvoice?.number ||
                `#${deletingInvoice?.id}`}
              ? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              disabled={deleteInvoiceMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
