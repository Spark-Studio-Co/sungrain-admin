import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("contract inner block layout", () => {
  const source = readFileSync(resolve(__dirname, "contract-inner-block.tsx"), "utf8");

  it("shows contract operation tabs in the requested order", () => {
    const tabsStart = source.indexOf("<TabsList");
    const tabsEnd = source.indexOf("</TabsList>", tabsStart);
    const tabsSource = source.slice(tabsStart, tabsEnd);

    expect(tabsSource.indexOf('value="applications"')).toBeGreaterThan(-1);
    expect(tabsSource.indexOf('value="finance"')).toBeGreaterThan(
      tabsSource.indexOf('value="applications"')
    );
    expect(tabsSource.indexOf('value="details"')).toBeGreaterThan(
      tabsSource.indexOf('value="finance"')
    );
  });

  it("downloads deal documents from normalized file URLs only", () => {
    expect(source).toMatch(/handleFileDownload\(\s*document\.downloadUrl/);
    expect(source).not.toContain("document.file || document.downloadUrl");
  });

  it("separates documented and actual shipped weight in volume usage", () => {
    expect(source).toContain("documentedShippedVolume");
    expect(source).toContain("actualShippedVolume");
    expect(source).toContain("По документам");
    expect(source).toContain("Фактически");
    expect(source).toContain("использовано по документам");
  });
});
