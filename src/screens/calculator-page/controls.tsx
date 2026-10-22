"use client";

import { ReactNode, useId } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`trade-field${wide ? " trade-wide" : ""}`}>
      <span>{label}</span>
      {children}
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
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  step?: string;
  min?: string;
  ariaLabel?: string;
}) {
  return (
    <Field label={label}>
      <Input
        aria-label={ariaLabel || label}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  wide?: boolean;
  maxLength?: number;
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
      />
    </div>
  );
}
export function Choice({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <Select
        value={value || "none"}
        onValueChange={(next) => {
          // Ignore the hidden form control's empty reset during async hydration.
          if (next !== value && options.some((option) => option.value === next))
            onChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
export function QueryError({ retry }: { retry: () => void }) {
  return (
    <div className="trade-empty" role="alert">
      <p>Не удалось загрузить данные</p>
      <Button variant="outline" onClick={retry}>
        <RotateCcw size={16} />
        Повторить
      </Button>
    </div>
  );
}
