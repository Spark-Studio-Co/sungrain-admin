"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type AdminPageSizeControlProps = {
  value: number;
  onChange: (value: number) => void;
  totalItems: number;
  visibleItems: number;
  itemLabel?: string;
  isLoading?: boolean;
  options?: number[];
  className?: string;
};

export function AdminPageSizeControl({
  value,
  onChange,
  totalItems,
  visibleItems,
  itemLabel = "записей",
  isLoading = false,
  options = DEFAULT_PAGE_SIZE_OPTIONS,
  className,
}: AdminPageSizeControlProps) {
  const safeVisibleItems = Math.min(visibleItems, totalItems || visibleItems);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="text-center text-[#7b857f] sm:text-left">
        Показано{" "}
        <span className="font-black text-[#223137]">
          {isLoading ? "..." : safeVisibleItems}
        </span>{" "}
        из{" "}
        <span className="font-black text-[#223137]">
          {isLoading ? "..." : totalItems}
        </span>{" "}
        {itemLabel}
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-bold text-[#7b857f]">Показать</span>
        <Select
          value={String(value)}
          onValueChange={(nextValue) => onChange(Number(nextValue))}
        >
          <SelectTrigger className="h-9 w-[96px] rounded-md border-[#dce4da] bg-white font-bold text-[#223137] shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden text-sm font-bold text-[#7b857f] sm:inline">
          сразу
        </span>
      </div>
    </div>
  );
}
