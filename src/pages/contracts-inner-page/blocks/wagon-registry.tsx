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
  Building2,
  CalendarIcon,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
  Pencil,
  Plus,
  TrainFront,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/shared/api/apiClient";

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

  // Update unloadingDate when editingWagon changes
  useEffect(() => {
    if (editingWagon) {
      setUnloadingDate(editingWagon.date_of_unloading || null);
    }
  }, [editingWagon]);

  // Open edit dialog and set up editing state
  const handleEditWagon = (wagon: any) => {
    setEditingWagon({
      ...wagon,
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

      // Only update status to shipped, don't set any date automatically
      if (allDocumentsHaveFiles) {
        setEditingWagon((prevWagon: any) => ({
          ...prevWagon,
          status: "shipped",
        }));
      }

      return updatedDocs;
    });
  };

  const removeFile = (index: number) => {
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

      // If the wagon has documents and a date is set, update status to shipped
      if (
        documents.length > 0 &&
        documents.every((doc) => doc.file || doc.location)
      ) {
        setEditingWagon((prev: any) => ({
          ...prev,
          status: "shipped",
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
      formData.append("status", editingWagon.status);

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

        try {
          // Use the specific upload endpoint
          await apiClient.post(
            `/wagon/upload-files/${editingWagon.id}`,
            uploadFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          console.log("Files uploaded successfully");
        } catch (uploadError) {
          console.error("Error uploading files:", uploadError);
        }
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

    // Format with up to 2 decimal places, but only if needed
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-full">
                <TrainFront className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <CardTitle>Реестр вагонов</CardTitle>
                <CardDescription>
                  Управление вагонами и их статусами
                </CardDescription>
              </div>
            </div>
            {isAdmin && (
              <Button
                onClick={onAddWagon}
                className="gap-2 bg-amber-500 hover:bg-amber-600"
              >
                <Plus className="h-4 w-4" />
                Добавить вагон
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№ вагона</TableHead>
                  <TableHead>Вес по документам, т.</TableHead>
                  <TableHead>
                    Фактический вес, т<div className=""></div>
                  </TableHead>
                  <TableHead>Собственник</TableHead>
                  <TableHead>Дата отгрузки</TableHead>
                  <TableHead>Статус</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right">Действия</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {wagons?.length > 0 ? (
                  wagons.map((wagon: any) => (
                    <TableRow
                      key={wagon.id}
                      className={
                        wagon.status === "shipped" ? "bg-green-50" : ""
                      }
                    >
                      <TableCell>{wagon.number}</TableCell>
                      <TableCell>{formatNumber(wagon.capacity)}</TableCell>
                      <TableCell>{formatNumber(wagon.real_weight)}</TableCell>
                      <TableCell>{wagon.owner || "Не указан"}</TableCell>

                      <TableCell>
                        {wagon.date_of_unloading
                          ? formatDate(wagon.date_of_unloading)
                          : "Не указана"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            wagon.status === "shipped"
                              ? "default"
                              : wagon.status === "in_transit"
                              ? "secondary"
                              : "outline"
                          }
                          className={`flex w-fit items-center gap-1 ${
                            wagon.status === "shipped"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : wagon.status === "in_transit"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-slate-100 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          {wagon.status === "shipped" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : wagon.status === "in_transit" ? (
                            <TrainFront className="h-3.5 w-3.5" />
                          ) : wagon.status === "at_elevator" ? (
                            <Building2 className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          {wagon.status === "shipped"
                            ? "Отгружен"
                            : wagon.status === "in_transit"
                            ? "В пути"
                            : wagon.status === "at_elevator"
                            ? "На элеваторе"
                            : wagon.status || "Не указан"}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditWagon(wagon)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteClick(wagon)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
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
                      className="text-center py-6"
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
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Редактировать вагон</DialogTitle>
              <DialogDescription>
                Измените информацию о вагоне и документах
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Wagon Information Section */}
              <div className="bg-blue-50 p-3 rounded-md">
                <h3 className="font-semibold text-blue-700 mb-3 uppercase text-sm">
                  ИНФОРМАЦИЯ О ВАГОНЕ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-md border border-blue-100">
                  <div className="space-y-2">
                    <Label htmlFor="edit-number" className="font-medium">
                      № вагона <span className="text-red-500">*</span>
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
                      placeholder="Введите номер вагона"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-capacity" className="font-medium">
                      Вес по документам, т.{" "}
                      <span className="text-red-500">*</span>
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
                      placeholder="Введите вес по документам"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-real_weight" className="font-medium">
                      Фактический вес, т.
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
                      placeholder="Введите фактический вес"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-owner" className="font-medium">
                      Собственник
                    </Label>
                    <Input
                      id="edit-owner"
                      value={editingWagon.owner}
                      onChange={(e) =>
                        setEditingWagon({
                          ...editingWagon,
                          owner: e.target.value,
                        })
                      }
                      placeholder="Введите собственника"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status" className="font-medium">
                      Статус
                    </Label>
                    <Select
                      value={editingWagon.status}
                      onValueChange={(value) =>
                        setEditingWagon({ ...editingWagon, status: value })
                      }
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="at_elevator">
                          На элеваторе
                        </SelectItem>
                        <SelectItem value="in_transit">В пути</SelectItem>
                        <SelectItem value="shipped">Отгружен</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-date_of_unloading"
                      className="font-medium"
                    >
                      Дата отгрузки
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="edit-date_of_unloading"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !unloadingDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                            unloadingDate ? new Date(unloadingDate) : undefined
                          }
                          onSelect={handleUnloadingDateChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-amber-50 p-3 rounded-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-amber-700 uppercase text-sm">
                    ДОКУМЕНТЫ ВАГОНА
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addDocumentRow}
                    className="text-amber-600 border-amber-300 hover:bg-amber-100"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Добавить документ
                  </Button>
                </div>

                <div className="bg-white p-4 rounded-md border border-amber-100">
                  <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-1">№</div>
                    <div className="col-span-3">Наименование</div>
                    <div className="col-span-2">Загрузить файл</div>
                    <div className="col-span-1"></div>
                  </div>
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 mb-4 items-center rounded-md border border-gray-200 p-4 bg-white shadow-sm"
                    >
                      {/* Index */}
                      <div className="col-span-1 text-center text-sm font-medium text-gray-700">
                        {index + 1}
                      </div>

                      {/* Document name input */}
                      <div className="col-span-4">
                        <Select
                          value={doc.name}
                          onValueChange={(value) => {
                            if (value === "custom") {
                              // If custom is selected, clear the name to allow manual input
                              updateDocument(index, "name", "");
                            } else {
                              updateDocument(index, "name", value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full border-gray-300 focus:ring-1 focus:ring-primary">
                            <SelectValue placeholder="Выберите тип документа">
                              {doc.name || "Выберите тип документа"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ЖД накладная">
                              ЖД накладная
                            </SelectItem>
                            <SelectItem value="Паспорт качества">
                              Паспорт качества
                            </SelectItem>
                            <SelectItem value="custom">
                              Другое (свое название)
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Show input field if custom option is selected or if name doesn't match predefined options */}
                        {doc.name &&
                          doc.name !== "ЖД накладная" &&
                          doc.name !== "Паспорт качества" && (
                            <Input
                              value={doc.name}
                              onChange={(e) =>
                                updateDocument(index, "name", e.target.value)
                              }
                              placeholder="Введите название документа"
                              className="w-full border-gray-300 focus:ring-1 focus:ring-primary mt-2"
                            />
                          )}
                      </div>

                      {/* Upload button and filename display */}
                      <div className="col-span-5">
                        <div className="flex items-center space-x-3">
                          <input
                            type="file"
                            id={`edit-file-${index}`}
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(index, e.target.files[0]);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-dashed hover:bg-green-50"
                            onClick={() =>
                              document
                                .getElementById(`edit-file-${index}`)
                                ?.click()
                            }
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {doc.location && !doc.file
                              ? "Заменить"
                              : "Загрузить"}
                          </Button>

                          {(doc.fileName || doc.location) && (
                            <div className="flex items-center text-sm text-gray-600 bg-gray-100 rounded px-2 py-1">
                              <FileText className="h-4 w-4 mr-1" />
                              <span className="truncate max-w-[140px]">
                                {doc.fileName || "Документ"}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 ml-2"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete document row button */}
                      <div className="col-span-2 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:bg-red-100"
                          onClick={() => removeDocumentRow(index)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setEditingWagon(null)}
                className="mr-2"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleSaveWagon}
                disabled={
                  isUpdating || !editingWagon.number || !editingWagon.capacity
                }
                className="gap-2"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить вагон</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить вагон №{deletingWagon?.number}? Это
              действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWagon}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
