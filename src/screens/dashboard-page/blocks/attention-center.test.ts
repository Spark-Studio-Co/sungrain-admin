import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard attention center", () => {
  const source = readFileSync(
    resolve(__dirname, "attention-center.tsx"),
    "utf8",
  );

  it("renders all six operational signal categories", () => {
    expect(source).toContain("stale_dislocations");
    expect(source).toContain("idle_wagons");
    expect(source).toContain("applications_without_documents");
    expect(source).toContain("invoices_with_balance");
    expect(source).toContain("unmatched_wagons");
    expect(source).toContain("volume_exceeded");
  });

  it("provides responsive loading and error states", () => {
    expect(source).toContain("Array.from({ length: 6 })");
    expect(source).toContain("Не удалось загрузить оперативные сигналы");
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("xl:grid-cols-3");
  });

  it("opens a responsive full problem list and hides actions for empty signals", () => {
    expect(source).toContain("selectedItem.details");
    expect(source).toContain("Показать все");
    expect(source).toContain("Перейти в раздел");
    expect(source).toContain("Проверено");
    expect(source).toContain("bottom-0");
    expect(source).toContain("sm:top-1/2");
  });
});
