export const contractDocumentTypes = {
  railway_waybill: "Ж/д накладная",
  goods_waybill: "Товарная накладная",
  act: "Акт",
  invoice: "Счет-фактура",
  certificate: "Сертификат",
  contract: "Договор / доп. соглашение",
  other: "Сопутствующий документ",
} as const;

export type ContractDocumentType = keyof typeof contractDocumentTypes;
export type ContractDocument = {
  name?: string;
  location?: string;
  document_type?: string;
  [key: string]: unknown;
};

export const contractDocumentTypeLabel = (type?: string) =>
  type && Object.hasOwn(contractDocumentTypes, type)
    ? contractDocumentTypes[type as ContractDocumentType]
    : "Документ договора";

export const getMainContractFile = (
  files: unknown,
): ContractDocument | undefined =>
  Array.isArray(files)
    ? files.find(
        (file) =>
          file && (!file.document_type || file.document_type === "contract"),
      )
    : undefined;

export function validateContractDocumentFiles(files: File[]) {
  if (!files.length) return "Выберите хотя бы один файл";
  if (files.length > 10) return "Можно загрузить до 10 файлов за один раз";
  if (files.some((file) => file.size > 50 * 1024 * 1024)) {
    return "Размер каждого файла должен быть не больше 50 МБ";
  }
  return null;
}
