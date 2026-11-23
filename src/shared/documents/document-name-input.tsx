"use client";

import { useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { getTokenUserId } from "@/shared/users/navigation-profile";

const defaultNames = [
  "Акт взвешивания",
  "Декларация на товары",
  "Счет-фактура",
  "СТ-1",
  "ЖД накладная",
  "Товарная накладная",
  "Паспорт качества",
  "Сертификат качества",
  "Договор",
  "Дополнительное соглашение",
];
const maxHistory = 20;

function readHistory(key: string | null): string[] {
  if (!key || typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .slice(0, maxHistory)
      : [];
  } catch {
    return [];
  }
}

function rememberName(key: string | null, value: string) {
  const name = value.trim().slice(0, 200);
  if (!key || !name) return;
  try {
    const names = [
      name,
      ...readHistory(key).filter(
        (item) =>
          item.toLocaleLowerCase("ru-RU") !== name.toLocaleLowerCase("ru-RU"),
      ),
    ].slice(0, maxHistory);
    localStorage.setItem(key, JSON.stringify(names));
  } catch {
    /* The field remains usable when storage is unavailable. */
  }
}

export function DocumentNameInput({
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  wrapperClassName,
  ...props
}: Omit<ComponentProps<typeof Input>, "value"> & {
  value: string;
  wrapperClassName?: string;
}) {
  const token = useAuthData((state) => state.token);
  const userId = useAuthData((state) => state.userId);
  const identity = getTokenUserId(token) ?? userId;
  const key = identity ? `sungrain:document-names:${identity}` : null;
  const listId = useId();
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = value.trim().toLocaleLowerCase("ru-RU");
  const seen = new Set<string>();
  const suggestions = [...history, ...defaultNames]
    .filter((name) => {
      const normalized = name.toLocaleLowerCase("ru-RU");
      if (seen.has(normalized) || (query && !normalized.includes(query)))
        return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 8);
  const choose = (name: string) => {
    const target = { value: name } as EventTarget & HTMLInputElement;
    onChange?.({
      target,
      currentTarget: target,
    } as React.ChangeEvent<HTMLInputElement>);
    rememberName(key, name);
    setOpen(false);
    setActive(-1);
  };
  return (
    <div
      className={
        wrapperClassName
          ? `relative min-w-0 ${wrapperClassName}`
          : "relative min-w-0"
      }
    >
      <Input
        {...props}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-activedescendant={
          active >= 0 && open ? `${listId}-${active}` : undefined
        }
        onChange={(event) => {
          setOpen(true);
          setActive(-1);
          onChange?.(event);
        }}
        onFocus={(event) => {
          setHistory(readHistory(key));
          setOpen(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          rememberName(key, value);
          setOpen(false);
          setActive(-1);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && suggestions.length) {
            event.preventDefault();
            setOpen(true);
            setActive((index) => Math.min(index + 1, suggestions.length - 1));
          } else if (event.key === "ArrowUp" && suggestions.length) {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));
          } else if (
            event.key === "Enter" &&
            open &&
            active >= 0 &&
            suggestions[active]
          ) {
            event.preventDefault();
            choose(suggestions[active]);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
          onKeyDown?.(event);
        }}
      />
      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-[#dfe7de] bg-white py-1 shadow-lg"
        >
          {suggestions.map((name, index) => (
            <li
              key={name}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={active === index}
              className={`cursor-pointer px-3 py-2 text-sm text-[#31413a] ${active === index ? "bg-[#eef5ef]" : "hover:bg-[#f6f8f5]"}`}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(name);
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
