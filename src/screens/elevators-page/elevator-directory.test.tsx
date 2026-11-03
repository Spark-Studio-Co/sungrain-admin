import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Elevator, ElevatorService } from "@/entities/calculator/api";
import {
  ElevatorDirectory,
  elevatorPhoneLink,
  filterElevators,
} from "./elevator-directory";

const service = { id: "service", archived: false } as ElevatorService;
const items: Elevator[] = [
  {
    id: "one",
    name: "ТОО Бидай",
    station: "Шарбакты",
    contact: "+7 700 000 00 01",
    address: "",
    notes: "",
    archived: false,
    version: 1,
    services: [
      service,
      { ...service, id: "old", archived: true },
      { ...service, id: "deleted", deletedAt: "2026-11-03" },
    ],
  },
  {
    id: "two",
    name: "Арго",
    station: "Павлодар",
    contact: "Отдел логистики",
    address: "",
    notes: "",
    archived: true,
    version: 1,
    services: [],
  },
];
const render = (props: Partial<Parameters<typeof ElevatorDirectory>[0]> = {}) =>
  renderToStaticMarkup(
    createElement(ElevatorDirectory, {
      elevators: items,
      onAdd: () => {},
      onRetry: () => {},
      ...props,
    }),
  );

describe("elevator directory", () => {
  it("combines normalized multiword search with status without mutating data", () => {
    const before = JSON.stringify(items);
    expect(filterElevators(items, "  БИДАЙ   шарбакты ", "all")).toEqual([
      items[0],
    ]);
    expect(filterElevators(items, "Павлодар", "active")).toEqual([]);
    expect(filterElevators(items, "Павлодар", "archived")).toEqual([items[1]]);
    expect(filterElevators(items, "700", "all")).toEqual([items[0]]);
    expect(filterElevators(items, "  ", "all")).toEqual(items);
    expect(JSON.stringify(items)).toBe(before);
  });
  it("only converts a standalone phone number into a safe telephone link", () => {
    expect(elevatorPhoneLink("+7 (700) 000-00-01")).toBe("tel:+77000000001");
    expect(elevatorPhoneLink("87000000001")).toBe("tel:87000000001");
    for (const value of [
      "",
      "123",
      "Отдел 87000000001",
      "javascript:alert(1)",
      "+7 700 000 00 01 / +7 700 000 00 02",
    ])
      expect(elevatorPhoneLink(value)).toBeUndefined();
  });
  it("keeps semantic navigation, status, active service counts and phone links", () => {
    const html = render();
    expect(html).toContain('aria-label="Всего элеваторов: 2"');
    expect(html).toContain('aria-label="Поиск элеватора"');
    expect(html).toContain('aria-label="Статус элеватора"');
    expect(html).toContain('scope="col"');
    expect(html).toContain('href="/admin/elevators/one"');
    expect(html).toContain('href="tel:+77000000001"');
    expect(html).toContain('data-count="1"');
    expect(html).toContain("1</strong><span>услуга</span>");
    expect(html).toContain("В архиве");
    expect(html).toContain('data-label="Контакты"');
    expect(html).toContain(
      '<div class="sr-only" role="status"><span>Загружено элеваторов: 2</span></div>',
    );
  });
  it("does not show false zero totals while loading or when the request fails", () => {
    for (const props of [{ isLoading: true }, { isError: true }]) {
      const html = render({ ...props, elevators: undefined });
      expect(html).not.toContain("Всего элеваторов:");
      expect(html).not.toContain("В справочнике:");
      expect(html).not.toContain('aria-label="Элеваторы"');
    }
    expect(render({ isError: true, elevators: undefined })).toContain(
      "Повторить",
    );
    expect(render({ isError: true, elevators: undefined })).toContain(
      'role="alert"',
    );
  });

  it("summarizes unique stations and excludes archived elevators and deleted services", () => {
    const html = render({
      elevators: [
        items[0],
        { ...items[1], services: Array.from({ length: 5 }, () => service) },
        {
          ...items[0],
          id: "third",
          station: "  ШАРБАКТЫ  ",
          services: [service, service],
        },
      ],
    });
    const summary = html.match(
      /<dl class="elevator-directory-summary">[\s\S]*?<\/dl>/,
    )?.[0];
    expect(summary).toContain("Станции</dt><dd>2</dd>");
    expect(summary).toContain("Активные услуги</dt><dd>3</dd>");
    expect(html).not.toContain("В справочнике:");
  });

  it("labels service counts correctly without disguising empty records as configured tariffs", () => {
    for (const [count, noun] of [
      [1, "услуга"],
      [2, "услуги"],
      [5, "услуг"],
      [11, "услуг"],
      [21, "услуга"],
    ] as const) {
      const html = render({
        elevators: [
          {
            ...items[0],
            services: Array.from({ length: count }, () => service),
          },
        ],
      });
      expect(html).toContain(`${count}</strong><span>${noun}</span>`);
    }
    expect(render({ elevators: [{ ...items[0], services: [] }] })).toContain(
      "Нет услуг",
    );
  });

  it("preserves cached data and search when a background refresh fails", () => {
    const html = render({ isError: true });
    expect(html).toContain("ТОО Бидай");
    expect(html).toContain('aria-label="Элеваторы"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Показаны последние загруженные данные.");
    expect(html).not.toMatch(
      /<input(?=[^>]*aria-label="Поиск элеватора")(?=[^>]* disabled="")/,
    );
    expect(render({ isError: true, elevators: [] })).toContain(
      "Элеваторы пока не добавлены",
    );
  });
  it("keeps the add action and a useful empty state without fake records", () => {
    const html = render({ elevators: [] });
    expect(html).toContain("Элеваторы пока не добавлены");
    expect(html).toContain("Добавить элеватор");
    expect(html).not.toContain("ТОО Бидай");
  });
  it("offers accessible edit/delete commands for active and archived records", () => {
    const props = { onEdit: () => {}, onDelete: () => {} };
    const html = render(props);
    for (const item of items) {
      expect(html).toContain(
        `aria-label="Редактировать элеватор: ${item.name}"`,
      );
      expect(html).toContain(`aria-label="Удалить элеватор: ${item.name}"`);
    }
    expect(render({ ...props, busy: true })).toMatch(
      /<button(?=[^>]*aria-label="Удалить элеватор: ТОО Бидай")(?=[^>]* disabled="")/,
    );
    expect(
      render({ elevators: [{ ...items[0], deletedAt: "2026-11-03" }] }),
    ).not.toContain("ТОО Бидай");
  });
});
