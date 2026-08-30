export const WAGON_STATUS_OPTIONS = [
  { value: "en_route_to_loading", label: "В пути под погрузку" },
  { value: "at_elevator", label: "На элеваторе" },
  { value: "registered", label: "Оформлен" },
  { value: "en_route_to_recipient", label: "Отгружен" },
  { value: "client_received", label: "Клиент получил" },
] as const;

export type CanonicalWagonStatus =
  (typeof WAGON_STATUS_OPTIONS)[number]["value"];

export const WAGON_STATUS_ORDER = [
  "client_received",
  "en_route_to_recipient",
  "registered",
  "at_elevator",
  "en_route_to_loading",
] as const;

const statusAliases: Record<string, string> = {
  en_route_to_loading: "en_route_to_loading",
  "в пути под погрузку": "en_route_to_loading",
  "в пути (под погрузку)": "en_route_to_loading",
  in_transit: "en_route_to_loading",
  "в пути": "en_route_to_loading",

  at_elevator: "at_elevator",
  "на элеваторе": "at_elevator",

  registered: "registered",
  оформлен: "registered",
  оформлено: "registered",

  en_route_to_recipient: "en_route_to_recipient",
  shipped: "en_route_to_recipient",
  отгружен: "en_route_to_recipient",
  отгружено: "en_route_to_recipient",
  "следует к получателю": "en_route_to_recipient",
  "в пути к клиенту": "en_route_to_recipient",
  "в пути (клиенту)": "en_route_to_recipient",

  client_received: "client_received",
  delivered: "client_received",
  completed: "client_received",
  доставлен: "client_received",
  доставлено: "client_received",
  "клиент получил": "client_received",
  "получен клиентом": "client_received",
};

export const normalizeWagonStatus = (value: unknown) => {
  if (typeof value !== "string") return "";

  const normalized = value.trim().toLowerCase();
  return statusAliases[normalized] || normalized;
};

export const getWagonStatusRank = (value: unknown) => {
  const status = normalizeWagonStatus(value);
  const rank = WAGON_STATUS_ORDER.indexOf(
    status as (typeof WAGON_STATUS_ORDER)[number],
  );

  return rank === -1 ? WAGON_STATUS_ORDER.length : rank;
};

export const isWagonShipmentStartedStatus = (value: unknown) => {
  const status = normalizeWagonStatus(value);
  return (
    status === "en_route_to_recipient" || status === "client_received"
  );
};

export const isWagonClientReceivedStatus = (value: unknown) =>
  normalizeWagonStatus(value) === "client_received";
