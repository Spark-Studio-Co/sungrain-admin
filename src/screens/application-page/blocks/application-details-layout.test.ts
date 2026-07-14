import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("application detail tabs", () => {
  const source = readFileSync(
    resolve(__dirname, "application-details.tsx"),
    "utf8",
  );

  it("opens on documents and removes the separate details tab", () => {
    expect(source).toContain('useState("documents")');
    expect(source).not.toContain('value="details"');
    expect(source).not.toContain("Детали заявки");
  });

  it("keeps application comment in the summary instead of the details tab", () => {
    expect(source).toContain("Комментарий к заявке");
    expect(source).toContain('application?.comment || "Не указан"');
  });

  it("shows the application-specific route and its wagon count", () => {
    expect(source).toContain("getApplicationRoute(application)");
    expect(source).toContain("Маршрут заявки");
    expect(source).toContain("applicationRoute.departure");
    expect(source).toContain("applicationRoute.destination");
    expect(source).toContain("applicationScopedWagons.length");
  });

  it("passes only current application wagons into wagon tabs", () => {
    expect(source).toContain("getApplicationScopedWagons(application)");
    expect(source).toContain("wagons={applicationScopedWagons}");
    expect(source).not.toContain("wagons={application?.wagons");
  });

  it("passes current application context to wagon details instead of showing raw database ids", () => {
    expect(source).toContain("currentApplicationWagonContext");
    expect(source).toContain("contractData={currentApplicationWagonContext}");
  });

  it("keeps all four mobile tabs in an even two-column grid", () => {
    expect(source).toContain("grid-cols-2");
    expect(source).toContain("sm:grid-cols-4");
    expect(source).not.toContain("col-span-2 sm:col-span-1");
  });
});
