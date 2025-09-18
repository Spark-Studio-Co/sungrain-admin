"use client";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteApplicationFile } from "@/entities/applications/hooks/mutations/use-delete-application-file.mutation";
import { useDeleteUploadedDocuments } from "@/entities/applications/hooks/mutations/use-delete-upload-documents.mutation";
import { useUploadApplicationFiles } from "@/entities/applications/hooks/mutations/use-upload-application-files.mutation";
import { useUpdateApplicationFile } from "@/entities/applications/hooks/mutations/use-update-application-file.mutation";
import { useUploadDocumentsForUpload } from "@/entities/applications/hooks/mutations/use-upload-documents.mutation";
import { useGetApplication } from "@/entities/applications/hooks/query/use-get-application.query";
import { useCreateInvoice } from "@/entities/invoices/hooks/mutations/use-create-invoice.mutation";
import { useDeleteInvoice } from "@/entities/invoices/hooks/mutations/use-delete-invoice.mutation";
import { useUpdateInvoice } from "@/entities/invoices/hooks/mutations/use-update-invoice.mutation";
import { useGetInvoices } from "@/entities/invoices/hooks/query/use-get-invoices.query";
import { useDeleteWagon } from "@/entities/wagon/hooks/mutations/use-delete-wagon.mutation";
import { useUpdateWagon } from "@/entities/wagon/hooks/mutations/use-update-wagon.mutation";
import { cn } from "@/lib/utils";
import { WagonDetails } from "@/pages/contracts-inner-page/blocks/wagon-details";
import { WagonRegistry } from "@/pages/contracts-inner-page/blocks/wagon-registry";
import { apiClient } from "@/shared/api/apiClient";
import { usePopupStore } from "@/shared/model/popup-store";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CalendarIcon,
  CheckCircle2,
  CreditCard,
  Coins as DollarSign,
  Download,
  Edit,
  type File,
  FileText,
  Loader2,
  Package,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";

interface ApplicationDetailProps {
  applicationId: string;
  contractId: string;
  onBack: () => void;
}

export const ApplicationDetail = ({
  applicationId,
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

  // State for editing shipping document
  const [isEditShippingDocOpen, setIsEditShippingDocOpen] = useState(false);
  const [editingShippingDoc, setEditingShippingDoc] = useState<any>(null);

  // Comments state
  const [comments, setComments] = useState<
    Array<{
      id: string;
      text: string;
      author: string;
      created_at: string;
    }>
  >([]);
  const [newComment, setNewComment] = useState("");

  // State for shipping document upload dialog
  const [isCreateShippingDocOpen, setIsCreateShippingDocOpen] = useState(false);
  const [newShippingDoc, setNewShippingDoc] = useState({
    name: "",
    number: "",
    date: "",
  });

  // State for document deletion
  const [isDeleteDocDialogOpen, setIsDeleteDocDialogOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<any>(null);

  // States for edit document dialog
  const [isEditDocDialogOpen, setIsEditDocDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);

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
  const deleteUploadedDocs = useDeleteUploadedDocuments();
  const uploadFilesMutation = useUploadApplicationFiles();
  const updateApplicationFileMutation = useUpdateApplicationFile();
  const deleteFileByNumberMutation = useDeleteApplicationFile();
  const createInvoiceMutation = useCreateInvoice();
  const uploadDocumentsForUploadMutation = useUploadDocumentsForUpload();

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

  // Get shipping documents from documents_for_upload array
  const shippingDocuments = application?.documents_for_upload || [];

  // useEffect(() => {
  //   if (
  //     shippingDocuments.length > 0 &&
  //     shippingDocuments[0]?.id &&
  //     shippingDocuments[0]?.files
  //   ) {
  //     updateUploadStatus(shippingDocuments[0].id, true);
  //   }
  // }, [shippingDocuments.length]);

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

    try {
      // Check if the URL is relative or absolute
      const url = fileUrl.startsWith("http")
        ? fileUrl
        : `${process.env.NEXT_PUBLIC_API_URL || ""}${fileUrl}`;

      console.log("Attempting to download file:", url);

      // For URLs with encoding issues, try to open in a new tab
      if (url.includes("%") || /[а-яА-Я]/.test(url) || url.includes("+")) {
        window.open(url, "_blank");
        console.log("Opening file in new tab due to special characters in URL");
        return;
      }

      // Create a fetch request to check if the file exists and is accessible
      fetch(url, { method: "HEAD" })
        .then((response) => {
          if (response.ok) {
            // File exists, create download link
            const link = document.createElement("a");
            window.open(url, "_blank");
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log("File download initiated");
          } else {
            // File doesn't exist or isn't accessible, open in new tab
            window.open(url, "_blank");
            console.log("Opening file in new tab as direct download failed");
          }
        })
        .catch((error) => {
          console.error("Error checking file:", error);
          // On error, try opening in new tab
          window.open(url, "_blank");
          console.log("Opening file in new tab as fallback");
        });
    } catch (error) {
      console.error("Error in handleFileDownload:", error);
      // Final fallback - try to open in new tab
      try {
        window.open(fileUrl, "_blank");
      } catch (e) {
        console.error("Failed to open file in new tab:", e);
      }
    }
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

  const handleEditShippingDocClick = (doc: any) => {
    setEditingShippingDoc({
      id: doc.id,
      name: doc.name || "",
      number: doc.number || "",
      date: doc.date || "",
      isUploaded: doc.isUploaded || false,
    });
    setIsEditShippingDocOpen(true);
  };

  // Update upload status
  const updateUploadStatus = async (
    id: number | string,
    isUploaded: boolean
  ) => {
    try {
      console.log(
        `Updating status for document ${id} to ${
          isUploaded ? "uploaded" : "pending"
        }`
      );

      const response = await apiClient.patch(
        `/application/${id}/upload-status`,
        {
          isUploaded,
        }
      );

      // Refresh the data to show updated status
      await refetch();

      console.log("Status update successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating upload status:", error);
      throw error;
    }
  };

  const handleDeleteDocumentClick = (doc: any) => {
    setDeletingDoc(doc);
    setIsDeleteDocDialogOpen(true);
  };

  const handleEditDocumentClick = (doc: any) => {
    setEditingDocument({
      ...doc,
      // Сохраняем оригинальные данные для возможности отмены
      originalName: doc.name,
      originalNumber: doc.number,
      originalDate: doc.date,
    });
    setIsEditDocDialogOpen(true);
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument) return;

    try {
      await updateApplicationFileMutation.mutateAsync({
        applicationId: applicationId,
        fileNumber: editingDocument.number || editingDocument.originalNumber,
        name: editingDocument.name,
        number: editingDocument.number,
        date: editingDocument.date,
        file: editingDocument.file,
      });

      setIsEditDocDialogOpen(false);
      setEditingDocument(null);
      refetch(); // Обновляем данные
    } catch (error) {
      console.error("Error updating document:", error);
    }
  };

  const handleDeleteDocument = async () => {
    try {
      // Check if this is a shipping document (from documents_for_upload)
      const isShippingDoc = shippingDocuments.some(
        (doc: any) => doc.id === deletingDoc.id
      );

      if (isShippingDoc) {
        // Use deleteUploadedDocs for shipping documents with document ID
        await deleteUploadedDocs.mutateAsync(
          deletingDoc.id // Use document ID directly
        );
      } else {
        // Use deleteFileByNumberMutation for regular documents
        await deleteFileByNumberMutation.mutateAsync({
          applicationId: application?.id || applicationId,
          docNumber: deletingDoc.number,
        });
      }

      setIsDeleteDocDialogOpen(false);
      setDeletingDoc(null);
      refetch();

      // If we deleted the last shipping document, update the upload status
      if (isShippingDoc && shippingDocuments.length <= 1 && deletingDoc.id) {
        updateUploadStatus(deletingDoc.id, false);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.name || !newInvoice.amount || !newInvoice.file) {
      return;
    }

    try {
      const invoiceData = {
        applicationId,
        name: newInvoice.name,
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

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice({
      ...invoice,
      name: invoice.name || "",
      date: invoice.date || "",
      amount: invoice.amount?.toString() || "",
      status: invoice.status || "pending",
      description: invoice.description || "",
      file: null,
    });
    setIsEditInvoiceDialogOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice || !editingInvoice.id) return;

    try {
      const invoiceData: any = {
        id: editingInvoice.id,
        applicationId: applicationId,
        data: {
          name: editingInvoice.name,
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
      await deleteInvoiceMutation.mutateAsync(
        { applicationId: applicationId, id: deletingInvoice.id },
        {
          onSuccess: () => {
            setIsDeleteInvoiceDialogOpen(false);
            setDeletingInvoice(null);
            refetchInvoices();
          },
          onError: (error: any) => {
            console.error("Invoice deletion failed:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  // Handle adding a comment
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    // In a real app, you would call an API to save the comment
    const newCommentObj = {
      id: Date.now().toString(),
      text: newComment,
      author: "Текущий пользователь",
      created_at: new Date().toISOString(),
    };

    setComments([...comments, newCommentObj]);
    setNewComment("");
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
      <Card className="overflow-hidden border-white-100 shadow-md">
        <CardHeader className="pb-2 bg-gradient-to-r from-white-50 to-white-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white-100 rounded-full">
              <FileText className="h-6 w-6 text-white-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Заявка по договору</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {application?.created_at
                  ? formatDate(application?.created_at)
                  : "Дата не указана"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Объем</p>
                <p className="font-medium">
                  {application?.volume ? formatNumber(application.volume) : 0}{" "}
                  тонн
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Package className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Культура</p>
                <p className="font-medium">
                  {application?.culture === "wheat"
                    ? "Пшеница мягкая 5 класса"
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
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Цена за тонну
                </p>
                <p className="font-medium text-green-600">
                  {application.price_per_ton} {application.contract?.currency}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-500">Общая сумма</p>
                <p className="font-medium ">
                  {application?.total_amount
                    ? formatCurrency(application.total_amount)
                    : 0}{" "}
                  {application?.currency ||
                    application?.contract?.currency ||
                    "₸"}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div className="mt-4 p-4 bg-white-50 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-white-500" />
                <h3 className="font-medium">Статус оплаты</h3>
              </div>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-white hover:bg-white-100"
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
                  Оплачено: {formatCurrency(paidAmount)}{" "}
                  {application?.currency ||
                    application?.contract?.currency ||
                    "₸"}
                </span>
                <span>
                  Всего: {formatCurrency(totalAmount)}{" "}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="details">Детали заявки</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="wagons-details">Детали вагонов</TabsTrigger>
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
                        <span className="text-sm">Дата</span>
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
                            ? formatNumber(application.volume)
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
                            ? formatCurrency(application.price_per_ton)
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
                        <span className="font-medium ">
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
                      <div className="flex justify-between"></div>
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
                        <span className="text-sm">Комментарий:</span>
                        <span>{application?.comment || "Не указан"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="wagons-details" className="mt-4">
          <WagonDetails
            wagons={application?.wagons}
            handleFileDownload={handleFileDownload}
          />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="pb-2 ">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white-200 rounded-full">
                    <FileText className="h-5 w-5 text-white-700" />
                  </div>
                  <div>
                    <CardTitle>Документы заявки</CardTitle>
                    <CardDescription>
                      Управление документами по заявке
                    </CardDescription>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    className="gap-2 !bg-primary shadow-sm"
                    onClick={() => setIsUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Загрузить документ
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {application?.files && application.files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {application.files.map((file: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white border border-white-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="bg-white-50 p-3 border-b border-white-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-white-600" />
                          <span className="font-medium text-white-800  max-w-[180px]">
                            {file.name || `Документ ${index + 1}`}
                          </span>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-50 rounded-full"
                              onClick={() => handleEditDocumentClick(file)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 rounded-full"
                              onClick={() => handleDeleteDocumentClick(file)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Номер:</span>
                          <span className="font-medium">
                            {file.number || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Дата:</span>
                          <span className="font-medium">
                            {file.date ? formatDate(file.date) : "—"}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 gap-2 border-white-200 text-white-700 hover:bg-white-50"
                          onClick={() => {
                            const filePath =
                              file.location || file.file || file.path || "";
                            handleFileDownload(
                              filePath,
                              file.name || `document-${index + 1}.pdf`
                            );
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Скачать документ
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border rounded-md bg-white-50/50 border-white-100">
                  <div className="bg-white-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-white-600" />
                  </div>
                  <h3 className="text-lg font-medium text-white-800 mb-2">
                    Документы не найдены
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    К этой заявке еще не прикреплены документы. Добавьте первый
                    документ, чтобы начать работу.
                  </p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="gap-2 border-white-300 text-white-700 hover:bg-white-100"
                      onClick={() => setIsUploadDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Добавить первый документ
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {application?.files && application.files.length > 0 && (
              <CardFooter className="bg-white-50 border-t border-white-100 py-3 px-6">
                <div className="flex items-center gap-2 text-sm text-white-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Всего документов: {application.files.length}</span>
                </div>
              </CardFooter>
            )}
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
                    className="gap-2 bg-white-500 hover:bg-white-600"
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
                                  : "bg-white-100 text-white-800 hover:bg-white-100"
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
                                onClick={() => {
                                  const filePath =
                                    invoice.file_url ||
                                    invoice.file ||
                                    invoice.location ||
                                    "";
                                  handleFileDownload(
                                    filePath,
                                    `invoice-${
                                      invoice.name ||
                                      invoice.number ||
                                      invoice.id
                                    }.pdf`
                                  );
                                }}
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
                    <FileText className="h-4 w-4 mr-2 text-white-500" />
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
      <Dialog
        open={isEditShippingDocOpen}
        onOpenChange={setIsEditShippingDocOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Изменить статус документа</DialogTitle>
            <DialogDescription>
              Управление статусом документа для отгрузки
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-shipping-doc-name" className="text-right">
                Название
              </Label>
              <div className="col-span-3">
                <p className="text-sm font-medium">
                  {editingShippingDoc?.name || ""}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-shipping-doc-number" className="text-right">
                Номер
              </Label>
              <div className="col-span-3">
                <p className="text-sm">
                  {editingShippingDoc?.number || "Не указан"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-shipping-doc-date" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <p className="text-sm">
                  {editingShippingDoc?.date
                    ? formatDate(editingShippingDoc.date)
                    : "Не указана"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-shipping-doc-status" className="text-right">
                Статус <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Select
                  value={
                    editingShippingDoc?.isUploaded ? "uploaded" : "pending"
                  }
                  onValueChange={(value) => {
                    setEditingShippingDoc({
                      ...editingShippingDoc,
                      isUploaded: value === "uploaded",
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploaded">Загружен</SelectItem>
                    <SelectItem value="pending">Ожидает загрузки</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditShippingDocOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={() => {
                if (editingShippingDoc && editingShippingDoc.id) {
                  updateUploadStatus(
                    editingShippingDoc.id,
                    editingShippingDoc.isUploaded
                  )
                    .then(() => {
                      setIsEditShippingDocOpen(false);
                    })
                    .catch((error) => {
                      console.error("Error updating status:", error);
                      alert(
                        "Ошибка при обновлении статуса. Пожалуйста, попробуйте снова."
                      );
                    });
                }
              }}
              className="bg-white-500 hover:bg-white-600"
            >
              Сохранить статус
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isDeleteDocDialogOpen}
        onOpenChange={setIsDeleteDocDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить документ</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить документ "{deletingDoc?.name}"? Это
              действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              disabled={deleteFileByNumberMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteFileByNumberMutation.isPending ? (
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
              {/* <Label htmlFor="invoice-number" className="text-right">
                Номер
              </Label>
              <Input
                id="invoice-number"
                value={newInvoice.number}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, number: e.target.value })
                }
                className="col-span-3"
              /> */}
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
                    <FileText className="h-4 w-4 mr-2 text-white-500" />
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
              {/* <Label htmlFor="edit-invoice-number" className="text-right">
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
              /> */}
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
              className="bg-destructive text-white hover:bg-destructive/90"
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
      <Dialog
        open={isCreateShippingDocOpen}
        onOpenChange={setIsCreateShippingDocOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Создать документ для отгрузки</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом документе для отгрузки
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shipping-doc-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shipping-doc-name"
                value={newShippingDoc.name}
                onChange={(e) =>
                  setNewShippingDoc({ ...newShippingDoc, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shipping-doc-number" className="text-right">
                Номер
              </Label>
              <Input
                id="shipping-doc-number"
                value={newShippingDoc.number}
                onChange={(e) =>
                  setNewShippingDoc({
                    ...newShippingDoc,
                    number: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shipping-doc-date" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="shipping-doc-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newShippingDoc.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newShippingDoc.date ? (
                        formatDate(newShippingDoc.date)
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        newShippingDoc.date
                          ? new Date(newShippingDoc.date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setNewShippingDoc({
                            ...newShippingDoc,
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateShippingDocOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={() => {
                if (!newShippingDoc.name) return;

                // Create a simple object with just the required data
                const documentData = {
                  name: newShippingDoc.name,
                  applicationId: applicationId,
                };

                // Add optional fields if they exist
                if (newShippingDoc.number)
                  documentData.number = newShippingDoc.number;
                if (newShippingDoc.date)
                  documentData.date = newShippingDoc.date;

                // Send the document data
                uploadDocumentsForUploadMutation.mutate(documentData, {
                  onSuccess: () => {
                    setIsCreateShippingDocOpen(false);
                    setNewShippingDoc({
                      name: "",
                      number: "",
                      date: "",
                    });
                    refetch();
                  },
                  onError: (error) => {
                    console.error("Error creating shipping document:", error);
                    alert(
                      "Ошибка при создании документа. Пожалуйста, попробуйте снова."
                    );
                  },
                });
              }}
              disabled={
                uploadDocumentsForUploadMutation.isPending ||
                !newShippingDoc.name
              }
              className="bg-white-500 hover:bg-white-600"
            >
              {uploadDocumentsForUploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать документ"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={isEditDocDialogOpen} onOpenChange={setIsEditDocDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать документ</DialogTitle>
            <DialogDescription>
              Измените информацию о документе и при необходимости загрузите
              новый файл
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-doc-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-doc-name"
                value={editingDocument?.name || ""}
                onChange={(e) =>
                  setEditingDocument({
                    ...editingDocument,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-doc-number" className="text-right">
                Номер
              </Label>
              <Input
                id="edit-doc-number"
                value={editingDocument?.number || ""}
                onChange={(e) =>
                  setEditingDocument({
                    ...editingDocument,
                    number: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-doc-date" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-doc-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingDocument?.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingDocument?.date ? (
                        formatDate(editingDocument.date)
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        editingDocument?.date
                          ? new Date(editingDocument.date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setEditingDocument({
                            ...editingDocument,
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
              <Label htmlFor="edit-doc-file" className="text-right">
                Новый файл
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-doc-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditingDocument({
                        ...editingDocument,
                        file: e.target.files[0],
                      });
                    }
                  }}
                />
                {editingDocument?.file && (
                  <div className="flex items-center mt-2 text-sm">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="truncate max-w-[300px]">
                      {editingDocument.file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={() =>
                        setEditingDocument({ ...editingDocument, file: null })
                      }
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Оставьте пустым, если не хотите заменять файл
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDocDialogOpen(false);
                setEditingDocument(null);
              }}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateDocument}
              disabled={
                updateApplicationFileMutation.isPending ||
                !editingDocument?.name
              }
            >
              {updateApplicationFileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обновление...
                </>
              ) : (
                "Обновить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
