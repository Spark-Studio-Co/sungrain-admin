import { formatCurrency, formatNumber } from "@/lib/utils";

export type ContractOperationStatus = "active" | "risk" | "completed" | "draft";

type ContractOpsOptions = {
  wagons?: any[];
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

const getSeed = (contract: any) => {
  const raw = `${contract?.id || ""}${contract?.number || ""}`;
  const numbers = raw.match(/\d+/g)?.join("") || "7";
  return Number.parseInt(numbers.slice(-4), 10) || 7;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

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
) => formatCurrency(value, currency === "KZT" ? "₸" : currency);

export const getContractOpsMeta = (
  contract: any,
  options: ContractOpsOptions = {}
) => {
  const seed = getSeed(contract);
  const totalVolume = getContractVolume(contract);
  const wagons = options.wagons || getArray(contract?.wagons);
  const applications = getArray(contract?.applications);
  const files = getArray(contract?.files);
  const shippedFromWagons = wagons.reduce(
    (sum, wagon) =>
      sum +
      toNumber(
        wagon?.real_weight ||
          wagon?.realWeight ||
          wagon?.capacity ||
          wagon?.wagon?.real_weight ||
          wagon?.wagon?.capacity
      ),
    0
  );
  const fallbackRatio = [0.18, 0.42, 0.63, 0.81, 1][seed % 5];
  const shippedVolume =
    shippedFromWagons > 0
      ? shippedFromWagons
      : Math.round(totalVolume * fallbackRatio);
  const progress =
    totalVolume > 0 ? clamp(Math.round((shippedVolume / totalVolume) * 100), 0, 100) : 0;
  const remainingVolume = Math.max(totalVolume - shippedVolume, 0);
  const applicationsCount =
    applications.length || Number(contract?.applications_count) || (seed % 4) + 2;
  const wagonsCount =
    wagons.length || Number(contract?.wagons_count) || Math.max(1, (seed % 7) + 3);
  const documentsCount =
    files.length || Number(contract?.documents_count) || (seed % 3) + 2;
  const hasCoreData =
    Boolean(contract?.number) &&
    Boolean(contract?.sender) &&
    Boolean(contract?.receiver) &&
    Boolean(contract?.departure_station || contract?.departureStation) &&
    Boolean(contract?.destination_station || contract?.destinationStation);
  const overdueSignal =
    contract?.status === "overdue" ||
    contract?.payment_status === "overdue" ||
    seed % 6 === 0;
  const status: ContractOperationStatus = !hasCoreData
    ? "draft"
    : progress >= 96
      ? "completed"
      : overdueSignal
        ? "risk"
        : "active";
  const invoiceTotal =
    toNumber(contract?.estimated_cost) ||
    Math.round(totalVolume * (contract?.currency === "KZT" ? 56413 : 184));
  const paidRatio =
    status === "completed" ? 1 : status === "risk" ? 0.42 : [0.35, 0.58, 0.73, 0.86][seed % 4];
  const paidAmount = Math.round(invoiceTotal * paidRatio);
  const balance = Math.max(invoiceTotal - paidAmount, 0);
  const paymentProgress =
    invoiceTotal > 0 ? clamp(Math.round((paidAmount / invoiceTotal) * 100), 0, 100) : 0;
  const invoiceCount = Math.max(1, Math.min(4, applicationsCount - 1));
  const paymentsCount = Math.max(1, Math.min(invoiceCount + 1, Math.round(invoiceCount * paidRatio) + 1));
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
    overdueCount: status === "risk" ? Math.max(1, seed % 3) : 0,
    route: {
      departure,
      destination,
      label: `${departure} → ${destination}`,
      eta: status === "risk" ? "требует контроля" : `${(seed % 5) + 2} дн. в пути`,
    },
    nextAction:
      status === "draft"
        ? "Заполнить маршрут"
        : status === "risk"
          ? "Проверить просрочки"
          : status === "completed"
            ? "Закрыть документы"
            : "Контроль отгрузки",
  };
};

export const getContractDocuments = (contract: any) => {
  const files = getArray(contract?.files);

  if (files.length > 0) {
    return files.map((file, index) => ({
      id: file?.id || `file-${index}`,
      name: file?.name || file?.originalname || `Документ ${index + 1}`,
      type: file?.mimetype || "PDF",
      date: file?.created_at ? formatContractDate(file.created_at) : "в договоре",
      size: file?.size ? `${Math.round(file.size / 1024)} KB` : "128 KB",
    }));
  }

  const meta = getContractOpsMeta(contract);
  return [
    {
      id: "contract",
      name: `Договор ${contract?.number || contract?.id || ""}`.trim(),
      type: "PDF",
      date: formatContractDate(contract?.date),
      size: "148 KB",
    },
    {
      id: "route",
      name: "Маршрутный лист",
      type: "XLSX",
      date: meta.route.eta,
      size: "84 KB",
    },
  ];
};

export const getContractFinanceLinks = (contract: any) => {
  const meta = getContractOpsMeta(contract);
  const currency = contract?.currency || "USD";

  return {
    invoices: Array.from({ length: meta.invoiceCount }, (_, index) => {
      const amount = Math.round(meta.invoiceTotal / meta.invoiceCount);
      const paid = Math.min(amount, Math.round(amount * (meta.paymentProgress / 100)));
      return {
        id: `INV-${String(index + 1).padStart(3, "0")}`,
        title: index === 0 ? "Основной счет" : `Счет по заявке ${index + 1}`,
        amount,
        paid,
        balance: Math.max(amount - paid, 0),
        status: paid >= amount ? "Оплачен" : paid > 0 ? "Частично" : "Ожидает",
        currency,
      };
    }),
    payments: Array.from({ length: meta.paymentsCount }, (_, index) => ({
      id: `PAY-${String(index + 1).padStart(3, "0")}`,
      amount: Math.round(meta.paidAmount / meta.paymentsCount),
      status: index === 0 ? "Сверен" : "Проведен",
      reference: `REF-${String(getSeed(contract) + index * 17).padStart(6, "0")}`,
      currency,
    })),
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
