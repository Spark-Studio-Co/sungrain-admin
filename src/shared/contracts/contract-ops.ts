import { formatMoney, formatNumber } from "../../lib/utils";
import {
  isWagonShipmentStartedStatus,
  normalizeWagonStatus,
} from "./wagon-status-data";

export type ContractOperationStatus =
  "active" | "risk" | "completed" | "delivered" | "draft";

type ContractOpsOptions = {
  wagons?: any[];
  applications?: any[];
  invoices?: any[];
  payments?: any[];
};

type ContractDocumentsOptions = {
  backendUrl?: string;
};

type ContractFinanceOptions = {
  invoices?: any[];
  payments?: any[];
};

const statusConfig: Record<
  ContractOperationStatus,
  {
    label: string;
    tone: string;
    badgeClassName: string;
    progressClassName: string;
  }
> = {
  active: {
    label: "В работе",
    tone: "Операции идут по плану",
    badgeClassName: "border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]",
    progressClassName: "bg-[#2f6b4f]",
  },
  risk: {
    label: "Риск",
    tone: "Нужен контроль сроков",
    badgeClassName: "border-[#f4d6ce] bg-[#fff1ed] text-[#b9472d]",
    progressClassName: "bg-[#b9472d]",
  },
  completed: {
    label: "Завершен",
    tone: "Объем закрыт",
    badgeClassName: "border-[#dce8dc] bg-[#eef5ef] text-[#1f5a43]",
    progressClassName: "bg-[#1f5a43]",
  },
  delivered: {
    label: "Клиент получил",
    tone: "Весь заявленный объем доставлен",
    badgeClassName: "border-[#bdddc9] bg-[#e2f5e9] text-[#195f3f]",
    progressClassName: "bg-[#195f3f]",
  },
  draft: {
    label: "Черновик",
    tone: "Не хватает данных",
    badgeClassName: "border-[#f2dfca] bg-[#fff3e5] text-[#d5740b]",
    progressClassName: "bg-[#f38810]",
  },
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(
      value.replace(/\s/g, "").replace(",", "."),
    );
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getBackendFileBaseUrl = (backendUrl?: string) => {
  const baseUrl =
    backendUrl ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "";

  return trimTrailingSlash(baseUrl.replace(/\/api\/?$/, ""));
};

const getFileUrlValue = (file: any) => {
  if (typeof file === "string") return file;

  return (
    file?.location ||
    file?.downloadUrl ||
    file?.download_url ||
    file?.url ||
    file?.file_url ||
    file?.fileUrl ||
    file?.path ||
    file?.src ||
    file?.href ||
    ""
  );
};

const getFileName = (file: any, index: number) => {
  if (typeof file === "string") {
    return file.split(/[\\/]/).pop()?.split("?")[0] || `Документ ${index + 1}`;
  }

  const fileUrl = getFileUrlValue(file);

  return (
    file?.name ||
    file?.originalname ||
    file?.filename ||
    file?.fileName ||
    (typeof fileUrl === "string"
      ? fileUrl.split(/[\\/]/).pop()?.split("?")[0]
      : "") ||
    `Документ ${index + 1}`
  );
};

export const resolveBackendFileUrl = (
  file: any,
  options: ContractDocumentsOptions = {},
) => {
  const rawUrl = String(getFileUrlValue(file) || "").trim();

  if (!rawUrl || rawUrl === "#") return "";

  if (/^(https?:|blob:|data:)/i.test(rawUrl)) {
    return rawUrl;
  }

  const backendBaseUrl = getBackendFileBaseUrl(options.backendUrl);
  if (!backendBaseUrl) return rawUrl;

  if (rawUrl.startsWith("/")) {
    return `${backendBaseUrl}${encodeURI(rawUrl)}`;
  }

  const normalizedPath = rawUrl.replace(/^\/+/, "");
  if (
    normalizedPath.startsWith("uploads/") ||
    normalizedPath.includes("/uploads/")
  ) {
    return `${backendBaseUrl}/${encodeURI(normalizedPath)}`;
  }

  return `${backendBaseUrl}/uploads/${encodeURI(normalizedPath)}`;
};

const documentFileExtensionPattern =
  /\.(pdf|docx?|xlsx?|png|jpe?g|webp|zip|rar|txt|csv)(?:[?#].*)?$/i;

const isHtmlDocumentReference = (
  file: any,
  downloadUrl: string,
  name: string,
) => {
  const rawUrl = String(getFileUrlValue(file) || "");
  const mimeType = String(file?.mimetype || file?.type || "");
  const text = `${rawUrl} ${downloadUrl} ${name} ${mimeType}`;

  return (
    /text\/html/i.test(mimeType) ||
    /\.html?(?:[?#]|\s|$)/i.test(text) ||
    /https?:\/\/admin\.sungrain\.kz\//i.test(text) ||
    /\/admin\/contracts\//i.test(text)
  );
};

const isDownloadableDocumentReference = (
  file: any,
  downloadUrl: string,
  name: string,
) => {
  if (!downloadUrl) return false;
  if (isHtmlDocumentReference(file, downloadUrl, name)) return false;

  const rawUrl = String(getFileUrlValue(file) || "");
  const source = `${rawUrl} ${downloadUrl} ${name}`;

  return (
    documentFileExtensionPattern.test(source) ||
    /\/uploads\//i.test(downloadUrl)
  );
};

const getDocumentDedupeKey = (downloadUrl: string, name: string) =>
  (downloadUrl || name).split("?")[0].trim().toLowerCase();

const getCount = (value: unknown) => {
  const count = toNumber(value);
  return count > 0 ? Math.round(count) : 0;
};

const getStatusValue = (value: unknown) => normalizeWagonStatus(value);

const getPositiveOrderNumber = (value: unknown) => {
  const numericValue = toNumber(value);
  return numericValue > 0 ? numericValue : null;
};

const applicationNumberPattern =
  /(?:приложени[ея]|application|app|заявк[аи]|№|#|n[оo]?\.?)\s*[-№#:]?\s*(\d+)/i;
const trailingNumberPattern = /(\d+)\s*$/;

const getApplicationSortNumber = (application: any) => {
  const explicitOrder = [
    application?.sort_order,
    application?.sortOrder,
    application?.position,
    application?.application_number,
    application?.applicationNumber,
    application?.order,
  ];

  for (const value of explicitOrder) {
    const orderNumber = getPositiveOrderNumber(value);
    if (orderNumber !== null) return orderNumber;
  }

  const textCandidates = [
    application?.name,
    application?.title,
    application?.number,
    application?.application_name,
    application?.applicationName,
  ];

  for (const value of textCandidates) {
    if (typeof value !== "string") continue;

    const normalizedValue = value.trim();
    const markerMatch = normalizedValue.match(applicationNumberPattern);
    const fallbackMatch = normalizedValue.match(trailingNumberPattern);
    const matchedValue = markerMatch?.[1] || fallbackMatch?.[1];

    if (matchedValue) {
      const orderNumber = getPositiveOrderNumber(matchedValue);
      if (orderNumber !== null) return orderNumber;
    }
  }

  return null;
};

const getApplicationSortDate = (application: any) => {
  const dateValue =
    application?.created_at ||
    application?.createdAt ||
    application?.date ||
    application?.updated_at ||
    application?.updatedAt;
  const timestamp = dateValue ? new Date(dateValue).getTime() : Number.NaN;

  return Number.isFinite(timestamp) ? timestamp : null;
};

export const sortApplicationsByNaturalOrder = <T>(applications: T[]) =>
  applications
    .map((application: T, index) => ({ application, index }))
    .sort((a, b) => {
      const aOrder = getApplicationSortNumber(a.application);
      const bOrder = getApplicationSortNumber(b.application);

      if (aOrder !== null && bOrder !== null && aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      if (aOrder !== null && bOrder === null) return -1;
      if (aOrder === null && bOrder !== null) return 1;

      const aDate = getApplicationSortDate(a.application);
      const bDate = getApplicationSortDate(b.application);

      if (aDate !== null && bDate !== null && aDate !== bDate) {
        return aDate - bDate;
      }

      return a.index - b.index;
    })
    .map(({ application }) => application);

const getFirstPositiveNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numericValue = toNumber(value);
    if (numericValue > 0) return numericValue;
  }

  return 0;
};

export const isContractWagonShipped = (wagon: any) => {
  return isWagonShipmentStartedStatus(
    wagon?.status || wagon?.wagon?.status,
  );
};

const isWagonIncludedInShippedVolume = (wagon: any) => {
  // A wagon that has left the loading point contributes to contract
  // shipment progress even while it is travelling to the recipient.
  return isContractWagonShipped(wagon);
};

export const getWagonCapacityValue = (wagon: any) =>
  getFirstPositiveNumber(wagon?.capacity, wagon?.wagon?.capacity);

export const getWagonActualWeightValue = (wagon: any) =>
  getFirstPositiveNumber(
    wagon?.real_weight,
    wagon?.realWeight,
    wagon?.wagon?.real_weight,
    wagon?.wagon?.realWeight,
  );

export const getWagonShippedDocumentWeightValue = (wagon: any) => {
  if (!isWagonIncludedInShippedVolume(wagon)) return 0;

  return getWagonCapacityValue(wagon);
};

export const getWagonShippedActualWeightValue = (wagon: any) => {
  if (!isWagonIncludedInShippedVolume(wagon)) return 0;

  return getWagonActualWeightValue(wagon);
};

export const getWagonShippedWeightValue = getWagonShippedDocumentWeightValue;

export const getWagonGroupStats = (wagons: any[]) => {
  const wagonItems = getArray(wagons);
  const totalCapacity = wagonItems.reduce(
    (sum: number, wagon: any) => sum + getWagonCapacityValue(wagon),
    0,
  );
  const totalShippedWeight = wagonItems.reduce(
    (sum: number, wagon: any) =>
      sum + getWagonShippedDocumentWeightValue(wagon),
    0,
  );
  const totalShippedActualWeight = wagonItems.reduce(
    (sum: number, wagon: any) => sum + getWagonShippedActualWeightValue(wagon),
    0,
  );

  return {
    wagonCount: wagonItems.length,
    totalCapacity,
    totalRealWeight: totalShippedActualWeight,
    totalShippedWeight,
    totalShippedDocumentWeight: totalShippedWeight,
    totalShippedActualWeight,
    utilizationPercentage:
      totalCapacity > 0
        ? clamp((totalShippedWeight / totalCapacity) * 100, 0, 100)
        : 0,
  };
};

export const getApplicationVolumeValue = (application: any) =>
  getFirstPositiveNumber(
    application?.volume,
    application?.total_volume,
    application?.totalVolume,
    application?.planned_volume,
    application?.plannedVolume,
  );

export const getApplicationWagonGroupStats = (
  application: any,
  wagons: any[],
) => {
  const wagonStats = getWagonGroupStats(wagons);
  const applicationVolume = getApplicationVolumeValue(application);
  const totalTargetVolume =
    applicationVolume > 0 ? applicationVolume : wagonStats.totalCapacity;

  return {
    ...wagonStats,
    applicationVolume,
    totalTargetVolume,
    utilizationPercentage:
      totalTargetVolume > 0
        ? clamp(
            (wagonStats.totalShippedWeight / totalTargetVolume) * 100,
            0,
            100,
          )
        : 0,
  };
};

export type ApplicationShipmentStatus =
  | "empty"
  | "at_elevator"
  | "loading"
  | "en_route_to_recipient"
  | "received";

export const getApplicationShipmentSummary = (application: any) => {
  const wagons = getArray(application?.wagons);
  const counts = wagons.reduce(
    (acc, wagon: any) => {
      const status = getStatusValue(wagon?.status || wagon?.wagon?.status);

      if (status === "client_received") {
        acc.clientReceived += 1;
      } else if (status === "en_route_to_recipient") {
        acc.enRouteToRecipient += 1;
        acc.inTransit += 1;
      } else {
        if (status === "en_route_to_loading") {
          acc.enRouteToLoading += 1;
          acc.inTransit += 1;
        } else if (status === "registered") {
          acc.registered += 1;
        } else if (status === "at_elevator") {
          acc.atElevator += 1;
        } else {
          acc.other += 1;
        }
      }

      return acc;
    },
    {
      total: wagons.length,
      clientReceived: 0,
      inTransit: 0,
      atElevator: 0,
      enRouteToLoading: 0,
      registered: 0,
      enRouteToRecipient: 0,
      other: 0,
    },
  );

  const status: ApplicationShipmentStatus =
    counts.total === 0
      ? "empty"
      : counts.clientReceived === counts.total
        ? "received"
        : counts.enRouteToRecipient === counts.total
          ? "en_route_to_recipient"
          : counts.inTransit > 0 ||
              counts.registered > 0 ||
              counts.clientReceived > 0
            ? "loading"
            : "at_elevator";
  const label =
    status === "received"
      ? "Клиент получил"
      : counts.clientReceived > 0
        ? "В работе"
        : status === "en_route_to_recipient"
          ? "Отгружен"
          : counts.enRouteToRecipient > 0
            ? "В работе"
            : counts.registered > 0
              ? "Оформлено"
              : counts.enRouteToLoading > 0
                ? "Под погрузку"
                : status === "loading"
                  ? "Грузится"
                  : status === "at_elevator"
                    ? "На элеваторе"
                    : "Нет вагонов";
  const progress =
    counts.total > 0
      ? clamp(
          Math.round(
            ((counts.enRouteToRecipient + counts.clientReceived) /
              counts.total) *
              100,
          ),
          0,
          100,
        )
      : 0;

  return {
    ...counts,
    status,
    label,
    progress,
  };
};

const getContractApplications = (contract: any) =>
  getArray(contract?.applications);

const getContractFiles = (contract: any) =>
  getArray(
    contract?.files || contract?.documents || contract?.documentsForUpload,
  );

const getContractInvoices = (contract: any) => {
  const directInvoices = getArray(
    contract?.invoices || contract?.finance?.invoices,
  );
  if (directInvoices.length > 0) return directInvoices;

  return getContractApplications(contract).flatMap((application: any) =>
    getArray(application?.invoices),
  );
};

const getContractPayments = (contract: any, invoices?: any[]) => {
  const directPayments = getArray(
    contract?.payments || contract?.finance?.payments,
  );
  if (directPayments.length > 0) return directPayments;

  return (invoices || getContractInvoices(contract)).flatMap((invoice: any) =>
    getArray(invoice?.payments),
  );
};

const getTextValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map((item) => getTextValue(item)).filter(Boolean)),
    ).join(" · ");
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const nestedValue =
      source.name ||
      source.title ||
      source.station_name ||
      source.stationName ||
      source.label ||
      source.value;

    return getTextValue(nestedValue);
  }

  return "";
};

const routeSourceKeys = ["route", "logistics", "transport", "shipping"];

const getRouteTextValue = (source: any, keys: string[]) => {
  const sources = [
    source,
    ...routeSourceKeys.map((key) => source?.[key]).filter(Boolean),
  ];

  for (const currentSource of sources) {
    for (const key of keys) {
      const value = getTextValue(currentSource?.[key]);

      if (value) return value;
    }
  }

  return "";
};

const routeDepartureKeys = [
  "departure_stations",
  "departureStations",
  "departure_station",
  "departureStation",
  "departure",
  "from_station",
  "fromStation",
  "from",
  "loading_station",
  "loadingStation",
  "origin_station",
  "originStation",
  "origin",
  "station_from",
  "stationFrom",
  "sender_station",
  "senderStation",
];

const routeDestinationKeys = [
  "destination_stations",
  "destinationStations",
  "destination_station",
  "destinationStation",
  "destination",
  "to_station",
  "toStation",
  "to",
  "unloading_station",
  "unloadingStation",
  "arrival_station",
  "arrivalStation",
  "arrival",
  "station_to",
  "stationTo",
  "receiver_station",
  "receiverStation",
];

export const getContractStationNames = (
  contract: any,
  direction: "departure" | "destination",
) => {
  const arrayKeys =
    direction === "departure"
      ? ["departure_stations", "departureStations"]
      : ["destination_stations", "destinationStations"];
  const legacyKeys =
    direction === "departure"
      ? ["departure_station", "departureStation"]
      : ["destination_station", "destinationStation"];

  for (const key of arrayKeys) {
    const value = contract?.[key];
    if (!Array.isArray(value)) continue;

    const stations = Array.from(
      new Set(value.map((item) => getTextValue(item)).filter(Boolean)),
    );
    if (stations.length > 0) return stations;
  }

  for (const key of legacyKeys) {
    const value = getTextValue(contract?.[key]);
    if (value) return [value];
  }

  return [];
};

const getRussianPlural = (
  count: number,
  one: string,
  few: string,
  many: string,
) => {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;

  return many;
};

const formatCount = (count: number, one: string, few: string, many: string) =>
  `${count} ${getRussianPlural(count, one, few, many)}`;

const getContractRoute = (contract: any, applicationsCount: number) => {
  const departure =
    getRouteTextValue(contract, routeDepartureKeys) || "Станция отправления";
  const destination =
    getRouteTextValue(contract, routeDestinationKeys) || "Станция назначения";

  return {
    departure,
    destination,
    label: `${departure} → ${destination}`,
    applicationsCount,
    applications: [],
  };
};

export const getApplicationRoute = (application: any) => {
  const departure =
    getRouteTextValue(application, routeDepartureKeys) ||
    getRouteTextValue(application?.contract, routeDepartureKeys) ||
    "Станция отправления";
  const destination =
    getRouteTextValue(application, routeDestinationKeys) ||
    getRouteTextValue(application?.contract, routeDestinationKeys) ||
    "Станция назначения";

  return {
    departure,
    destination,
    label: `${departure} → ${destination}`,
  };
};

const getApplicationRoutes = (applications: any[]) => {
  const routes = new Map<
    string,
    {
      departure: string;
      destination: string;
      label: string;
      applicationsCount: number;
      applications: Array<{
        id: string | number;
        label: string;
        wagonsCount: number;
      }>;
    }
  >();

  applications.forEach((application) => {
    const applicationRoute = getApplicationRoute(application);
    const departure = applicationRoute.departure;
    const destination = applicationRoute.destination;

    if (
      departure === "Станция отправления" ||
      destination === "Станция назначения"
    ) {
      return;
    }

    const applicationSummary = {
      id: application?.id || application?.name || routes.size,
      label:
        application?.name || `Заявка №${application?.id || routes.size + 1}`,
      wagonsCount: getArray(application?.wagons).length,
    };

    const routeKey = `${departure.toLocaleLowerCase()}|${destination.toLocaleLowerCase()}`;
    const existingRoute = routes.get(routeKey);

    if (existingRoute) {
      existingRoute.applicationsCount += 1;
      existingRoute.applications.push(applicationSummary);
      return;
    }

    routes.set(routeKey, {
      departure,
      destination,
      label: `${departure} → ${destination}`,
      applicationsCount: 1,
      applications: [applicationSummary],
    });
  });

  return Array.from(routes.values());
};

const getRouteSummary = (
  routes: ReturnType<typeof getApplicationRoutes>,
  status: ContractOperationStatus,
  shippedVolume: number,
) => {
  const eta =
    status === "risk"
      ? "требует контроля"
      : shippedVolume > 0
        ? "в работе"
        : "отгрузок нет";

  if (routes.length <= 1) {
    const route = routes[0];

    return {
      departure: route.departure,
      destination: route.destination,
      label: route.label,
      eta,
      count: routes.length,
    };
  }

  return {
    departure: formatCount(
      routes.length,
      "отправление",
      "отправления",
      "отправлений",
    ),
    destination: formatCount(
      routes.length,
      "назначение",
      "назначения",
      "назначений",
    ),
    label: formatCount(routes.length, "маршрут", "маршрута", "маршрутов"),
    eta,
    count: routes.length,
  };
};

const getMoneyValue = (value: any) =>
  toNumber(
    value?.amount ??
      value?.total_amount ??
      value?.totalAmount ??
      value?.sum ??
      value,
  );

const getInvoicePaidValue = (invoice: any) => {
  const amount = getMoneyValue(invoice);
  const status = getStatusValue(invoice?.status);

  if (status === "paid") {
    return amount;
  }

  const explicitPaid = toNumber(
    invoice?.paid_amount ??
      invoice?.paidAmount ??
      invoice?.paid ??
      invoice?.paid_total ??
      invoice?.paidTotal,
  );
  const paymentsPaid = getArray(invoice?.payments).reduce(
    (sum, payment) => sum + getMoneyValue(payment),
    0,
  );

  return Math.min(amount, Math.max(explicitPaid + paymentsPaid, 0));
};

const getInvoiceBalanceValue = (invoice: any) =>
  Math.max(getMoneyValue(invoice) - getInvoicePaidValue(invoice), 0);

export const getContractStatusConfig = (status: ContractOperationStatus) =>
  statusConfig[status] || statusConfig.active;

export const getContractVolume = (contract: any) =>
  toNumber(contract?.total_volume || contract?.totalVolume || contract?.volume);

export const getContractCompanyName = (contract: any) => {
  if (!contract?.company) return "-";
  if (typeof contract.company === "string") return contract.company;
  return contract.company.name || "-";
};

export const formatContractDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString("ru-RU") : "-";

export const formatContractMoney = (
  value: number | string | null | undefined,
  currency = "USD",
) => formatMoney(value, currency, "USD");

export const getContractOpsMeta = (
  contract: any,
  options: ContractOpsOptions = {},
) => {
  const totalVolume = getContractVolume(contract);
  const wagons = options.wagons || getArray(contract?.wagons);
  const applications =
    options.applications || getContractApplications(contract);
  const files = getContractFiles(contract);
  const invoices = options.invoices || getContractInvoices(contract);
  const payments = options.payments || getContractPayments(contract, invoices);
  const documentedShippedVolume = wagons.reduce(
    (sum, wagon) => sum + getWagonShippedDocumentWeightValue(wagon),
    0,
  );
  const actualShippedVolume = wagons.reduce(
    (sum, wagon) => sum + getWagonShippedActualWeightValue(wagon),
    0,
  );
  const shippedVolume = documentedShippedVolume;
  const progress =
    totalVolume > 0
      ? clamp(Math.round((shippedVolume / totalVolume) * 100), 0, 100)
      : 0;
  const remainingVolume = Math.max(totalVolume - shippedVolume, 0);
  const applicationsCount =
    applications.length || getCount(contract?.applications_count);
  const wagonsCount = wagons.length || getCount(contract?.wagons_count);
  const documentsCount = files.length || getCount(contract?.documents_count);
  const hasCoreData =
    Boolean(contract?.number) && Boolean(contract?.crop) && totalVolume > 0;
  const overdueSignal =
    contract?.status === "overdue" || contract?.payment_status === "overdue";
  const receivedWagonsCount = wagons.filter(
    (wagon) =>
      getStatusValue(wagon?.status || wagon?.wagon?.status) ===
      "client_received",
  ).length;
  const allWagonsReceived =
    wagons.length > 0 && receivedWagonsCount === wagons.length;
  const status: ContractOperationStatus = !hasCoreData
    ? "draft"
    : allWagonsReceived && progress >= 96
      ? "delivered"
      : progress >= 96
        ? "completed"
        : overdueSignal
          ? "risk"
          : "active";
  const invoiceTotal = invoices.reduce(
    (sum, invoice) => sum + getMoneyValue(invoice),
    0,
  );
  const paidAmount = invoices.reduce(
    (sum, invoice) => sum + getInvoicePaidValue(invoice),
    0,
  );
  const balance = Math.max(invoiceTotal - paidAmount, 0);
  const paymentProgress =
    invoiceTotal > 0
      ? clamp(Math.round((paidAmount / invoiceTotal) * 100), 0, 100)
      : 0;
  const invoiceCount = invoices.length || getCount(contract?.invoice_count);
  const paymentsCount = payments.length || getCount(contract?.payments_count);
  const paidInvoiceCount = invoices.filter(
    (invoice) =>
      getMoneyValue(invoice) > 0 && getInvoiceBalanceValue(invoice) <= 0,
  ).length;
  const openInvoiceCount = invoices.filter(
    (invoice) => getInvoiceBalanceValue(invoice) > 0,
  ).length;
  const applicationRoutes = getApplicationRoutes(applications);
  const routes =
    applicationRoutes.length > 0
      ? applicationRoutes
      : [getContractRoute(contract, applicationsCount)];
  const route = getRouteSummary(routes, status, shippedVolume);
  const baseStatusConfig = getContractStatusConfig(status);
  const resolvedStatusConfig =
    receivedWagonsCount > 0 && !allWagonsReceived
      ? {
          ...baseStatusConfig,
          tone: `У клиента: ${receivedWagonsCount}`,
        }
      : baseStatusConfig;

  return {
    status,
    statusConfig: resolvedStatusConfig,
    totalVolume,
    shippedVolume,
    documentedShippedVolume,
    actualShippedVolume,
    remainingVolume,
    progress,
    applicationsCount,
    wagonsCount,
    documentsCount,
    invoiceTotal,
    paidAmount,
    balance,
    paymentProgress,
    invoiceCount,
    paymentsCount,
    paidInvoiceCount,
    openInvoiceCount,
    receivedWagonsCount,
    allWagonsReceived,
    overdueCount: status === "risk" ? 1 : 0,
    route,
    routes,
  };
};

export const getContractDocuments = (
  contract: any,
  options: ContractDocumentsOptions = {},
) => {
  const files = getContractFiles(contract);

  if (files.length > 0) {
    const seenDocuments = new Set<string>();

    return files
      .map((file, index) => {
        const name = getFileName(file, index);
        const downloadUrl = resolveBackendFileUrl(file, options);

        return {
          id: file?.id || `file-${index}`,
          name,
          type: file?.mimetype || file?.type || "PDF",
          date: file?.created_at
            ? formatContractDate(file.created_at)
            : "в договоре",
          size: file?.size ? `${Math.round(file.size / 1024)} KB` : "128 KB",
          downloadUrl,
          file,
        };
      })
      .filter((document) => {
        if (
          !isDownloadableDocumentReference(
            document.file,
            document.downloadUrl,
            document.name,
          )
        ) {
          return false;
        }

        const dedupeKey = getDocumentDedupeKey(
          document.downloadUrl,
          document.name,
        );

        if (seenDocuments.has(dedupeKey)) {
          return false;
        }

        seenDocuments.add(dedupeKey);
        return true;
      });
  }

  return [];
};

export const getContractFinanceLinks = (
  contract: any,
  options: ContractFinanceOptions = {},
) => {
  const currency = contract?.currency || "USD";
  const sourceInvoices = options.invoices || getContractInvoices(contract);
  const invoices = sourceInvoices.map((invoice: any, index) => {
    const amount = getMoneyValue(invoice);
    const paid = getInvoicePaidValue(invoice);
    const status = getStatusValue(invoice?.status);

    return {
      id:
        invoice?.number ||
        invoice?.id ||
        `INV-${String(index + 1).padStart(3, "0")}`,
      title: invoice?.name || invoice?.title || `Счет ${index + 1}`,
      amount,
      paid,
      balance: Math.max(amount - paid, 0),
      status:
        status === "paid" || paid >= amount
          ? "Оплачен"
          : paid > 0
            ? "Частично"
            : "Ожидает",
      currency: invoice?.currency || currency,
    };
  });
  const payments = (
    options.payments || getContractPayments(contract, sourceInvoices)
  ).map((payment: any, index) => ({
    id:
      payment?.number ||
      payment?.id ||
      `PAY-${String(index + 1).padStart(3, "0")}`,
    amount: getMoneyValue(payment),
    status: payment?.status || "Проведен",
    reference: payment?.reference || payment?.ref || "-",
    currency: payment?.currency || currency,
  }));

  return {
    invoices,
    payments,
  };
};

export const getContractOperationSummary = (contract: any) => {
  const meta = getContractOpsMeta(contract);

  return [
    {
      label: "Объем",
      value: `${formatNumber(meta.shippedVolume)} / ${formatNumber(meta.totalVolume)} т`,
      hint: `${meta.progress}% закрыто`,
    },
    {
      label: "Финансы",
      value: formatContractMoney(meta.balance, contract?.currency || "USD"),
      hint: `остаток к оплате`,
    },
    {
      label: "Документы",
      value: String(meta.documentsCount),
      hint: `${meta.applicationsCount} заявок`,
    },
  ];
};
