import { describe, expect, it } from "vitest";
import {
  calculatePurchase,
  formatMoney,
  validatePurchase,
} from "./purchase-calculation";
import type { PurchaseValues } from "../api/purchases.api";
const values: PurchaseValues = {
  farmId: 1,
  cultureName: "Пшеница",
  quantity: "100",
  unitPrice: "100000",
  currency: "KZT",
  vatMode: "EXCLUSIVE",
  vatRate: "16",
  agreementNumber: "TEST",
  agreementDate: "2026-10-18",
  notes: "",
};
describe("purchase calculation", () => {
  it.each([
    ["NONE", "10000000.00", "0.00", "10000000.00"],
    ["EXCLUSIVE", "10000000.00", "1600000.00", "11600000.00"],
    ["INCLUSIVE", "8620689.66", "1379310.34", "10000000.00"],
  ] as const)("%s matches server rounding", (mode, net, vat, total) => {
    expect(calculatePurchase("100", "100000", mode, "16")).toEqual({
      netAmount: net,
      vatAmount: vat,
      totalAmount: total,
    });
  });
  it("supports decimal commas and fractional tonnes", () => {
    expect(
      calculatePurchase("0,125", "123,45", "EXCLUSIVE", "16").totalAmount,
    ).toBe("17.90");
    expect(calculatePurchase("1.005", "1", "NONE", "16").totalAmount).toBe(
      "1.01",
    );
  });
  it("keeps cents when displaying totals above Number safe precision", () => {
    expect(
      formatMoney("99999999999999999.99", "KZT").replace(/\s/g, ""),
    ).toMatch(/^99999999999999999,99(?:₸|KZT)$/);
  });
  it("validates required fields, real dates and precision", () => {
    expect(validatePurchase(values)).toEqual({});
    expect(
      validatePurchase({
        ...values,
        farmId: undefined,
        quantity: "1.0001",
        unitPrice: "-1",
        agreementDate: "2026-02-30",
      }),
    ).toHaveProperty("quantity");
    expect(
      validatePurchase({ ...values, agreementDate: "2026-02-30" }),
    ).toHaveProperty("agreementDate");
    expect(validatePurchase({ ...values, farmId: undefined }, true)).toEqual(
      {},
    );
    expect(
      validatePurchase({ ...values, quantity: "0.001", unitPrice: "0.01" }),
    ).toHaveProperty("unitPrice");
  });
  it("ignores a hidden invalid VAT rate after switching to NONE", () => {
    expect(
      validatePurchase({ ...values, vatMode: "NONE", vatRate: "" }),
    ).toEqual({});
    expect(calculatePurchase("100", "100000", "NONE", "").totalAmount).toBe(
      "10000000.00",
    );
  });
});
