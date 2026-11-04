import { describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import type { AttentionCenterResponse } from "@/entities/contracts/api/get/get-attention-center.api";
import { mockApiAdapter } from "./mock-api";

describe("mock attention center arrivals", () => {
  it("returns linked received wagons with clients and keeps arrivals separate from problem counts", async () => {
    const response = await mockApiAdapter({
      url: "/contract/attention-center",
      method: "get",
      headers: {},
    } as InternalAxiosRequestConfig);
    const data = response.data as AttentionCenterResponse;
    const arrivals = data.items.find((item) => item.key === "arrived_wagons");
    expect(arrivals.count).toBeGreaterThan(0);
    expect(arrivals.details).toHaveLength(arrivals.count);
    for (const row of arrivals.details) {
      expect(row.arrival.clientName).toBeTruthy();
      expect(row.arrival.destinationStations.length).toBeGreaterThan(0);
      expect(row.arrival.statusUpdatedAt).toBeTruthy();
      expect(row.href).toMatch(/^\/admin\/contracts\/\d+\/applications\/\d+$/);
    }
    const dates = arrivals.details.map((row) => row.arrival.statusUpdatedAt);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(data.summary.total).toBe(data.items
      .filter((item) => item.key !== "arrived_wagons")
      .reduce((total, item) => total + item.count, 0));
  });
  it("uses all contract destinations when the application has no route override", async () => {
    const call = (url: string) => mockApiAdapter({url, method: "get", headers: {}} as InternalAxiosRequestConfig);
    const contract = (await call("/contract/1")).data;
    const savedStations = contract.destination_stations;
    const savedApplicationStations = contract.applications.map((application) => application.destination_stations);
    try {
      contract.destination_stations = ["Демо станция 1", "Демо станция 2"];
      contract.applications.forEach((application) => { application.destination_stations = []; });
      const data = (await call("/contract/attention-center")).data as AttentionCenterResponse;
      const arrivals = data.items.find((item) => item.key === "arrived_wagons");
      const row = arrivals.details.find((detail) => detail.arrival.contractNumber === contract.number);
      expect(row.arrival.destinationStations).toEqual(["Демо станция 1", "Демо станция 2"]);
    } finally {
      contract.destination_stations = savedStations;
      contract.applications.forEach((application, index) => { application.destination_stations = savedApplicationStations[index]; });
    }
  });
});
