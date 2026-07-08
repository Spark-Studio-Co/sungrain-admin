"use client";

import { useEffect, useRef } from "react";
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
import { DatePickerInput } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FormError } from "@/components/ui/form-error";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  AlertCircle,
  Loader2,
  Package,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useAddContract } from "../api/post/use-create-contract";
import { useState } from "react";
import { useContractDialogStore } from "../model/use-contract-dialog";
import { useFetchCultures } from "@/entities/cultures/hooks/query/use-get-cultures.query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";

type AddContractErrors = Partial<
  Record<
    | "number"
    | "name"
    | "date"
    | "estimated_cost"
    | "companyId"
    | "crop"
    | "total_volume"
    | "currency",
    string
  >
>;

type AddContractDraft = {
  number: string;
  unk: string;
  name: string;
  crop: string;
  estimated_cost: number;
  companyId: string | number | undefined;
  total_volume: string;
  currency: string;
  date: string;
};

const hasAddContractErrors = (errors: AddContractErrors) =>
  Object.values(errors).some(Boolean);

export const AddContractDialog = () => {
  const { isAddDialogOpen, setDialogOpen } = useContractDialogStore();
  const toast = useToast();
  const { data: cultures } = useFetchCultures();
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);

  const [newContract, setNewContract] = useState<AddContractDraft>({
    number: "",
    unk: "",
    name: "",
    crop: "",
    estimated_cost: 0,
    companyId: undefined,
    total_volume: "",
    currency: "USD",
    date: new Date().toISOString(),
  });

  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<AddContractErrors>({});

  const [documents, setDocuments] = useState<
    Array<{
      name: string;
      number: string;
      date: string;
      file?: File;
      fileName?: string;
    }>
  >([]);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null]);

  const mutation = useAddContract();
  const formShellClass =
    "rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_14px_34px_rgba(22,42,35,0.06)]";
  const sectionTitleClass =
    "flex items-center gap-2 text-sm font-black uppercase text-[#223137]";
  const labelClass = "text-sm font-bold text-[#31423b]";
  const inputClass =
    "h-11 rounded-md border-[#dce4da] bg-[#fbfcfa] text-[#223137] shadow-sm focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";
  const selectTriggerClass =
    "h-11 w-full rounded-md border-[#dce4da] bg-[#fbfcfa] px-3 font-semibold text-[#223137] shadow-sm focus:border-[#f38810] focus:ring-[#f38810]/20";
  const mutedMetricClass =
    "rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2";
  const centeredContentClass = "mx-auto w-full max-w-[1040px]";
  const addDocument = () =>
    setDocuments([...documents, { name: "", number: "", date: "" }]);

  const clearError = (field: keyof AddContractErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;

      return {
        ...prev,
        [field]: undefined,
      };
    });
  };

  const updateContractDraft = (patch: Partial<AddContractDraft>) => {
    Object.keys(patch).forEach((field) =>
      clearError(field as keyof AddContractErrors)
    );
    setNewContract((prev) => ({ ...prev, ...patch }));
  };

  const validateContractDraft = () => {
    const nextErrors: AddContractErrors = {};
    const volume = Number(newContract.total_volume);
    const estimatedCost = Number(newContract.estimated_cost);

    if (!newContract.number.trim()) {
      nextErrors.number = "Укажите номер контракта.";
    }
    if (!newContract.name.trim()) {
      nextErrors.name = "Добавьте понятное название сделки.";
    }
    if (!newContract.date) {
      nextErrors.date = "Выберите дату контракта.";
    }
    if (newContract.estimated_cost && !Number.isFinite(estimatedCost)) {
      nextErrors.estimated_cost = "Стоимость должна быть числом.";
    }
    if (!newContract.companyId) {
      nextErrors.companyId = "Выберите компанию.";
    }
    if (!newContract.crop) {
      nextErrors.crop = "Выберите культуру.";
    }
    if (!Number.isFinite(volume) || volume <= 0) {
      nextErrors.total_volume = "Объем должен быть больше 0 тонн.";
    }
    if (!newContract.currency) {
      nextErrors.currency = "Выберите валюту.";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const updateDocument = (
    index: number,
    patch: Partial<{
      name: string;
      number: string;
      date: string;
      file?: File;
      fileName?: string;
    }>
  ) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], ...patch };
    setDocuments(newDocs);
  };

  const removeDocument = (index: number) => {
    const removedFile = documents[index]?.file;
    setDocuments(documents.filter((_, docIndex) => docIndex !== index));
    fileInputRefs.current.splice(index, 1);

    if (removedFile) {
      setFiles((prev) => prev.filter((file) => file !== removedFile));
    }
  };

  const setDocumentFile = (index: number, file: File) => {
    const currentFile = documents[index]?.file;

    updateDocument(index, { file, fileName: file.name });
    setFiles((prev) => [
      ...prev.filter((existingFile) => existingFile !== currentFile),
      file,
    ]);
  };

  const clearDocumentFile = (index: number) => {
    const currentFile = documents[index]?.file;

    updateDocument(index, { file: undefined, fileName: undefined });

    if (currentFile) {
      setFiles((prev) => prev.filter((file) => file !== currentFile));
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      setNewContract({
        number: "",
        unk: "",
        name: "",
        crop: "",
        estimated_cost: 0,
        companyId: undefined,
        total_volume: "",
        currency: "USD",
        date: new Date().toISOString(),
      });
      setFiles([]);
      setDocuments([]);
      setErrors({});
      fileInputRefs.current = [null, null];
    }
  }, [isAddDialogOpen]);

  const handleAddContract = () => {
    const validationErrors = validateContractDraft();

    if (hasAddContractErrors(validationErrors)) {
      toast.error(
        "Проверьте данные контракта",
        "Мы подсветили поля, которые нужны для создания сделки."
      );
      return;
    }

    // Create FormData to send files along with contract data
    const formData = new FormData();
    const trimmedUnk = newContract.unk.trim();

    // Append each field separately (excluding ID)
    formData.append("number", newContract.number);
    if (trimmedUnk) {
      formData.append("unk", trimmedUnk);
    }
    formData.append("name", newContract.name);
    formData.append("crop", newContract.crop);
    formData.append("companyId", Number(newContract.companyId) as any);

    // Use parseFloat for total_volume to support decimal values
    formData.append(
      "total_volume",
      Number.parseFloat(newContract.total_volume) as any
    );

    formData.append(
      "estimated_cost",
      Number(newContract.estimated_cost) as any
    );
    formData.append("currency", newContract.currency);
    formData.append("date", newContract.date);

    // Add documents info
    const documentsInfo = documents
      .filter((doc) => doc.file)
      .map((doc) => ({
        name: doc.name,
        number: doc.number,
        date: doc.date,
      }));

    if (documentsInfo.length > 0) {
      formData.append("files_info", JSON.stringify(documentsInfo));
    }

    // Append document files
    documents.forEach((doc) => {
      if (doc.file) {
        formData.append("files", doc.file);
      }
    });

    // Append additional files
    files.forEach((file) => {
      // Check if this file is already included in documents
      const isDocumentFile = documents.some((doc) => doc.file === file);
      if (!isDocumentFile) {
        formData.append("files", file);
      }
    });

    // Send the FormData to the API
    mutation.mutate(formData, {
      onSuccess: () => {
        setDialogOpen(false);
        toast.success(
          "Контракт создан",
          `${newContract.number} добавлен в реестр сделок.`
        );
      },
      onError: (error) => {
        toast.error(
          "Не удалось создать контракт",
          error instanceof Error
            ? error.message
            : "Проверьте данные и попробуйте еще раз."
        );
      },
    });
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="grid h-[92vh] max-h-[860px] w-[calc(100vw-2rem)] !max-w-[1120px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-md border-[#dfe7de] bg-[#f6f8f5] p-0 shadow-[0_28px_90px_rgba(22,42,35,0.24)]">
        <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-5 sm:px-6">
          <div
            data-add-contract-layout="header"
            className={`${centeredContentClass} flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between`}
          >
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#dfe7de] bg-[#eef5ef] px-3 py-1 text-xs font-black uppercase text-[#2f6b4f]">
                <FileText className="h-3.5 w-3.5" />
                Новый договор
              </div>
              <DialogTitle className="text-2xl font-black leading-tight text-[#223137]">
                Добавить новый контракт
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-[#6f7774]">
                Заполните основные параметры и документы сделки.
              </DialogDescription>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mr-16 lg:min-w-[440px]">
              <div className={mutedMetricClass}>
                <p className="text-[11px] font-black uppercase text-[#7b857f]">
                  Номер
                </p>
                <p className="mt-1 truncate text-sm font-black text-[#223137]">
                  {newContract.number || "Не указан"}
                </p>
              </div>
              <div className={mutedMetricClass}>
                <p className="text-[11px] font-black uppercase text-[#7b857f]">
                  Объем
                </p>
                <p className="mt-1 truncate text-sm font-black text-[#223137]">
                  {newContract.total_volume || "0"} т
                </p>
              </div>
              <div className={mutedMetricClass}>
                <p className="text-[11px] font-black uppercase text-[#7b857f]">
                  Документы
                </p>
                <p className="mt-1 truncate text-sm font-black text-[#223137]">
                  {documents.length}
                </p>
              </div>
              <div className="rounded-md border border-[#f6d7b3] bg-[#fff8ef] px-3 py-2">
                <p className="text-[11px] font-black uppercase text-[#a96516]">
                  Валюта
                </p>
                <p className="mt-1 truncate text-sm font-black text-[#f38810]">
                  {newContract.currency}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
          {hasAddContractErrors(errors) && (
            <Alert
              variant="destructive"
              className={`${centeredContentClass} mb-4 border-[#f2c7c1] bg-[#fff8f7]`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Не хватает данных</AlertTitle>
              <AlertDescription>
                Проверьте подсвеченные поля. После исправления контракт можно
                добавить.
              </AlertDescription>
            </Alert>
          )}
          <Tabs
            data-add-contract-layout="body"
            defaultValue="basic"
            className={`${centeredContentClass} min-h-full`}
          >
            <TabsList className="mx-auto mb-5 grid h-auto w-full max-w-[560px] grid-cols-1 gap-2 rounded-md border border-[#dfe7de] bg-white p-1 shadow-sm md:grid-cols-2">
              <TabsTrigger
                value="basic"
                className="h-12 rounded-md px-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_12px_24px_rgba(243,136,16,0.22)]"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-xs data-[state=active]:bg-white/15">
                  01
                </span>
                Основная информация
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="h-12 rounded-md px-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_12px_24px_rgba(243,136,16,0.22)]"
              >
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-xs">
                  02
                </span>
                Документы
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0 space-y-4">
              <div className={formShellClass}>
                <div className={sectionTitleClass}>
                  <FileText className="h-4 w-4 text-[#f38810]" />
                  Основные данные
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="number" className={labelClass}>
                    Номер контракта <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="number"
                    className={inputClass}
                    aria-invalid={Boolean(errors.number)}
                    placeholder="SG-2026-007"
                    value={newContract.number}
                    onChange={(e) =>
                      updateContractDraft({ number: e.target.value })
                    }
                  />
                  <FormError message={errors.number} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unk" className={labelClass}>
                    УНК
                  </Label>
                  <Input
                    id="unk"
                    className={inputClass}
                    placeholder="Введите УНК"
                    value={newContract.unk}
                    onChange={(e) =>
                      updateContractDraft({ unk: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className={labelClass}>
                    Название <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    className={inputClass}
                    aria-invalid={Boolean(errors.name)}
                    placeholder="Например: экспорт пшеницы в порт Актау"
                    value={newContract.name}
                    onChange={(e) =>
                      updateContractDraft({ name: e.target.value })
                    }
                  />
                  <FormError message={errors.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className={labelClass}>
                    Дата контракта <span className="text-destructive">*</span>
                  </Label>
                  <DatePickerInput
                    id="date"
                    className={inputClass}
                    value={newContract.date}
                    outputFormat="iso"
                    onChange={(date) =>
                      updateContractDraft({ date })
                    }
                  />
                  <FormError message={errors.date} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost" className={labelClass}>
                    Ориентировочная стоимость
                  </Label>
                  <Input
                    id="estimated_cost"
                    type="text"
                    className={inputClass}
                    aria-invalid={Boolean(errors.estimated_cost)}
                    placeholder="0"
                    value={newContract.estimated_cost}
                    onChange={(e) =>
                      updateContractDraft({
                        estimated_cost: Number(e.target.value),
                      })
                    }
                  />
                  <FormError message={errors.estimated_cost} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className={labelClass}>
                    Компания <span className="text-destructive">*</span>
                  </Label>
                  {isCompaniesLoading ? (
                    <Skeleton className="h-11 w-full rounded-md" />
                  ) : (
                    <Select
                      value={
                        newContract.companyId
                          ? String(newContract.companyId)
                          : undefined
                      }
                      onValueChange={(value) =>
                        updateContractDraft({ companyId: value as any })
                      }
                    >
                      <SelectTrigger
                        aria-invalid={Boolean(errors.companyId)}
                        className={selectTriggerClass}
                      >
                        <SelectValue placeholder="Выберите компанию" />
                      </SelectTrigger>
                      <SelectContent>
                        {companiesData?.data?.map((company: any) => (
                          <SelectItem
                            key={company.id}
                            value={String(company.id)}
                          >
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormError message={errors.companyId} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crop" className={labelClass}>
                    Культура <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newContract.crop}
                    onValueChange={(value) =>
                      updateContractDraft({ crop: value })
                    }
                  >
                    <SelectTrigger
                      aria-invalid={Boolean(errors.crop)}
                      className={selectTriggerClass}
                    >
                      <SelectValue placeholder="Выберите культуру" />
                    </SelectTrigger>
                    <SelectContent>
                      {cultures?.data?.map((crop: any) => (
                        <SelectItem
                          key={crop.id || crop}
                          value={crop.name || crop}
                        >
                          {crop.name || crop}
                        </SelectItem>
                      )) || (
                        <SelectItem value="loading" disabled>
                          Загрузка...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormError message={errors.crop} />
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_volume" className={labelClass}>
                      Общий объем (тонн){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className={inputClass}
                      aria-invalid={Boolean(errors.total_volume)}
                      id="total_volume"
                      type="text"
                      step="0.01"
                      placeholder="0"
                      value={newContract.total_volume || ""}
                      onChange={(e) =>
                        updateContractDraft({ total_volume: e.target.value })
                      }
                    />
                    <FormError message={errors.total_volume} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className={labelClass}>
                      Валюта <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newContract.currency}
                      onValueChange={(value) =>
                        updateContractDraft({ currency: value })
                      }
                    >
                      <SelectTrigger
                        aria-invalid={Boolean(errors.currency)}
                        className={selectTriggerClass}
                      >
                        <SelectValue placeholder="Выберите валюту" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="KZT">KZT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormError message={errors.currency} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-0 space-y-4">
              <div className={formShellClass}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className={sectionTitleClass}>
                      <Package className="h-4 w-4 text-[#f38810]" />
                      Документы контракта
                    </div>
                    <p className="mt-2 text-sm text-[#7b857f]">
                      Добавьте документы и прикрепите файлы к каждой позиции.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={addDocument}
                    className="h-10 rounded-md border-[#f6c587] bg-[#fff8ef] px-4 font-black text-[#d26d07] shadow-sm hover:bg-[#ffefd9] hover:text-[#b85d05]"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить документ
                  </Button>
                </div>

                {documents.length === 0 ? (
                  <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed border-[#f6c587] bg-[#fffaf2] px-6 py-10 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#f38810] text-white shadow-[0_12px_24px_rgba(243,136,16,0.22)]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-black text-[#223137]">
                      Документов пока нет
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-[#7b857f]">
                      Добавьте заявку, спецификацию или другой файл по договору.
                    </p>
                    <Button
                      onClick={addDocument}
                      className="mt-5 h-10 rounded-md bg-[#f38810] px-4 font-black text-white shadow-[0_12px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
                    >
                      <Plus className="h-4 w-4" />
                      Добавить документ
                    </Button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4 shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#223137]">
                              Документ заявки
                            </p>
                            <p className="text-xs font-semibold text-[#7b857f]">
                              {doc.fileName || "Файл не выбран"}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(index)}
                          className="h-9 w-9 rounded-md text-[#8a928f] hover:bg-[#fff1f1] hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_auto] lg:items-end">
                        <div className="space-y-2">
                          <Label className={labelClass}>Наименование</Label>
                        <Input
                          value={doc.name}
                          onChange={(e) =>
                            updateDocument(index, { name: e.target.value })
                          }
                          placeholder="Название документа"
                            className={inputClass}
                        />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>Номер</Label>
                        <Input
                          value={doc.number}
                          onChange={(e) =>
                            updateDocument(index, { number: e.target.value })
                          }
                          placeholder="APP-0101"
                            className={inputClass}
                        />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>Дата документа</Label>
                          <DatePickerInput
                            value={doc.date}
                            outputFormat="date"
                            placeholder="Выберите дату"
                            className={inputClass}
                            onChange={(date) =>
                              updateDocument(index, { date })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id={`file-${index}`}
                          className="hidden"
                          ref={(el: any) => (fileInputRefs.current[index] = el)}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                setDocumentFile(index, e.target.files[0]);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                            className="h-11 rounded-md border-[#dfe7de] bg-white px-4 font-black text-[#2f6b4f] shadow-sm hover:bg-[#eef5ef] hover:text-[#24563f]"
                          onClick={() => fileInputRefs.current[index]?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {doc.fileName ? "Заменить" : "Загрузить"}
                        </Button>
                        {doc.fileName && (
                          <Button
                            variant="ghost"
                              size="icon"
                              className="h-11 w-11 rounded-md text-red-500 hover:bg-red-50"
                              onClick={() => clearDocumentFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
                </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="border-t border-[#dfe7de] bg-white px-5 py-4 sm:px-6">
          <div
            data-add-contract-layout="footer"
            className={`${centeredContentClass} flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={mutation.isPending}
              className="h-11 rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleAddContract}
              disabled={mutation.isPending}
              className="h-11 rounded-md bg-[#f38810] px-6 font-black text-white shadow-[0_12px_26px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить контракт"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
