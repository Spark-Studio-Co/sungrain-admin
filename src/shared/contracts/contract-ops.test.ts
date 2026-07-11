import { describe, expect, it } from "vitest";
import {
  getWagonGroupStats,
  getApplicationWagonGroupStats,
  getApplicationShipmentSummary,
  getContractDocuments,
  getContractFinanceLinks,
  getContractOpsMeta,
  sortApplicationsByNaturalOrder,
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
  it("sorts contract applications by their natural application number", () => {
    const applications = [
      { id: "b", name: "Приложение №2", created_at: "2026-06-20" },
      { id: "c", name: "Приложение №10", created_at: "2026-06-19" },
      { id: "a", name: "Приложение №1", created_at: "2026-06-21" },
    ];

    const sorted = sortApplicationsByNaturalOrder(applications);

    expect(sorted.map((application) => application.name)).toEqual([
      "Приложение №1",
      "Приложение №2",
      "Приложение №10",
    ]);
    expect(applications.map((application) => application.name)).toEqual([
      "Приложение №2",
      "Приложение №10",
      "Приложение №1",
    ]);
  });

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

  it("does not require route fields on the contract itself", () => {
    const meta = getContractOpsMeta({
      id: 8,
      number: "SG-2026-008",
      name: "Контракт без маршрута",
      crop: "Пшеница",
      companyId: 1,
      total_volume: 3000,
      currency: "USD",
    });

    expect(meta.status).toBe("active");
    expect(meta.statusConfig.label).toBe("В работе");
  });

  it("collects distinct application routes for contract operations", () => {
    const meta = getContractOpsMeta({
      ...baseContract,
      applications: [
        {
          id: 1,
          departure_station: "Павлодар-Южный",
          destination_station: "Янгер",
        },
        {
          id: 2,
          departure_station: "Павлодар-Южный",
          destination_station: "Янгер",
        },
        {
          id: 3,
          departure_station: "Астана",
          destination_station: "Алматы",
        },
      ],
    });

    expect(meta.routes).toEqual([
      {
        departure: "Павлодар-Южный",
        destination: "Янгер",
        label: "Павлодар-Южный → Янгер",
        applicationsCount: 2,
      },
      {
        departure: "Астана",
        destination: "Алматы",
        label: "Астана → Алматы",
        applicationsCount: 1,
      },
    ]);
    expect(meta.route.label).toBe("2 маршрута");
    expect(meta.route.departure).toBe("2 отправления");
    expect(meta.route.destination).toBe("2 назначения");
  });

  it("counts only shipped wagons as shipped volume", () => {
    const meta = getContractOpsMeta(baseContract, {
      wagons: [
        { status: "at_elevator", capacity: 1000, real_weight: 980 },
        { status: "in_transit", capacity: 700, real_weight: 690 },
        { status: "shipped", capacity: 1200, real_weight: 1180 },
      ],
    });

    expect(meta.shippedVolume).toBe(1200);
    expect(meta.documentedShippedVolume).toBe(1200);
    expect(meta.actualShippedVolume).toBe(1180);
    expect(meta.progress).toBe(24);
    expect(meta.remainingVolume).toBe(3800);
    expect(meta.wagonsCount).toBe(3);
  });

  it("uses document weight for volume usage while keeping actual weight separate", () => {
    const meta = getContractOpsMeta(baseContract, {
      wagons: [
        { status: "shipped", capacity: 980, real_weight: 977.15 },
        { status: "at_elevator", capacity: 4000, real_weight: 3990 },
      ],
    });

    expect(meta.progress).toBe(20);
    expect(meta.shippedVolume).toBe(980);
    expect(meta.documentedShippedVolume).toBe(980);
    expect(meta.actualShippedVolume).toBe(977.15);
    expect(meta.remainingVolume).toBe(4020);
  });

  it("counts fetched paid application invoices as paid contract finance", () => {
    const invoices = [
      {
        id: 42,
        number: "Инвойс",
        name: "Счет по заявке",
        amount: 212660,
        currency: "USD",
        status: "paid",
      },
    ];

    const meta = getContractOpsMeta(baseContract, { invoices } as any);
    const links = getContractFinanceLinks(baseContract, { invoices } as any);

    expect(meta.invoiceTotal).toBe(212660);
    expect(meta.paidAmount).toBe(212660);
    expect(meta.balance).toBe(0);
    expect(meta.paymentProgress).toBe(100);
    expect(meta.invoiceCount).toBe(1);
    expect(meta.paymentsCount).toBe(0);
    expect(meta.paidInvoiceCount).toBe(1);
    expect(meta.openInvoiceCount).toBe(0);
    expect(links.invoices[0]).toMatchObject({
      id: "Инвойс",
      amount: 212660,
      paid: 212660,
      balance: 0,
      status: "Оплачен",
      currency: "USD",
    });
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
    expect(stats.totalShippedDocumentWeight).toBe(5000);
    expect(stats.totalShippedActualWeight).toBe(1000);
    expect(stats.utilizationPercentage).toBe(100);
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
    expect(stats.totalShippedWeight).toBe(490);
    expect(stats.totalShippedActualWeight).toBe(490);
    expect(stats.totalTargetVolume).toBe(980);
    expect(stats.utilizationPercentage).toBe(50);
  });

  it("marks an application as shipped when all wagons are shipped", () => {
    const summary = getApplicationShipmentSummary({
      wagons: [
        { status: "shipped", real_weight: 70 },
        { status: "shipped", real_weight: 68 },
      ],
    });

    expect(summary).toMatchObject({
      status: "shipped",
      label: "Отгружено",
      total: 2,
      shipped: 2,
      inTransit: 0,
      atElevator: 0,
    });
  });

  it("summarizes mixed application wagon statuses for operations", () => {
    const summary = getApplicationShipmentSummary({
      wagons: [
        { status: "shipped" },
        { status: "in_transit" },
        { status: "at_elevator" },
        { wagon: { status: "in_transit" } },
      ],
    });

    expect(summary).toMatchObject({
      status: "loading",
      label: "Грузится",
      total: 4,
      shipped: 1,
      inTransit: 2,
      atElevator: 1,
    });
  });

  it("summarizes the new wagon workflow statuses", () => {
    const summary = getApplicationShipmentSummary({
      wagons: [
        { status: "en_route_to_loading" },
        { status: "registered" },
        { status: "en_route_to_recipient" },
        { status: "shipped" },
      ],
    });

    expect(summary).toMatchObject({
      status: "loading",
      label: "Следует к получателю",
      total: 4,
      shipped: 1,
      enRouteToLoading: 1,
      registered: 1,
      enRouteToRecipient: 1,
    });
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

  it("keeps only real downloadable deal files and removes duplicate document links", () => {
    const documents = getContractDocuments(
      {
        ...baseContract,
        files: [
          {
            id: "page-link",
            name: "contract-page.html",
            location: "https://admin.sungrain.kz/admin/contracts/c3f1097a",
            mimetype: "text/html",
          },
          {
            id: "primary",
            name: "contract-final.pdf",
            location: "/uploads/contracts/contract-final.pdf",
            mimetype: "application/pdf",
          },
          {
            id: "duplicate",
            name: "duplicate-contract.pdf",
            url: "/uploads/contracts/contract-final.pdf",
            mimetype: "application/pdf",
          },
        ],
      },
      { backendUrl: "https://backend.sungrain.kz/api" }
    );

    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({
      id: "primary",
      name: "contract-final.pdf",
      downloadUrl: "https://backend.sungrain.kz/uploads/contracts/contract-final.pdf",
    });
  });
});
