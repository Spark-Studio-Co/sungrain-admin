import { describe, expect, it } from "vitest";
import {
  WAGON_STATUS_OPTIONS,
  isWagonClientReceivedStatus,
  isWagonShipmentStartedStatus,
  normalizeWagonStatus,
} from "./wagon-status-data";

describe("wagon status model", () => {
  it("exposes exactly five unique statuses in the editor", () => {
    expect(WAGON_STATUS_OPTIONS).toEqual([
      { value: "en_route_to_loading", label: "В пути под погрузку" },
      { value: "at_elevator", label: "На элеваторе" },
      { value: "registered", label: "Оформлен" },
      { value: "en_route_to_recipient", label: "Отгружен" },
      { value: "client_received", label: "Клиент получил" },
    ]);
  });

  it.each([
    ["shipped", "en_route_to_recipient"],
    ["Отгружено", "en_route_to_recipient"],
    ["Отгружен", "en_route_to_recipient"],
    ["completed", "client_received"],
    ["Доставлен", "client_received"],
    ["in_transit", "en_route_to_loading"],
  ])("normalizes legacy value %s to %s", (legacy, canonical) => {
    expect(normalizeWagonStatus(legacy)).toBe(canonical);
  });

  it("uses receipt as the only final status", () => {
    expect(isWagonShipmentStartedStatus("shipped")).toBe(true);
    expect(isWagonShipmentStartedStatus("client_received")).toBe(true);
    expect(isWagonShipmentStartedStatus("registered")).toBe(false);
    expect(isWagonClientReceivedStatus("delivered")).toBe(true);
    expect(isWagonClientReceivedStatus("en_route_to_recipient")).toBe(false);
  });
});
