"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronsUpDown, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type {
  CalculationInput,
  CalculatorOptions,
} from "@/entities/calculator/api";
import { Field } from "./controls";

function ReferenceChoice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((item) => item.value === value);
  const currentLabel =
    current?.label ||
    (value === "none" ? "Без привязки" : "Связанный документ недоступен");
  return (
    <Field label={label}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-label={label}
            aria-expanded={open}
            title={currentLabel}
            className="crm-control h-10 w-full min-w-0 justify-between text-left"
          >
            <span className="min-w-0 truncate">{currentLabel}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={12}
          className="max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden p-0"
        >
          <Command label={`Поиск: ${label}`} defaultValue={value}>
            <CommandInput placeholder="Найти по номеру или названию" />
            <CommandList className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3.125rem))]">
              <CommandEmpty>Ничего не найдено</CommandEmpty>
              <CommandGroup>
                {!current && value !== "none" && (
                  <CommandItem
                    value={value}
                    keywords={[currentLabel]}
                    onSelect={() => setOpen(false)}
                  >
                    <Check className="size-4 shrink-0" />
                    {currentLabel}
                  </CommandItem>
                )}
                {options.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    keywords={[item.label]}
                    onSelect={() => {
                      if (value !== item.value) onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`size-4 shrink-0 ${value === item.value ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="min-w-0 break-words">{item.label}</span>
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

export function CalculationLinks({
  input,
  options,
  onChange,
}: {
  input: CalculationInput;
  options: Pick<CalculatorOptions, "purchases" | "applications">;
  onChange: (patch: Partial<CalculationInput>) => void;
}) {
  const count = Number(!!input.purchaseId) + Number(!!input.applicationId);
  return (
    <details className="cost-links" open={count ? true : undefined}>
      <summary>
        <Link2 size={15} />
        Связать с закупкой или приложением
        {count > 0 && <span className="cost-count">{count}</span>}
        <ChevronDown size={15} />
      </summary>
      <div className="trade-form-grid">
        <ReferenceChoice
          label="Закупка"
          value={input.purchaseId || "none"}
          onChange={(value) => {
            const purchase = options.purchases.find(
              (item) => item.id === value,
            );
            onChange(
              purchase
                ? {
                    purchaseId: purchase.id,
                    culture: purchase.cultureName,
                    tonnes: purchase.quantity,
                    purchasePrice: purchase.unitPrice,
                  }
                : { purchaseId: undefined },
            );
          }}
          options={[
            { value: "none", label: "Без привязки" },
            ...options.purchases
              .filter((p) => p.currency === "KZT")
              .map((p) => ({
                value: p.id,
                label: `${p.agreementNumber} · ${p.cultureName}`,
              })),
          ]}
        />
        <ReferenceChoice
          label="Контракт / приложение"
          value={input.applicationId ? String(input.applicationId) : "none"}
          onChange={(value) => {
            const application = options.applications.find(
              (item) => item.id === Number(value),
            );
            onChange(
              application
                ? {
                    applicationId: application.id,
                    culture: application.culture,
                    departureStation: application.departure_stations.join(", "),
                    destinationStation:
                      application.destination_stations.join(", "),
                  }
                : { applicationId: undefined },
            );
          }}
          options={[
            { value: "none", label: "Без привязки" },
            ...options.applications.map((a) => ({
              value: String(a.id),
              label: `${a.contract.number} · ${a.name || a.id}`,
            })),
          ]}
        />
      </div>
    </details>
  );
}
