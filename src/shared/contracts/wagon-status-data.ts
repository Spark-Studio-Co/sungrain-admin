export const WAGON_STATUS_OPTIONS = [
  { value: "en_route_to_loading", label: "В пути под погрузку" },
  { value: "at_elevator", label: "На элеваторе" },
  { value: "registered", label: "Оформлен" },
  { value: "en_route_to_recipient", label: "Отгружено" },
  { value: "shipped", label: "Отгружен" },
] as const;

export const WAGON_STATUS_ORDER = [
  "shipped",
  "en_route_to_recipient",
  "registered",
  "at_elevator",
  "en_route_to_loading",
  "in_transit",
] as const;

const statusAliases: Record<string, string> = {
  "отгружен": "shipped",
  "в пути": "in_transit",
  "на элеваторе": "at_elevator",
  "в пути под погрузку": "en_route_to_loading",
  "в пути (под погрузку)": "en_route_to_loading",
  "оформлен": "registered",
  "следует к получателю": "en_route_to_recipient",
  "в пути к клиенту": "en_route_to_recipient",
  "в пути (клиенту)": "en_route_to_recipient",
};

export const normalizeWagonStatus = (value: unknown) => {
  if (typeof value !== "string") return "";

  const normalized = value.trim().toLowerCase();
  return statusAliases[normalized] || normalized;
};

export const getWagonStatusRank = (value: unknown) => {
  const status = normalizeWagonStatus(value);
  const rank = WAGON_STATUS_ORDER.indexOf(
    status as (typeof WAGON_STATUS_ORDER)[number]
  );

  return rank === -1 ? WAGON_STATUS_ORDER.length : rank;
};
