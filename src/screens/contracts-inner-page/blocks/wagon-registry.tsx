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
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetOwners } from "@/entities/owner/hooks/query/use-get-owners.query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteWagonFiles } from "@/entities/wagon/api/delete/delete-wagon-files.api";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  Plus,
  TrainFront,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/shared/api/apiClient";
import { sortWagonsByStatusGroup } from "@/shared/contracts/wagon-sort";
import {
  getWagonStatusMeta,
  WAGON_STATUS_OPTIONS,
  WagonStatusBadge,
} from "@/shared/contracts/wagon-status";
import {
  isWagonShipmentStartedStatus,
  normalizeWagonStatus,
} from "@/shared/contracts/wagon-status-data";

interface WagonRegistryProps {
  wagons: any[];
  onAddWagon: () => void;
  onUpdateWagon?: (wagonId: string | number, data: any) => Promise<void>;
  onDeleteWagon?: (wagonId: string | number) => Promise<void>;
}

export const WagonRegistry = ({
  wagons,
  onAddWagon,
  onUpdateWagon,
  onDeleteWagon,
}: WagonRegistryProps) => {
  const [isAdmin] = useState<boolean | null>(() => {
    const storedAdminStatus = localStorage.getItem("isAdmin");
    return storedAdminStatus ? JSON.parse(storedAdminStatus) : null;
  });

  const [editingWagon, setEditingWagon] = useState<any>(null);
  const [deletingWagon, setDeletingWagon] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    data: ownersData,
    isLoading: isLoadingOwners,
    isError: isErrorOwners,
  } = useGetOwners(1, 100);
  const sortedWagons = useMemo(
    () => sortWagonsByStatusGroup(wagons || []),
    [wagons]
  );

  // Add a separate state for tracking the unloading date
  const [unloadingDate, setUnloadingDate] = useState<string | null>(null);

  // State for documents in the editing modal
  const [documents, setDocuments] = useState<
    Array<{
      name: string;
      number: string;
      date: string;
      file?: File;
      fileName?: string;
      id?: string | number;
      location?: string;
    }>
  >([]);
  const [documentFileErrors, setDocumentFileErrors] = useState<
    Record<number, string>
  >({});

  const maxDocumentSize = 20 * 1024 * 1024;
  const acceptedDocumentExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".txt",
  ];

  // Update unloadingDate when editingWagon changes
  useEffect(() => {
    if (editingWagon) {
      setUnloadingDate(editingWagon.date_of_unloading || null);
    }
  }, [editingWagon]);

  // Open edit dialog and set up editing state
  const handleEditWagon = (wagon: any) => {
    const normalizedStatus = normalizeWagonStatus(wagon.status);
    const editableStatus = WAGON_STATUS_OPTIONS.some(
      (status) => status.value === normalizedStatus
    )
      ? normalizedStatus
      : wagon.status;

    setEditingWagon({
      ...wagon,
      status: editableStatus,
      capacity: wagon.capacity?.toString() || "",
      real_weight: wagon.real_weight?.toString() || "",
      date_of_departure: wagon.date_of_departure || "",
      date_of_unloading: wagon.date_of_unloading || "",
    });

    // Initialize the unloading date
    setUnloadingDate(wagon.date_of_unloading || null);

    // Set up documents for editing
    if (wagon.files && Array.isArray(wagon.files)) {
      setDocuments(
        wagon.files.map((file: any) => ({
          id: file.id,
          name: file.name || "Документ",
          number: file.number || "",
          date: file.date || "",
          fileName: file.name,
          location: typeof file === "string" ? file : file.location,
        }))
      );
    } else {
      setDocuments([]);
    }
    setDocumentFileErrors({});
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (wagon: any) => {
    setDeletingWagon(wagon);
  };

  // Handle document changes in edit mode
  const updateDocument = (index: number, field: string, value: string) => {
    console.log(`Updating document ${index}, field: ${field}, value: ${value}`);
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  // Add a new document row
  const addDocumentRow = () => {
    // Add a new document with a unique default name
    setDocuments((prev) => [
      ...prev,
      {
        name: `Документ ${prev.length + 1}`,
        number: "",
        date: "",
      },
    ]);
  };

  // Remove a document row
  const removeDocumentRow = async (index: number) => {
    const docToRemove = documents[index];

    // If the document has an ID, it exists on the server and needs to be deleted
    if (editingWagon?.id) {
      try {
        // First remove from UI to make it feel responsive
        setDocuments((prev) => prev.filter((_, i) => i !== index));

        // Then delete from server
        await deleteWagonFiles(editingWagon.id, [
          {
            id: docToRemove.id as any,
            name: docToRemove.name,
            number: docToRemove.number || "",
            date: docToRemove.date || "",
            location: docToRemove.location,
          },
        ]);

        console.log(`Document ${docToRemove.name} deleted successfully`);
      } catch (error) {
        console.error("Error deleting document:", error);
        // If server deletion fails, add the document back to the UI
        setDocuments((prev) => {
          const newDocs = [...prev];
          newDocs.splice(index, 0, docToRemove);
          return newDocs;
        });
      }
    } else {
      // If no ID, it's a new document that only exists locally
      setDocuments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Handle file upload for a document
  const handleFileUpload = (index: number, file: File) => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;

    if (!acceptedDocumentExtensions.includes(extension)) {
      setDocumentFileErrors((prev) => ({
        ...prev,
        [index]: "Поддерживаются PDF, изображения, Word, Excel и TXT.",
      }));
      return;
    }

    if (file.size > maxDocumentSize) {
      setDocumentFileErrors((prev) => ({
        ...prev,
        [index]: "Размер файла не должен превышать 20 МБ.",
      }));
      return;
    }

    setDocumentFileErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    setDocuments((prev) => {
      const updatedDocs = prev.map((doc, i) =>
        i === index
          ? {
              ...doc,
              file,
              fileName: file.name,
              name: doc.name || file.name,
            }
          : doc
      );

      // Check if all documents have files after this update
      const allDocumentsHaveFiles =
        updatedDocs.length > 0 &&
        updatedDocs.every((doc) => doc.file || doc.location);

      // Documents make the wagon ready for shipment, but do not complete it.
      if (allDocumentsHaveFiles) {
        setEditingWagon((prevWagon: any) => ({
          ...prevWagon,
          status:
            normalizeWagonStatus(prevWagon?.status) ===
              "en_route_to_loading" ||
            normalizeWagonStatus(prevWagon?.status) === "at_elevator"
              ? "registered"
              : prevWagon?.status,
        }));
      }

      return updatedDocs;
    });
  };

  const removeFile = (index: number) => {
    setDocumentFileErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setDocuments((prev) =>
      prev.map((doc, i) =>
        i === index
          ? {
              ...doc,
              file: undefined,
              fileName: doc.location ? doc.fileName : undefined,
            }
          : doc
      )
    );
  };

  const handleUnloadingDateChange = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setUnloadingDate(formattedDate);

      // Also update the date in the editingWagon state
      setEditingWagon((prev: any) => ({
        ...prev,
        date_of_unloading: formattedDate,
      }));

      // A date and documents mean the wagon is оформлен, not yet completed.
      if (
        documents.length > 0 &&
        documents.every((doc) => doc.file || doc.location)
      ) {
        setEditingWagon((prev: any) => ({
          ...prev,
          status:
            normalizeWagonStatus(prev?.status) === "en_route_to_loading" ||
            normalizeWagonStatus(prev?.status) === "at_elevator"
              ? "registered"
              : prev?.status,
        }));
      }
    } else {
      setUnloadingDate(null);
      // Clear the date in the editingWagon state
      setEditingWagon((prev: any) => ({
        ...prev,
        date_of_unloading: "",
      }));
    }
  };

  // Save wagon changes
  const handleSaveWagon = async () => {
    if (!editingWagon || !onUpdateWagon) return;

    setIsUpdating(true);

    try {
      const formData = new FormData();

      // Add basic wagon data
      formData.append("number", editingWagon.number);

      // Make sure capacity is a valid number
      const capacity = Number.parseFloat(editingWagon.capacity);
      if (!isNaN(capacity)) {
        formData.append("capacity", capacity.toString());
      }

      // Only add real_weight if it has a value
      if (editingWagon.real_weight) {
        const realWeight = Number.parseFloat(editingWagon.real_weight);
        if (!isNaN(realWeight)) {
          formData.append("real_weight", realWeight.toString());
        }
      }

      formData.append("owner", editingWagon.owner || "");

      const hasRailwayWaybill = documents.some(
        (document) =>
          Boolean(document.file || document.location) &&
          /(?:ж\s*д|железнодорож).*(?:накладн|ведомост)/i.test(
            document.name || "",
          ),
      );
      const currentStatus = normalizeWagonStatus(editingWagon.status);
      const status =
        hasRailwayWaybill &&
        !isWagonShipmentStartedStatus(currentStatus) &&
        currentStatus !== "client_received"
          ? "registered"
          : currentStatus || editingWagon.status;

      formData.append("status", status);

      // Add date_of_departure as string
      if (editingWagon.date_of_departure) {
        formData.append("date_of_departure", editingWagon.date_of_departure);
      }

      // Use the date from editingWagon state
      if (editingWagon.date_of_unloading) {
        formData.append("date_of_unloading", editingWagon.date_of_unloading);
      } else {
        formData.append("date_of_unloading", "");
      }

      // Handle file uploads separately using the new endpoint
      const filesWithUploads = documents.filter((doc) => doc.file);
      if (filesWithUploads.length > 0) {
        const uploadFormData = new FormData();

        // Prepare files_info array
        const filesInfo = filesWithUploads.map((doc) => ({
          name: doc.name,
          number: doc.number || "",
          date: doc.date || "",
        }));

        // Append each file to the form data
        filesWithUploads.forEach((doc) => {
          if (doc.file) {
            uploadFormData.append("files", doc.file);
          }
        });

        // Add files_info as JSON string
        uploadFormData.append("files_info", JSON.stringify(filesInfo));

        // Keep the modal open if this request fails. A selected file must not
        // look saved while the server did not receive it.
        await apiClient.post(
          `/wagon/upload-files/${editingWagon.id}`,
          uploadFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // Append files_info for existing files (without new uploads)
      const existingFilesInfo = documents
        .filter((doc) => !doc.file && doc.location)
        .map((doc) => ({
          id: doc.id,
          name: doc.name,
          number: doc.number || "",
          date: doc.date || "",
          location: doc.location,
        }));

      formData.append("files_info", JSON.stringify(existingFilesInfo));

      console.log("Updating wagon with data:", {
        ...Object.fromEntries(formData.entries()),
        date_of_unloading: unloadingDate,
      });

      await onUpdateWagon(editingWagon.id, formData);
      setEditingWagon(null);
    } catch (error) {
      console.error("Error updating wagon:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete a wagon
  const handleDeleteWagon = async () => {
    if (!deletingWagon || !onDeleteWagon) return;

    setIsDeleting(true);

    try {
      await onDeleteWagon(deletingWagon.id);
      setDeletingWagon(null);
    } catch (error) {
      console.error("Error deleting wagon:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd.MM.yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Format number with decimal places for display
  const formatNumber = (value: number | string | undefined) => {
    if (value === undefined || value === null || value === "") {
      return "Не указана";
    }

    const num = typeof value === "string" ? Number.parseFloat(value) : value;

    if (isNaN(num)) {
      return "Не указана";
    }

    // Format with dot separators like 1.000.000
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const editCapacity = Number.parseFloat(editingWagon?.capacity || "0") || 0;
  const editRealWeight =
    Number.parseFloat(editingWagon?.real_weight || "0") || 0;
  const editCompletion =
    editCapacity > 0 ? Math.min((editRealWeight / editCapacity) * 100, 100) : 0;
  const editStatusLabel = getWagonStatusMeta(editingWagon?.status).label;
  const ownerOptions = (ownersData?.data || []).filter(
    (ownerItem: any) => typeof ownerItem?.owner === "string" && ownerItem.owner.trim()
  );
  const currentOwner =
    typeof editingWagon?.owner === "string" ? editingWagon.owner.trim() : "";
  const visibleOwnerOptions =
    currentOwner &&
    !ownerOptions.some((ownerItem: any) => ownerItem.owner === currentOwner)
      ? [{ id: "current-owner", owner: currentOwner }, ...ownerOptions]
      : ownerOptions;

  return (
    <>
      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-amber-50 rounded-full flex-shrink-0">
                <TrainFront className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg truncate">
                  Реестр вагонов
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm hidden sm:block">
                  Управление вагонами и их статусами
                </CardDescription>
              </div>
            </div>
            {isAdmin && (
              <Button
                onClick={onAddWagon}
                className="gap-1 sm:gap-2 bg-amber-500 hover:bg-amber-600 text-xs sm:text-sm py-2 px-3 w-full sm:w-auto flex-shrink-0"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Добавить вагон</span>
                <span className="sm:hidden">Добавить</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-3">
            {sortedWagons.length > 0 ? (
              sortedWagons.map((wagon: any) => (
                <div
                  key={wagon.id}
                  className={`border rounded-lg p-3 ${
                    isWagonShipmentStartedStatus(wagon.status)
                      ? "bg-green-50 border-green-200"
                      : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        № {wagon.number}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {wagon.owner || "Не указан"}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <WagonStatusBadge
                        status={wagon.status}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">
                        По документам:
                      </span>
                      <div className="font-medium">
                        {formatNumber(wagon.capacity)} т
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Фактический:
                      </span>
                      <div className="font-medium">
                        {formatNumber(wagon.real_weight)} т
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Дата:{" "}
                      {wagon.date_of_unloading
                        ? formatDate(wagon.date_of_unloading)
                        : "Не указана"}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditWagon(wagon)}
                          className="h-7 w-7"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteClick(wagon)}
                          className="h-7 w-7"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/10">
                <TrainFront className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  Вагоны не найдены
                </p>
              </div>
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="crm-scrollbar hidden overflow-x-auto rounded-md border border-[#dfe7de] sm:block">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm p-2 sm:p-4">
                    № вагона
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm p-2 sm:p-4">
                    Вес по документам, т.
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm p-2 sm:p-4">
                    Фактический вес, т
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm p-2 sm:p-4">
                    Собственник
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm p-2 sm:p-4">
                    Дата отгрузки
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm p-2 sm:p-4">
                    Статус
                  </TableHead>
                  {isAdmin && (
                    <TableHead className="text-right text-xs sm:text-sm p-2 sm:p-4">
                      Действия
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWagons.length > 0 ? (
                  sortedWagons.map((wagon: any) => (
                    <TableRow
                      key={wagon.id}
                      className={
                        isWagonShipmentStartedStatus(wagon.status)
                          ? "bg-green-50"
                          : ""
                      }
                    >
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4 font-medium">
                        {wagon.number}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        {formatNumber(wagon.capacity)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        {formatNumber(wagon.real_weight)}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        {wagon.owner || "Не указан"}
                      </TableCell>

                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        {wagon.date_of_unloading
                          ? formatDate(wagon.date_of_unloading)
                          : "Не указана"}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        <WagonStatusBadge
                          status={wagon.status}
                          className="text-xs sm:text-sm"
                        />
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right text-xs sm:text-sm p-2 sm:p-4">
                          <div className="flex justify-end gap-1 sm:gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditWagon(wagon)}
                              className="h-7 w-7 sm:h-8 sm:w-8"
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteClick(wagon)}
                              className="h-7 w-7 sm:h-8 sm:w-8"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 8 : 7}
                      className="text-center py-6 text-sm"
                    >
                      Вагоны не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Wagon Dialog */}
      {editingWagon && (
        <Dialog
          open={!!editingWagon}
          onOpenChange={(open) => !open && setEditingWagon(null)}
        >
          <DialogContent className="grid h-[94vh] max-h-[880px] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-[#dfe7de] bg-[#f8faf7] p-0 shadow-[0_28px_90px_rgba(22,42,35,0.24)] sm:w-[94vw] sm:max-w-[1180px]">
            <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-5 pr-16 sm:pr-20 sm:pl-7">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(500px,540px)] lg:items-start">
                <div className="min-w-0">
                  <Badge
                    variant="outline"
                    className="mb-3 border-[#dce8dc] bg-[#eef5ef] px-3 py-1 text-[#2f6b4f]"
                  >
                    <TrainFront className="h-3.5 w-3.5" />
                    Операционная карточка вагона
                  </Badge>
                  <DialogTitle className="text-2xl font-black tracking-tight text-[#223137] sm:text-3xl">
                    Редактировать вагон
                  </DialogTitle>
                  <DialogDescription className="mt-2 text-sm text-[#6f7774]">
                    Обновите номер, вес, статус отгрузки и документы вагона.
                  </DialogDescription>
                </div>

                <div className="grid min-w-0 gap-2 sm:grid-cols-3">
                  <div className="min-h-[76px] rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                    <div className="text-[11px] font-black uppercase text-[#7b857f]">
                      Вагон
                    </div>
                    <div className="mt-1 truncate text-base font-black text-[#223137]">
                      {editingWagon.number || "Не указан"}
                    </div>
                  </div>
                  <div className="min-h-[76px] rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                    <div className="text-[11px] font-black uppercase text-[#7b857f]">
                      Статус
                    </div>
                    <div className="mt-1 truncate text-base font-black text-[#2f6b4f]">
                      {editStatusLabel}
                    </div>
                  </div>
                  <div className="min-h-[76px] rounded-md border border-[#f2dfca] bg-[#fff8ed] px-3 py-2">
                    <div className="text-[11px] font-black uppercase text-[#b56c12]">
                      Заполнено
                    </div>
                    <div className="mt-1 text-base font-black text-[#d5740b]">
                      {Math.round(editCompletion)}%
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="crm-scrollbar min-h-0 overflow-y-auto px-4 py-4 pb-24 sm:px-7 sm:py-6 sm:pb-24">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <div className="space-y-4">
                  <section className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_14px_34px_rgba(34,49,55,0.06)] sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#edf1eb] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                          <TrainFront className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-[#223137]">
                            Параметры вагона
                          </h3>
                          <p className="mt-0.5 text-sm text-[#7b857f]">
                            Номер, собственник, вес и текущий статус.
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="hidden border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f] sm:inline-flex"
                      >
                        {editStatusLabel}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-number" className="text-sm font-black text-[#34433d]">
                          № вагона <span className="text-[#c84b31]">*</span>
                        </Label>
                        <Input
                          id="edit-number"
                          value={editingWagon.number}
                          onChange={(e) =>
                            setEditingWagon({
                              ...editingWagon,
                              number: e.target.value,
                            })
                          }
                          placeholder="Например: 64718290"
                          className="h-12 rounded-md border-[#dfe7de] bg-[#fbfcfa] text-base font-bold shadow-sm focus-visible:ring-[#f38810]/25"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-owner" className="text-sm font-black text-[#34433d]">
                          Собственник
                        </Label>
                        <Select
                          value={editingWagon.owner}
                          onValueChange={(value) =>
                            setEditingWagon({
                              ...editingWagon,
                              owner: value,
                            })
                          }
                        >
                          <SelectTrigger
                            id="edit-owner"
                            className="h-12 rounded-md border-[#dfe7de] bg-[#fbfcfa] text-base font-bold shadow-sm focus:ring-[#f38810]/25"
                          >
                            <SelectValue placeholder="Выберите собственника" />
                          </SelectTrigger>
                          <SelectContent className="z-[80]">
                            {isLoadingOwners ? (
                              <SelectItem value="owner-loading" disabled>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Загрузка собственников...
                              </SelectItem>
                            ) : isErrorOwners ? (
                              <SelectItem value="owner-error" disabled>
                                Ошибка загрузки собственников
                              </SelectItem>
                            ) : visibleOwnerOptions.length > 0 ? (
                              visibleOwnerOptions.map((ownerItem: any) => (
                                <SelectItem
                                  key={ownerItem.id ?? ownerItem.owner}
                                  value={ownerItem.owner}
                                >
                                  {ownerItem.owner}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="owner-empty" disabled>
                                Нет доступных собственников
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-capacity" className="text-sm font-black text-[#34433d]">
                          Вес по документам, т <span className="text-[#c84b31]">*</span>
                        </Label>
                        <Input
                          id="edit-capacity"
                          type="number"
                          step="0.01"
                          value={editingWagon.capacity}
                          onChange={(e) =>
                            setEditingWagon({
                              ...editingWagon,
                              capacity: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          className="h-12 rounded-md border-[#dfe7de] bg-[#fbfcfa] text-base font-bold shadow-sm focus-visible:ring-[#f38810]/25"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-real_weight" className="text-sm font-black text-[#34433d]">
                          Фактический вес, т
                        </Label>
                        <Input
                          id="edit-real_weight"
                          type="number"
                          step="0.01"
                          value={editingWagon.real_weight}
                          onChange={(e) =>
                            setEditingWagon({
                              ...editingWagon,
                              real_weight: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          className="h-12 rounded-md border-[#dfe7de] bg-[#fbfcfa] text-base font-bold shadow-sm focus-visible:ring-[#f38810]/25"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-status" className="text-sm font-black text-[#34433d]">
                          Статус
                        </Label>
                        <Select
                          value={editingWagon.status}
                          onValueChange={(value) =>
                            setEditingWagon({ ...editingWagon, status: value })
                          }
                        >
                          <SelectTrigger
                            id="edit-status"
                            className="h-12 rounded-md border-[#dfe7de] bg-[#fbfcfa] text-base font-bold shadow-sm focus:ring-[#f38810]/25"
                          >
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                          <SelectContent>
                            {editingWagon?.status &&
                              !WAGON_STATUS_OPTIONS.some(
                                (status) => status.value === editingWagon.status
                              ) && (
                                <SelectItem value={editingWagon.status}>
                                  {getWagonStatusMeta(editingWagon.status).label}
                                  {" (текущий)"}
                                </SelectItem>
                              )}
                            {WAGON_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-date_of_unloading" className="text-sm font-black text-[#34433d]">
                          Дата отгрузки
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="edit-date_of_unloading"
                              variant="outline"
                              className={cn(
                                "h-12 w-full justify-start rounded-md border-[#dfe7de] bg-[#fbfcfa] text-left text-base font-bold shadow-sm hover:bg-white",
                                !unloadingDate && "text-[#8b948f]"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-[#f38810]" />
                              {unloadingDate ? (
                                formatDate(unloadingDate)
                              ) : (
                                <span>Выберите дату</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                unloadingDate
                                  ? new Date(unloadingDate)
                                  : undefined
                              }
                              onSelect={handleUnloadingDateChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_14px_34px_rgba(34,49,55,0.06)] sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 border-b border-[#edf1eb] pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-[#223137]">
                            Документы вагона
                          </h3>
                          <p className="mt-0.5 text-sm text-[#7b857f]">
                            Накладные, паспорта качества и вложения.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addDocumentRow}
                        className="h-10 gap-2 rounded-md border-[#f2dfca] bg-[#fff8ed] font-black text-[#d5740b] hover:bg-[#fff3e5]"
                      >
                        <Plus className="h-4 w-4" />
                        Добавить документ
                      </Button>
                    </div>

                    {documents.length === 0 ? (
                      <div className="rounded-md border border-dashed border-[#dfe7de] bg-[#fbfcfa] px-4 py-8 text-center">
                        <div className="mx-auto flex size-11 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="mt-3 text-sm font-black text-[#223137]">
                          Документы пока не добавлены
                        </div>
                        <div className="mt-1 text-sm text-[#7b857f]">
                          Добавьте файл, чтобы зафиксировать отгрузку.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc, index) => (
                          <div
                            key={index}
                            className="rounded-md border border-[#e5ece4] bg-[#fbfcfa] p-3"
                          >
                            <div className="grid gap-3 lg:grid-cols-[48px_minmax(220px,1fr)_minmax(280px,340px)_40px] lg:items-start">
                              <div className="flex size-11 items-center justify-center rounded-md bg-white text-sm font-black text-[#2f6b4f] shadow-sm">
                                {String(index + 1).padStart(2, "0")}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-[#7b857f]">
                                  Тип документа
                                </Label>
                                <Select
                                  value={doc.name}
                                  onValueChange={(value) => {
                                    updateDocument(
                                      index,
                                      "name",
                                      value === "custom" ? "" : value
                                    );
                                  }}
                                >
                                  <SelectTrigger className="h-11 rounded-md border-[#dfe7de] bg-white font-semibold">
                                    <SelectValue placeholder="Выберите тип документа" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ЖД накладная">
                                      ЖД накладная
                                    </SelectItem>
                                    <SelectItem value="Паспорт качества">
                                      Паспорт качества
                                    </SelectItem>
                                    <SelectItem value="custom">
                                      Другое название
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {doc.name &&
                                  doc.name !== "ЖД накладная" &&
                                  doc.name !== "Паспорт качества" && (
                                    <Input
                                      value={doc.name}
                                      onChange={(e) =>
                                        updateDocument(
                                          index,
                                          "name",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Введите название документа"
                                      className="h-11 rounded-md border-[#dfe7de] bg-white font-semibold"
                                    />
                                  )}
                              </div>

                              <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-[#7b857f]">
                                  Файл
                                </Label>
                                <input
                                  type="file"
                                  id={`edit-wagon-file-${index}`}
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleFileUpload(index, e.target.files[0]);
                                    }
                                    e.currentTarget.value = "";
                                  }}
                                />
                                <div className="flex flex-col gap-2">
                                  <label
                                    htmlFor={`edit-wagon-file-${index}`}
                                    className={cn(
                                      "group flex min-h-20 cursor-pointer items-center gap-3 rounded-md border border-dashed px-3 py-3 transition-colors",
                                      doc.file
                                        ? "border-[#96d6b1] bg-[#f2faf4]"
                                        : "border-[#dce8dc] bg-white hover:border-[#70b88c] hover:bg-[#f7fbf7]"
                                    )}
                                  >
                                    <span className={cn(
                                      "flex size-10 shrink-0 items-center justify-center rounded-md transition-colors",
                                      doc.file
                                        ? "bg-[#dff4e5] text-[#287044]"
                                        : "bg-[#eef5ef] text-[#2f6b4f] group-hover:bg-[#dff4e5]"
                                    )}>
                                      <Upload className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-black text-[#34433d]">
                                        {doc.file
                                          ? doc.file.name
                                          : doc.location
                                            ? "Загруженный файл"
                                            : "Выбрать файл"}
                                      </span>
                                      <span className="mt-0.5 block text-xs text-[#7b857f]">
                                        {doc.file
                                          ? `${(doc.file.size / 1024 / 1024).toFixed(1)} МБ · будет загружен после сохранения`
                                          : doc.location
                                            ? "Нажмите, чтобы заменить файл"
                                            : "PDF, изображение, Word или Excel · до 20 МБ"}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-xs font-black text-[#2f6b4f]">
                                      {doc.file || doc.location ? "Заменить" : "Выбрать"}
                                    </span>
                                  </label>

                                  {documentFileErrors[index] && (
                                    <p className="text-xs font-semibold text-[#c84b31]" role="alert">
                                      {documentFileErrors[index]}
                                    </p>
                                  )}

                                  {(doc.fileName || doc.location) && (
                                    <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-[#dfe7de] bg-white px-3 py-2 text-sm text-[#53605a]">
                                      <span className="flex min-w-0 items-center gap-2">
                                        <FileText className="h-4 w-4 shrink-0 text-[#2f6b4f]" />
                                        <span className="truncate">
                                          {doc.fileName || "Загруженный документ"}
                                        </span>
                                      </span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0 text-[#c84b31] hover:bg-[#fff1ed] hover:text-[#c84b31]"
                                        onClick={(event) => {
                                          event.preventDefault();
                                          removeFile(index);
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-md text-[#c84b31] hover:bg-[#fff1ed] hover:text-[#c84b31] lg:mt-6"
                                onClick={() => removeDocumentRow(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                <aside className="space-y-3 xl:sticky xl:top-0">
                  <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_14px_34px_rgba(34,49,55,0.06)]">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-[#223137]">
                          Сводка отгрузки
                        </div>
                        <div className="text-xs text-[#7b857f]">
                          Данные обновятся после сохранения.
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-black uppercase text-[#7b857f]">
                          <span>Фактический вес</span>
                          <span>{Math.round(editCompletion)}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-[#f7eadc]">
                          <div
                            className="h-full rounded-full bg-[#f38810]"
                            style={{ width: `${editCompletion}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-3 py-2">
                          <div className="text-[11px] font-black uppercase text-[#7b857f]">
                            По документам
                          </div>
                          <div className="mt-1 font-black text-[#223137]">
                            {formatNumber(editCapacity)} т
                          </div>
                        </div>
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-3 py-2">
                          <div className="text-[11px] font-black uppercase text-[#7b857f]">
                            Фактический
                          </div>
                          <div className="mt-1 font-black text-[#2f6b4f]">
                            {formatNumber(editRealWeight)} т
                          </div>
                        </div>
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-3 py-2">
                          <div className="text-[11px] font-black uppercase text-[#7b857f]">
                            Документы
                          </div>
                          <div className="mt-1 font-black text-[#223137]">
                            {documents.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-[#dfe7de] bg-white/95 px-4 py-4 shadow-[0_-12px_28px_rgba(34,49,55,0.06)] backdrop-blur sm:px-7">
              <Button
                variant="outline"
                onClick={() => setEditingWagon(null)}
                className="h-12 w-full rounded-md border-[#dfe7de] bg-white font-black text-[#53605a] shadow-sm hover:bg-[#fbfcfa] sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleSaveWagon}
                disabled={
                  isUpdating || !editingWagon.number || !editingWagon.capacity
                }
                className="h-12 w-full gap-2 rounded-md bg-[#f38810] px-6 font-black text-white shadow-[0_12px_26px_rgba(243,136,16,0.24)] hover:bg-[#d5740b] sm:w-auto"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  "Сохранить изменения"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingWagon}
        onOpenChange={(open) => !open && setDeletingWagon(null)}
      >
        <AlertDialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          <AlertDialogHeader className="text-center sm:text-left">
            <AlertDialogTitle className="text-base sm:text-lg">
              Удалить вагон
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              Вы уверены, что хотите удалить вагон №{deletingWagon?.number}? Это
              действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto text-sm order-2 sm:order-1">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWagon}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 w-full sm:w-auto text-sm order-1 sm:order-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
