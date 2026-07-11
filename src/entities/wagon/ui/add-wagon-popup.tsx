"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  X,
  FileText,
  CalendarIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { usePopupStore } from "@/shared/model/popup-store";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { useAddWagon } from "../hooks/mutations/use-add-wagon.mutation";
import { useGetOwners } from "@/entities/owner/hooks/query/use-get-owners.query";
import { WAGON_STATUS_OPTIONS } from "@/shared/contracts/wagon-status";

interface AddWagonPopupProps {
  contractId: string;
  applicationId?: string;
}

export const AddWagonPopup = ({
  contractId,
  applicationId,
}: AddWagonPopupProps) => {
  const { isOpen, close } = usePopupStore("addWagon");

  const [newWagon, setNewWagon] = useState({
    number: "",
    capacity: "",
    real_weight: "",
    owner: "",
    status: "en_route_to_loading",
    date_of_departure: "",
    date_of_unloading: "",
  });

  const [documents, setDocuments] = useState<
    Array<{
      name: string;
      number: string;
      date: string;
      file?: File;
      fileName?: string;
    }>
  >([]);

  const mutation = useAddWagon();

  // Fetch owners for dropdown
  const {
    data: ownersData,
    isLoading: isLoadingOwners,
    isError: isErrorOwners,
  } = useGetOwners();

  // Check if all documents have files and update status accordingly
  useEffect(() => {
    if (documents.length > 0) {
      const allFilesUploaded = documents.every((doc) => doc.file);
      if (allFilesUploaded) {
        setNewWagon((prev) =>
          prev.status === "en_route_to_loading" || prev.status === "at_elevator"
            ? { ...prev, status: "registered" }
            : prev
        );
      }
    }
  }, [documents]);

  // Update the handleAddWagon function to match the expected API structure
  const handleAddWagon = () => {
    const formData = new FormData();

    // Convert string values to integers for numeric fields
    formData.append("number", newWagon.number);

    // Make sure capacity is a valid number
    const capacity = newWagon.capacity;
    if (isNaN(capacity as any)) {
      alert("Пожалуйста, введите корректное значение для веса по документам");
      return;
    }
    formData.append("capacity", capacity.toString());

    // Add real_weight (use capacity as fallback if not provided)
    if (newWagon.real_weight) {
      const realWeight = newWagon.real_weight;
      if (!isNaN(realWeight as any)) {
        formData.append("real_weight", realWeight.toString());
      }
    } else {
      // If real_weight is not provided, use capacity value
      const capacity = newWagon.capacity;
      if (!isNaN(capacity as any)) {
        formData.append("real_weight", capacity.toString());
      }
    }

    formData.append("owner", newWagon.owner);
    formData.append("status", newWagon.status);

    // Add date_of_departure as string
    if (newWagon.date_of_departure) {
      formData.append("date_of_departure", newWagon.date_of_departure);
    }

    // Add date_of_unloading as string
    if (newWagon.date_of_unloading) {
      formData.append("date_of_unloading", newWagon.date_of_unloading);
    }

    // Add contract_id
    formData.append("contract_id", contractId);

    // Add application_id if available
    if (applicationId) {
      formData.append("applicationId", applicationId);
    }

    // Append files with proper files_info structure
    const filesInfo = documents
      .filter((doc) => doc.file)
      .map((doc) => ({
        name: doc.name,
        number: doc.number,
        date: doc.date,
      }));

    formData.append("files_info", JSON.stringify(filesInfo));

    documents.forEach((doc) => {
      if (doc.file) {
        formData.append(`files`, doc.file); // 👈 you add all `doc.file`s, but order might mismatch
      }
    });

    mutation.mutate(formData, {
      onSuccess: () => {
        close();
        setNewWagon({
          number: "",
          capacity: "",
          real_weight: "",
          owner: "",
          status: "en_route_to_loading",
          date_of_departure: "",
          date_of_unloading: "",
        });
        setDocuments([]);
      },
    });
  };

  const handleFileUpload = (index: number, file: File) => {
    setDocuments((prev) =>
      prev.map((doc, i) =>
        i === index ? { ...doc, file, fileName: file.name } : doc
      )
    );
  };

  const removeFile = (index: number) => {
    setDocuments((prev) =>
      prev.map((doc, i) =>
        i === index ? { ...doc, file: undefined, fileName: undefined } : doc
      )
    );
  };

  const addDocumentRow = () => {
    setDocuments((prev) => [...prev, { name: "", number: "", date: "" }]);
  };

  const removeDocumentRow = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocument = (index: number, field: string, value: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Добавить новый вагон</DialogTitle>
          <DialogDescription>
            Заполните информацию о новом вагоне и прикрепите документы
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
                <Label htmlFor="number" className="font-medium">
                  № вагона <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="number"
                  value={newWagon.number}
                  onChange={(e) =>
                    setNewWagon({ ...newWagon, number: e.target.value })
                  }
                  placeholder="Введите номер вагона"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="font-medium">
                  Вес по документам, т. <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  value={newWagon.capacity}
                  onChange={(e) =>
                    setNewWagon({ ...newWagon, capacity: e.target.value })
                  }
                  placeholder="Введите вес по документам"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="real_weight" className="font-medium">
                  Фактический вес, т.
                </Label>
                <Input
                  id="real_weight"
                  type="number"
                  value={newWagon.real_weight}
                  onChange={(e) =>
                    setNewWagon({ ...newWagon, real_weight: e.target.value })
                  }
                  placeholder="Введите фактический вес"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner" className="font-medium">
                  Собственник
                </Label>
                <Select
                  value={newWagon.owner}
                  onValueChange={(value) =>
                    setNewWagon({ ...newWagon, owner: value })
                  }
                >
                  <SelectTrigger id="owner" className="w-full">
                    <SelectValue placeholder="Выберите собственника" />
                  </SelectTrigger>

                  <SelectContent className="w-full">
                    {isLoadingOwners ? (
                      <SelectItem value="loading" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Загрузка собственников...
                      </SelectItem>
                    ) : isErrorOwners ? (
                      <SelectItem value="error" disabled>
                        Ошибка загрузки собственников
                      </SelectItem>
                    ) : ownersData && ownersData.data.length > 0 ? (
                      ownersData.data.map((owner: any) => (
                        <SelectItem key={owner.id} value={owner.owner}>
                          {owner.owner}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>
                        Нет доступных собственников
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="font-medium">
                  Статус
                </Label>
                <Select
                  value={newWagon.status}
                  onValueChange={(value) =>
                    setNewWagon({ ...newWagon, status: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {WAGON_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_unloading" className="font-medium">
                  Дата отгрузки
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newWagon.date_of_unloading && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newWagon.date_of_unloading ? (
                        format(
                          new Date(newWagon.date_of_unloading),
                          "dd.MM.yyyy"
                        )
                      ) : (
                        <span>Выберите дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        newWagon.date_of_unloading
                          ? new Date(newWagon.date_of_unloading)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setNewWagon({
                            ...newWagon,
                            date_of_unloading: format(date, "yyyy-MM-dd"),
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
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium text-muted-foreground">
                <div className="col-span-1 text-center">№</div>
                <div className="col-span-5">Наименование</div>
                <div className="col-span-5">Файл</div>
                <div className="col-span-1 text-center">Удалить</div>
              </div>

              {/* Rows */}
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center bg-white p-3 mb-2 border rounded-md shadow-sm"
                >
                  {/* № */}
                  <div className="col-span-1 text-center font-medium text-gray-700">
                    {index + 1}
                  </div>

                  {/* Название */}
                  <div className="col-span-5">
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

                  {/* File Upload */}
                  <div className="col-span-5">
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        id={`file-${index}`}
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
                        className="border-dashed text-green-600 hover:bg-green-50"
                        onClick={() =>
                          document.getElementById(`file-${index}`)?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {doc.fileName ? "Заменить" : "Загрузить"}
                      </Button>
                      {doc.fileName && (
                        <div className="flex items-center text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          <FileText className="h-3 w-3 mr-1" />
                          <span className="truncate max-w-[120px]">
                            {doc.fileName}
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
                  </div>

                  {/* Удалить */}
                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100"
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
          <Button variant="outline" onClick={close} className="mr-2">
            Отмена
          </Button>
          <Button
            type="submit"
            onClick={handleAddWagon}
            disabled={
              mutation.isPending || !newWagon.number || !newWagon.capacity
            }
            className="gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Добавление...
              </>
            ) : (
              "Добавить вагон"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
