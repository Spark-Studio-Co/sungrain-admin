"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useSaveProcurementFarm } from "@/entities/procurement/hooks/use-procurement";
import type { ProcurementFarmDetail } from "@/entities/procurement/api/procurement.api";
import {
  EMPTY_FARM_DRAFT,
  FARM_FIELDS,
  parseFarmDraft,
  type FarmFormErrors,
} from "@/entities/procurement/model/farm-form";

export function FarmCreateDialog({
  onClose,
  onCreated,
  onReturnFocus,
}: {
  onClose: () => void;
  onCreated: (farm: ProcurementFarmDetail) => void;
  onReturnFocus: () => void;
}) {
  const id = useId();
  const toast = useToast();
  const save = useSaveProcurementFarm();
  const submitted = useRef(false);
  const [draft, setDraft] = useState(EMPTY_FARM_DRAFT);
  const [errors, setErrors] = useState<FarmFormErrors>({});
  const [saveError, setSaveError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitted.current) return;
    const parsed = parseFarmDraft(draft);
    if (parsed.ok === false) {
      setErrors(parsed.errors);
      document.getElementById(`${id}-${Object.keys(parsed.errors)[0]}`)?.focus();
      return;
    }
    submitted.current = true;
    setErrors({});
    setSaveError("");
    try {
      const farm = await save.mutateAsync(parsed.values);
      onCreated(farm);
      toast.success("Хозяйство создано");
      onClose();
    } catch {
      setSaveError(
        "Не удалось создать хозяйство. Проверьте соединение и повторите попытку.",
      );
    } finally {
      submitted.current = false;
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !submitted.current) onClose();
      }}
    >
      <DialogContent
        className={`record-dialog max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl ${save.isPending ? "[&>[data-slot=dialog-close]]:pointer-events-none [&>[data-slot=dialog-close]]:opacity-50" : ""}`}
        aria-busy={save.isPending}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onReturnFocus();
        }}
      >
        <DialogHeader className="pr-10 text-left">
          <DialogTitle>Новое хозяйство</DialogTitle>
          <DialogDescription className="sr-only">
            Контакты и реквизиты хозяйства
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-5">
          <fieldset
            disabled={save.isPending}
            className="grid min-w-0 gap-4 sm:grid-cols-2"
          >
            {FARM_FIELDS.map((field) => (
              <div
                key={field.key}
                className={`purchase-field ${field.key === "organizationName" ? "sm:col-span-2" : ""}`}
              >
                <label htmlFor={`${id}-${field.key}`}>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                <Input
                  id={`${id}-${field.key}`}
                  value={draft[field.key]}
                  required={field.required}
                  maxLength={field.maxLength}
                  type={field.key === "phone" ? "tel" : "text"}
                  inputMode={
                    field.key === "totalAreaHa"
                      ? "decimal"
                      : field.key === "phone"
                        ? "tel"
                        : "text"
                  }
                  autoComplete={
                    field.key === "organizationName"
                      ? "organization"
                      : field.key === "phone"
                        ? "tel"
                        : "off"
                  }
                  aria-invalid={!!errors[field.key]}
                  aria-describedby={
                    errors[field.key] ? `${id}-${field.key}-error` : undefined
                  }
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }));
                    setErrors((current) => ({ ...current, [field.key]: undefined }));
                    setSaveError("");
                  }}
                />
                {errors[field.key] && (
                  <span
                    id={`${id}-${field.key}-error`}
                    role="alert"
                    className="purchase-error"
                  >
                    {errors[field.key]}
                  </span>
                )}
              </div>
            ))}
          </fieldset>
          {saveError && (
            <p role="alert" className="purchase-error">
              {saveError}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!submitted.current) onClose();
              }}
              disabled={save.isPending}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {save.isPending ? "Создаём…" : "Создать хозяйство"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
