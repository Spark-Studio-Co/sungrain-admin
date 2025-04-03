"use client";

import { useState, useRef } from "react";
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
import { useAddWagon } from "../api/use-add-wagon";

interface AddWagonPopupProps {
  contractId: string;
}

export const AddWagonPopup = ({ contractId }: AddWagonPopupProps) => {
  const { isOpen, close } = usePopupStore("addWagon");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newWagon, setNewWagon] = useState({
    number: "",
    capacity: "",
    real_weight: "",
    owner: "",
    status: "at_elevator",
    date_of_departure: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<
    Array<{
      name: string;
      number: string;
      date: string;
      file?: File;
      fileName?: string;
    }>
  >([
    { name: "Паспорт качества", number: "", date: "" },
    { name: "ЭПД", number: "", date: "" },
  ]);

  const mutation = useAddWagon();

  // Update the handleAddWagon function to match the expected API structure
  const handleAddWagon = () => {
    const formData = new FormData();

    // Convert string values to integers for numeric fields
    formData.append("number", newWagon.number);

    // Make sure capacity is a valid number
    const capacity = Number.parseInt(newWagon.capacity, 10);
    if (isNaN(capacity)) {
      alert("Пожалуйста, введите корректное значение для веса по документам");
      return;
    }
    formData.append("capacity", capacity.toString());

    // Only add real_weight if it has a value
    if (newWagon.real_weight) {
      const realWeight = Number.parseInt(newWagon.real_weight, 10);
      if (!isNaN(realWeight)) {
        formData.append("real_weight", realWeight.toString());
      }
    }

    formData.append("owner", newWagon.owner);
    formData.append("status", newWagon.status);

    // Add date_of_departure as string
    if (newWagon.date_of_departure) {
      formData.append("date_of_departure", newWagon.date_of_departure);
    }

    // Add contract_id instead of contractId (to match the many-to-many relationship)
    formData.append("contract_id", contractId);

    // Append files with proper files_info structure
    const filesInfo = documents
      .filter((doc) => doc.file)
      .map((doc) => ({
        name: doc.name,
        number: doc.number,
        date: doc.date,
      }));

    formData.append("files_info", JSON.stringify(filesInfo));

    // Append actual files
    documents.forEach((doc) => {
      if (doc.file) {
        formData.append(`files`, doc.file);
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
          status: "at_elevator",
          date_of_departure: "",
        });
        setFiles([]);
        setDocuments([
          { name: "Паспорт качества", number: "", date: "" },
          { name: "ЭПД", number: "", date: "" },
        ]);
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
                  Вес по документам, кг <span className="text-red-500">*</span>
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
                  Фактический вес, кг
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
                <Input
                  id="owner"
                  value={newWagon.owner}
                  onChange={(e) =>
                    setNewWagon({ ...newWagon, owner: e.target.value })
                  }
                  placeholder="Введите собственника"
                />
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
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="at_elevator">На элеваторе</SelectItem>
                    <SelectItem value="in_transit">В пути</SelectItem>
                    <SelectItem value="shipped">Отгружен</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_departure" className="font-medium">
                  Дата отправления
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newWagon.date_of_departure && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newWagon.date_of_departure ? (
                        format(
                          new Date(newWagon.date_of_departure),
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
                        newWagon.date_of_departure
                          ? new Date(newWagon.date_of_departure)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setNewWagon({
                            ...newWagon,
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
                            format(new Date(doc.date), "dd.MM.yyyy")
                          ) : (
                            <span>Выберите дату</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={doc.date ? new Date(doc.date) : undefined}
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
                        className="w-full border-dashed text-green-600 hover:bg-green-50"
                        onClick={() =>
                          document.getElementById(`file-${index}`)?.click()
                        }
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Загрузить
                      </Button>
                    </div>
                    {doc.fileName && (
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
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
