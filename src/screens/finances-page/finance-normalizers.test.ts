import { describe, expect, it } from "vitest";
import {
  mapBackendInvoiceToFinanceInvoice,
  normalizeInvoiceStatus,
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
});
