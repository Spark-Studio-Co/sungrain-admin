import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("contract applications list layout", () => {
  const source = readFileSync(
    resolve(__dirname, "contracts-application-block.tsx"),
    "utf8"
  );

  it("shows an operational shipment summary for every application", () => {
    expect(source).toContain("getApplicationShipmentSummary");
    expect(source).toContain("Статус отгрузки");
    expect(source).toContain("renderShipmentSummary");
    expect(source).toContain("Отгружено");
    expect(source).toContain("В пути");
    expect(source).toContain("Элеватор");
  });
});
