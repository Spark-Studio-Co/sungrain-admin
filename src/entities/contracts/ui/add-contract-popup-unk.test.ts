import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AddContractDialog UNK field", () => {
  const source = readFileSync(
    resolve(__dirname, "add-contract-popup.tsx"),
    "utf8"
  );

  it("does not send an empty UNK value as a required contract field", () => {
    expect(source).not.toContain('formData.append("unk", newContract.unk);');
    expect(source).toContain('newContract.unk.trim()');
    expect(source).toContain('formData.append("unk",');
  });

  it("keeps route fields out of contract creation", () => {
    expect(source).not.toContain('value="route"');
    expect(source).not.toContain("Маршрут и участники");
    expect(source).not.toContain('formData.append("sender"');
    expect(source).not.toContain('formData.append("receiver"');
    expect(source).not.toContain('formData.append("departure_station"');
    expect(source).not.toContain('formData.append("destination_station"');
    expect(source).not.toContain("nextErrors.sender");
    expect(source).not.toContain("nextErrors.receiver");
    expect(source).not.toContain("nextErrors.departure_station");
    expect(source).not.toContain("nextErrors.destination_station");
  });
});
