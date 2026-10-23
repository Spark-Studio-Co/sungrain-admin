import { describe, expect, it } from "vitest";
import { EMPTY_FARM_DRAFT, parseFarmDraft } from "./farm-form";

describe("manual farm values", () => {
  it("requires a non-blank organization name", () => {
    expect(
      parseFarmDraft({ ...EMPTY_FARM_DRAFT, organizationName: "   " }),
    ).toEqual({
      ok: false,
      errors: { organizationName: "Укажите название хозяйства" },
    });
  });

  it("allows only the name, without inventing contact or area values", () => {
    const result = parseFarmDraft({
      ...EMPTY_FARM_DRAFT,
      organizationName: '  КХ "Демо"  ',
    });
    expect(result).toEqual({
      ok: true,
      values: {
        ...EMPTY_FARM_DRAFT,
        organizationName: 'КХ "Демо"',
        totalAreaHa: null,
      },
    });
  });

  it("trims fields and accepts a decimal comma for area", () => {
    const result = parseFarmDraft({
      organizationName: " Демо ",
      leaderName: " Руководитель ",
      phone: " +7 700 000 00 00 ",
      regionName: " Область ",
      district: " Район ",
      ruralDistrict: " Округ ",
      totalAreaHa: " 12,5 ",
    });
    expect(result).toEqual({
      ok: true,
      values: {
        organizationName: "Демо",
        leaderName: "Руководитель",
        phone: "+7 700 000 00 00",
        regionName: "Область",
        district: "Район",
        ruralDistrict: "Округ",
        totalAreaHa: 12.5,
      },
    });
  });

  it.each(["-1", "не число", "Infinity", "1e309", "100000001"])(
    "rejects invalid area %s",
    (totalAreaHa) => {
      const result = parseFarmDraft({
        ...EMPTY_FARM_DRAFT,
        organizationName: "Демо",
        totalAreaHa,
      });
      expect(result.ok).toBe(false);
      if (result.ok === false) expect(result.errors.totalAreaHa).toBeTruthy();
    },
  );

  it("keeps an explicit zero area", () => {
    const result = parseFarmDraft({
      ...EMPTY_FARM_DRAFT,
      organizationName: "Демо",
      totalAreaHa: "0",
    });
    expect(result.ok && result.values.totalAreaHa).toBe(0);
  });

  it("accepts the API maximum area", () => {
    const result = parseFarmDraft({
      ...EMPTY_FARM_DRAFT,
      organizationName: "Демо",
      totalAreaHa: "100000000",
    });
    expect(result.ok && result.values.totalAreaHa).toBe(100000000);
  });

  it.each([
    ["organizationName", 200],
    ["leaderName", 200],
    ["phone", 80],
    ["regionName", 160],
    ["district", 160],
    ["ruralDistrict", 160],
  ] as const)("matches the API length limit for %s", (key, limit) => {
    const result = parseFarmDraft({
      ...EMPTY_FARM_DRAFT,
      organizationName: "Демо",
      [key]: "x".repeat(limit + 1),
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.errors[key]).toBeTruthy();
  });
});
