"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerInputProps = {
  id?: string;
  value?: string | Date | null;
  onChange: (value: string, date?: Date) => void;
  outputFormat?: "date" | "iso";
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

const parseDateValue = (value?: string | Date | null) => {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;

  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) {
    const fallbackDate = new Date(value);
    return Number.isNaN(fallbackDate.getTime()) ? undefined : fallbackDate;
  }

  return new Date(year, month - 1, day);
};

const getOutputValue = (date: Date, outputFormat: "date" | "iso") =>
  outputFormat === "iso" ? date.toISOString() : format(date, "yyyy-MM-dd");

function DatePickerInput({
  id,
  value,
  onChange,
  outputFormat = "date",
  placeholder = "Выберите дату",
  className,
  disabled,
  min,
  max,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-required": ariaRequired,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);
  const minDate = parseDateValue(min);
  const maxDate = parseDateValue(max);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayDisabled = (minDate && todayStart < minDate) || (maxDate && todayStart > maxDate);

  const selectDate = (date: Date) => {
    onChange(getOutputValue(date, outputFormat), date);
    setOpen(false);
  };

  const clearDate = () => {
    onChange("", undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-required={ariaRequired}
          className={cn(
            "crm-control h-11 w-full justify-between rounded-md bg-[#fbfcfa] px-3 text-left font-semibold transition-colors hover:translate-y-0 hover:bg-white",
            selectedDate ? "text-[#223137]" : "text-[#9aa49f]",
            className
          )}
        >
          <span className="truncate">
            {selectedDate ? format(selectedDate, "dd.MM.yyyy") : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-[#6f7774]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={8}
        className="max-h-[min(480px,calc(100dvh-24px))] w-auto max-w-[calc(100vw-16px)] overflow-auto rounded-md border-[#dfe7de] bg-white p-2 shadow-[0_18px_44px_rgba(34,49,55,0.16)]"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          disabled={[
            ...(minDate ? [{ before: minDate }] : []),
            ...(maxDate ? [{ after: maxDate }] : []),
          ]}
          onSelect={(date) => {
            if (!date) {
              clearDate();
              return;
            }

            selectDate(date);
          }}
          initialFocus
        />
        <div className="mt-2 flex items-center justify-between border-t border-[#e7eee6] px-1 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!!todayDisabled}
            className="h-8 rounded-md px-3 text-xs font-black text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
            onClick={() => selectDate(new Date())}
          >
            Сегодня
          </Button>
          {selectedDate ? <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs font-bold" onClick={clearDate}><X className="size-3.5" /> Сбросить</Button> : <span className="px-2 text-xs text-[#7a8580]">Нет даты</span>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DatePickerInput };
