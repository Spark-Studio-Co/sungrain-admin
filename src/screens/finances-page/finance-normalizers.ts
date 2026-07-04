import { format } from "date-fns";
import {
  getInvoiceComputedStatus,
  getInvoicePaidAmount as getBackendInvoicePaidAmount,
} from "../../shared/finance/invoice-payments";

export type InvoiceStatus = "paid" | "pending" | "partial" | "overdue";

export type FinanceDocument = {
  id: string;
  title: string;
  kind: string;
  fileName: string;
  size: string;
  updatedAt: string;
  url?: string;
};

export type FinanceHistoryItem = {
  date: string;
  title: string;
  description: string;
  tone?: "green" | "orange" | "red" | "slate";
};

export type FinanceInvoice = {
  id: string;
  backendId?: string;
  applicationId?: string;
  contractNumericId?: string;
  contract: string;
  contractId: string;
  contractTitle: string;
  counterparty: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  currency: string;
  status: InvoiceStatus;
  paymentTerms: string;
  overdueDays?: number;
  documents: FinanceDocument[];
  history: FinanceHistoryItem[];
  details?: Record<string, string>;
};

export type FinanceCurrencySummary = {
  currency: string;
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  balance: number;
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
  overdueCount: number;
  openCount: number;
};

type BackendInvoiceContext = {
  invoice: Record<string, any>;
  application?: Record<string, any>;
  contract?: Record<string, any>;
};

export const toEntityArray = <T = any>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

export const normalizeInvoiceStatus = (status: unknown): InvoiceStatus => {
  if (status === "paid" || status === "partial" || status === "overdue") {
    return status;
  }

  return "pending";
};

export const formatBackendDate = (value: unknown) => {
  if (!value) return "Не указан";

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return format(date, "dd.MM.yyyy");
};

const normalizeFinanceCurrency = (currency: unknown) => {
  const normalized = pickString(currency, "USD").toUpperCase();
  return normalized === "₸" ? "KZT" : normalized;
};

export const getFinanceInvoicePaidAmount = (invoice: FinanceInvoice) => {
  if (invoice.status === "paid") {
    return invoice.amount;
  }

  return Math.min(invoice.amount, Math.max(invoice.paidAmount || 0, 0));
};

export const getFinanceInvoiceBalance = (invoice: FinanceInvoice) =>
  Math.max(invoice.amount - getFinanceInvoicePaidAmount(invoice), 0);

export const buildFinanceCurrencySummaries = (
  invoices: FinanceInvoice[]
): FinanceCurrencySummary[] => {
  const summaries = new Map<string, FinanceCurrencySummary>();

  invoices.forEach((invoice) => {
    const currency = normalizeFinanceCurrency(invoice.currency);
    const current =
      summaries.get(currency) ||
      ({
        currency,
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        balance: 0,
        invoiceCount: 0,
        paidCount: 0,
        pendingCount: 0,
        partialCount: 0,
        overdueCount: 0,
        openCount: 0,
      } satisfies FinanceCurrencySummary);

    const paid = getFinanceInvoicePaidAmount(invoice);
    const balance = getFinanceInvoiceBalance(invoice);

    current.total += invoice.amount;
    current.paid += paid;
    current.balance += balance;
    current.invoiceCount += 1;

    if (invoice.status === "paid") {
      current.paidCount += 1;
    } else {
      current.openCount += 1;
    }

    if (invoice.status === "pending") {
      current.pending += balance;
      current.pendingCount += 1;
    }

    if (invoice.status === "partial") {
      current.pending += balance;
      current.partialCount += 1;
    }

    if (invoice.status === "overdue") {
      current.overdue += balance;
      current.overdueCount += 1;
    }

    summaries.set(currency, current);
  });

  return Array.from(summaries.values());
};

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
};

const pickNumber = (...values: unknown[]) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return 0;
};

const getFileName = (url: string, fallback: string) => {
  if (!url) return fallback;
  const cleanUrl = url.split("?")[0];
  const name = cleanUrl.split("/").pop();
  return name || fallback;
};

export const mapBackendInvoiceToFinanceInvoice = ({
  invoice,
  application,
  contract,
}: BackendInvoiceContext): FinanceInvoice => {
  const backendId = pickString(invoice.id, invoice._id);
  const applicationId = pickString(
    invoice.applicationId,
    invoice.application_id,
    application?.id
  );
  const contractNumericId = pickString(contract?.id, application?.contractId);
  const displayId =
    pickString(invoice.number, invoice.name) || (backendId ? `INV-${backendId}` : "INV");
  const status = normalizeInvoiceStatus(invoice.status);
  const date = formatBackendDate(invoice.date || invoice.createdAt);
  const amount = pickNumber(
    invoice.amount,
    invoice.total_amount,
    application?.total_amount
  );
  const paidAmount = getBackendInvoicePaidAmount({ ...invoice, amount });
  const computedStatus = getInvoiceComputedStatus({
    ...invoice,
    amount,
    paidAmount,
  });
  const currency = pickString(
    invoice.currency,
    application?.currency,
    contract?.currency,
    "KZT"
  );
  const contractId = pickString(
    contract?.number,
    contract?.contract_number,
    application?.contract_number,
    contractNumericId && `Контракт ${contractNumericId}`,
    "Без контракта"
  );
  const contractTitle = pickString(
    contract?.name,
    application?.name,
    contract?.title,
    invoice.description,
    "Счет по заявке"
  );
  const counterparty = pickString(
    contract?.receiver,
    contract?.receiver_name,
    application?.receiver,
    application?.counterparty,
    "Контрагент не указан"
  );
  const fileUrl = pickString(invoice.file_url, invoice.fileUrl, invoice.url);
  const documents: FinanceDocument[] = fileUrl
    ? [
        {
          id: `DOC-${backendId || displayId}`,
          title: pickString(invoice.name, invoice.number, "Счет на оплату"),
          kind: "PDF",
          fileName: getFileName(fileUrl, `${displayId}.pdf`),
          updatedAt: formatBackendDate(invoice.updatedAt || invoice.createdAt || invoice.date),
          size: "PDF",
          url: fileUrl,
        },
      ]
    : [];

  return {
    id: displayId,
    backendId,
    applicationId,
    contractNumericId,
    contract: contractId,
    contractId,
    contractTitle,
    counterparty,
    date,
    dueDate: formatBackendDate(invoice.dueDate || invoice.due_date),
    amount,
    paidAmount,
    currency,
    status: computedStatus === "pending" ? status : computedStatus,
    paymentTerms:
      computedStatus === "paid"
        ? "Счет закрыт по данным backend"
        : computedStatus === "partial"
          ? "Частичная оплата"
          : "Ожидает оплаты",
    documents,
    history: [
      {
        date,
        title: "Счет загружен из backend",
        description: `${displayId} привязан к заявке ${applicationId || "без номера"}.`,
        tone:
          computedStatus === "paid"
            ? "green"
            : computedStatus === "partial"
              ? "orange"
              : "slate",
      },
    ],
    details: {
      invoice_number: displayId,
      invoice_date: pickString(invoice.date),
      contract_number: contractId,
      product_name: pickString(contract?.crop, application?.crop, contractTitle),
      payment_amount_usd: String(amount || ""),
      total_amount_usd: String(amount || ""),
      currency,
      sender_company_name: counterparty,
      description: pickString(invoice.description),
    },
  };
};
