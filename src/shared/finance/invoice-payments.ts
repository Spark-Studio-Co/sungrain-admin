export type InvoiceLike = Record<string, any>;

export type InvoicePaymentPatch = {
  paidAmount: number;
  status: "pending" | "partial" | "paid";
};

const parseAmount = (value: unknown) => {
  if (value === null || value === undefined || value === "") return 0;

  const normalized =
    typeof value === "string"
      ? value.replace(/\s/g, "").replace(",", ".")
      : value;
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : 0;
};

const getArray = (value: unknown) => (Array.isArray(value) ? value : []);

const clampAmount = (value: number, max: number) =>
  Math.min(Math.max(value, 0), Math.max(max, 0));

export const getInvoiceAmount = (invoice: InvoiceLike) =>
  parseAmount(
    invoice?.amount ?? invoice?.total_amount ?? invoice?.totalAmount ?? invoice?.sum
  );

export const getInvoiceExplicitPaidAmount = (invoice: InvoiceLike) =>
  parseAmount(
    invoice?.paidAmount ??
      invoice?.paid_amount ??
      invoice?.paid ??
      invoice?.paid_total ??
      invoice?.paidTotal
  );

export const getInvoicePaymentsAmount = (invoice: InvoiceLike) =>
  getArray(invoice?.payments).reduce((sum, payment: any) => {
    return (
      sum +
      parseAmount(
        payment?.amount ??
          payment?.paidAmount ??
          payment?.paid_amount ??
          payment?.sum
      )
    );
  }, 0);

export const getInvoicePaidAmount = (invoice: InvoiceLike) => {
  const amount = getInvoiceAmount(invoice);
  const status = String(invoice?.status || "").toLowerCase();

  if (status === "paid" && amount > 0) {
    return amount;
  }

  return clampAmount(
    getInvoiceExplicitPaidAmount(invoice) + getInvoicePaymentsAmount(invoice),
    amount
  );
};

export const getInvoiceBalance = (invoice: InvoiceLike) =>
  Math.max(getInvoiceAmount(invoice) - getInvoicePaidAmount(invoice), 0);

export const getInvoiceComputedStatus = (
  invoice: InvoiceLike
): InvoicePaymentPatch["status"] => {
  const amount = getInvoiceAmount(invoice);
  const paidAmount = getInvoicePaidAmount(invoice);

  if (amount > 0 && paidAmount >= amount) return "paid";
  if (paidAmount > 0) return "partial";
  return "pending";
};

export const buildInvoicePaymentPatch = (
  invoice: InvoiceLike,
  paymentAmount: unknown
): InvoicePaymentPatch => {
  const amount = getInvoiceAmount(invoice);
  const currentPaidAmount = getInvoicePaidAmount(invoice);
  const nextPaidAmount = clampAmount(
    currentPaidAmount + Math.max(parseAmount(paymentAmount), 0),
    amount
  );

  return {
    paidAmount: nextPaidAmount,
    status: getInvoiceComputedStatus({
      ...invoice,
      paidAmount: nextPaidAmount,
      status: "pending",
    }),
  };
};
