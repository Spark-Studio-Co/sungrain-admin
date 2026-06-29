import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("application detail tabs", () => {
  const source = readFileSync(
    resolve(__dirname, "application-details.tsx"),
    "utf8"
  );

  it("opens on documents and removes the separate details tab", () => {
    expect(source).toContain('useState("documents")');
    expect(source).not.toContain('value="details"');
    expect(source).not.toContain("Детали заявки");
  });

  it("keeps application comment in the summary instead of the details tab", () => {
    expect(source).toContain("Комментарий к заявке");
    expect(source).toContain("application?.comment || \"Не указан\"");
  });
});
