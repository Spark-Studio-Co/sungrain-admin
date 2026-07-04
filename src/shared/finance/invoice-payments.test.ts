import { describe, expect, it } from "vitest";
import {
  buildInvoicePaymentPatch,
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
});
