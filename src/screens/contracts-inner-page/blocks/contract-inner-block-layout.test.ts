import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("contract inner block layout", () => {
  const source = readFileSync(
    resolve(__dirname, "contract-inner-block.tsx"),
    "utf8",
  );

  it("shows contract operation tabs in the requested order", () => {
    const tabsStart = source.indexOf("<TabsList");
    const tabsEnd = source.indexOf("</TabsList>", tabsStart);
    const tabsSource = source.slice(tabsStart, tabsEnd);

    expect(tabsSource.indexOf('value="applications"')).toBeGreaterThan(-1);
    expect(tabsSource.indexOf('value="finance"')).toBeGreaterThan(
      tabsSource.indexOf('value="applications"'),
    );
    expect(tabsSource.indexOf('value="details"')).toBeGreaterThan(
      tabsSource.indexOf('value="finance"'),
    );
  });

  it("hides contract operation tabs while an application detail is open", () => {
    expect(source).toContain("isApplicationDetailOpen");
    expect(source).toMatch(/\{!isApplicationDetailOpen && \(\s*<TabsList/);
  });

  it("does not render deal documents inside the contract finance tab", () => {
    const financeStart = source.indexOf('<TabsContent value="finance"');
    const financeEnd = source.indexOf("</TabsContent>", financeStart);
    const financeSource = source.slice(financeStart, financeEnd);

    expect(financeStart).toBeGreaterThan(-1);
    expect(financeEnd).toBeGreaterThan(financeStart);
    expect(financeSource).not.toContain("Документы сделки");
    expect(financeSource).not.toContain("contractDocuments.map");
    expect(financeSource).not.toContain("xl:grid-cols-[minmax(0,1fr)_380px]");
  });

  it("separates documented and actual shipped weight in volume usage", () => {
    expect(source).toContain("documentedShippedVolume");
    expect(source).toContain("actualShippedVolume");
    expect(source).toContain("По документам");
    expect(source).toContain("Фактически");
    expect(source).toMatch(/использовано по\s+документам/);
  });

  it("renders application routes in the deal control block", () => {
    expect(source).toContain("applications: contractApplications");
    expect(source).toContain("contractOps.routes");
    expect(source).toContain("Маршруты по приложениям");
    expect(source).toContain("applicationsCount");
    expect(source).toContain("route.applications.map");
    expect(source).toContain("application.wagonsCount");
  });
});
