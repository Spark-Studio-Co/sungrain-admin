import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  Purchase,
  PurchaseValues,
} from "../../entities/procurement/api/purchases.api";
import type { ProcurementFarmRecord, ProcurementFarmValues } from "../../entities/procurement/api/procurement.api";
import {
  calculatePurchase,
  validatePurchase,
} from "../../entities/procurement/model/purchase-calculation";

const farms: ProcurementFarmRecord[] = [
  {
    id: 9101,
    organizationName: 'КХ "Демо Колос"',
    leaderName: "Демо Фермер 1",
    phone: null,
    district: "Павлодарский район",
    importId: 9100, sourceRow: 1, version: 1, regionName: "Павлодарская область", ruralDistrict: null, totalAreaHa: 1000, cropAreas: [],
  },
  {
    id: 9102,
    organizationName: 'ТОО "Демо Урожай"',
    leaderName: "Демо Фермер 2",
    phone: null,
    district: "Успенский район",
    importId: 9100, sourceRow: 2, version: 1, regionName: "Павлодарская область", ruralDistrict: null, totalAreaHa: 1300, cropAreas: [],
  },
  {
    id: 9103,
    organizationName: 'КХ "Демо Нива"',
    leaderName: "Демо Фермер 3",
    phone: null,
    district: "Железинский район",
    importId: 9100, sourceRow: 3, version: 1, regionName: "Павлодарская область", ruralDistrict: null, totalAreaHa: 1600, cropAreas: [],
  },
];
const cultures = [
  "Пшеница 3 класс",
  "Пшеница 4 класс",
  "Ячмень",
  "Лен",
  "Рапс",
  "Подсолнечник",
];
type StoredPurchase = Purchase & {
  requestId?: string;
  fingerprint?: string;
  file?: Blob;
};
const fixtures = (): StoredPurchase[] =>
  farms.map((farm, index) => {
    const vatMode = (["EXCLUSIVE", "INCLUSIVE", "NONE"] as const)[index];
    return {
      id: `61000000-0000-4000-8000-00000000000${index + 1}`,
      sourceFarmId: farm.id,
      farmerName: farm.organizationName,
      farmerLeader: farm.leaderName,
      farmerPhone: null,
      farmerDistrict: farm.district,
      cultureName: cultures[index],
      quantity: ["100", "250.5", "80"][index],
      unitPrice: ["100000", "85000", "72000"][index],
      currency: "KZT",
      vatMode,
      vatRate: vatMode === "NONE" ? "0" : "16",
      ...calculatePurchase(
        ["100", "250.5", "80"][index],
        ["100000", "85000", "72000"][index],
        vatMode,
        "16",
      ),
      agreementNumber: `ДЕМО-00${index + 1}`,
      agreementDate: `2026-10-${18 - index}`,
      notes: "Синтетическая закупка",
      document: null,
      version: 1,
      createdAt: "2026-10-18T09:00:00.000Z",
      updatedAt: "2026-10-18T09:00:00.000Z",
      createdBy: "admin@sungrain.test",
      updatedBy: "admin@sungrain.test",
    };
  });
const publicPurchase = (stored: StoredPurchase): Purchase => {
  const row = { ...stored };
  delete row.file;
  delete row.requestId;
  delete row.fingerprint;
  return row;
};

// The explicit mock adapter stores this module's synthetic data locally, including document blobs.
function access<T>(
  action: (rows: StoredPurchase[]) => { result: T; save?: StoredPurchase },
): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("sungrain-procurement-demo-v1", 2);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains("purchases")) {
        const store = open.result.createObjectStore("purchases", { keyPath: "id" });
        fixtures().forEach((row) => store.put(row));
      }
      if (!open.result.objectStoreNames.contains("farms")) {
        const store = open.result.createObjectStore("farms", { keyPath: "id" });
        farms.forEach((farm) => store.put(farm));
      }
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction("purchases", "readwrite");
      const store = transaction.objectStore("purchases");
      const request = store.getAll();
      let result: T;
      request.onsuccess = () => {
        try {
          const next = action(request.result);
          result = next.result;
          if (next.save) store.put(next.save);
        } catch (error) {
          transaction.abort();
          reject(error);
        }
      };
      transaction.oncomplete = () => {
        db.close();
        resolve(result);
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
      transaction.onabort = () => {
        db.close();
        reject(
          transaction.error || new Error("Не удалось сохранить демо-данные"),
        );
      };
    };
  });
}

function accessFarms<T>(action: (rows: ProcurementFarmRecord[]) => { result: T; save?: ProcurementFarmRecord }): Promise<T> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("sungrain-procurement-demo-v1", 2);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains("purchases")) {
        const store = open.result.createObjectStore("purchases", { keyPath: "id" });
        fixtures().forEach((row) => store.put(row));
      }
      if (!open.result.objectStoreNames.contains("farms")) {
        const store = open.result.createObjectStore("farms", { keyPath: "id" });
        farms.forEach((farm) => store.put(farm));
      }
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction("farms", "readwrite");
      const store = transaction.objectStore("farms");
      const request = store.getAll();
      let result: T;
      request.onsuccess = () => {
        try {
          const next = action(request.result.map((row: ProcurementFarmRecord) => ({ ...row, version: row.version ?? 1 })));
          result = next.result;
          if (next.save) store.put(next.save);
        } catch (error) {
          transaction.abort();
          reject(error);
        }
      };
      transaction.oncomplete = () => { db.close(); resolve(result); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
      transaction.onabort = () => { db.close(); reject(transaction.error || new Error("Не удалось сохранить хозяйство")); };
    };
  });
}

export async function mockProcurement(config: InternalAxiosRequestConfig) {
  const path =
    config.url?.replace(/\?.*$/, "").split("/").filter(Boolean) || [];
  const method = config.method?.toLowerCase() || "get";
  const params = config.params || {};
  const fail = (message: string, status = 400): never => {
    throw new AxiosError(message, "ERR_BAD_REQUEST", config, undefined, {
      data: { message },
      status,
      statusText: "Error",
      headers: {},
      config,
    });
  };
  if (path[1] === "imports")
    return [
      {
        id: 9100,
        status: "COMPLETED",
        attachmentName: "synthetic.xlsx",
        sheetName: "Демо",
        regionName: "Павлодарская область",
        cropYear: 2026,
        farmsTotal: 3,
        issueCount: 0,
        createdAt: "2026-10-18T09:00:00.000Z",
      },
    ];
  if (path[1] === "import")
    return fail(
      "Импорт XLSX доступен при подключении к серверу. В демо используются синтетические хозяйства.",
    );
  if (path[1] === "farmers") {
    const currentFarms = await accessFarms((rows) => ({ result: rows }));
    const farmValues = (typeof config.data === "string"
      ? JSON.parse(config.data)
      : config.data) as ProcurementFarmValues | undefined;
    if (path[2]) {
      const farm = currentFarms.find((row) => row.id === Number(path[2]));
      if (!farm) fail("Хозяйство не найдено", 404);
      if (method === "patch") {
        const values = farmValues;
        if (!values?.organizationName?.trim()) fail("Укажите название хозяйства");
        if (farm.importId !== null) fail("Хозяйство из XLSX нельзя редактировать");
        if (values.version !== farm.version) fail("Хозяйство изменено. Обновите страницу", 409);
        const next = { ...farm, ...values, version: farm.version + 1 };
        await accessFarms(() => ({ result: next, save: next }));
        return { ...next, import: next.importId ? { id: 9100, attachmentName: "synthetic.xlsx", createdAt: "2026-10-18T09:00:00.000Z" } : null, purchases: [] };
      }
      const purchases = await access((rows) => ({ result: rows.filter((item) => item.sourceFarmId === farm.id).map((item) => ({ id: item.id, agreementNumber: item.agreementNumber, agreementDate: item.agreementDate, cultureName: item.cultureName, quantity: item.quantity, currency: item.currency, totalAmount: item.totalAmount })) }));
      return { ...farm, import: farm.importId ? { id: 9100, attachmentName: "synthetic.xlsx", createdAt: "2026-10-18T09:00:00.000Z" } : null, purchases };
    }
    if (method === "post") {
      const values = farmValues;
      if (!values?.organizationName?.trim()) fail("Укажите название хозяйства");
      const next: ProcurementFarmRecord = { ...values, id: Math.max(9100, ...currentFarms.map((item) => item.id)) + 1, importId: null, sourceRow: null, version: 1, cropAreas: [] };
      await accessFarms(() => ({ result: next, save: next }));
      return { ...next, import: null, purchases: [] };
    }
    if (params.importId && Number(params.importId) !== 9100) fail("Снимок закупа не найден", 404);
    const rows = currentFarms
      .filter(
        (farm) =>
          (!params.importId || farm.importId === Number(params.importId) || farm.importId === null) &&
          (!params.region || farm.regionName === params.region) &&
          (!params.district || farm.district === params.district) &&
          (!params.ruralDistrict || farm.ruralDistrict === params.ruralDistrict) &&
          (!params.withPhone || !!farm.phone) &&
          (!params.search ||
            farm.organizationName
              .toLowerCase()
              .includes(params.search.toLowerCase())),
      )
      .map((farm, index) => ({
        ...farm,
        selectedAreaHa: params.cultureKey ? 250 + index * 100 : undefined,
      }));
    return {
      import: {
        id: 9100,
        regionName: "Павлодарская область",
        cropYear: 2026,
        farmsTotal: 3,
      },
      rows,
      filters: {
        regions: ["Павлодарская область"],
        districts: currentFarms.map((farm) => farm.district).filter(Boolean),
        ruralDistricts: [],
        cultures: cultures.map((name) => ({ key: name, name })),
      },
    };
  }
  if (path[2] === "options")
    return {
      farms: (await accessFarms((rows) => ({ result: rows }))).filter(
        (farm) =>
          farm.id === Number(params.selectedId) ||
          farm.organizationName
            .toLowerCase()
            .includes((params.search || "").toLowerCase()),
      ),
      cultures,
    };

  const form = config.data instanceof FormData ? config.data : undefined;
  const values = form
    ? (Object.fromEntries(form.entries()) as unknown as PurchaseValues)
    : undefined;
  if (values)
    values.farmId = form.get("farmId") ? Number(form.get("farmId")) : undefined;
  const upload = form?.get("file") as File | null;
  if (upload) {
    const header = new Uint8Array(await upload.slice(0, 8).arrayBuffer());
    const pdf = new TextDecoder().decode(header).startsWith("%PDF-");
    const jpg = header[0] === 255 && header[1] === 216 && header[2] === 255;
    const png = header.join(",") === "137,80,78,71,13,10,26,10";
    if (
      !(
        (pdf && /\.pdf$/i.test(upload.name)) ||
        (jpg && /\.jpe?g$/i.test(upload.name)) ||
        (png && /\.png$/i.test(upload.name))
      ) ||
      !upload.size ||
      upload.size > 10485760
    )
      fail("Договор: PDF, JPG или PNG, не больше 10 МБ");
  }
  const currentFarms = await accessFarms((rows) => ({ result: rows }));
  return access<unknown>((rows) => {
    const existing = rows.find((row) => row.id === path[2]);
    if (path[3] === "document") {
      if (!existing?.file) fail("Договор не найден", 404);
      return { result: existing.file };
    }
    if (method === "get" && path[2]) {
      if (!existing) fail("Закупка не найдена", 404);
      return { result: publicPurchase(existing) };
    }
    if (method === "get") {
      const filtered = rows
        .filter(
          (row) =>
            (!params.search ||
              `${row.farmerName} ${row.agreementNumber}`
                .toLowerCase()
                .includes(params.search.toLowerCase())) &&
            (!params.culture || row.cultureName === params.culture) &&
            (!params.from || row.agreementDate.slice(0, 10) >= params.from) &&
            (!params.to || row.agreementDate.slice(0, 10) <= params.to),
        )
        .sort(
          (a, b) =>
            b.agreementDate.localeCompare(a.agreementDate) ||
            b.id.localeCompare(a.id),
        );
      const page = Number(params.page) || 1;
      return {
        result: {
          rows: filtered.slice((page - 1) * 20, page * 20).map(publicPurchase),
          total: filtered.length,
          page,
          pageSize: 20,
          cultures: Array.from(
            new Set(rows.map((row) => row.cultureName)),
          ).sort(),
        },
      };
    }
    if (!values) fail("Отсутствуют данные закупки");
    if (values.vatMode === "EXCLUSIVE" && (!existing || existing.vatMode !== "EXCLUSIVE"))
      fail("Для новых закупок выберите «С НДС» или «Без НДС»");
    const errors = validatePurchase(values, !!existing);
    if (Object.keys(errors).length) fail(Object.values(errors).join(". "));
    if (method === "patch" && !existing) fail("Закупка не найдена", 404);
    if (existing && existing.version !== Number(form.get("version")))
      fail("Закупка изменена. Обновите страницу перед сохранением", 409);
    const requestId = String(form.get("requestId") || "");
    const fingerprint = JSON.stringify(values);
    const previous = rows.find(
      (row) => row.requestId === requestId && requestId,
    );
    if (!existing && previous) {
      if (previous.fingerprint !== fingerprint)
        fail("Запрос уже сохранён с другими данными", 409);
      return { result: publicPurchase(previous) };
    }
    const farm = currentFarms.find((item) => item.id === values.farmId);
    if (!farm && !existing) fail("Выберите фермера");
    const now = new Date().toISOString();
    const remove = form.get("removeDocument") === "true";
    const row: StoredPurchase = {
      ...values,
      id: existing?.id || crypto.randomUUID(),
      requestId,
      fingerprint,
      sourceFarmId: farm?.id || existing?.sourceFarmId || null,
      farmerName: farm?.organizationName || existing.farmerName,
      farmerLeader: farm?.leaderName || existing?.farmerLeader || null,
      farmerPhone: null,
      farmerDistrict: farm?.district || existing?.farmerDistrict || null,
      ...calculatePurchase(
        values.quantity,
        values.unitPrice,
        values.vatMode,
        values.vatRate,
      ),
      vatRate: values.vatMode === "NONE" ? "0" : values.vatRate,
      version: (existing?.version || 0) + 1,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      createdBy: "admin@sungrain.test",
      updatedBy: "admin@sungrain.test",
      document: upload
        ? {
            id: crypto.randomUUID(),
            name: upload.name,
            size: upload.size,
            mimeType: upload.type,
          }
        : remove
          ? null
          : existing?.document || null,
      file: upload || (remove ? undefined : existing?.file),
    };
    return { result: publicPurchase(row), save: row };
  });
}
