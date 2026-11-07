"use client";

import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Loader2, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const documents: ContractDocument[] = Array.isArray(files)
    ? files
        .filter(Boolean)
        .map((file) =>
          typeof file === "string"
            ? { location: file, name: file.split(/[\\/]/).pop() || "Документ" }
            : file,
        )
    : [];
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

  return (
    <Card className="sungrain-analytics-card overflow-hidden">
      <CardHeader className="border-b border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-black">
              <FileText className="size-5 text-[#2f6b4f]" />
              Документы договора
            </CardTitle>
            <CardDescription className="mt-1">
              Накладные, акты, сертификаты и сопутствующие документы
            </CardDescription>
          </div>
          {isAdmin && (
            <Button
              className="gap-2"
              disabled={busy}
              onClick={() => closeUpload(true)}
            >
              <Upload className="size-4" />
              Добавить документы
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {documents.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#dfe7de] bg-[#fbfcfa] px-4 py-10 text-center text-sm text-[#6f7774]">
            Документы пока не добавлены
          </div>
        ) : (
          <ul className="divide-y divide-[#e5ece4] rounded-md border border-[#dfe7de]">
            {documents.map((document, index) => {
              const url = resolveBackendFileUrl(document);
              const name = document.name || `Документ ${index + 1}`;
              return (
                <li
                  key={document.location || index}
                  className="flex items-start gap-3 p-4"
                >
                  <FileText className="mt-1 size-5 shrink-0 text-[#2f6b4f]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#6f7774]">
                      {contractDocumentTypeLabel(document.document_type)}
                    </div>
                    <div className="mt-1 break-words text-sm font-bold text-[#223137]">
                      {name}
                    </div>
                    {!url && (
                      <div className="mt-1 text-xs text-[#6f7774]">
                        Файл недоступен
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {url && (
                      <Button variant="outline" size="icon" asChild>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Скачать ${name}`}
                        >
                          <Download className="size-4" />
                        </a>
                      </Button>
                    )}
                    {isAdmin && document.location && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        aria-label={`Удалить ${name}`}
                        onClick={() => setToDelete(document)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={closeUpload}>
        <DialogContent
          className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
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
            <div className="space-y-2">
              <Label htmlFor="contract-document-files">Файлы</Label>
              <Input
                ref={input}
                id="contract-document-files"
                type="file"
                multiple
                disabled={upload.isPending}
                onChange={(event) => {
                  const selected = Array.from(event.target.files || []);
                  if (!selected.length) return;
                  const combined = [
                    ...drafts.map(({ file }) => file),
                    ...selected,
                  ];
                  const validation = validateContractDocumentFiles(combined);
                  event.target.value = "";
                  if (validation) {
                    setError(validation);
                    return;
                  }
                  setError(null);
                  setDrafts((current) => [
                    ...current,
                    ...selected.map((file) => ({
                      file,
                      name: file.name,
                      type: "other" as const,
                      id: nextId.current++,
                    })),
                  ]);
                }}
              />
            </div>
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="space-y-3 rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-3"
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
