"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Loader2,
  Upload,
  X,
  FileText,
  CalendarIcon,
  Plus,
  Trash2,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useGetContractsId } from "@/entities/contracts/api/get/use-get-contract-id";
import { useCreateApplication } from "@/entities/applications/api/use-create-application";
import { useUpdateApplication } from "@/entities/applications/api/use-update-application";
import { useUploadApplicationFiles } from "@/entities/applications/api/use-upload-application-files";
import { useDeleteApplicationFile } from "@/entities/applications/api/use-delete-application-file";
import { useFetchCultures } from "@/entities/cultures/api/use-get-cultures";

interface ApplicationDialogProps {
  isOpen: boolean;
  onClose: (shouldRefresh: boolean) => void;
  contractId: string;
  application?: any; // For editing existing application
}

export const ApplicationDialog = ({
  isOpen,
  onClose,
  contractId,
  application,
}: ApplicationDialogProps) => {
  const { data: contractData } = useGetContractsId(contractId);
  const { data: culturesData, isLoading: isCulturesLoading } = useFetchCultures(
    1,
    100
  );

  // Also update the formData state to include currency from contractData
  const [formData, setFormData] = useState({
    currency: contractData?.currency || "",
    price_per_ton: application?.price_per_ton || "",
    volume: application?.volume || "",
    culture: application?.culture || "",
    contractId: contractId,
  });

  const [totalAmount, setTotalAmount] = useState(
    application?.total_amount || 0
  );
  // Update the useState for documents to properly initialize from application files if they exist
  // Replace the current documents state initialization with this:

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
  >(() => {
    // If we have an application with files, initialize from those
    if (application?.files && application.files.length > 0) {
      return application.files.map((file: any) => ({
        id: file.id,
        name: file.name || "Документ",
        number: file.number || "",
        date: file.date || "",
        fileName: file.name,
        location: typeof file === "string" ? file : file.location || file.file,
      }));
    }

    // Otherwise use default documents
    return [
      { name: "Счет на оплату", number: "", date: "" },
      { name: "Акт выполненных работ", number: "", date: "" },
    ];
  });

  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication();
  const uploadFilesMutation = useUploadApplicationFiles();
  const deleteFileMutation = useDeleteApplicationFile();

  useEffect(() => {
    if (application?.culture && !formData.culture) {
      setFormData((prev) => ({
        ...prev,
        culture: application.culture,
      }));
    }
  }, [application, formData.culture]);

  // Calculate total amount when price or volume changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number.parseFloat(value);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Calculate total amount
    if (name === "price_per_ton") {
      const volume = Number.parseFloat(formData.volume) || 0;
      if (!isNaN(numValue) && !isNaN(volume)) {
        setTotalAmount(numValue * volume);
      }
    } else if (name === "volume") {
      const price = Number.parseFloat(formData.price_per_ton) || 0;
      if (!isNaN(numValue) && !isNaN(price)) {
        setTotalAmount(price * numValue);
      }
    }
  };

  const handleCultureChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      culture: value,
    }));
  };

  // Document management functions
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
    // If this is an existing document with an ID and we're in edit mode
    const doc = documents[index];
    if (application?.id && doc.number && !doc.file) {
      // For existing documents without new files, we need to delete from the server
      handleDeleteDocument(index);
    } else {
      // For new documents or those with new files, just remove from state
      setDocuments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateDocument = (index: number, field: string, value: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  // Add a function to handle document deletion
  const handleDeleteDocument = async (index: number) => {
    const doc = documents[index];

    console.log(doc);

    if (application?.id && doc.number) {
      try {
        await deleteFileMutation.mutateAsync({
          applicationId: application.id,
          docNumber: doc.number,
        });

        // Remove the document from the local state
        removeDocumentRow(index);
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    } else {
      // If there's no application ID or document number, just remove from local state
      removeDocumentRow(index);
    }
  };

  // Update the handleSubmit function to include currency in the data
  const handleSubmit = async () => {
    try {
      // For creating/updating basic application data
      const formDataObj = new FormData();

      formDataObj.append("currency", formData.currency);
      formDataObj.append("price_per_ton", formData.price_per_ton);
      formDataObj.append("volume", formData.volume);
      formDataObj.append("culture", formData.culture);
      formDataObj.append("contractId", contractId);

      // First, create or update the application
      let applicationId;

      if (application) {
        await updateMutation.mutateAsync({
          id: application.id,
          data: {
            price_per_ton: Number(formData.price_per_ton),
            volume: Number(formData.volume),
            culture: formData.culture,
            currency: formData.currency,
            contractId: contractId,
          },
        });
        applicationId = application.id;
      } else {
        const result = await createMutation.mutateAsync({
          price_per_ton: Number(formData.price_per_ton),
          currency: formData.currency,
          volume: Number(formData.volume),
          culture: formData.culture,
          contractId: contractId as any,
        });
        applicationId = result.id;
      }

      // Then handle file uploads if there are any
      const docsWithFiles = documents.filter((doc) => doc.file);

      if (docsWithFiles.length > 0) {
        // Create the files_info array with the required structure
        const filesInfo = docsWithFiles.map((doc) => ({
          name: doc.name,
          number: doc.number || "",
          date: doc.date || "",
        }));

        // Get all files
        const files = docsWithFiles.map((doc) => doc.file as File);

        // Use the upload files mutation
        await uploadFilesMutation.mutateAsync({
          applicationId: applicationId,
          files: files,
          filesInfo: filesInfo,
        });
      }

      // Close dialog and refresh data
      onClose(true);
    } catch (error) {
      console.error("Error saving application:", error);
      // You could add toast notification here for error feedback
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {application ? "Редактировать заявку" : "Добавить новую заявку"}
          </DialogTitle>
          <DialogDescription>
            Заполните информацию о заявке по договору
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Application Information Section */}
          <div className="bg-blue-50 p-3 rounded-md">
            <h3 className="font-semibold text-blue-700 mb-3 uppercase text-sm">
              ИНФОРМАЦИЯ О ЗАЯВКЕ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-md border border-blue-100">
              <div className="space-y-2">
                <Label htmlFor="price_per_ton" className="font-medium">
                  Цена за тонну <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price_per_ton"
                  name="price_per_ton"
                  type="number"
                  value={formData.price_per_ton}
                  onChange={handleInputChange}
                  placeholder="Введите цену за тонну"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume" className="font-medium">
                  Объем (т) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="volume"
                  name="volume"
                  type="number"
                  value={formData.volume}
                  onChange={handleInputChange}
                  placeholder="Введите объем в тоннах"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className="font-medium">
                  Валюта
                </Label>
                <div className="p-3 bg-muted rounded-md font-medium flex items-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                  <span>{contractData?.currency || "KZT"}</span>
                </div>
              </div>

              {/* Culture Selection */}
              <div className="space-y-2">
                <Label htmlFor="culture" className="font-medium">
                  Культура <span className="text-red-500">*</span>
                </Label>

                {/* Custom select implementation */}
                <div className="relative">
                  <select
                    id="culture"
                    value={formData.culture}
                    onChange={(e) => handleCultureChange(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Выберите культуру
                    </option>
                    {isCulturesLoading ? (
                      <option value="" disabled>
                        Загрузка культур...
                      </option>
                    ) : culturesData?.data && culturesData.data.length > 0 ? (
                      culturesData.data.map((culture: any) => (
                        <option
                          key={culture.id || culture.value}
                          value={culture.id || culture.value}
                        >
                          {culture.name}
                        </option>
                      ))
                    ) : (
                      // Fallback to hardcoded values if API fails
                      <>
                        <option value="wheat">Пшеница</option>
                        <option value="barley">Ячмень</option>
                        <option value="corn">Кукуруза</option>
                        <option value="sunflower">Подсолнечник</option>
                        <option value="flax">Лен</option>
                        <option value="rapeseed">Рапс</option>
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 opacity-50"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Общая сумма</Label>
                <div className="p-3 bg-muted rounded-md font-medium flex items-center">
                  <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                  <span>{totalAmount.toLocaleString()}</span>
                  <span className="ml-1 text-green-600">
                    {contractData?.currency || "KZT"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-amber-50 p-3 rounded-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-amber-700 uppercase text-sm">
                ДОКУМЕНТЫ ЗАЯВКИ
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
                        {doc.fileName || doc.location
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
                      onClick={() => {
                        const doc = documents[index];
                        if (application?.id && doc.number && !doc.file) {
                          console.log(doc);
                          handleDeleteDocument(index);
                        } else {
                          console.log(doc);

                          removeDocumentRow(index);
                        }
                      }}
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
            onClick={() => onClose(false)}
            className="mr-2"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={
              createMutation.isPending ||
              updateMutation.isPending ||
              !formData.price_per_ton ||
              !formData.volume ||
              !formData.culture
            }
            className="gap-2"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : application ? (
              "Сохранить"
            ) : (
              "Добавить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
