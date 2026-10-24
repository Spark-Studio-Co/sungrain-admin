"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, RotateCcw } from "lucide-react";
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
import { Field } from "./controls";
import { getWagonOwnerNames } from "./wagon-owner-options";

export function WagonOwnerChoice({
  value,
  onChange,
  index,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  index: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const owners = useQuery({
    queryKey: ["owners", "calculator-wagon-options"],
    queryFn: getWagonOwnerNames,
    enabled: open && !disabled,
    staleTime: 30_000,
    retry: false,
  });
  const names = owners.data || [];
  const select = (name: string) => {
    if (name !== value) onChange(name);
    setOpen(false);
  };

  return (
    <Field label={`Собственник ${index}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-label={`Собственник вагонов ${index}`}
            aria-expanded={open}
            disabled={disabled}
            title={value || undefined}
            className="crm-control h-10 w-full min-w-0 justify-between text-left"
          >
            <span className="min-w-0 truncate">
              {value || "Выберите собственника"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          collisionPadding={12}
          className="max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-24px)] overflow-hidden p-0"
        >
          <Command
            label={`Поиск собственника вагонов ${index}`}
            defaultValue={value || "Без собственника"}
          >
            <CommandInput
              aria-label={`Поиск собственника вагонов ${index}`}
              placeholder="Найти собственника"
            />
            <CommandList className="max-h-[min(16rem,calc(var(--radix-popover-content-available-height)-3.125rem))]">
              {owners.isPending ? (
                <div
                  role="status"
                  className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground"
                >
                  <Loader2 className="size-4 animate-spin" />
                  Загрузка собственников…
                </div>
              ) : owners.isError ? (
                <div role="alert" className="space-y-2 px-3 py-3 text-sm">
                  <p>Не удалось загрузить собственников</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => owners.refetch()}
                    disabled={owners.isFetching}
                  >
                    <RotateCcw size={14} />
                    Повторить
                  </Button>
                </div>
              ) : (
                <>
                  {!names.length && (
                    <p
                      role="status"
                      className="px-3 py-4 text-sm text-muted-foreground"
                    >
                      Справочник собственников пуст
                    </p>
                  )}
                  <CommandEmpty>Собственники не найдены</CommandEmpty>
                </>
              )}
              <CommandGroup>
                <CommandItem value="Без собственника" onSelect={() => select("")}>
                  <Check
                    className={`size-4 shrink-0 ${!value ? "opacity-100" : "opacity-0"}`}
                  />
                  Без собственника
                </CommandItem>
                {value && !names.includes(value) && (
                  <CommandItem value={value} onSelect={() => select(value)}>
                    <Check className="size-4 shrink-0" />
                    <span className="min-w-0 break-words">{value}</span>
                  </CommandItem>
                )}
                {names.map((name) => (
                  <CommandItem
                    key={name}
                    value={name}
                    disabled={name.length > 160}
                    onSelect={() => select(name)}
                  >
                    <Check
                      className={`size-4 shrink-0 ${value === name ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="min-w-0 break-words">
                      {name}
                      {name.length > 160 && (
                        <span className="block text-xs font-normal">
                          Название длиннее 160 символов
                        </span>
                      )}
                    </span>
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
