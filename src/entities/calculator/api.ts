import { apiClient } from "@/shared/api/apiClient";

export const UNITS = {
  TONNE: "За тонну",
  WAGON: "За вагон",
  ITEM: "За штуку",
  FIXED: "За отправку",
  TONNE_MONTH: "За тонну в месяц",
  TONNE_PERCENT: "За тонно-процент",
} as const;
export type CostUnit = keyof typeof UNITS;
export const UNIT_SHORT: Record<CostUnit, string> = {
  TONNE: "т",
  WAGON: "вагон",
  ITEM: "шт.",
  FIXED: "отправка",
  TONNE_MONTH: "т × мес.",
  TONNE_PERCENT: "т × п.п.",
};
export const CATEGORIES = {
  TRANSPORT: "Перевозка",
  ELEVATOR: "Элеватор",
  DOCUMENTS: "Документы",
  OTHER: "Прочее",
} as const;
export type Currency = "KZT" | "USD" | "EUR" | "RUB" | "CNY";
export type ElevatorRate = {
  id: string;
  price: string;
  effectiveFrom: string;
  createdAt: string;
};
export type ElevatorService = {
  id: string;
  name: string;
  culture?: string | null;
  unit: CostUnit;
  archived: boolean;
  overtimeEligible: boolean;
  alternativeGroup: string;
  rates: ElevatorRate[];
};
export type Elevator = {
  id: string;
  name: string;
  station: string;
  address: string;
  contact: string;
  notes: string;
  archived: boolean;
  version: number;
  services: ElevatorService[];
};
export type ElevatorInput = Omit<Elevator, "id" | "services" | "version"> & {
  version?: number;
};
export type ServiceInput = Pick<
  ElevatorService,
  "name" | "unit" | "overtimeEligible" | "alternativeGroup"
> & { culture?: string | null; price: string; effectiveFrom: string };
export type CalculationLine = {
  id: string;
  serviceId?: string;
  name: string;
  category: keyof typeof CATEGORIES;
  unit: CostUnit;
  price: string;
  factor: string;
  capacityTonnesPerWagon?: string;
  overtime: boolean;
};
export type CalculationInput = {
  schemaVersion?: 1 | 2;
  requestId?: string;
  sourceId?: string;
  title: string;
  mode: "DOMESTIC" | "EXPORT";
  date: string;
  culture: string;
  departureStation: string;
  destinationStation: string;
  wagons: number;
  tonnes: string;
  purchasePrice: string;
  salePrice?: string;
  currency: Currency;
  techPdPerWagon?: string;
  elevatorId?: string;
  purchaseId?: string;
  applicationId?: number;
  notes: string;
  lines: CalculationLine[];
};
export type CalculationResult = {
  schemaVersion?: number;
  fingerprint: string;
  fx: {
    currency: string;
    date: string;
    nominal: number;
    value: string;
    perUnit: string;
    sourceUrl: string;
    fetchedAt: string;
  };
  expenses: (CalculationLine & {
    quantity: string;
    multiplier: string;
    amountKzt: string;
    rateId?: string;
    effectiveFrom?: string;
    serviceCulture?: string;
  })[];
  elevatorName: string | null;
  purchaseReference: {
    id: string;
    number: string;
    price: string;
    currency: string;
    tonnes: string;
  } | null;
  applicationReference: {
    id: number;
    name: string;
    contract: string;
    price: string;
    currency: string;
    tonnes: string;
  } | null;
  purchaseKzt: string;
  expensesKzt: string;
  totalCostKzt: string;
  totalCostCurrency?: string;
  wagonExpensesKzt?: string;
  elevatorExpensesKzt?: string;
  revenueKzt: string | null;
  revenueCurrency: string | null;
  profitKzt: string | null;
  profitCurrency: string | null;
  costPerTonneKzt: string;
  costPerTonneCurrency: string;
  profitPerTonneKzt: string | null;
  profitPerTonneCurrency: string | null;
  marginPercent: string | null;
};
export type Calculation = {
  id: string;
  title: string;
  mode: "DOMESTIC" | "EXPORT";
  date: string;
  culture: string;
  currency: Currency;
  tonnes: string;
  totalCostKzt: string;
  profitKzt: string | null;
  createdAt: string;
  sourceId: string | null;
  input: CalculationInput;
  result: CalculationResult;
};
export type CalculatorOptions = {
  cultures: { name: string }[];
  stations: { id: number; name: string; code: string }[];
  purchases: {
    id: string;
    cultureName: string;
    quantity: string;
    unitPrice: string;
    currency: string;
    agreementNumber: string;
  }[];
  applications: {
    id: number;
    name: string | null;
    contract: { number: string };
    culture: string;
    volume: number;
    currency: string | null;
    price_per_ton: number;
    departure_stations: string[];
    destination_stations: string[];
  }[];
};

export const tradeApi = {
  elevators: async () =>
    (await apiClient.get<Elevator[]>("/elevators", { timeout: 15_000 })).data,
  elevator: async (id: string) =>
    (await apiClient.get<Elevator>(`/elevators/${id}`)).data,
  createElevator: async (input: ElevatorInput) =>
    (await apiClient.post<Elevator>("/elevators", input)).data,
  updateElevator: async (id: string, input: ElevatorInput) =>
    (await apiClient.patch<Elevator>(`/elevators/${id}`, input)).data,
  addService: async (id: string, input: ServiceInput) =>
    (await apiClient.post(`/elevators/${id}/services`, input)).data,
  addRate: async (
    id: string,
    serviceId: string,
    input: { price: string; effectiveFrom: string },
  ) =>
    (
      await apiClient.post(
        `/elevators/${id}/services/${serviceId}/rates`,
        input,
      )
    ).data,
  archiveService: async (id: string, serviceId: string, archived: boolean) =>
    (
      await apiClient.patch(`/elevators/${id}/services/${serviceId}`, {
        archived,
      })
    ).data,
  options: async () =>
    (
      await apiClient.get<CalculatorOptions>("/calculator/options", {
        timeout: 15_000,
      })
    ).data,
  preview: async (input: CalculationInput) =>
    (
      await apiClient.post<CalculationResult>("/calculator/preview", input, {
        timeout: 30_000,
      })
    ).data,
  save: async (input: CalculationInput, previewFingerprint: string) =>
    (
      await apiClient.post<Calculation>(
        "/calculator/calculations",
        { ...input, previewFingerprint },
        { timeout: 30_000 },
      )
    ).data,
  list: async (search: string, mode: string, page: number) =>
    (
      await apiClient.get<{
        items: Calculation[];
        total: number;
        page: number;
        pages: number;
      }>("/calculator/calculations", {
        params: { search, mode: mode || undefined, page },
      })
    ).data,
  get: async (id: string) =>
    (
      await apiClient.get<Calculation>(`/calculator/calculations/${id}`, {
        timeout: 15_000,
      })
    ).data,
  download: async (id: string, format: "xlsx" | "pdf") => {
    const response = await apiClient.get(
      `/calculator/calculations/${id}/export`,
      { params: { format }, responseType: "blob" },
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sungrain-calculation-${id}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export function moneyText(value: string | number | null | undefined) {
  if (value == null) return "—";
  const [integer, fraction] = String(value).split(".");
  return `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}${fraction ? `,${fraction}` : ""}`;
}
export const todayKz = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty" }).format(
    new Date(),
  );
export const dateText = (value: string) =>
  value.slice(0, 10).split("-").reverse().join(".");
export function errorText(error: unknown) {
  const message = (
    error as { response?: { data?: { message?: string | string[] } } }
  )?.response?.data?.message;
  return Array.isArray(message)
    ? message.join(". ")
    : message || "Не удалось выполнить запрос. Повторите попытку.";
}
export function applicableRate(service: ElevatorService, date: string) {
  return service.rates.find((rate) => rate.effectiveFrom.slice(0, 10) <= date);
}
