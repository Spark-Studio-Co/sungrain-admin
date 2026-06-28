import { formatMoney, formatNumber } from "../../lib/utils";

export type ContractOperationStatus = "active" | "risk" | "completed" | "draft";

type ContractOpsOptions = {
  wagons?: any[];
};

type ContractDocumentsOptions = {
  backendUrl?: string;
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
    const parsed = Number.parseFloat(value.replace(/\s/g, "").replace(",", "."));
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
  options: ContractDocumentsOptions = {}
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
  if (normalizedPath.startsWith("uploads/") || normalizedPath.includes("/uploads/")) {
    return `${backendBaseUrl}/${encodeURI(normalizedPath)}`;
  }

  return `${backendBaseUrl}/uploads/${encodeURI(normalizedPath)}`;
};

const getCount = (value: unknown) => {
  const count = toNumber(value);
  return count > 0 ? Math.round(count) : 0;
};

const getStatusValue = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase() : "";

const getFirstPositiveNumber = (...values: unknown[]) => {
  for (const value of values) {
    const numericValue = toNumber(value);
    if (numericValue > 0) return numericValue;
  }

  return 0;
};

export const isContractWagonShipped = (wagon: any) => {
  const status = getStatusValue(wagon?.status || wagon?.wagon?.status);
  return (
    status === "shipped" ||
    status === "completed" ||
    Boolean(wagon?.date_of_unloading || wagon?.dateOfUnloading || wagon?.wagon?.date_of_unloading)
  );
};

export const getWagonCapacityValue = (wagon: any) =>
  getFirstPositiveNumber(wagon?.capacity, wagon?.wagon?.capacity);

export const getWagonActualWeightValue = (wagon: any) =>
  getFirstPositiveNumber(
    wagon?.real_weight,
    wagon?.realWeight,
    wagon?.wagon?.real_weight,
    wagon?.wagon?.realWeight
  );

export const getWagonShippedWeightValue = (wagon: any) => {
  if (!isContractWagonShipped(wagon)) return 0;

  const actualWeight = getWagonActualWeightValue(wagon);
  return actualWeight > 0 ? actualWeight : getWagonCapacityValue(wagon);
};

export const getWagonGroupStats = (wagons: any[]) => {
  const wagonItems = getArray(wagons);
  const totalCapacity = wagonItems.reduce(
    (sum: number, wagon: any) => sum + getWagonCapacityValue(wagon),
    0
  );
  const totalShippedWeight = wagonItems.reduce(
    (sum: number, wagon: any) => sum + getWagonShippedWeightValue(wagon),
    0
  );

  return {
    wagonCount: wagonItems.length,
    totalCapacity,
    totalRealWeight: totalShippedWeight,
    totalShippedWeight,
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
    application?.plannedVolume
  );

export const getApplicationWagonGroupStats = (
  application: any,
  wagons: any[]
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
        ? clamp((wagonStats.totalShippedWeight / totalTargetVolume) * 100, 0, 100)
        : 0,
  };
};

const getContractApplications = (contract: any) => getArray(contract?.applications);

const getContractFiles = (contract: any) =>
  getArray(contract?.files || contract?.documents || contract?.documentsForUpload);

const getContractInvoices = (contract: any) => {
  const directInvoices = getArray(contract?.invoices || contract?.finance?.invoices);
  if (directInvoices.length > 0) return directInvoices;

  return getContractApplications(contract).flatMap((application: any) =>
    getArray(application?.invoices)
  );
};

const getContractPayments = (contract: any) => {
  const directPayments = getArray(contract?.payments || contract?.finance?.payments);
  if (directPayments.length > 0) return directPayments;

  return getContractInvoices(contract).flatMap((invoice: any) =>
    getArray(invoice?.payments)
  );
};

const getMoneyValue = (value: any) =>
  toNumber(value?.amount ?? value?.total_amount ?? value?.totalAmount ?? value?.sum ?? value);

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
  currency = "USD"
) => formatMoney(value, currency, "USD");

export const getContractOpsMeta = (
  contract: any,
  options: ContractOpsOptions = {}
) => {
  const totalVolume = getContractVolume(contract);
  const wagons = options.wagons || getArray(contract?.wagons);
  const applications = getContractApplications(contract);
  const files = getContractFiles(contract);
  const invoices = getContractInvoices(contract);
  const payments = getContractPayments(contract);
  const shippedFromWagons = wagons.reduce(
    (sum, wagon) => sum + getWagonShippedWeightValue(wagon),
    0
  );
  const shippedVolume = shippedFromWagons;
  const progress =
    totalVolume > 0 ? clamp(Math.round((shippedVolume / totalVolume) * 100), 0, 100) : 0;
  const remainingVolume = Math.max(totalVolume - shippedVolume, 0);
  const applicationsCount =
    applications.length || getCount(contract?.applications_count);
  const wagonsCount =
    wagons.length || getCount(contract?.wagons_count);
  const documentsCount =
    files.length || getCount(contract?.documents_count);
  const hasCoreData =
    Boolean(contract?.number) &&
    Boolean(contract?.sender) &&
    Boolean(contract?.receiver) &&
    Boolean(contract?.departure_station || contract?.departureStation) &&
    Boolean(contract?.destination_station || contract?.destinationStation);
  const overdueSignal =
    contract?.status === "overdue" ||
    contract?.payment_status === "overdue";
  const status: ContractOperationStatus = !hasCoreData
    ? "draft"
    : progress >= 96
      ? "completed"
      : overdueSignal
        ? "risk"
        : "active";
  const invoiceTotal = invoices.reduce(
    (sum, invoice) => sum + getMoneyValue(invoice),
    0
  );
  const paidAmount = payments.reduce(
    (sum, payment) => sum + getMoneyValue(payment),
    0
  );
  const balance = Math.max(invoiceTotal - paidAmount, 0);
  const paymentProgress =
    invoiceTotal > 0 ? clamp(Math.round((paidAmount / invoiceTotal) * 100), 0, 100) : 0;
  const invoiceCount = invoices.length || getCount(contract?.invoice_count);
  const paymentsCount = payments.length || getCount(contract?.payments_count);
  const departure =
    contract?.departure_station || contract?.departureStation || "Станция отправления";
  const destination =
    contract?.destination_station || contract?.destinationStation || "Станция назначения";

  return {
    status,
    statusConfig: getContractStatusConfig(status),
    totalVolume,
    shippedVolume,
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
    overdueCount: status === "risk" ? 1 : 0,
    route: {
      departure,
      destination,
      label: `${departure} → ${destination}`,
      eta:
        status === "risk"
          ? "требует контроля"
          : shippedVolume > 0
            ? "в работе"
            : "отгрузок нет",
    },
    nextAction:
      status === "draft"
        ? "Заполнить маршрут"
        : status === "risk"
          ? "Проверить просрочки"
          : status === "completed"
            ? "Закрыть документы"
            : shippedVolume > 0
              ? "Контроль отгрузки"
              : "Начать отгрузку",
  };
};

export const getContractDocuments = (
  contract: any,
  options: ContractDocumentsOptions = {}
) => {
  const files = getContractFiles(contract);

  if (files.length > 0) {
    return files.map((file, index) => ({
      id: file?.id || `file-${index}`,
      name: getFileName(file, index),
      type: file?.mimetype || "PDF",
      date: file?.created_at ? formatContractDate(file.created_at) : "в договоре",
      size: file?.size ? `${Math.round(file.size / 1024)} KB` : "128 KB",
      downloadUrl: resolveBackendFileUrl(file, options),
      file,
    }));
  }

  return [];
};

export const getContractFinanceLinks = (contract: any) => {
  const currency = contract?.currency || "USD";
  const invoices = getContractInvoices(contract).map((invoice: any, index) => {
    const amount = getMoneyValue(invoice);
    const paid = getArray(invoice?.payments).reduce(
      (sum, payment) => sum + getMoneyValue(payment),
      toNumber(invoice?.paid_amount ?? invoice?.paidAmount)
    );
    const status = getStatusValue(invoice?.status);

    return {
      id: invoice?.number || invoice?.id || `INV-${String(index + 1).padStart(3, "0")}`,
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
  const payments = getContractPayments(contract).map((payment: any, index) => ({
    id: payment?.number || payment?.id || `PAY-${String(index + 1).padStart(3, "0")}`,
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
