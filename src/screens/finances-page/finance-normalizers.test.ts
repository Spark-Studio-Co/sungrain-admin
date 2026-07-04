import { describe, expect, it } from "vitest";
import {
  buildFinanceCurrencySummaries,
  mapBackendInvoiceToFinanceInvoice,
  normalizeInvoiceStatus,
  type FinanceInvoice,
} from "./finance-normalizers";

describe("finance normalizers", () => {
  it("normalizes backend invoice context for the finance table", () => {
    const invoice = {
      id: 77,
      name: "Счет на оплату",
      number: "INV-077",
      amount: 16320,
      date: "2026-06-20",
      status: "paid",
      file_url: "https://backend.sungrain.kz/files/invoice.pdf",
    };
    const application = {
      id: 12,
      name: "Отгрузка июнь",
      total_amount: 16320,
      currency: "USD",
    };
    const contract = {
      id: 4,
      number: "SG-2026-004",
      name: "Пшеница 4 класс, южное направление",
      receiver: "Sungrain Terminal",
      crop: "Пшеница 4 класс",
      currency: "USD",
    };

    const result = mapBackendInvoiceToFinanceInvoice({
      invoice,
      application,
      contract,
    });

    expect(result).toMatchObject({
      id: "INV-077",
      backendId: "77",
      applicationId: "12",
      contractNumericId: "4",
      contractId: "SG-2026-004",
      contractTitle: "Пшеница 4 класс, южное направление",
      counterparty: "Sungrain Terminal",
      date: "20.06.2026",
      amount: 16320,
      paidAmount: 16320,
      currency: "USD",
      status: "paid",
    });
    expect(result.documents[0]).toMatchObject({
      title: "Счет на оплату",
      url: "https://backend.sungrain.kz/files/invoice.pdf",
    });
  });

  it("falls back unknown invoice statuses to pending", () => {
    expect(normalizeInvoiceStatus("sent_to_client")).toBe("pending");
  });

  it("normalizes partial backend invoice payments from snake_case fields", () => {
    const result = mapBackendInvoiceToFinanceInvoice({
      invoice: {
        id: 91,
        name: "Инвойс",
        amount: 393_289_000,
        paid_amount: 200_000_000,
        status: "pending",
      },
      application: {
        id: 44,
        total_amount: 393_289_000,
        currency: "KZT",
      },
    });

    expect(result).toMatchObject({
      amount: 393_289_000,
      paidAmount: 200_000_000,
      currency: "KZT",
      status: "partial",
      paymentTerms: "Частичная оплата",
    });
  });

  it("counts paid USD invoices as paid even when there are no payment rows", () => {
    const invoices: FinanceInvoice[] = [
      {
        id: "INV-001",
        contract: "SG-1",
        contractId: "SG-1",
        contractTitle: "Контракт",
        counterparty: "Клиент",
        date: "28.06.2026",
        dueDate: "Не указан",
        amount: 212660,
        paidAmount: 0,
        currency: "USD",
        status: "paid",
        paymentTerms: "Счет закрыт",
        documents: [],
        history: [],
      },
    ];

    expect(buildFinanceCurrencySummaries(invoices)).toEqual([
      {
        currency: "USD",
        total: 212660,
        paid: 212660,
        pending: 0,
        overdue: 0,
        balance: 0,
        invoiceCount: 1,
        paidCount: 1,
        pendingCount: 0,
        partialCount: 0,
        overdueCount: 0,
        openCount: 0,
      },
    ]);
  });

  it("keeps finance totals separated by currency", () => {
    const invoices: FinanceInvoice[] = [
      {
        id: "INV-USD",
        contract: "SG-1",
        contractId: "SG-1",
        contractTitle: "Контракт",
        counterparty: "Клиент",
        date: "28.06.2026",
        dueDate: "Не указан",
        amount: 100,
        paidAmount: 25,
        currency: "USD",
        status: "partial",
        paymentTerms: "Частичная оплата",
        documents: [],
        history: [],
      },
      {
        id: "INV-KZT",
        contract: "SG-2",
        contractId: "SG-2",
        contractTitle: "Контракт",
        counterparty: "Клиент",
        date: "28.06.2026",
        dueDate: "Не указан",
        amount: 1000,
        paidAmount: 0,
        currency: "KZT",
        status: "pending",
        paymentTerms: "Ожидает оплаты",
        documents: [],
        history: [],
      },
    ];

    const result = buildFinanceCurrencySummaries(invoices);

    expect(result).toHaveLength(2);
    expect(result.find((summary) => summary.currency === "USD")).toMatchObject({
      total: 100,
      paid: 25,
      balance: 75,
      openCount: 1,
    });
    expect(result.find((summary) => summary.currency === "KZT")).toMatchObject({
      total: 1000,
      paid: 0,
      balance: 1000,
      openCount: 1,
    });
  });
});
