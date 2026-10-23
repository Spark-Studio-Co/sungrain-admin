import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Warehouse } from "lucide-react";
import { describe, expect, it } from "vitest";
import { WorkspaceHeading } from "./workspace-heading";

describe("record workspace heading", () => {
  it("keeps a semantic title, CRM eyebrow, metadata and primary action", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceHeading, {
        icon: Warehouse,
        eyebrow: "Фермерская база",
        title: "Хозяйства",
        description: createElement("span", null, "Данные хозяйства"),
        actions: createElement("a", { href: "/admin/procurement/farmers/new" }, "Добавить хозяйство"),
      }),
    );
    expect(html).toContain("<h1>Хозяйства</h1>");
    expect(html).toContain("Фермерская база");
    expect(html).toContain("Данные хозяйства");
    expect(html).toContain('href="/admin/procurement/farmers/new"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("does not render empty metadata or action areas", () => {
    const html = renderToStaticMarkup(
      createElement(WorkspaceHeading, {
        icon: Warehouse,
        eyebrow: "Логистика и хранение",
        title: "Элеваторы",
      }),
    );
    expect(html).not.toContain('class="record-heading-description"');
    expect(html).not.toContain('class="record-heading-actions"');
  });
});
