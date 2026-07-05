"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Выберите элементы...",
  emptyMessage = "Ничего не найдено",
  disabled = false,
  className,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (value: string) => {
    if (disabled) return;
    onChange(selected.filter((item) => item !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          onChange(selected.slice(0, -1));
        }
      }
      // This is not a default behavior of the <input /> field
      if (e.key === "Escape") {
        input.blur();
      }
    }
  };

  const selectables = options.filter(
    (option) => !selected.includes(option.value)
  );

  const selectedLabels = selected.map((value) => {
    const option = options.find((opt) => opt.value === value);

    return {
      value,
      label: option?.label || value,
    };
  });

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn("overflow-visible bg-transparent", className)}
    >
      <div
        className={cn(
          "group min-h-11 rounded-md border border-[#dce4da] bg-white px-2.5 py-2 text-sm shadow-sm transition-[border-color,box-shadow,background-color] focus-within:border-[#f38810] focus-within:ring-[3px] focus-within:ring-[#f38810]/15",
          disabled && "cursor-not-allowed bg-[#f4f6f3] opacity-70"
        )}
      >
        <div className="flex min-h-6 flex-wrap items-center gap-1.5">
          {selectedLabels.map((option) => {
            return (
              <span
                key={option.value}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-2 py-1 text-xs font-black text-[#2f6b4f]"
              >
                <span className="max-w-[240px] truncate">{option.label}</span>
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`Убрать ${option.label}`}
                  className="rounded-full text-[#7b8a82] outline-none transition hover:text-[#b9472d] focus:ring-2 focus:ring-[#f38810]/30 disabled:cursor-not-allowed"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option.value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option.value)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            );
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            disabled={disabled}
            onBlur={() => setOpen(false)}
            onFocus={() => !disabled && setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : undefined}
            className="min-w-[140px] flex-1 bg-transparent px-1 py-0.5 font-semibold text-[#223137] outline-none placeholder:text-[#8a928f] disabled:cursor-not-allowed"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && !disabled ? (
          <div className="absolute top-0 z-50 w-full rounded-md border border-[#dfe7de] bg-white text-[#223137] shadow-[0_18px_44px_rgba(34,49,55,0.16)] outline-none animate-in fade-in-0 zoom-in-95">
            <CommandList className="max-h-[240px]">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup className="p-1.5">
                {selectables.map((option) => {
                  return (
                    <CommandItem
                      key={option.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => {
                        setInputValue("");
                        onChange([...selected, option.value]);
                        inputRef.current?.focus();
                      }}
                      className="cursor-pointer py-2.5"
                    >
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </div>
        ) : null}
      </div>
    </Command>
  );
}
