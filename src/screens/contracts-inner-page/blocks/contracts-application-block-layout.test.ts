import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("contract applications list layout", () => {
  const source = readFileSync(
    resolve(__dirname, "contracts-application-block.tsx"),
    "utf8",
  );

  it("shows an operational shipment summary for every application", () => {
    expect(source).toContain("getApplicationShipmentSummary");
    expect(source).toContain("Статус отгрузки");
    expect(source).toContain("renderShipmentSummary");
    expect(source).toContain("Отгружен");
    expect(source).toContain("Под погрузку");
    expect(source).toContain("Элеватор");
  });

  it("shows the route next to each application on desktop and mobile", () => {
    expect(source).toContain("getApplicationRoute");
    expect(source).toContain("Маршрут заявки");
    expect(source).toContain("route.label.toLowerCase()");
  });
});
