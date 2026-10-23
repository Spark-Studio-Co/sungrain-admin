import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Elevator, ElevatorService } from "@/entities/calculator/api";
import { ElevatorDetail, ElevatorRateHistory } from "./elevator-detail";

vi.mock("@/shared/api/apiClient", () => ({ apiClient: {} }));

const service: ElevatorService = {
  id: "loading",
  name: "Отгрузка зерна",
  culture: "Пшеница",
  unit: "TONNE",
  archived: false,
  overtimeEligible: true,
  alternativeGroup: "",
  rates: [
    {
      id: "future",
      price: "9000",
      effectiveFrom: "2027-01-01",
      createdAt: "2026-10-01",
    },
    {
      id: "current",
      price: "3000",
      effectiveFrom: "2026-10-21",
      createdAt: "2026-10-01",
    },
    {
      id: "previous",
      price: "2000",
      effectiveFrom: "2026-01-01",
      createdAt: "2026-01-01",
    },
  ],
};
const elevator: Elevator = {
  id: "elevator",
  name: "Тестовый элеватор",
  station: "Шарбакты",
  address: "",
  contact: "",
  notes: "Контакт согласован",
  archived: false,
  version: 1,
  services: [service],
};
function detail(record: Elevator = elevator, busyService?: string) {
  return renderToStaticMarkup(
    createElement(ElevatorDetail, {
      elevator: record,
      date: "2026-10-23",
      actionError: "",
      busyService,
      onEdit: () => {},
      onAddService: () => {},
      onAddRate: () => {},
      onHistory: () => {},
      onArchive: () => {},
    }),
  );
}

describe("elevator detail workspace", () => {
  it("keeps semantic identity, factual metadata and the calculator link", () => {
    const html = detail();
    expect(html).toContain('<h1 id="elevator-name">Тестовый элеватор</h1>');
    expect(html).toContain('href="/admin/calculator/new?elevator=elevator"');
    expect(html).toContain("Шарбакты");
    expect(html).toContain("Не указан");
    expect(html).toContain("Контакт согласован");
    expect(html).toContain('scope="col"');
    expect(html).toContain('aria-label="Услуг: 1"');
  });

  it("displays the effective tariff, crop, overtime and accessible row actions", () => {
    const html = detail();
    expect(html).toContain("3 000");
    expect(html).not.toContain("9 000");
    expect(html).toContain("Пшеница");
    expect(html).toContain("Неурочное время ×1,5");
    for (const action of ["История тарифов", "Новый тариф", "Архивировать"]) {
      expect(html).toContain(`aria-label="${action}: Отгрузка зерна"`);
    }
  });

  it("preserves archived elevator restrictions while allowing edit and history", () => {
    const html = detail({ ...elevator, archived: true });
    expect(html).not.toContain('href="/admin/calculator/new');
    expect(html).toMatch(
      /<button(?=[^>]*disabled="")[^>]*>[^]*?Добавить услугу/,
    );
    expect(html).toMatch(
      /<button(?=[^>]*aria-label="Новый тариф: Отгрузка зерна")(?=[^>]*disabled="")[^>]*>/,
    );
    expect(html).not.toMatch(
      /<button(?=[^>]*aria-label="История тарифов: Отгрузка зерна")(?=[^>]*disabled="")[^>]*>/,
    );
    expect(html).toContain("Редактировать");
  });

  it("shows general services and keeps restore distinct from adding a rate", () => {
    const html = detail({
      ...elevator,
      services: [{ ...service, culture: null, archived: true }],
    });
    expect(html).toContain("Все культуры");
    expect(html).toContain('aria-label="Восстановить: Отгрузка зерна"');
    expect(html).toMatch(
      /<button(?=[^>]*aria-label="Новый тариф: Отгрузка зерна")(?=[^>]*disabled="")[^>]*>/,
    );
    expect(html).not.toContain('aria-label="Архивировать:');
  });

  it("disables duplicate mutations for a busy service", () => {
    const html = detail(elevator, service.id);
    for (const action of ["Новый тариф", "Архивировать"]) {
      expect(html).toMatch(
        new RegExp(
          `<button(?=[^>]*aria-label="${action}: Отгрузка зерна")(?=[^>]*disabled="")[^>]*>`,
        ),
      );
    }
  });

  it("renders empty services and empty rate history without invented prices", () => {
    expect(detail({ ...elevator, services: [] })).toContain(
      "Услуги пока не добавлены",
    );
    const html = renderToStaticMarkup(
      createElement(ElevatorRateHistory, {
        service: { ...service, rates: [] },
        date: "2026-10-23",
      }),
    );
    expect(html).toContain("Тарифы пока не добавлены");
    expect(html).not.toContain("3 000");
  });

  it("keeps every historical rate and distinguishes future, current and previous rates", () => {
    const before = JSON.stringify(service);
    const html = renderToStaticMarkup(
      createElement(ElevatorRateHistory, { service, date: "2026-10-23" }),
    );
    expect(html).toContain("9 000");
    expect(html).toContain("3 000");
    expect(html).toContain("2 000");
    expect(html).toContain("Запланирован");
    expect(html).toContain("Предыдущий");
    expect(html).toContain('class="is-current"');
    expect(JSON.stringify(service)).toBe(before);
  });
});
