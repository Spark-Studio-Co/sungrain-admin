import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CrmRouteLoading } from "./crm-route-loading";

vi.mock("./skeleton", () => ({
  Skeleton: ({ className }: { className: string }) =>
    createElement("div", { className, "data-slot": "skeleton" }),
}));

describe("route loading state", () => {
  it("renders a non-empty, accessible loading state without browser APIs", () => {
    const html = renderToStaticMarkup(createElement(CrmRouteLoading));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="Загрузка страницы"');
    expect(html).toContain('data-slot="skeleton"');
    expect(html).toContain("min-w-0");
    expect(html).toContain("min-h-96");
  });
});
