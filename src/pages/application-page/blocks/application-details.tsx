"use client";

import type React from "react";

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
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
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
import { useUpdateWagon } from "@/entities/wagon/hooks/mutations/use-update-wagon.mutation";
import { useDeleteWagon } from "@/entities/wagon/hooks/mutations/use-delete-wagon.mutation";
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
import { useGetApplication } from "@/entities/applications/hooks/query/use-get-application.query";
import { useUploadApplicationFiles } from "@/entities/applications/hooks/mutations/use-upload-application-files.mutation";
import { useDeleteApplicationFile } from "@/entities/applications/hooks/mutations/use-delete-application-file.mutation";
import { useUploadDocumentsForUpload } from "@/entities/applications/hooks/mutations/use-upload-documents-for-upload.mutation";
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

import { useGetInvoices } from "@/entities/invoices/hooks/query/use-get-invoices.query";
import { useCreateInvoice } from "@/entities/invoices/hooks/mutations/use-create-invoice.mutation";
import { useUpdateInvoice } from "@/entities/invoices/hooks/mutations/use-update-invoice.mutation";
import { useDeleteInvoice } from "@/entities/invoices/hooks/mutations/use-delete-invoice.mutation";
import { WagonDetails } from "@/pages/contracts-inner-page/blocks/wagon-details";

interface ApplicationDetailProps {
  applicationId: string;
  contractId: string;
  onBack: () => void;
}

// Initial shipping document types
const initialShippingDocuments = [
  { id: "tlg", name: "ТЛГ + инструкция", required: true },
  { id: "ikr", name: "ИКР", required: true },
  { id: "invoice", name: "Счет-фактура", required: true },
  { id: "quality", name: "Паспорта качества", required: true },
  { id: "transit", name: "Коды транзитные", required: true },
  { id: "st1", name: "СТ-1", required: false },
  { id: "rgp", name: "РГП", required: false },
  { id: "phyto", name: "Фито", required: false },
  { id: "ds", name: "ДС", required: false },
];

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

  // State for upload documents for upload dialog
  const [isUploadForUploadDialogOpen, setIsUploadForUploadDialogOpen] =
    useState(false);
  const [newUploadDocument, setNewUploadDocument] = useState({
    name: "",
    number: "",
    date: "",
    file: null as File | null,
  });

  const [isEditInvoiceDialogOpen, setIsEditInvoiceDialogOpen] = useState(false);
  const [isDeleteInvoiceDialogOpen, setIsDeleteInvoiceDialogOpen] =
    useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<any>(null);

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
  const [isShippingDocUploadOpen, setIsShippingDocUploadOpen] = useState(false);
  const [selectedShippingDoc, setSelectedShippingDoc] = useState<any>(null);

  // State for shipping documents
  const [shippingDocuments, setShippingDocuments] = useState(
    initialShippingDocuments
  );
  const [isAddDocTypeDialogOpen, setIsAddDocTypeDialogOpen] = useState(false);
  const [newDocType, setNewDocType] = useState({ name: "", required: false });
  const [isEditDocTypeDialogOpen, setIsEditDocTypeDialogOpen] = useState(false);
  const [editingDocType, setEditingDocType] = useState<any>(null);

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
  const uploadDocumentsForUploadMutation = useUploadDocumentsForUpload();
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

  // Get the list of uploaded document names to check shipping document status
  const uploadedDocumentNames = application?.files
    ? application.files.map((file: any) => file.name?.toLowerCase())
    : [];

  // Check if a shipping document is uploaded
  const isDocumentUploaded = (docName: string) => {
    if (!uploadedDocumentNames.length) return false;

    // Check if any uploaded document name contains the shipping document name
    return uploadedDocumentNames.some(
      (name: string) => name && name.includes(docName.toLowerCase())
    );
  };

  // Calculate shipping documents completion percentage
  const calculateDocumentsCompletion = () => {
    if (!shippingDocuments.length) return 0;

    const requiredDocs = shippingDocuments.filter((doc) => doc.required);
    if (!requiredDocs.length) return 100;

    const uploadedRequiredDocs = requiredDocs.filter((doc) =>
      isDocumentUploaded(doc.name)
    );

    return Math.round(
      (uploadedRequiredDocs.length / requiredDocs.length) * 100
    );
  };

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
    link.setAttribute("target", "_blank");

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
            setIsUploadDialogOpen(false);
            setNewDocument({
              name: "",
              number: "",
              date: "",
              file: null,
            });
            // Refetch after a short delay to ensure the backend has processed the file
            setTimeout(() => {
              refetch();
            }, 500);
          },
          onError: (error) => {
            console.error("Upload failed:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };

  // Handle document for upload upload
  const handleDocumentForUploadUpload = async () => {
    if (!newUploadDocument.file || !newUploadDocument.name) return;

    try {
      const filesInfo = [
        {
          name: newUploadDocument.name,
          number: newUploadDocument.number || "",
          date: newUploadDocument.date || "",
        },
      ];

      await uploadDocumentsForUploadMutation.mutateAsync(
        {
          applicationId,
          files: [newUploadDocument.file],
          filesInfo,
        },
        {
          onSuccess: () => {
            console.log("✅ Document for upload uploaded successfully!");
            setIsUploadForUploadDialogOpen(false);
            setNewUploadDocument({
              name: "",
              number: "",
              date: "",
              file: null,
            });
            // Refetch after a short delay to ensure the backend has processed the file
            setTimeout(() => {
              refetch();
            }, 500);
          },
          onError: (error) => {
            console.error("Upload failed:", error);
          },
        }
      );
    } catch (error) {
      console.error("Error uploading document for upload:", error);
    }
  };

  // Handle shipping document upload
  const handleShippingDocUpload = async () => {
    if (!newDocument.file || !selectedShippingDoc) return;

    try {
      const filesInfo = [
        {
          name: selectedShippingDoc.name,
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
            console.log("✅ Shipping document uploaded successfully!");
            refetch();
            setIsShippingDocUploadOpen(false);
            setSelectedShippingDoc(null);
          },
          onError: (error) => {
            console.error("Upload failed:", error);
          },
        }
      );

      setNewDocument({
        name: "",
        number: "",
        date: "",
        file: null,
      });
    } catch (error) {
      console.error("Error uploading shipping document:", error);
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

  // Open shipping document upload dialog
  const openShippingDocUpload = (doc: any) => {
    setSelectedShippingDoc(doc);
    setNewDocument({
      name: doc.name,
      number: "",
      date: "",
      file: null,
    });
    setIsShippingDocUploadOpen(true);
  };

  // Handle adding a new document type
  const handleAddDocType = () => {
    if (!newDocType.name.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newDoc = {
      id: newId,
      name: newDocType.name,
      required: newDocType.required,
    };

    setShippingDocuments([...shippingDocuments, newDoc]);
    setNewDocType({ name: "", required: false });
    setIsAddDocTypeDialogOpen(false);
  };

  // Handle editing a document type
  const openEditDocType = (doc: any) => {
    setEditingDocType({
      id: doc.id,
      name: doc.name,
      required: doc.required,
    });
    setIsEditDocTypeDialogOpen(true);
  };

  const handleUpdateDocType = () => {
    if (!editingDocType || !editingDocType.name.trim()) return;

    const updatedDocs = shippingDocuments.map((doc) =>
      doc.id === editingDocType.id ? editingDocType : doc
    );

    setShippingDocuments(updatedDocs);
    setIsEditDocTypeDialogOpen(false);
  };

  // Handle deleting a document type
  const handleDeleteDocType = (docId: string) => {
    const updatedDocs = shippingDocuments.filter((doc) => doc.id !== docId);
    setShippingDocuments(updatedDocs);
  };

  // Handle file drop for document upload
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>, doc: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedShippingDoc(doc);
      setNewDocument({
        name: doc.name,
        number: "",
        date: "",
        file: file,
      });
      setIsShippingDocUploadOpen(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="details">Детали заявки</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="shipping-docs">
            Документы для отгрузки
          </TabsTrigger>
          <TabsTrigger value="upload-docs">Документы для загрузки</TabsTrigger>
          <TabsTrigger value="wagons-details">Детали вагонов</TabsTrigger>
          <TabsTrigger value="wagons">Вагоны</TabsTrigger>
          <TabsTrigger value="invoices">Счета</TabsTrigger>
        </TabsList>

        <TabsContent value="upload-docs" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Документы для загрузки</CardTitle>
                  <CardDescription>
                    Управление документами для загрузки
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button
                    className="gap-2 bg-purple-500 hover:bg-purple-600"
                    onClick={() => setIsUploadForUploadDialogOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Загрузить документ
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {application?.documents_for_upload &&
              application.documents_for_upload.length > 0 ? (
                <div className="bg-purple-50 p-3 rounded-md">
                  <div className="bg-white p-4 rounded-md border border-purple-100">
                    <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <div className="col-span-1">№</div>
                      <div className="col-span-3">Наименование</div>
                      <div className="col-span-2">Номер</div>
                      <div className="col-span-3">Дата документа</div>
                      <div className="col-span-2">Файл</div>
                      <div className="col-span-1"></div>
                    </div>

                    {application.documents_for_upload.map(
                      (doc: any, index: number) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 mb-3 items-center"
                        >
                          <div className="col-span-1 text-center">
                            {index + 1}
                          </div>
                          <div className="col-span-3">
                            <div className="truncate">
                              {doc.name || `Документ ${index + 1}`}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <div className="truncate">{doc.number || "—"}</div>
                          </div>
                          <div className="col-span-3">
                            <div className="truncate">
                              {doc.date ? formatDate(doc.date) : "—"}
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                handleFileDownload(
                                  doc.files?.path || doc.files?.location || "",
                                  doc.name || `upload-doc-${index + 1}.pdf`
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
                                  handleDeleteDocument(doc.number);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Документы для загрузки не найдены
                  </p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => setIsUploadForUploadDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Добавить первый документ для загрузки
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping-docs" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Документы для отгрузки</CardTitle>
                  <CardDescription>
                    Статус документов, необходимых для отгрузки
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => setIsAddDocTypeDialogOpen(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить тип документа
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress indicator */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-700">
                    Статус готовности документов
                  </h3>
                  <span className="text-sm font-medium">
                    {calculateDocumentsCompletion()}% завершено
                  </span>
                </div>
                <Progress
                  value={calculateDocumentsCompletion()}
                  className="h-2"
                  color={
                    calculateDocumentsCompletion() === 100 ? "bg-green-500" : ""
                  }
                />
                <p className="text-sm text-gray-500 mt-2">
                  {calculateDocumentsCompletion() === 100
                    ? "Все необходимые документы загружены"
                    : "Загрузите все необходимые документы для отгрузки"}
                </p>
              </div>

              {/* Document cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shippingDocuments.map((doc) => {
                  const isUploaded = isDocumentUploaded(doc.name);
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        "rounded-lg shadow-sm transition-all duration-200 hover:shadow-md",
                        isUploaded
                          ? "bg-green-50 border border-green-200"
                          : "bg-white border border-gray-200 hover:border-red-200"
                      )}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleFileDrop(e, doc)}
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "p-2 rounded-full",
                                isUploaded ? "bg-green-100" : "bg-gray-100"
                              )}
                            >
                              <FileText
                                className={cn(
                                  "h-5 w-5",
                                  isUploaded
                                    ? "text-green-600"
                                    : "text-gray-500"
                                )}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium">{doc.name}</h3>
                              <p className="text-xs text-gray-500">
                                {doc.required
                                  ? "Обязательный"
                                  : "Необязательный"}
                              </p>
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openEditDocType(doc)}
                              >
                                <Edit className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDeleteDocType(doc.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isUploaded ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium text-green-600">
                                  Загружен
                                </span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <span className="text-sm font-medium text-red-500">
                                  Не загружен
                                </span>
                              </>
                            )}
                          </div>

                          {!isUploaded && isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 border-dashed border-gray-300 hover:bg-gray-50"
                              onClick={() => openShippingDocUpload(doc)}
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span className="text-xs">Загрузить</span>
                            </Button>
                          )}

                          {isUploaded && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="text-xs">Просмотр</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span className="text-xs">Скачать</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Drag & drop area */}
                      {!isUploaded && (
                        <div className="px-4 pb-4">
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => openShippingDocUpload(doc)}
                          >
                            <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Перетащите файл сюда или нажмите для загрузки
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {shippingDocuments.length === 0 && (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Документы для отгрузки не определены
                  </p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => setIsAddDocTypeDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Добавить первый тип документа
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Документы договора
                      </h3>
                      <div className="bg-muted/50 p-4 rounded-md">
                        {application?.contract?.files &&
                        application.contract.files.length > 0 ? (
                          <div className="space-y-3">
                            {application.contract.files.map(
                              (file: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm">
                                      {file.name || `Документ ${index + 1}`}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() =>
                                      handleFileDownload(
                                        file.location,
                                        file.name ||
                                          `contract-doc-${index + 1}.pdf`
                                      )
                                    }
                                  >
                                    <Download className="h-4 w-4" />
                                    <span className="text-xs">Скачать</span>
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-3">
                            <p className="text-sm text-muted-foreground">
                              Документы договора не найдены
                            </p>
                          </div>
                        )}
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

      {/* Document For Upload Dialog */}
      <Dialog
        open={isUploadForUploadDialogOpen}
        onOpenChange={setIsUploadForUploadDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Загрузить документ для загрузки</DialogTitle>
            <DialogDescription>
              Заполните информацию о документе и загрузите файл
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upload-doc-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="upload-doc-name"
                value={newUploadDocument.name}
                onChange={(e) =>
                  setNewUploadDocument({
                    ...newUploadDocument,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upload-doc-number" className="text-right">
                Номер
              </Label>
              <Input
                id="upload-doc-number"
                value={newUploadDocument.number}
                onChange={(e) =>
                  setNewUploadDocument({
                    ...newUploadDocument,
                    number: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="upload-doc-date" className="text-right">
                Дата
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="upload-doc-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newUploadDocument.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newUploadDocument.date ? (
                        formatDate(newUploadDocument.date)
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        newUploadDocument.date
                          ? new Date(newUploadDocument.date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setNewUploadDocument({
                            ...newUploadDocument,
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
              <Label htmlFor="upload-doc-file" className="text-right">
                Файл <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="upload-doc-file"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewUploadDocument({
                        ...newUploadDocument,
                        file: e.target.files[0],
                      });
                    }
                  }}
                />
                {newUploadDocument.file && (
                  <div className="flex items-center mt-2 text-sm">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="truncate max-w-[300px]">
                      {newUploadDocument.file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 ml-2"
                      onClick={() =>
                        setNewUploadDocument({
                          ...newUploadDocument,
                          file: null,
                        })
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
              onClick={() => setIsUploadForUploadDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleDocumentForUploadUpload}
              disabled={
                uploadDocumentsForUploadMutation.isPending ||
                !newUploadDocument.name ||
                !newUploadDocument.file
              }
            >
              {uploadDocumentsForUploadMutation.isPending ? (
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

      {/* Shipping Document Upload Dialog */}
      <Dialog
        open={isShippingDocUploadOpen}
        onOpenChange={setIsShippingDocUploadOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Загрузить документ для отгрузки</DialogTitle>
            <DialogDescription>
              Загрузите файл документа "{selectedShippingDoc?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shipping-doc-number" className="text-right">
                Номер
              </Label>
              <Input
                id="shipping-doc-number"
                value={newDocument.number}
                onChange={(e) =>
                  setNewDocument({ ...newDocument, number: e.target.value })
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
              <Label htmlFor="shipping-doc-file" className="text-right">
                Файл <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="shipping-doc-file"
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
              onClick={() => setIsShippingDocUploadOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleShippingDocUpload}
              disabled={uploadFilesMutation.isPending || !newDocument.file}
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

      {/* Add Document Type Dialog */}
      <Dialog
        open={isAddDocTypeDialogOpen}
        onOpenChange={setIsAddDocTypeDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Добавить тип документа</DialogTitle>
            <DialogDescription>
              Укажите название и требования для нового типа документа
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-type-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doc-type-name"
                value={newDocType.name}
                onChange={(e) =>
                  setNewDocType({ ...newDocType, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-type-required" className="text-right">
                Обязательный
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="doc-type-required"
                  checked={newDocType.required}
                  onChange={(e) =>
                    setNewDocType({ ...newDocType, required: e.target.checked })
                  }
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm text-gray-600">
                  Отметьте, если документ обязателен для отгрузки
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDocTypeDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleAddDocType}
              disabled={!newDocType.name.trim()}
            >
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Type Dialog */}
      <Dialog
        open={isEditDocTypeDialogOpen}
        onOpenChange={setIsEditDocTypeDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать тип докумен��а</DialogTitle>
            <DialogDescription>
              Измените название и требования для типа документа
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-doc-type-name" className="text-right">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-doc-type-name"
                value={editingDocType?.name || ""}
                onChange={(e) =>
                  setEditingDocType({ ...editingDocType, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-doc-type-required" className="text-right">
                Обязательный
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="checkbox"
                  id="edit-doc-type-required"
                  checked={editingDocType?.required || false}
                  onChange={(e) =>
                    setEditingDocType({
                      ...editingDocType,
                      required: e.target.checked,
                    })
                  }
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm text-gray-600">
                  Отметьте, если документ обязателен для отгрузки
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDocTypeDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleUpdateDocType}
              disabled={!editingDocType?.name?.trim()}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialogs */}
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
    </div>
  );
};
