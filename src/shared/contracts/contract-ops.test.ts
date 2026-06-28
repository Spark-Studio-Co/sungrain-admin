import { describe, expect, it } from "vitest";
import {
  getWagonGroupStats,
  getApplicationWagonGroupStats,
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

  it("uses backend wagon weight fields for wagon detail group totals", () => {
    const stats = getWagonGroupStats([
      {
        status: "shipped",
        capacity: "1000",
        real_weight: "1000",
      },
      {
        status: "at_elevator",
        capacity: "4000",
        real_weight: "4000",
      },
    ]);

    expect(stats.totalCapacity).toBe(5000);
    expect(stats.totalRealWeight).toBe(1000);
    expect(stats.totalShippedWeight).toBe(1000);
    expect(stats.utilizationPercentage).toBe(20);
  });

  it("reads nested wagon payloads when calculating wagon detail group totals", () => {
    const stats = getWagonGroupStats([
      {
        wagon: {
          status: "shipped",
          capacity: 5000,
          real_weight: 1000,
        },
      },
    ]);

    expect(stats.totalCapacity).toBe(5000);
    expect(stats.totalRealWeight).toBe(1000);
    expect(stats.utilizationPercentage).toBe(20);
  });

  it("uses application volume as wagon group target volume", () => {
    const stats = getApplicationWagonGroupStats(
      { id: 1, name: "Приложение №1", volume: 980 },
      Array.from({ length: 7 }, (_, index) => ({
        id: index + 1,
        status: "shipped",
        capacity: 70,
        real_weight: 70,
      }))
    );

    expect(stats.wagonCount).toBe(7);
    expect(stats.totalRealWeight).toBe(490);
    expect(stats.totalCapacity).toBe(490);
    expect(stats.totalTargetVolume).toBe(980);
    expect(stats.utilizationPercentage).toBe(50);
  });

  it("keeps a safe backend download target for contract documents", () => {
    const file = {
      id: 12,
      name: "contract-signed.pdf",
      location: "/uploads/contracts/contract-signed.pdf",
      mimetype: "application/pdf",
      created_at: "2026-06-20T00:00:00.000Z",
      size: 2048,
    };

    const documents = getContractDocuments(
      { ...baseContract, files: [file] },
      { backendUrl: "https://backend.sungrain.kz/api" }
    );

    expect(documents[0]).toMatchObject({
      id: 12,
      name: "contract-signed.pdf",
      type: "application/pdf",
      size: "2 KB",
      downloadUrl: "https://backend.sungrain.kz/uploads/contracts/contract-signed.pdf",
      file,
    });
  });

  it("resolves bare uploaded filenames against the backend uploads directory", () => {
    const documents = getContractDocuments(
      { ...baseContract, files: ["contract-final.pdf"] },
      { backendUrl: "https://backend.sungrain.kz/api" }
    );

    expect(documents[0]).toMatchObject({
      name: "contract-final.pdf",
      downloadUrl: "https://backend.sungrain.kz/uploads/contract-final.pdf",
      file: "contract-final.pdf",
    });
  });
});
