import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("createInvoice api", () => {
  const source = readFileSync(resolve(__dirname, "create-invoice.api.ts"), "utf8");

  it("uses the backend add-invoice route", () => {
    expect(source).toContain("`/application/add-invoice/${applicationId}/invoice`");
    expect(source).not.toContain("`/application/${applicationId}/invoice`");
  });
});
