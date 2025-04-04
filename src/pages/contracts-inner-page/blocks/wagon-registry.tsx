"use client";

import { useState } from "react";
import {
  Truck,
  Building2,
  CheckCircle2,
  Circle,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Upload,
  X,
  CalendarIcon,
  Loader2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WagonRegistryProps {
  wagons: any[];
  isAdmin: boolean;
  onAddWagon: () => void;
  onUpdateWagon?: (wagonId: string | number, data: any) => Promise<void>;
  onDeleteWagon?: (wagonId: string | number) => Promise<void>;
}

export const WagonRegistry = ({
  wagons,
  isAdmin,
  onAddWagon,
  onUpdateWagon,
  onDeleteWagon,
}: WagonRegistryProps) => {
  const [editingWagon, setEditingWagon] = useState<any>(null);
  const [deletingWagon, setDeletingWagon] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Open edit dialog and set up editing state
  const handleEditWagon = (wagon: any) => {
    setEditingWagon({
      ...wagon,
      capacity: wagon.capacity?.toString() || "",
      real_weight: wagon.real_weight?.toString() || "",
      date_of_departure: wagon.date_of_departure || "",
    });

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
      setDocuments([
        { name: "Паспорт качества", number: "", date: "" },
        { name: "ЭПД", number: "", date: "" },
      ]);
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (wagon: any) => {
    setDeletingWagon(wagon);
  };

  // Handle document changes in edit mode
  const updateDocument = (index: number, field: string, value: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  // Add a new document row
  const addDocumentRow = () => {
    setDocuments((prev) => [...prev, { name: "", number: "", date: "" }]);
  };

  // Remove a document row
  const removeDocumentRow = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle file upload for a document
  const handleFileUpload = (index: number, file: File) => {
    setDocuments((prev) =>
      prev.map((doc, i) =>
        i === index ? { ...doc, file, fileName: file.name } : doc
      )
    );

    // Check if all documents have files and update status if needed
    const updatedDocs = [...documents];
    updatedDocs[index] = { ...updatedDocs[index], file, fileName: file.name };

    if (
      updatedDocs.length > 0 &&
      updatedDocs.every((doc) => doc.file || doc.location)
    ) {
      setEditingWagon((prev: any) => ({ ...prev, status: "shipped" }));
    }
  };

  // Remove a file from a document
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

  // Save wagon changes
  const handleSaveWagon = async () => {
    if (!editingWagon || !onUpdateWagon) return;

    setIsUpdating(true);

    try {
      const formData = new FormData();

      // Add basic wagon data
      formData.append("number", editingWagon.number);

      // Make sure capacity is a valid number
      const capacity = Number.parseInt(editingWagon.capacity, 10);
      if (!isNaN(capacity)) {
        formData.append("capacity", capacity.toString());
      }

      // Only add real_weight if it has a value
      if (editingWagon.real_weight) {
        const realWeight = Number.parseInt(editingWagon.real_weight, 10);
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

      // Append files with proper files_info structure
      const filesInfo = documents
        .filter((doc) => doc.file || doc.location)
        .map((doc) => ({
          id: doc.id,
          name: doc.name,
          number: doc.number,
          date: doc.date,
          location: doc.location,
        }));

      formData.append("files_info", JSON.stringify(filesInfo));

      // Append actual new files
      documents.forEach((doc) => {
        if (doc.file) {
          formData.append(`files`, doc.file);
        }
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

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 rounded-full">
                <Truck className="h-6 w-6 text-amber-500" />
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
                  <TableHead>ID</TableHead>
                  <TableHead>№ вагона</TableHead>
                  <TableHead>Вес по документам, кг</TableHead>
                  <TableHead>Дата отправки</TableHead>
                  <TableHead>Собственник</TableHead>
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
                      <TableCell>{wagon.id}</TableCell>
                      <TableCell>{wagon.number}</TableCell>
                      <TableCell>
                        {wagon.capacity?.toLocaleString() || "Не указана"}
                      </TableCell>
                      <TableCell>
                        {formatDate(wagon.date_of_departure) || "Не указан"}
                      </TableCell>
                      <TableCell>{wagon.owner || "Не указан"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            wagon.status === "shipped"
                              ? "success"
                              : wagon.status === "in_transit"
                              ? "warning"
                              : "default"
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
                            <Truck className="h-3.5 w-3.5" />
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
                      colSpan={isAdmin ? 6 : 5}
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
                      Вес по документам, кг{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-capacity"
                      type="number"
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
                      Фактический вес, кг
                    </Label>
                    <Input
                      id="edit-real_weight"
                      type="number"
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
                      htmlFor="edit-date_of_departure"
                      className="font-medium"
                    >
                      Дата отправления
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="edit-date_of_departure"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editingWagon.date_of_departure &&
                              "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editingWagon.date_of_departure ? (
                            formatDate(editingWagon.date_of_departure)
                          ) : (
                            <span>Выберите дату</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            editingWagon.date_of_departure
                              ? new Date(editingWagon.date_of_departure)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setEditingWagon({
                                ...editingWagon,
                                date_of_departure: format(date, "yyyy-MM-dd"),
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
                    <div className="col-span-2">Номер</div>
                    <div className="col-span-3">Дата документа</div>
                    <div className="col-span-2">Загрузить файл</div>
                    <div className="col-span-1"></div>
                  </div>

                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 mb-3 items-center"
                    >
                      <div className="col-span-1 text-center">{index + 1}</div>
                      <div className="col-span-3">
                        <Input
                          value={doc.name}
                          onChange={(e) =>
                            updateDocument(index, "name", e.target.value)
                          }
                          placeholder="Название документа"
                          className="border-dashed"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={doc.number}
                          onChange={(e) =>
                            updateDocument(index, "number", e.target.value)
                          }
                          placeholder="№ документа"
                          className="border-dashed"
                        />
                      </div>
                      <div className="col-span-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal border-dashed",
                                !doc.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {doc.date ? (
                                formatDate(doc.date)
                              ) : (
                                <span>Выберите дату</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                doc.date ? new Date(doc.date) : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  updateDocument(
                                    index,
                                    "date",
                                    format(date, "yyyy-MM-dd")
                                  );
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="col-span-2">
                        <div className="relative">
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
                            className="w-full border-dashed text-green-600 hover:bg-green-50"
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
                        </div>
                        {(doc.fileName || doc.location) && (
                          <div className="flex items-center mt-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3 mr-1" />
                            <span className="truncate max-w-[120px]">
                              {doc.fileName || "Документ"}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 ml-1"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => removeDocumentRow(index)}
                        >
                          <Trash2 className="h-4 w-4" />
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
              className="bg-destructive !text-white hover:bg-destructive/90"
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
