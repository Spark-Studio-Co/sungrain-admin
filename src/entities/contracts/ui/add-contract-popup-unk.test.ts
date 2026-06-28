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
});
