"use client";

import { DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatNumber } from "@/lib/utils";

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
  Coins as DollarSign,
  CheckCircle,
  ClipboardList,
  FileUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const contract = contractData as any;
  const contractCurrency = contract?.currency || "";
  const { data: culturesData, isLoading: isCulturesLoading } = useFetchCultures(
    1,
    100
  );

  // Also update the formData state to include currency from contractData
  const [formData, setFormData] = useState({
    name: application?.name || "",
    currency: contractCurrency,
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
        currency: contractCurrency,
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
        currency: contractCurrency,
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
    if (contractCurrency && !formData.currency) {
      setFormData((prev) => ({
        ...prev,
        currency: contractCurrency,
      }));
    }
  }, [application, formData.culture, contractData, formData.currency]);

  // Calculate total amount when price or volume changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = Number.parseFloat(value);

    // Check volume against contract volume
    if (name === "volume") {
      const contractVolume = Number(contract?.total_volume) || 0;
      const currentApplicationVolume = Number(application?.volume) || 0;

      // Сумма volume всех заявок, кроме редактируемой
      const usedVolume = (contract?.applications || [])
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
          `Объем не может превышать ${formatNumber(
            maxAllowedVolume
          )} тонн (доступно по договору)`
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
            total_amount: totalAmount,
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
          total_amount: totalAmount,
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

  const applicationFieldClassName =
    "h-11 rounded-md border-[#dce4da] bg-white text-[#223137] shadow-sm placeholder:text-[#9aa49f] focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";
  const applicationLabelClassName =
    "text-xs font-black uppercase tracking-[0.02em] text-[#5f6c66]";
  const applicationSectionClassName =
    "rounded-md border border-[#dfe7de] bg-white p-3.5 shadow-[0_12px_28px_rgba(34,49,55,0.045)]";
  const applicationSectionHeaderClassName =
    "mb-3 flex items-center justify-between gap-3 border-b border-[#edf1eb] pb-3";
  const legacyCultureNames: Record<string, string> = {
    wheat: "Пшеница 3 класс",
    barley: "Ячмень",
    corn: "Кукуруза",
    sunflower: "Подсолнечник",
    flax: "Лен",
    rapeseed: "Рапс",
  };
  const cultureOptions =
    culturesData?.data?.map((culture: any) => ({
      value: String(culture.id || culture.value || culture.name),
      name: culture.name,
    })) || [];
  const filledCoreCount = [
    formData.name,
    formData.price_per_ton,
    formData.volume,
    formData.culture,
  ].filter(Boolean).length;
  const selectedCultureName =
    cultureOptions.find((culture) => culture.value === String(formData.culture))
      ?.name ||
    legacyCultureNames[String(formData.culture)] ||
    formData.culture;
  const hasSelectedCultureOption =
    !!formData.culture &&
    cultureOptions.some((culture) => culture.value === String(formData.culture));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="grid h-[96vh] max-h-[900px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-[#dfe7de] bg-[#f8faf7] [padding:0] sm:max-w-[980px]">
        <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-3.5 pr-12 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                <ClipboardList className="h-3.5 w-3.5" />
                Заявка по договору
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-[#223137]">
                {application ? "Редактировать заявку" : "Добавить заявку"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[#6f7774]">
                Объем, ставка, культура и документы отгрузки.
              </DialogDescription>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:min-w-[390px]">
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-1.5">
                <div className="text-[10px] font-black uppercase text-[#7b857f]">
                  Готовность
                </div>
                <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                  {filledCoreCount}/4
                </div>
              </div>
              <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] px-3 py-1.5">
                <div className="text-[10px] font-black uppercase text-[#7b857f]">
                  Сумма
                </div>
                <div className="mt-1 truncate text-lg font-black text-[#d5740b]">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-1.5">
                <div className="text-[10px] font-black uppercase text-[#7b857f]">
                  Документы
                </div>
                <div className="mt-1 text-lg font-black text-[#223137]">
                  {documents.length}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 space-y-3 overflow-y-auto px-4 py-3 sm:px-6">
          {/* Application Information Section */}
          <div className={applicationSectionClassName}>
            <div className={applicationSectionHeaderClassName}>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#223137]">
                    Информация о заявке
                  </h3>
                  <p className="text-xs text-[#7b857f]">
                    Основные параметры отгрузки и расчет суммы.
                  </p>
                </div>
              </div>
              <span className="hidden rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-xs font-black text-[#2f6b4f] sm:inline-flex">
                {selectedCultureName || "Культура не выбрана"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="name" className={applicationLabelClassName}>
                  Название заявки <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Введите название заявки"
                  className={applicationFieldClassName}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="price_per_ton"
                  className={applicationLabelClassName}
                >
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
                  className={applicationFieldClassName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="volume" className={applicationLabelClassName}>
                  Объем (т) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="volume"
                  name="volume"
                  type="number"
                  value={formData.volume}
                  onChange={handleInputChange}
                  placeholder="Введите объем в тоннах"
                  className={cn(
                    applicationFieldClassName,
                    volumeError
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  )}
                />
                {volumeError && (
                  <p className="text-red-500 text-xs mt-1">{volumeError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency" className={applicationLabelClassName}>
                  Валюта
                </Label>
                <div className="flex h-11 items-center rounded-md border border-[#edf1eb] bg-[#f7f8f5] px-3 font-black text-[#223137] shadow-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-[#6f7774]" />
                  <span>{contractCurrency || "KZT"}</span>
                </div>
              </div>

              {/* Culture Selection */}
              <div className="space-y-2">
                <Label htmlFor="culture" className={applicationLabelClassName}>
                  Культура <span className="text-red-500">*</span>
                </Label>

                {/* Custom select implementation */}
                <div className="relative">
                  <select
                    id="culture"
                    value={formData.culture}
                    onChange={(e) => handleCultureChange(e.target.value)}
                    className="h-11 w-full rounded-md border border-[#dce4da] bg-white px-3 py-2 text-sm font-semibold text-[#223137] shadow-sm outline-none focus:border-[#f38810] focus:ring-3 focus:ring-[#f38810]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Выберите культуру
                    </option>
                    {isCulturesLoading ? (
                      <option value="" disabled>
                        Загрузка культур...
                      </option>
                    ) : cultureOptions.length > 0 ? (
                      <>
                        {!hasSelectedCultureOption && formData.culture && (
                          <option value={formData.culture} hidden>
                            {selectedCultureName}
                          </option>
                        )}
                        {cultureOptions.map((culture) => (
                          <option key={culture.value} value={culture.value}>
                            {culture.name}
                          </option>
                        ))}
                      </>
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
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="comment" className={applicationLabelClassName}>
                  Комментарий
                </Label>
                <Input
                  id="comment"
                  name="comment"
                  type="text"
                  value={formData.comment}
                  onChange={handleInputChange}
                  placeholder="Введите комментарий"
                  className={applicationFieldClassName}
                />
              </div>

              <div className="space-y-2">
                <Label className={applicationLabelClassName}>Общая сумма</Label>
                <div className="flex h-12 items-center rounded-md border border-[#f2dfca] bg-[#fffdf9] px-3 font-black text-[#223137] shadow-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-[#2f6b4f]" />
                  <span className="text-lg">{formatCurrency(totalAmount)}</span>
                  <span className="ml-1 text-lg text-[#2f6b4f]">
                    {contractCurrency || "KZT"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={applicationSectionClassName}>
            <div className={applicationSectionHeaderClassName}>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                  <FileUp className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#223137]">
                    Документы заявки
                  </h3>
                  <p className="text-xs text-[#7b857f]">
                    Прикрепленные файлы, номера и даты документов.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {application?.id &&
                  documents.some((doc) => doc.file && doc.isNew) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUploadFiles}
                      disabled={uploadFilesMutation.isPending}
                      className="h-9 rounded-md border-[#dce8dc] bg-white px-3 text-xs font-black text-[#2f6b4f] hover:bg-[#f5faf5]"
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
                  className="h-9 rounded-md border-[#f2dfca] bg-white px-3 text-xs font-black text-[#d5740b] hover:bg-[#fff3e5]"
                >
                  <Plus className="h-4 w-4 mr-1" /> Добавить документ
                </Button>
              </div>
            </div>
            <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
              {documents.length > 0 ? (
                <>
                  <div className="mb-2 grid grid-cols-12 gap-2 rounded-md bg-[#f7f8f5] px-3 py-2 text-xs font-black uppercase text-[#7b857f]">
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
                      className="mb-2 grid grid-cols-12 items-start gap-2 rounded-md border border-[#edf1eb] bg-white px-3 py-3 shadow-sm last:mb-0"
                    >
                      <div className="col-span-1 pt-2 text-sm font-black text-[#53605a]">
                        {index + 1}
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={doc.name}
                          onChange={(e) =>
                            updateDocument(index, "name", e.target.value)
                          }
                          placeholder="Название документа"
                          className={cn(
                            applicationFieldClassName,
                            "h-10 border-dashed shadow-none"
                          )}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          value={doc.number}
                          onChange={(e) =>
                            updateDocument(index, "number", e.target.value)
                          }
                          placeholder="№ документа"
                          className={cn(
                            applicationFieldClassName,
                            "h-10 border-dashed shadow-none"
                          )}
                        />
                      </div>
                      <div className="col-span-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-10 w-full justify-start rounded-md border-[#dce4da] bg-white text-left font-semibold text-[#223137] shadow-none",
                                !doc.date && "text-[#9aa49f]"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-[#6f7774]" />
                              {doc.date ? (
                                format(new Date(doc.date), "dd.MM.yyyy")
                              ) : (
                                <span>Выберите дату</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto border-[#dfe7de] bg-white p-2 shadow-[0_18px_44px_rgba(34,49,55,0.16)]"
                            align="start"
                          >
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
                              className="rounded-md bg-white"
                              classNames={{
                                caption_label:
                                  "text-sm font-black capitalize text-[#223137]",
                                nav_button:
                                  "size-8 rounded-md border-[#dfe7de] bg-[#fbfcfa] text-[#53605a] opacity-100 hover:bg-[#eef5ef] hover:text-[#2f6b4f]",
                                head_cell:
                                  "w-9 rounded-md text-[0.72rem] font-black uppercase text-[#7b857f]",
                                day: "size-9 rounded-md p-0 text-sm font-semibold text-[#223137] hover:bg-[#fff3e5] hover:text-[#d5740b]",
                                day_selected:
                                  "bg-[#f38810] text-white hover:bg-[#f38810] hover:text-white focus:bg-[#f38810] focus:text-white",
                                day_today: "bg-[#eef5ef] text-[#2f6b4f]",
                                day_outside: "text-[#b6beb9] opacity-70",
                              }}
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
                              "h-10 w-full rounded-md border-dashed bg-white font-black shadow-none",
                              doc.isUploading
                                ? "border-[#f2dfca] text-[#d5740b] hover:bg-[#fff3e5]"
                                : "border-[#dce8dc] text-[#2f6b4f] hover:bg-[#f5faf5]"
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
                          <div className="mt-1 flex items-center text-xs text-[#7b857f]">
                            <FileText className="mr-1 h-3 w-3 shrink-0" />
                            <span className="max-w-[120px] truncate">
                              {doc.fileName || "Документ"}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-5 w-5 rounded-md p-0 hover:bg-[#fff1ed]"
                              onClick={() => removeFile(index)}
                              disabled={doc.isUploading}
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="col-span-1 flex justify-center pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-md p-0 text-[#c24135] hover:bg-[#fff1ed] hover:text-[#a8322a]"
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
                <div className="rounded-md border border-dashed border-[#dfe7de] bg-white py-8 text-center text-[#7b857f]">
                  <FileText className="mx-auto mb-2 h-10 w-10 text-[#f38810]" />
                  <p className="text-sm font-semibold">Нет прикрепленных документов</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addDocumentRow}
                    className="mt-3 rounded-md border-[#f2dfca] font-black text-[#d5740b] hover:bg-[#fff3e5]"
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
                "flex items-center rounded-md border p-3 text-sm font-semibold shadow-sm",
                notification.type === "success" &&
                  "border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]",
                notification.type === "error" &&
                  "border-[#f4d6ce] bg-[#fff1ed] text-[#b9472d]",
                notification.type === "info" &&
                  "border-[#dfe7de] bg-[#fbfcfa] text-[#53605a]"
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

        <DialogFooter className="border-t border-[#dfe7de] bg-white px-5 py-4 sm:px-6">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            className="h-11 rounded-md border-[#dce4da] px-5 font-bold text-[#53605a]"
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
            className="h-11 gap-2 rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
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
