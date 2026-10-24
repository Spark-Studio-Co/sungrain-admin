"use client";

import { ReactNode, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CrmErrorState } from "@/components/ui/crm-state";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CalculatorOptions } from "@/entities/calculator/api";
import { Check, ChevronsUpDown, RotateCcw } from "lucide-react";

export function Field({
  label,
  children,
  wide = false,
  error,
  errorId,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  error?: string;
  errorId?: string;
}) {
  return (
    <div className={`trade-field${wide ? " trade-wide" : ""}`}>
      <span>{label}</span>
      {children}
      {error && (
        <p id={errorId} className="cost-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  step = "0.01",
  min = "0",
  ariaLabel,
  error,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  step?: string;
  min?: string;
  ariaLabel?: string;
  error?: string;
}) {
  const errorId = useId();
  return (
    <Field label={label} error={error} errorId={errorId}>
      <Input
        aria-label={ariaLabel || label}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </Field>
  );
}
export function TextField({
  label,
  value,
  onChange,
  required = false,
  wide = false,
  maxLength = 160,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  wide?: boolean;
  maxLength?: number;
  error?: string;
}) {
  const id = useId();
  return (
    <div className={`trade-field${wide ? " trade-wide" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="cost-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function Choice({
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  const errorId = useId();
  return (
    <Field label={label} error={error} errorId={errorId}>
      <Select
        value={value || (required ? "" : "none")}
        onValueChange={(next) => {
          // Ignore the hidden form control's empty reset during async hydration.
          if (next !== value && options.some((option) => option.value === next))
            onChange(next);
        }}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          aria-label={label}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          aria-required={required || undefined}
          className="w-full min-w-0 *:data-[slot=select-value]:min-w-0"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          align="start"
          sideOffset={4}
          collisionPadding={12}
          className="max-h-[min(20rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-24px)]"
        >
          {options.length ? (
            options.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Нет вариантов
            </div>
          )}
        </SelectContent>
      </Select>
    </Field>
  );
}
export function StationChoice({
  label,
  value,
  onChange,
  stations,
  required = true,
  disabled = false,
  placeholder = "Выберите станцию",
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  stations: CalculatorOptions["stations"];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
}) {
  const errorId = useId();
  const [open, setOpen] = useState(false);
  const [boundary, setBoundary] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasCurrentStation = stations.some((station) => station.name === value);
  const select = (name: string) => {
    if (name !== value) onChange(name);
    setOpen(false);
  };

  return (
    <Field label={label} error={error} errorId={errorId}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next)
            setBoundary(
              triggerRef.current?.closest<HTMLElement>(
                '[data-slot="dialog-content"]',
              ) || null,
            );
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            role="combobox"
            aria-label={label}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errorId : undefined}
            aria-expanded={open}
            aria-required={required || undefined}
            disabled={disabled}
            title={value || undefined}
            className="crm-control h-10 w-full min-w-0 justify-between text-left"
          >
            <span className="min-w-0 truncate">{value || placeholder}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionBoundary={boundary || undefined}
          collisionPadding={8}
          className="max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-32px)] overflow-hidden p-0"
        >
          <Command>
            <CommandInput
              aria-label={`Поиск: ${label.toLocaleLowerCase("ru")}`}
              placeholder="Название или код станции"
            />
            <CommandList className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3.125rem))]">
              <CommandEmpty>Станции не найдены</CommandEmpty>
              <CommandGroup>
                {!required && (
                  <CommandItem value="Не указана" onSelect={() => select("")}>
                    <Check
                      className={`size-4 shrink-0 ${!value ? "opacity-100" : "opacity-0"}`}
                    />
                    Не указана
                  </CommandItem>
                )}
                {value && !hasCurrentStation && (
                  <CommandItem value={value} onSelect={() => select(value)}>
                    <Check className="size-4 shrink-0" />
                    <span className="min-w-0 break-words">{value}</span>
                  </CommandItem>
                )}
                {stations.map((station) => (
                  <CommandItem
                    key={station.id}
                    value={`${station.name} ${station.code || ""}`}
                    onSelect={() => select(station.name)}
                  >
                    <Check
                      className={`size-4 shrink-0 ${value === station.name ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="min-w-0 flex-1 break-words">
                      {station.name}
                    </span>
                    {station.code && (
                      <span className="shrink-0 text-xs font-normal text-muted-foreground">
                        {station.code}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
export function QueryError({ retry }: { retry: () => void }) {
  return (
    <div role="alert">
      <CrmErrorState
        title="Не удалось загрузить данные"
        action={
          <Button variant="outline" onClick={retry}>
            <RotateCcw size={16} />
            Повторить
          </Button>
        }
      />
    </div>
  );
}
