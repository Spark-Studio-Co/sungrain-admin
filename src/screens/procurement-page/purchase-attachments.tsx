"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Download, FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentNameInput } from "@/shared/documents/document-name-input";
import { useToast } from "@/components/ui/toast";
import {
  addPurchaseAttachment,
  deletePurchaseAttachment,
  downloadPurchaseAttachment,
  getPurchaseAttachments,
  type PurchaseAttachment,
} from "@/entities/procurement/api/purchases.api";

type Draft = { id: string; file: File | null; title: string; number: string; date: string };
const emptyDraft = (): Draft => ({ id: crypto.randomUUID(), file: null, title: "", number: "", date: "" });

export function PurchaseAttachments({ purchaseId }: { purchaseId: string }) {
  const key = ["purchase-attachments", purchaseId];
  const client = useQueryClient();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const fileTarget = useRef<string | null>(null);
  const [workingId, setWorkingId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const files = useQuery({ queryKey: key, queryFn: () => getPurchaseAttachments(purchaseId) });
  const upload = useMutation({
    mutationFn: async (selected: Draft[]) => {
      let uploaded = 0;
      const failed: Draft[] = [];
      let limitReached = false;
      for (const draft of selected) {
        const { file } = draft;
        if (!file || !/\.(pdf|jpe?g|png|docx?|xlsx?)$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024) {
          failed.push(draft);
          continue;
        }
        try {
          const saved = await addPurchaseAttachment(purchaseId, file, draft.id, { title: draft.title, number: draft.number, date: draft.date });
          client.setQueryData<PurchaseAttachment[]>(key, (current) => current ? [saved, ...current.filter((item) => item.id !== saved.id)] : [saved]);
          uploaded++;
        } catch (error) {
          if (isAxiosError(error) && String(error.response?.data?.message).includes("не более 30")) limitReached = true;
          failed.push(draft);
        }
      }
      return { uploaded, failed, limitReached };
    },
    onSuccess: ({ uploaded, failed, limitReached }) => {
      if (uploaded) toast.success(`Загружено файлов: ${uploaded}`);
      setDrafts(failed);
      if (!failed.length) setOpen(false);
      if (failed.length) toast.error(limitReached ? `Не загружены: ${failed.map((draft) => draft.file?.name || "Файл").join(", ")}. Лимит — 30 документов на закупку.` : `Не загружены: ${failed.map((draft) => draft.file?.name || "Файл").join(", ")}. Проверьте формат и размер файла.`);
      void client.invalidateQueries({ queryKey: key, exact: true });
    },
  });
  const remove = useMutation({
    mutationFn: (file: PurchaseAttachment) => deletePurchaseAttachment(purchaseId, file.id),
    onSuccess: (_, file) => {
      client.setQueryData<PurchaseAttachment[]>(key, (current) => current?.filter((item) => item.id !== file.id));
      toast.success("Документ удалён");
    },
    onError: () => toast.error("Не удалось удалить документ"),
  });
  return (
    <div className="purchase-attachments">
      <div className="purchase-attachments-heading">
        <div><h3>Дополнительные документы</h3><p>Накладные, акты, сертификаты и другие файлы</p></div>
        <Button type="button" variant="outline" size="sm" disabled={upload.isPending} onClick={() => { setDrafts([emptyDraft()]); setOpen(true); }}>
          <Upload className="size-4" /> Добавить документы
        </Button>
      </div>
      <p className="purchase-attachments-hint">PDF, JPG, PNG, Word или Excel · до 10 МБ на файл · до 30 файлов</p>
      {files.isPending && <p className="purchase-document-empty" role="status">Загружаем документы…</p>}
      {files.isError && <p className="purchase-document-empty" role="alert">Не удалось загрузить документы. <button type="button" className="underline" onClick={() => void files.refetch()}>Повторить</button></p>}
      {files.isSuccess && files.data.length === 0 && <p className="purchase-document-empty">Дополнительных документов пока нет</p>}
      {files.data?.map((file) => (
        <div className="purchase-file purchase-attachment-row" key={file.id}>
          <FileText className="size-5 shrink-0 text-[#2f6b4f]" />
          <div className="purchase-file-name"><bdi className="purchase-file-title" title={file.name}>{file.title || file.name}</bdi><small>{[file.number && `№ ${file.number}`, file.date && file.date.split("-").reverse().join("."), `${Math.max(1, Math.round(file.size / 1024))} КБ`].filter(Boolean).join(" · ")}</small></div>
          <Button type="button" variant="outline" size="sm" disabled={workingId === file.id} aria-label={`Скачать ${file.name}`} onClick={async () => {
            setWorkingId(file.id);
            try { await downloadPurchaseAttachment(purchaseId, file); } catch { toast.error("Не удалось скачать документ"); } finally { setWorkingId(undefined); }
          }}><Download className="size-4" /><span>Скачать</span></Button>
          <Button type="button" variant="ghost" size="icon" disabled={remove.isPending} aria-label={`Удалить ${file.name}`} title="Удалить документ" onClick={() => {
            if (window.confirm(`Удалить документ «${file.name}»?`)) remove.mutate(file);
          }}><Trash2 className="size-4" /></Button>
        </div>
      ))}
      <Dialog open={open} onOpenChange={(value) => { if (!upload.isPending) { setOpen(value); if (!value) setDrafts([]); } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Загрузить документы</DialogTitle><DialogDescription>Укажите название, номер и дату для каждого файла.</DialogDescription></DialogHeader>
          <input ref={input} type="file" className="sr-only" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={(event) => {
            const selected = Array.from(event.target.files || []);
            event.target.value = "";
            const target = fileTarget.current;
            fileTarget.current = null;
            const additions = selected.map((file) => ({ ...emptyDraft(), file, title: file.name }));
            if (!additions.length) return;
            setDrafts((current) => {
              const index = current.findIndex((draft) => draft.id === target);
              if (index < 0) return current;
              const [first, ...rest] = additions;
              return [...current.map((draft, currentIndex) => currentIndex === index ? { ...draft, id: draft.file ? first.id : draft.id, file: first.file, title: draft.title.trim() ? draft.title : first.title } : draft), ...rest];
            });
          }} />
          <div className="space-y-4">{drafts.map((draft) => <div key={draft.id} className="space-y-3 rounded-md border p-4">
            {drafts.length > 1 && <div className="flex justify-end"><Button type="button" variant="ghost" size="icon" disabled={upload.isPending} aria-label={`Убрать ${draft.file?.name || "документ"}`} onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}><Trash2 className="size-4" /></Button></div>}
            <div className="space-y-1"><Label htmlFor={`purchase-title-${draft.id}`}>Название *</Label><DocumentNameInput id={`purchase-title-${draft.id}`} value={draft.title} maxLength={200} disabled={upload.isPending} onChange={(event) => setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, title: event.target.value } : item))} /></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor={`purchase-number-${draft.id}`}>Номер</Label><Input id={`purchase-number-${draft.id}`} value={draft.number} maxLength={100} disabled={upload.isPending} onChange={(event) => setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, number: event.target.value } : item))} /></div><div className="space-y-1"><Label htmlFor={`purchase-date-${draft.id}`}>Дата</Label><Input id={`purchase-date-${draft.id}`} type="date" value={draft.date} disabled={upload.isPending} onChange={(event) => setDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, date: event.target.value } : item))} /></div></div>
            <div className="space-y-2"><Label>Файл *</Label><div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" disabled={upload.isPending} onClick={() => { fileTarget.current = draft.id; input.current?.click(); }}><Upload className="size-4" />{draft.file ? "Заменить файл" : "Выбрать файлы"}</Button><span className="min-w-0 break-all text-sm text-muted-foreground">{draft.file?.name || "Файл не выбран"}</span></div></div>
          </div>)}</div>
          <Button type="button" variant="outline" onClick={() => setDrafts((current) => [...current, emptyDraft()])} disabled={upload.isPending}>Добавить ещё документ</Button>
          <DialogFooter><Button variant="outline" type="button" disabled={upload.isPending} onClick={() => { setOpen(false); setDrafts([]); }}>Отмена</Button><Button type="button" disabled={!drafts.length || drafts.some((draft) => !draft.title.trim() || !draft.file) || upload.isPending} onClick={() => upload.mutate(drafts)}>{upload.isPending && <LoaderCircle className="size-4 animate-spin" />}{upload.isPending ? "Загружаем…" : "Загрузить"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
