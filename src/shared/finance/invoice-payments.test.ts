import { describe, expect, it } from "vitest";
import {
  buildInvoicePaymentUpdatePayload,
  buildInvoicePaymentPatch,
  getApplicationPaymentSummary,
  getInvoiceBalance,
  getInvoiceComputedStatus,
  getInvoicePaidAmount,
} from "./invoice-payments";

describe("invoice payment helpers", () => {
  it("adds a partial payment and leaves the remaining debt", () => {
    const invoice = {
      amount: 393_289_000,
      paidAmount: 0,
      status: "pending",
    };

    const patch = buildInvoicePaymentPatch(invoice, 200_000_000);

    expect(patch).toEqual({
      paidAmount: 200_000_000,
      status: "partial",
    });
    expect(getInvoiceBalance({ ...invoice, ...patch })).toBe(193_289_000);
  });

  it("never lets paid amount exceed the invoice amount", () => {
    const patch = buildInvoicePaymentPatch(
      {
        amount: 100,
        paidAmount: 70,
        status: "partial",
      },
      90
    );

    expect(patch).toEqual({ paidAmount: 100, status: "paid" });
  });

  it("reads backend snake_case paid fields", () => {
    const invoice = {
      amount: 500,
      paid_amount: 125,
      status: "partial",
    };

    expect(getInvoicePaidAmount(invoice)).toBe(125);
    expect(getInvoiceBalance(invoice)).toBe(375);
    expect(getInvoiceComputedStatus(invoice)).toBe("partial");
  });

  it("treats paid invoices as fully paid even without a paidAmount field", () => {
    expect(getInvoicePaidAmount({ amount: 300, status: "paid" })).toBe(300);
  });

  it("builds the full backend update payload for saving a payment", () => {
    const payload = buildInvoicePaymentUpdatePayload(
      {
        name: "Инвойс",
        amount: 393_289_000,
        paidAmount: 0,
        status: "pending",
        date: "15.03.2024",
        description: "Счет по заявке",
      },
      200_000_000,
      "2026-07-04"
    );

    expect(payload).toEqual({
      name: "Инвойс",
      amount: 393_289_000,
      paidAmount: 200_000_000,
      status: "partial",
      date: "2024-03-15",
      description: "Счет по заявке",
    });
  });

  it("recalculates application payment progress from the updated application total", () => {
    const summary = getApplicationPaymentSummary(37_477_120, [
      {
        amount: 31_680_000,
        paidAmount: 31_680_000,
        status: "paid",
      },
    ]);

    expect(summary).toEqual({
      paymentBaseAmount: 37_477_120,
      paidAmount: 31_680_000,
      remainingPaymentAmount: 5_797_120,
      paymentProgress: (31_680_000 / 37_477_120) * 100,
    });
  });

  it("falls back to invoice totals when an application has no total", () => {
    const summary = getApplicationPaymentSummary(0, [
      { amount: 500, paidAmount: 125, status: "partial" },
    ]);

    expect(summary).toEqual({
      paymentBaseAmount: 500,
      paidAmount: 125,
      remainingPaymentAmount: 375,
      paymentProgress: 25,
    });
  });

  it("keeps the paid amount visible when the application total is reduced", () => {
    const summary = getApplicationPaymentSummary(400, [
      { amount: 500, paidAmount: 500, status: "paid" },
    ]);

    expect(summary).toEqual({
      paymentBaseAmount: 400,
      paidAmount: 500,
      remainingPaymentAmount: 0,
      paymentProgress: 100,
    });
  });
});
