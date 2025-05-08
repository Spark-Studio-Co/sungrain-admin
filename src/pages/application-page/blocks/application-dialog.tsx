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
  CheckCircle,
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
import { useGetContractsId } from "@/entities/contracts/hooks/query/use-get-contract-id.query";
import { useCreateApplication } from "@/entities/applications/hooks/mutations/use-create-application.mutation";
import { useUpdateApplication } from "@/entities/applications/hooks/mutations/use-update-application.mutation";
import { useUploadApplicationFiles } from "@/entities/applications/hooks/mutations/use-upload-application-files.mutation";
import { useDeleteApplicationFile } from "@/entities/applications/hooks/mutations/use-delete-application-file.mutation";
import { useFetchCultures } from "@/entities/cultures/hooks/query/use-get-cultures.query";

interface ApplicationDialogProps {
  isOpen: boolean;
  onClose: (shouldRefresh: boolean) => void;
  contractId: string;
  application?: any;
}

export const ApplicationDialog = ({
  isOpen,
  onClose,
  contractId,
  application,
}: ApplicationDialogProps) => {
  const { data: contractData, isLoading: isContractLoading } =
    useGetContractsId(contractId);
  const { data: culturesData, isLoading: isCulturesLoading } = useFetchCultures(
    1,
    100
  );

  // Also update the formData state to include currency from contractData
  const [formData, setFormData] = useState({
    name: application?.name || "",
    currency: contractData?.currency || "",
    price_per_ton: application?.price_per_ton || "",
    volume: application?.volume || "",
    culture: application?.culture || "",
    comment: application?.comment || "",
    contractId: contractId,
  });

  const [totalAmount, setTotalAmount] = useState(
    application?.total_amount || 0
  );

  // State for volume validation
  const [volumeError, setVolumeError] = useState("");

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
      isUploading?: boolean;
      isNew?: boolean;
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
    return [];
  });

  const createMutation = useCreateApplication({
    onSuccess: () => {
      // Reset form data
      setFormData({
        name: "",
        currency: contractData?.currency || "",
        price_per_ton: "",
        volume: "",
        culture: "",
        comment: "",
        contractId: contractId,
      });

      // Reset documents
      setDocuments([]);

      // Reset total amount
      setTotalAmount(0);

      // Reset volume error
      setVolumeError("");

      // Close dialog with refresh flag
      onClose(true);
    },
  });
  const updateMutation = useUpdateApplication({
    onSuccess: () => {
      // Reset form data
      setFormData({
        name: "",
        currency: contractData?.currency || "",
        price_per_ton: "",
        volume: "",
        culture: "",
        comment: "",
        contractId: contractId,
      });

      // Reset documents
      setDocuments([]);

      // Reset total amount
      setTotalAmount(0);

      // Reset volume error
      setVolumeError("");

      // Close dialog with refresh flag
      onClose(true);
    },
  });
  const uploadFilesMutation = useUploadApplicationFiles({
    onSuccess: (data) => {
      // Update documents with the newly uploaded files
      if (data && Array.isArray(data)) {
        setDocuments((prev) => {
          const newDocs = [...prev];
          // Find documents with isUploading flag and update them with server data
          const uploadingDocs = newDocs.filter((doc) => doc.isUploading);

          // Match uploaded files with their corresponding documents
          data.forEach((uploadedFile, index) => {
            if (index < uploadingDocs.length) {
              const docIndex = newDocs.findIndex(
                (doc) => doc === uploadingDocs[index]
              );
              if (docIndex !== -1) {
                newDocs[docIndex] = {
                  ...newDocs[docIndex],
                  id: uploadedFile.id,
                  location: uploadedFile.location || uploadedFile.file,
                  isUploading: false,
                  isNew: false,
                };
              }
            }
          });

          return newDocs;
        });

        // Show success notification
        setNotification({
          type: "success",
          message: "Документы успешно загружены",
        });
        setTimeout(() => setNotification(null), 3000);
      }
    },
    onError: (error) => {
      // Handle upload error
      console.error("Error uploading files:", error);
      setNotification({
        type: "error",
        message: "Ошибка при загрузке документов",
      });
      setTimeout(() => setNotification(null), 3000);

      // Reset uploading state for documents
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.isUploading ? { ...doc, isUploading: false } : doc
        )
      );
    },
  });
  const deleteFileMutation = useDeleteApplicationFile();

  useEffect(() => {
    if (application?.culture && !formData.culture) {
      setFormData((prev) => ({
        ...prev,
        culture: application.culture,
      }));
    }

    // Set currency from contract data when it loads
    if (contractData?.currency && !formData.currency) {
      setFormData((prev) => ({
        ...prev,
        currency: contractData.currency,
      }));
    }
  }, [application, formData.culture, contractData, formData.currency]);

  // Calculate total amount when price or volume changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number.parseFloat(value);

    // Check volume against contract volume
    if (name === "volume") {
      const contractVolume = Number(contractData?.total_volume) || 0;
      const currentApplicationVolume = Number(application?.volume) || 0;

      // Сумма volume всех заявок, кроме редактируемой
      const usedVolume = (contractData?.applications || [])
        .filter((app: any) => app.id !== application?.id)
        .reduce((sum: number, app: any) => sum + (Number(app.volume) || 0), 0);

      // Доступный объем по договору
      const availableVolume = Math.max(0, contractVolume - usedVolume);

      // Если редактируем, добавляем обратно текущую заявку
      const maxAllowedVolume = Math.max(
        0,
        availableVolume + currentApplicationVolume
      );

      if (numValue > maxAllowedVolume) {
        setVolumeError(
          `Объем не может превышать ${maxAllowedVolume.toLocaleString()} тонн (доступно по договору)`
        );
      } else {
        setVolumeError("");
      }
    }

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
        i === index
          ? {
              ...doc,
              file,
              fileName: file.name,
              isNew: true,
            }
          : doc
      )
    );
  };

  const removeFile = (index: number) => {
    setDocuments((prev) =>
      prev.map((doc, i) =>
        i === index
          ? {
              ...doc,
              file: undefined,
              fileName: undefined,
              isNew: false,
            }
          : doc
      )
    );
  };

  const addDocumentRow = () => {
    setDocuments((prev) => [...prev, { name: "", number: "", date: "" }]);
  };

  // Notification state for all operations
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const handleDeleteDocument = async (index: number) => {
    const doc = documents[index];

    if (application?.id && doc.number) {
      try {
        // Show deletion in progress notification
        setNotification({
          type: "info",
          message: `Удаление документа "${doc.name}"...`,
        });

        await deleteFileMutation.mutateAsync({
          applicationId: application.id,
          docNumber: doc.number,
        });

        // After successful deletion, remove the document from the local state
        setDocuments((prev) => prev.filter((_, i) => i !== index));

        // Show success notification
        setNotification({
          type: "success",
          message: `Документ "${doc.name}" был успешно удален`,
        });
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error("Error deleting document:", error);
        setNotification({
          type: "error",
          message: `Ошибка при удалении документа "${doc.name}"`,
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } else {
      // If there's no application ID or document number, just remove from local state
      removeDocumentRow(index);
    }
  };

  // Update the removeDocumentRow function to not call handleDeleteDocument again
  // This prevents duplicate API calls
  const removeDocumentRow = (index: number) => {
    const doc = documents[index];

    // For new documents or those with new files, just remove from state
    setDocuments((prev) => prev.filter((_, i) => i !== index));

    // Show notification for client-side deletions
    if (doc.name) {
      setNotification({
        type: "info",
        message: `Документ "${doc.name}" был удален`,
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const updateDocument = (index: number, field: string, value: string) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc))
    );
  };

  // Function to handle immediate file uploads
  const handleUploadFiles = async () => {
    const docsWithFiles = documents.filter((doc) => doc.file && doc.isNew);

    if (docsWithFiles.length === 0 || !application?.id) return;

    try {
      // Mark documents as uploading
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.file && doc.isNew ? { ...doc, isUploading: true } : doc
        )
      );

      // Show uploading notification
      setNotification({
        type: "info",
        message: "Загрузка документов...",
      });

      const filesInfo = docsWithFiles.map((doc) => ({
        name: doc.name,
        number: doc.number || "",
        date: doc.date || "",
      }));

      const files = docsWithFiles.map((doc) => doc.file as File);

      await uploadFilesMutation.mutateAsync({
        applicationId: application.id,
        files: files,
        filesInfo: filesInfo,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleSubmit = async () => {
    // Check if volume exceeds contract volume
    if (volumeError) {
      return;
    }

    try {
      const formDataObj = new FormData();

      formDataObj.append("currency", formData.currency);
      formDataObj.append("price_per_ton", formData.price_per_ton);
      formDataObj.append("volume", formData.volume);
      formDataObj.append("culture", formData.culture);
      formDataObj.append("contractId", contractId);

      let applicationId;

      if (application) {
        await updateMutation.mutateAsync({
          id: application.id,
          data: {
            name: formData.name,
            price_per_ton: Number(formData.price_per_ton),
            volume: Number(formData.volume),
            culture: formData.culture,
            comment: formData.comment,
            currency: formData.currency,
            contractId: contractId,
          },
        });
        applicationId = application.id;
      } else {
        const result = await createMutation.mutateAsync({
          name: formData.name,
          price_per_ton: Number(formData.price_per_ton),
          currency: formData.currency,
          volume: Number(formData.volume),
          comment: formData.comment,
          culture: formData.culture,
          contractId: contractId as any,
        });
        applicationId = result.id;
      }

      const docsWithFiles = documents.filter((doc) => doc.file);

      if (docsWithFiles.length > 0) {
        const filesInfo = docsWithFiles.map((doc) => ({
          name: doc.name,
          number: doc.number || "",
          date: doc.date || "",
        }));

        const files = docsWithFiles.map((doc) => doc.file as File);

        await uploadFilesMutation.mutateAsync({
          applicationId: applicationId,
          files: files,
          filesInfo: filesInfo,
        });
      }
    } catch (error) {
      console.error("Error saving application:", error);
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
                <Label htmlFor="name" className="font-medium">
                  Название заявки <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Введите название заявки"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_per_ton" className="font-medium">
                  Цена за тонну <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price_per_ton"
                  min={0}
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
                  className={
                    volumeError
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {volumeError && (
                  <p className="text-red-500 text-xs mt-1">{volumeError}</p>
                )}
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
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment" className="font-medium">
                  Комментарий
                </Label>
                <Input
                  id="comment"
                  name="comment"
                  type="text"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Введите комментарий"
                />
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
          <div className="bg-amber-50 p-3 rounded-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-amber-700 uppercase text-sm">
                ДОКУМЕНТЫ ЗАЯВКИ
              </h3>
              <div className="flex gap-2">
                {application?.id &&
                  documents.some((doc) => doc.file && doc.isNew) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUploadFiles}
                      disabled={uploadFilesMutation.isPending}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      {uploadFilesMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />{" "}
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-1" /> Загрузить файлы
                        </>
                      )}
                    </Button>
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addDocumentRow}
                  className="text-amber-600 border-amber-300 hover:bg-amber-100"
                >
                  <Plus className="h-4 w-4 mr-1" /> Добавить документ
                </Button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md border border-amber-100">
              {documents.length > 0 ? (
                <>
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
                            className={cn(
                              "w-full border-dashed",
                              doc.isUploading
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-green-600 hover:bg-green-50"
                            )}
                            onClick={() =>
                              document.getElementById(`file-${index}`)?.click()
                            }
                            disabled={doc.isUploading}
                          >
                            {doc.isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />{" "}
                                Загрузка...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-1" />
                                {doc.fileName || doc.location
                                  ? "Заменить"
                                  : "Загрузить"}
                              </>
                            )}
                          </Button>
                        </div>
                        {(doc.fileName || doc.location) && !doc.isUploading && (
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
                              disabled={doc.isUploading}
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
                            if (
                              application?.id &&
                              doc.number &&
                              !doc.file &&
                              !doc.isNew
                            ) {
                              handleDeleteDocument(index);
                            } else {
                              removeDocumentRow(index);
                            }
                          }}
                          disabled={doc.isUploading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-amber-300" />
                  <p>Нет прикрепленных документов</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addDocumentRow}
                    className="mt-2 text-amber-600 border-amber-300 hover:bg-amber-100"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Добавить документ
                  </Button>
                </div>
              )}
            </div>
          </div>
          {notification && (
            <div
              className={cn(
                "p-3 rounded-md text-sm flex items-center",
                notification.type === "success" &&
                  "bg-green-50 text-green-700 border border-green-200",
                notification.type === "error" &&
                  "bg-red-50 text-red-700 border border-red-200",
                notification.type === "info" &&
                  "bg-blue-50 text-blue-700 border border-blue-200"
              )}
            >
              {notification.type === "success" && (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {notification.type === "error" && <X className="h-4 w-4 mr-2" />}
              {notification.type === "info" && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {notification.message}
            </div>
          )}
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
              uploadFilesMutation.isPending ||
              !formData.name ||
              !formData.price_per_ton ||
              !formData.volume ||
              !formData.culture ||
              !!volumeError
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
