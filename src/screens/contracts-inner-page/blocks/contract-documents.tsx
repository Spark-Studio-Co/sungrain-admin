"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileText,
  Loader2,
  Trash2,
  Upload,
  X,
  FolderOpen,
  Files,
  FileCheck2,
  TrainFront,
  Award,
  Search,
  LayoutGrid,
  List,
  Plus,
  CloudUpload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  deleteContractDocument,
  uploadContractDocuments,
} from "@/entities/contracts/api/contract-documents.api";
import {
  contractDocumentTypes,
  contractDocumentTypeLabel,
  validateContractDocumentFiles,
  type ContractDocument,
  type ContractDocumentType,
} from "@/entities/contracts/model/contract-documents";
import { resolveBackendFileUrl } from "@/shared/contracts/contract-ops";

type Draft = {
  file: File;
  name: string;
  type: ContractDocumentType;
  id: number;
};

export function ContractDocuments({
  contractId,
  files,
  isAdmin,
}: {
  contractId: string;
  files: unknown;
  isAdmin: boolean;
}) {
  const documents = useMemo<ContractDocument[]>(
    () =>
      Array.isArray(files)
        ? files.filter(Boolean).map((file) =>
            typeof file === "string"
              ? {
                  location: file,
                  name: file.split(/[\\/]/).pop() || "Документ",
                }
              : file,
          )
        : [],
    [files],
  );
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [dragging, setDragging] = useState(false);
  const categories = [
    { id: "all", label: "Все документы", icon: Files, types: null },
    {
      id: "contracts",
      label: "Договоры",
      icon: FileText,
      types: ["contract", "legacy"],
    },
    {
      id: "waybills",
      label: "Накладные",
      icon: TrainFront,
      types: ["railway_waybill", "goods_waybill"],
    },
    { id: "acts", label: "Акты", icon: FileCheck2, types: ["act"] },
    {
      id: "certificates",
      label: "Сертификаты",
      icon: Award,
      types: ["certificate"],
    },
    {
      id: "other",
      label: "Другие",
      icon: FolderOpen,
      types: ["invoice", "other"],
    },
  ];
  const categoryFor = (document: ContractDocument) => {
    const type = document.document_type || "legacy";
    return categories.find((item) => item.types?.includes(type))?.id || "other";
  };
  const activeCategory = categories.find((item) => item.id === category)!;
  const filtered = documents.filter(
    (document) =>
      (category === "all" || categoryFor(document) === category) &&
      `${document.name || ""} ${contractDocumentTypeLabel(document.document_type)}`
        .toLocaleLowerCase("ru-RU")
        .includes(search.trim().toLocaleLowerCase("ru-RU")),
  );
  const extension = (document: ContractDocument) => {
    for (const value of [document.name, document.location]) {
      const match = value?.split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i);
      if (match) return match[1].toUpperCase();
    }
    return "ФАЙЛ";
  };
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ContractDocument | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);

  const refreshDocuments = async () => {
    // Only this contract refetches. Mark inactive contract lists stale for their next visit.
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["all-contracts", contractId],
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: ["contracts", contractId],
        exact: true,
        refetchType: "none",
      }),
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "all-contracts" && query.queryKey.length === 3,
        refetchType: "none",
      }),
    ]);
  };
  const upload = useMutation({
    mutationFn: uploadContractDocuments,
    onSuccess: async () => {
      setOpen(false);
      setCategory("all");
      setSearch("");
      setDrafts([]);
      setError(null);
      toast.success("Документы добавлены");
      await refreshDocuments();
    },
    onError: () =>
      setError(
        "Не удалось загрузить документы. Выбранные файлы сохранены, попробуйте ещё раз.",
      ),
  });
  const remove = useMutation({
    mutationFn: deleteContractDocument,
    onSuccess: async () => {
      setToDelete(null);
      toast.success("Документ удалён из договора");
      await refreshDocuments();
    },
    onError: () => toast.error("Не удалось удалить документ"),
  });
  const busy = upload.isPending || remove.isPending;

  const closeUpload = (value: boolean) => {
    if (upload.isPending) return;
    setOpen(value);
    setDragging(false);
    if (!value) {
      setDrafts([]);
      setError(null);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isAdmin || busy) return;
    const validation = validateContractDocumentFiles(
      drafts.map(({ file }) => file),
    );
    if (validation) {
      setError(validation);
      return;
    }
    upload.mutate({ contractId, documents: drafts });
  };

  const addFiles = (selected: File[]) => {
    if (!selected.length || upload.isPending) return;
    const validation = validateContractDocumentFiles([
      ...drafts.map(({ file }) => file),
      ...selected,
    ]);
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    const type: ContractDocumentType =
      category === "contracts"
        ? "contract"
        : category === "waybills"
          ? "railway_waybill"
          : category === "acts"
            ? "act"
            : category === "certificates"
              ? "certificate"
              : "other";
    setDrafts((current) => [
      ...current,
      ...selected.map((file) => ({
        file,
        name: file.name,
        type,
        id: nextId.current++,
      })),
    ]);
  };

  return (
    <Card className="overflow-hidden rounded-xl border border-[#dfe7de] py-0 shadow-none">
      <div className="flex flex-col gap-4 border-b border-[#e5ece4] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#edf5ee] text-[#2f6b4f]">
            <FolderOpen className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#223137]">
              Документы договора
            </h2>
            <p className="mt-0.5 text-xs text-[#7b857f]">
              Накладные, акты и файлы по сделке{" "}
              <span className="mx-1 text-[#c5cec5]">·</span>
              {documents.length} файлов
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button
            className="gap-2 rounded-lg"
            disabled={busy}
            onClick={() => closeUpload(true)}
          >
            <Plus className="size-4" />
            Добавить документы
          </Button>
        )}
      </div>
      <CardContent className="grid gap-5 px-4 pb-5 pt-0 sm:px-6 lg:grid-cols-[190px_minmax(0,1fr)]">
        <nav
          aria-label="Типы документов"
          className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
        >
          <div className="mb-2 hidden px-3 text-[10px] font-semibold uppercase tracking-wider text-[#94a094] lg:block">
            Документы по типу
          </div>
          {categories.map((item) => {
            const Icon = item.icon;
            const count =
              item.id === "all"
                ? documents.length
                : documents.filter(
                    (document) => categoryFor(document) === item.id,
                  ).length;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={category === item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6b4f] lg:w-full",
                  category === item.id
                    ? "border-[#dbe9dc] bg-[#edf5ee] font-semibold text-[#245b40]"
                    : "text-[#6f7774] hover:bg-[#f6f8f5]",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
                <span
                  className={cn(
                    "ml-auto rounded px-1.5 py-0.5 text-[11px] tabular-nums",
                    category === item.id
                      ? "bg-white/80 text-[#245b40]"
                      : "bg-[#f1f4ef] text-[#7b857f]",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#223137]">
                {activeCategory.label}
              </h3>
              <span className="text-xs tabular-nums text-[#8a948a]">
                {filtered.length}
              </span>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#8a948a]" />
                <Input
                  aria-label="Поиск документов"
                  placeholder="Найти документ"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-9 rounded-lg pl-9 text-xs"
                />
              </div>
              <div className="flex rounded-lg border border-[#dfe7de] bg-[#f8faf6] p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 rounded-md",
                    view === "grid" && "bg-white text-[#2f6b4f] shadow-sm",
                  )}
                  aria-label="Показать карточками"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-8 rounded-md",
                    view === "list" && "bg-white text-[#2f6b4f] shadow-sm",
                  )}
                  aria-label="Показать списком"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                >
                  <List className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
          {filtered.length ? (
            <ul
              aria-label="Файлы договора"
              className={cn(
                "grid gap-3",
                view === "grid" && "md:grid-cols-2 2xl:grid-cols-3",
              )}
            >
              {filtered.map((document, index) => {
                const url = resolveBackendFileUrl(document);
                const name = document.name || `Документ ${index + 1}`;
                const ext = extension(document);
                const fileTone =
                  ext === "PDF"
                    ? "border-[#f2dcd5] bg-[#fff2ed] text-[#ba654c]"
                    : ["XLSX", "XLS", "CSV"].includes(ext)
                      ? "border-[#d7e6da] bg-[#edf5ef] text-[#427451]"
                      : "border-[#e0e5ee] bg-[#f0f3f9] text-[#697da1]";
                return (
                  <li
                    key={document.location || index}
                    className={cn(
                      "group min-w-0 rounded-xl border border-[#e2e9df] bg-white p-4 transition-colors hover:border-[#afc7b1] hover:bg-[#fcfdfb]",
                      view === "list" && "flex items-center gap-4",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-start gap-3",
                        view === "list" && "min-w-0 flex-1",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-14 w-11 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border",
                          fileTone,
                        )}
                      >
                        <FileText className="size-5" />
                        <span className="text-[9px] font-bold tracking-wide">
                          {ext}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-medium text-[#7b857f]">
                          {contractDocumentTypeLabel(document.document_type)}
                        </span>
                        <div
                          className="mt-1 line-clamp-2 break-words text-sm font-bold leading-5 text-[#223137]"
                          title={name}
                        >
                          {name}
                        </div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center justify-between gap-2",
                        view === "grid" &&
                          "mt-5 border-t border-[#edf1ea] pt-3",
                      )}
                    >
                      {url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 rounded-md px-2 text-xs font-semibold text-[#2f6b4f] hover:bg-[#edf5ee]"
                          asChild
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Скачать ${name}`}
                          >
                            <Download className="size-3.5" />
                            <span
                              className={
                                view === "list" ? "hidden sm:inline" : ""
                              }
                            >
                              Скачать
                            </span>
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-[#9a7b6a]">
                          Файл недоступен
                        </span>
                      )}
                      {isAdmin && document.location && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-[#a2aaa0] hover:bg-[#fff0ee] hover:text-[#c25648]"
                          disabled={busy}
                          aria-label={`Удалить ${name}`}
                          onClick={() => setToDelete(document)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-[#d6e2d3] bg-[#f8fbf6] px-5 py-8 text-center">
              <div className="mb-4 grid size-16 place-items-center rounded-2xl border border-[#dfebdc] bg-white text-[#7e9d80]">
                <FolderOpen className="size-8" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-bold text-[#314735]">
                {search
                  ? "Документы не найдены"
                  : documents.length
                    ? "В этом разделе пока нет файлов"
                    : "Соберите документы по сделке"}
              </h3>
              <p className="mt-2 max-w-xs text-xs leading-5 text-[#7b857f]">
                {search
                  ? "Попробуйте другое название или выберите все документы."
                  : "Договор, накладные и сертификаты будут под рукой в одном месте."}
              </p>
              {isAdmin && !search && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2 bg-white text-[#2f6b4f]"
                  disabled={busy}
                  onClick={() => closeUpload(true)}
                >
                  <Upload className="size-3.5" />
                  Добавить первый файл
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={closeUpload}>
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto rounded-xl sm:max-w-2xl"
          onInteractOutside={(event) => {
            if (upload.isPending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Добавить документы</DialogTitle>
            <DialogDescription>
              Укажите тип и название каждого файла. До 10 файлов, каждый до 50
              МБ.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="min-w-0 space-y-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                if (!upload.isPending) setDragging(true);
              }}
              onDragLeave={(event) => {
                if (
                  !(event.relatedTarget instanceof Node) ||
                  !event.currentTarget.contains(event.relatedTarget)
                )
                  setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(Array.from(event.dataTransfer.files));
              }}
              className={cn(
                "rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragging
                  ? "border-[#f38810] bg-[#fff7ed]"
                  : "border-[#dbe7d8] bg-[#f8fbf6]",
              )}
            >
              <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl border border-[#e0eadb] bg-white text-[#4e7d53]">
                <CloudUpload className="size-6" />
              </div>
              <p className="text-sm font-semibold text-[#314735]">
                Перетащите файлы сюда
              </p>
              <p className="mt-1 text-xs text-[#7b857f]">
                До 10 файлов по 50 МБ за одну загрузку
              </p>
              <Label htmlFor="contract-document-files" className="sr-only">
                Файлы
              </Label>
              <input
                ref={input}
                id="contract-document-files"
                type="file"
                tabIndex={-1}
                multiple
                className="sr-only"
                disabled={upload.isPending}
                onChange={(event) => {
                  addFiles(Array.from(event.target.files || []));
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 gap-2 bg-white text-[#2f6b4f]"
                disabled={upload.isPending}
                onClick={() => input.current?.click()}
              >
                <Plus className="size-3.5" />
                Выбрать файлы
              </Button>
            </div>
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="space-y-3 rounded-xl border border-[#dfe7de] bg-[#fbfcfa] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 break-words text-xs text-[#6f7774]">
                      {draft.file.name}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={upload.isPending}
                      aria-label={`Убрать ${draft.file.name}`}
                      onClick={() => {
                        setDrafts((current) =>
                          current.filter(({ id }) => id !== draft.id),
                        );
                        setError(null);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[200px_minmax(0,1fr)]">
                    <div className="space-y-1">
                      <Label htmlFor={`document-type-${draft.id}`}>
                        Тип документа
                      </Label>
                      <select
                        id={`document-type-${draft.id}`}
                        value={draft.type}
                        disabled={upload.isPending}
                        className="h-10 w-full rounded-md border border-input bg-white px-2 text-sm"
                        onChange={(event) =>
                          setDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id
                                ? {
                                    ...item,
                                    type: event.target
                                      .value as ContractDocumentType,
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        {Object.entries(contractDocumentTypes).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`document-name-${draft.id}`}>
                        Название
                      </Label>
                      <Input
                        id={`document-name-${draft.id}`}
                        value={draft.name}
                        maxLength={200}
                        disabled={upload.isPending}
                        placeholder={draft.file.name}
                        onChange={(event) =>
                          setDrafts((current) =>
                            current.map((item) =>
                              item.id === draft.id
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={upload.isPending}
                onClick={() => closeUpload(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={!drafts.length || busy}>
                {upload.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Загрузить{drafts.length > 0 ? ` (${drafts.length})` : ""}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!toDelete}
        onOpenChange={(value) => {
          if (!value && !remove.isPending) setToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить документ?</DialogTitle>
            <DialogDescription className="break-words">
              «{toDelete?.name || "Документ"}» будет удалён из списка документов
              договора.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={remove.isPending}
              onClick={() => setToDelete(null)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (isAdmin && toDelete && !busy)
                  remove.mutate({ contractId, document: toDelete });
              }}
            >
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
