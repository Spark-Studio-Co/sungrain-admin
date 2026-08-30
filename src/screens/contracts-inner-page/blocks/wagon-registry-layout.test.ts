import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("wagon edit dialog layout", () => {
  const source = readFileSync(resolve(__dirname, "wagon-registry.tsx"), "utf8");

  it("uses the CRM modal shell with reachable footer and structured sections", () => {
    expect(source).toContain("grid h-[94vh] max-h-[880px]");
    expect(source).toContain("grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(source).toContain("crm-scrollbar min-h-0 overflow-y-auto");
    expect(source).toContain("sm:max-w-[1180px]");
    expect(source).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(500px,540px)]");
    expect(source).toContain("pr-16 sm:pr-20");
    expect(source).toContain("pb-24");
    expect(source).toContain("xl:grid-cols-[minmax(0,1fr)_320px]");
    expect(source).toContain("xl:items-start");
    expect(source).toContain("Операционная карточка вагона");
    expect(source).toContain("Параметры вагона");
    expect(source).toContain("Документы вагона");
    expect(source).toContain("shrink-0 border-t border-[#dfe7de]");
  });

  it("uses the owner directory dropdown in the edit wagon dialog", () => {
    const ownerFieldStart = source.indexOf('htmlFor="edit-owner"');
    const capacityFieldStart = source.indexOf('htmlFor="edit-capacity"');
    const ownerFieldSource = source.slice(ownerFieldStart, capacityFieldStart);

    expect(ownerFieldStart).toBeGreaterThan(-1);
    expect(capacityFieldStart).toBeGreaterThan(ownerFieldStart);
    expect(source).toContain("useGetOwners");
    expect(ownerFieldSource).toContain("<Select");
    expect(ownerFieldSource).toContain('id="edit-owner"');
    expect(ownerFieldSource).toContain("Выберите собственника");
    expect(ownerFieldSource).not.toContain("<Input");
  });

  it("renders wagons through the shared status sorter", () => {
    expect(source).toContain("sortWagonsByStatusGroup");
    expect(source).toContain("const sortedWagons = useMemo");
    expect(source).toContain("sortedWagons.map");
    expect(source).not.toContain("wagons.map((wagon");
  });

  it("uses a guided document upload state instead of an opaque file input", () => {
    expect(source).toContain('accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.txt"');
    expect(source).toContain("будет загружен после сохранения");
    expect(source).toContain("Размер файла не должен превышать 20 МБ.");
    expect(source).toContain("Keep the modal open if this request fails");
  });
});
