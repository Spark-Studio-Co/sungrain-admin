import { describe, expect, it } from "vitest";
import {
  getContractDocuments,
  getContractFinanceLinks,
  getContractOpsMeta,
} from "./contract-ops";

const baseContract = {
  id: 7,
  number: "SG-2026-007",
  sender: "ТОО SUN GRAIN",
  receiver: "ИП CRISTALL ALMAZ GROUP",
  departure_station: "Павлодар-Южный",
  destination_station: "Янгер",
  total_volume: 5000,
  currency: "USD",
};

describe("contract operational metadata", () => {
  it("does not invent shipment progress for a new contract without wagons", () => {
    const meta = getContractOpsMeta(baseContract);

    expect(meta.shippedVolume).toBe(0);
    expect(meta.remainingVolume).toBe(5000);
    expect(meta.progress).toBe(0);
    expect(meta.applicationsCount).toBe(0);
    expect(meta.wagonsCount).toBe(0);
    expect(meta.documentsCount).toBe(0);
    expect(meta.invoiceCount).toBe(0);
    expect(meta.paymentsCount).toBe(0);
    expect(meta.paymentProgress).toBe(0);
    expect(meta.route.eta).toBe("отгрузок нет");
    expect(getContractDocuments(baseContract)).toEqual([]);
    expect(getContractFinanceLinks(baseContract)).toEqual({
      invoices: [],
      payments: [],
    });
  });

  it("counts only shipped wagons as shipped volume", () => {
    const meta = getContractOpsMeta(baseContract, {
      wagons: [
        { status: "at_elevator", capacity: 1000, real_weight: 980 },
        { status: "in_transit", capacity: 700, real_weight: 690 },
        { status: "shipped", capacity: 1200, real_weight: 1180 },
      ],
    });

    expect(meta.shippedVolume).toBe(1180);
    expect(meta.progress).toBe(24);
    expect(meta.remainingVolume).toBe(3820);
    expect(meta.wagonsCount).toBe(3);
  });
});
