import type { ProcurementFarmValues } from "../api/procurement.api";

export type FarmDraft = Omit<ProcurementFarmValues, "version" | "totalAreaHa"> & {
  totalAreaHa: string;
};

export type FarmFormErrors = Partial<Record<keyof FarmDraft, string>>;

export const EMPTY_FARM_DRAFT: FarmDraft = {
  organizationName: "",
  leaderName: "",
  phone: "",
  regionName: "",
  district: "",
  ruralDistrict: "",
  totalAreaHa: "",
};

export const FARM_FIELDS: Array<{
  key: keyof FarmDraft;
  label: string;
  required?: boolean;
  maxLength: number;
}> = [
  {
    key: "organizationName",
    label: "Название хозяйства",
    required: true,
    maxLength: 200,
  },
  { key: "leaderName", label: "Руководитель", maxLength: 200 },
  { key: "phone", label: "Телефон", maxLength: 80 },
  { key: "regionName", label: "Область", maxLength: 160 },
  { key: "district", label: "Район", maxLength: 160 },
  { key: "ruralDistrict", label: "Сельский округ", maxLength: 160 },
  { key: "totalAreaHa", label: "Общая площадь, га", maxLength: 200 },
];

export function parseFarmDraft(
  draft: FarmDraft,
):
  | { ok: true; values: ProcurementFarmValues }
  | { ok: false; errors: FarmFormErrors } {
  const errors: FarmFormErrors = {};
  for (const field of FARM_FIELDS) {
    const value = draft[field.key].trim();
    if (field.required && !value) {
      errors[field.key] = "Укажите название хозяйства";
    } else if (value.length > field.maxLength) {
      errors[field.key] = `Не более ${field.maxLength} символов`;
    }
  }
  const area = draft.totalAreaHa.trim().replace(",", ".");
  if (
    area &&
    (!Number.isFinite(Number(area)) || Number(area) < 0 || Number(area) > 100000000)
  ) {
    errors.totalAreaHa = "Укажите площадь от 0 до 100 000 000 га";
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    values: {
      organizationName: draft.organizationName.trim(),
      leaderName: draft.leaderName.trim(),
      phone: draft.phone.trim(),
      regionName: draft.regionName.trim(),
      district: draft.district.trim(),
      ruralDistrict: draft.ruralDistrict.trim(),
      totalAreaHa: area ? Number(area) : null,
    },
  };
}
