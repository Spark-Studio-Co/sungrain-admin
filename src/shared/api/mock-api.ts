import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

type AnyRecord = Record<string, any>;

const today = new Date("2026-06-18T09:00:00.000Z");
const isoDate = (daysOffset: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + daysOffset);
  return date.toISOString();
};

const companies = [
  { id: 1, name: "SUN GRAIN LOGISTICS", users: [] },
  { id: 2, name: "ТОО Sungrain Export", users: [] },
  { id: 3, name: "ТОО Grain Terminal Aktau", users: [] },
  { id: 4, name: "AgroTrade Kazakhstan", users: [] },
];

const cultures = [
  { id: 1, name: "Пшеница 3 класс" },
  { id: 2, name: "Пшеница 4 класс" },
  { id: 3, name: "Ячмень" },
  { id: 4, name: "Лен" },
  { id: 5, name: "Рапс" },
  { id: 6, name: "Подсолнечник" },
];

const senders = [
  { id: "1", name: "ТОО Северный элеватор" },
  { id: "2", name: "Костанай Агро Логистик" },
  { id: "3", name: "Акмола Grain Hub" },
  { id: "4", name: "Павлодарский зерновой терминал" },
];

const receivers = [
  { id: "1", name: "Sungrain Terminal" },
  { id: "2", name: "Black Sea Grain" },
  { id: "3", name: "Caspian Food Logistics" },
  { id: "4", name: "Almaty Feed Group" },
];

const stations = [
  { id: 1, name: "Костанай", code: "684001" },
  { id: 2, name: "Астана Нурлы Жол", code: "690002" },
  { id: 3, name: "Павлодар", code: "696001" },
  { id: 4, name: "Сарыагаш", code: "700506" },
  { id: 5, name: "Актау Порт", code: "663507" },
  { id: 6, name: "Алматы-1", code: "700100" },
];

const owners = [
  { id: 1, owner: "KTZ Express" },
  { id: 2, owner: "Sungrain Rail" },
  { id: 3, owner: "TransAsia Logistic" },
  { id: 4, owner: "Astana Wagon Service" },
];

const users = [
  {
    id: "dev-admin",
    email: "admin@sungrain.test",
    full_name: "Администратор SUNGRAIN",
    name: "Администратор",
    username: "admin",
    role: "admin",
    companies: [{ company: companies[0] }, { company: companies[1] }],
    userContracts: [],
  },
  {
    id: 2,
    email: "manager@sungrain.test",
    full_name: "Алия Смагулова",
    name: "Алия",
    username: "aliya",
    role: "manager",
    companies: [{ company: companies[1] }],
    userContracts: [],
  },
  {
    id: 3,
    email: "logistics@sungrain.test",
    full_name: "Данияр Нуртаев",
    name: "Данияр",
    username: "daniyar",
    role: "logist",
    companies: [{ company: companies[2] }],
    userContracts: [],
  },
  {
    id: 4,
    email: "finance@sungrain.test",
    full_name: "Мария Ким",
    name: "Мария",
    username: "finance",
    role: "finance",
    companies: [{ company: companies[0] }],
    userContracts: [],
  },
];

const makeFile = (
  id: string | number,
  name: string,
  extra: AnyRecord = {},
) => ({
  id,
  name,
  number: extra.number || `DOC-${id}`,
  date: extra.date || isoDate(-7),
  url: extra.url || "#",
  file_url: extra.file_url || "#",
  location: extra.location || "CRM",
  size: extra.size || 184000,
  type: extra.type || "application/pdf",
  createdAt: extra.createdAt || isoDate(-7),
  ...extra,
});

const makeWagon = (
  id: number,
  contractId: number,
  applicationId: number,
  number: string,
  status: string,
  capacity: number,
  realWeight: number,
  owner: string,
  daysOffset: number,
) => {
  const wagon = {
    id,
    wagon_id: id,
    contractId,
    applicationId,
    number,
    status,
    capacity,
    real_weight: realWeight,
    owner,
    date_of_departure: isoDate(daysOffset),
    date_of_unloading:
      status === "en_route_to_recipient" ||
      status === "client_received"
        ? isoDate(daysOffset + 8)
        : "",
    files: [
      makeFile(`${id}-railway-bill`, "ЖД накладная", {
        number: `RW-${number}`,
        date: isoDate(daysOffset),
      }),
    ],
  };

  return {
    ...wagon,
    wagon: { ...wagon },
  };
};

const makeApplication = (
  id: number,
  contractId: number,
  name: string,
  volume: number,
  pricePerTon: number,
  currency: string,
  culture: string,
  daysOffset: number,
) => ({
  id,
  contractId,
  name,
  volume,
  price_per_ton: pricePerTon,
  total_amount: volume * pricePerTon,
  currency,
  culture,
  status: "active",
  created_at: isoDate(daysOffset),
  updated_at: isoDate(daysOffset + 1),
  files: [
    makeFile(`${id}-app`, "Заявка на отгрузку", {
      number: `APP-${String(id).padStart(4, "0")}`,
      date: isoDate(daysOffset),
    }),
  ],
  wagons: [],
});

const contracts = [
  {
    id: 1,
    number: "SG-2026-001",
    date: "2026-02-12",
    name: "Экспорт пшеницы в порт Актау",
    crop: "Пшеница 3 класс",
    sender: "ТОО Северный элеватор",
    receiver: "Sungrain Terminal",
    departure_station: "Костанай",
    destination_station: "Актау Порт",
    total_volume: 6400,
    estimated_cost: 512000,
    currency: "USD",
    companyId: 1,
    company: companies[0],
    unk: "SNG-001",
    created_at: isoDate(-120),
    updated_at: isoDate(-6),
    files: [makeFile(1, "Контракт SG-2026-001.pdf")],
    applications: [
      makeApplication(
        101,
        1,
        "Отгрузка февраль",
        2200,
        82,
        "USD",
        "wheat",
        -118,
      ),
      makeApplication(102, 1, "Отгрузка март", 1750, 84, "USD", "wheat", -88),
    ],
    wagons: [
      makeWagon(
        1001,
        1,
        101,
        "54781234",
        "en_route_to_recipient",
        68,
        67.4,
        "KTZ Express",
        -116,
      ),
      makeWagon(
        1002,
        1,
        101,
        "54781235",
        "en_route_to_recipient",
        69,
        68.1,
        "KTZ Express",
        -115,
      ),
      makeWagon(
        1003,
        1,
        102,
        "54781236",
        "en_route_to_recipient",
        70,
        69.2,
        "Sungrain Rail",
        -20,
      ),
    ],
  },
  {
    id: 2,
    number: "SG-2026-002",
    date: "2026-03-04",
    name: "Поставка ячменя в Алматы",
    crop: "Ячмень",
    sender: "Акмола Grain Hub",
    receiver: "Almaty Feed Group",
    departure_station: "Астана Нурлы Жол",
    destination_station: "Алматы-1",
    total_volume: 3800,
    estimated_cost: 193800000,
    currency: "KZT",
    companyId: 2,
    company: companies[1],
    unk: "SNG-002",
    created_at: isoDate(-95),
    updated_at: isoDate(-12),
    files: [makeFile(2, "Контракт SG-2026-002.pdf")],
    applications: [
      makeApplication(
        201,
        2,
        "Алматы партия 1",
        1400,
        51000,
        "KZT",
        "barley",
        -90,
      ),
      makeApplication(
        202,
        2,
        "Алматы партия 2",
        950,
        51200,
        "KZT",
        "barley",
        -45,
      ),
    ],
    wagons: [
      makeWagon(
        2001,
        2,
        201,
        "62133418",
        "en_route_to_recipient",
        66,
        65.8,
        "TransAsia Logistic",
        -88,
      ),
      makeWagon(
        2002,
        2,
        202,
        "62133419",
        "registered",
        66,
        0,
        "TransAsia Logistic",
        -2,
      ),
    ],
  },
  {
    id: 3,
    number: "SG-2026-003",
    date: "2026-03-28",
    name: "Лен на экспорт",
    crop: "Лен",
    sender: "Костанай Агро Логистик",
    receiver: "Black Sea Grain",
    departure_station: "Костанай",
    destination_station: "Сарыагаш",
    total_volume: 2600,
    estimated_cost: 910000,
    currency: "USD",
    companyId: 3,
    company: companies[2],
    unk: "SNG-003",
    created_at: isoDate(-82),
    updated_at: isoDate(-4),
    files: [makeFile(3, "Контракт SG-2026-003.pdf")],
    applications: [
      makeApplication(301, 3, "Лен экспортный", 1100, 350, "USD", "flax", -80),
      makeApplication(302, 3, "Лен доп. партия", 700, 352, "USD", "flax", -18),
    ],
    wagons: [
      makeWagon(
        3001,
        3,
        301,
        "58900121",
        "en_route_to_recipient",
        64,
        63.9,
        "Sungrain Rail",
        -78,
      ),
      makeWagon(
        3002,
        3,
        302,
        "58900122",
        "en_route_to_loading",
        65,
        64.5,
        "Sungrain Rail",
        -12,
      ),
    ],
  },
  {
    id: 4,
    number: "SG-2026-004",
    date: "2026-04-19",
    name: "Рапс для переработки",
    crop: "Рапс",
    sender: "Павлодарский зерновой терминал",
    receiver: "Caspian Food Logistics",
    departure_station: "Павлодар",
    destination_station: "Актау Порт",
    total_volume: 4200,
    estimated_cost: 1428000,
    currency: "USD",
    companyId: 4,
    company: companies[3],
    unk: "SNG-004",
    created_at: isoDate(-60),
    updated_at: isoDate(-9),
    files: [makeFile(4, "Контракт SG-2026-004.pdf")],
    applications: [
      makeApplication(
        401,
        4,
        "Рапс партия A",
        1600,
        340,
        "USD",
        "rapeseed",
        -58,
      ),
      makeApplication(
        402,
        4,
        "Рапс партия B",
        1200,
        342,
        "USD",
        "rapeseed",
        -31,
      ),
    ],
    wagons: [
      makeWagon(
        4001,
        4,
        401,
        "73319845",
        "en_route_to_recipient",
        67,
        66.7,
        "Astana Wagon Service",
        -55,
      ),
      makeWagon(
        4002,
        4,
        402,
        "73319846",
        "en_route_to_recipient",
        68,
        67.5,
        "KTZ Express",
        -10,
      ),
      makeWagon(
        4003,
        4,
        402,
        "73319847",
        "registered",
        68,
        0,
        "KTZ Express",
        0,
      ),
    ],
  },
  {
    id: 5,
    number: "SG-2026-005",
    date: "2026-05-07",
    name: "Подсолнечник, внутренняя поставка",
    crop: "Подсолнечник",
    sender: "Акмола Grain Hub",
    receiver: "Almaty Feed Group",
    departure_station: "Астана Нурлы Жол",
    destination_station: "Алматы-1",
    total_volume: 2100,
    estimated_cost: 138600000,
    currency: "KZT",
    companyId: 1,
    company: companies[0],
    unk: "SNG-005",
    created_at: isoDate(-42),
    updated_at: isoDate(-3),
    files: [makeFile(5, "Контракт SG-2026-005.pdf")],
    applications: [
      makeApplication(
        501,
        5,
        "Майская отгрузка",
        760,
        66000,
        "KZT",
        "sunflower",
        -39,
      ),
      makeApplication(
        502,
        5,
        "Июньская отгрузка",
        520,
        66500,
        "KZT",
        "sunflower",
        -8,
      ),
    ],
    wagons: [
      makeWagon(
        5001,
        5,
        501,
        "61230077",
        "en_route_to_recipient",
        65,
        64.8,
        "TransAsia Logistic",
        -38,
      ),
      makeWagon(
        5002,
        5,
        502,
        "61230078",
        "en_route_to_loading",
        66,
        65.2,
        "TransAsia Logistic",
        -4,
      ),
    ],
  },
  {
    id: 6,
    number: "SG-2026-006",
    date: "2026-06-03",
    name: "Пшеница 4 класс, южное направление",
    crop: "Пшеница 4 класс",
    sender: "ТОО Северный элеватор",
    receiver: "Sungrain Terminal",
    departure_station: "Костанай",
    destination_station: "Сарыагаш",
    total_volume: 5200,
    estimated_cost: 374400,
    currency: "USD",
    companyId: 2,
    company: companies[1],
    unk: "SNG-006",
    created_at: isoDate(-15),
    updated_at: isoDate(-1),
    files: [makeFile(6, "Контракт SG-2026-006.pdf")],
    applications: [
      makeApplication(
        601,
        6,
        "Первая южная партия",
        1800,
        72,
        "USD",
        "wheat",
        -14,
      ),
      makeApplication(
        602,
        6,
        "Вторая южная партия",
        1250,
        73,
        "USD",
        "wheat",
        -5,
      ),
    ],
    wagons: [
      makeWagon(
        6001,
        6,
        601,
        "54799101",
        "en_route_to_recipient",
        70,
        69.4,
        "Sungrain Rail",
        -12,
      ),
      makeWagon(
        6002,
        6,
        601,
        "54799102",
        "registered",
        70,
        69.7,
        "Sungrain Rail",
        -11,
      ),
      makeWagon(
        6003,
        6,
        602,
        "54799103",
        "en_route_to_loading",
        70,
        0,
        "KTZ Express",
        1,
      ),
    ],
  },
];

contracts.forEach((contract) => {
  contract.applications.forEach((application) => {
    (application as AnyRecord).contract = contract;
    application.wagons = contract.wagons.filter(
      (wagon) => wagon.applicationId === application.id,
    );
  });
});

users[0].userContracts = contracts.map((contract) => ({ contract }));
users[1].userContracts = contracts
  .slice(0, 3)
  .map((contract) => ({ contract }));
users[2].userContracts = contracts.slice(3).map((contract) => ({ contract }));

const invoices: AnyRecord[] = contracts.flatMap((contract) =>
  contract.applications.map((application, index) => ({
    id: `${application.id}-invoice`,
    applicationId: application.id,
    name: `Инвойс ${application.name}`,
    number: `INV-${application.id}`,
    amount: Math.round(application.total_amount * (index === 0 ? 0.55 : 0.4)),
    date: application.created_at,
    file_url: "#",
    status: index === 0 ? "paid" : "pending",
    description: `Счет по контракту ${contract.number}`,
    createdAt: application.created_at,
    updatedAt: application.updated_at,
  })),
);

const activities = [
  {
    id: 1,
    action: "Создан контракт",
    contract: "SG-2026-006",
    user: "Администратор SUNGRAIN",
    timestamp: isoDate(-1),
  },
  {
    id: 2,
    action: "Добавлены вагоны",
    contract: "SG-2026-004",
    user: "Данияр Нуртаев",
    timestamp: isoDate(-3),
  },
  {
    id: 3,
    action: "Обновлен инвойс",
    contract: "SG-2026-003",
    user: "Мария Ким",
    timestamp: isoDate(-5),
  },
];

const tableRows: AnyRecord[] = contracts.map((contract) => ({
  id: contract.id,
  number: contract.number,
  date: contract.date,
  crop: contract.crop,
  sender: contract.sender,
  receiver: contract.receiver,
  total_volume: contract.total_volume,
  currency: contract.currency,
  company: contract.company.name,
}));

const loginAudits: AnyRecord[] = [
  {
    id: 1,
    userId: 1,
    email: "admin@sungrain.test",
    ipAddress: "185.125.44.17",
    geoCountry: "Казахстан",
    geoRegion: "Алматы",
    geoCity: "Алматы",
    geoLatitude: 43.24,
    geoLongitude: 76.91,
    geoTimezone: "Asia/Almaty",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
    success: true,
    failureReason: null,
    createdAt: new Date().toISOString(),
    user: {
      id: 1,
      email: "admin@sungrain.test",
      full_name: "Администратор SUNGRAIN",
      role: "ADMIN",
    },
  },
  {
    id: 2,
    userId: null,
    email: "unknown@sungrain.kz",
    ipAddress: "92.47.18.204",
    geoCountry: "Казахстан",
    geoRegion: "Алматинская область",
    geoCity: "Каскелен",
    geoLatitude: 43.20,
    geoLongitude: 76.62,
    geoTimezone: "Asia/Almaty",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
    success: false,
    failureReason: "USER_NOT_FOUND",
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    user: null,
  },
];

const dislocationImports: AnyRecord[] = [
  {
    id: 2,
    sourceMessageId: "<dislocation-20260711@sungrain.kz>",
    sourceUid: 814,
    sender: "logistics@sungrain.kz",
    subject: "Ежедневная дислокация вагонов",
    attachmentName: "dislocation_2026-07-11_10-12.xlsx",
    attachmentHash: "mock-dislocation-2",
    sourceCreatedAt: "2026-07-11T05:12:04.000Z",
    receivedAt: "2026-07-11T05:13:18.000Z",
    status: "COMPLETED",
    rowsTotal: 29,
    matchedRows: 22,
    unmatchedRows: 7,
    errorMessage: null,
    createdAt: "2026-07-11T05:13:22.000Z",
    completedAt: "2026-07-11T05:13:24.000Z",
  },
  {
    id: 1,
    sourceMessageId: null,
    sourceUid: null,
    sender: null,
    subject: "Ручной импорт",
    attachmentName: "dislocation_2026-07-11_09-04.xlsx",
    attachmentHash: "mock-dislocation-1",
    sourceCreatedAt: "2026-07-11T04:04:43.000Z",
    receivedAt: "2026-07-11T04:05:02.000Z",
    status: "COMPLETED",
    rowsTotal: 16,
    matchedRows: 16,
    unmatchedRows: 0,
    errorMessage: null,
    createdAt: "2026-07-11T04:05:02.000Z",
    completedAt: "2026-07-11T04:05:03.000Z",
  },
];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const shouldUseMockApi = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

const normalizePath = (url = "") => {
  const cleanUrl = url.split("?")[0];

  if (/^https?:\/\//.test(cleanUrl)) {
    const parsed = new URL(cleanUrl);
    return parsed.pathname.replace(/^\/api(?=\/)/, "") || "/";
  }

  return cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`;
};

const parseBody = (data: any): AnyRecord => {
  if (!data) return {};

  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const body: AnyRecord = {};
    data.forEach((value, key) => {
      if (body[key] === undefined) {
        body[key] = value;
      } else if (Array.isArray(body[key])) {
        body[key].push(value);
      } else {
        body[key] = [body[key], value];
      }
    });
    return body;
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  return data;
};

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toStringArray = (value: any, fallback: string[] = []) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return [value.trim()];
    }
  }

  return fallback;
};

const nextId = (items: AnyRecord[]) =>
  items.reduce((max, item) => Math.max(max, toNumber(item.id, 0)), 0) + 1;

const includesSearch = (item: AnyRecord, search?: string) => {
  if (!search?.trim()) return true;
  return JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
};

const paginate = <T extends AnyRecord>(items: T[], params: AnyRecord = {}) => {
  const page = Math.max(1, toNumber(params.page, 1));
  const limit = Math.max(1, toNumber(params.limit, items.length || 10));
  const searched = items.filter((item) => includesSearch(item, params.search));
  const total = searched.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    data: searched.slice(start, start + limit),
    page,
    limit,
    total,
    totalPages,
    lastPage: totalPages,
  };
};

const findContract = (id: string | number) =>
  contracts.find((contract) => String(contract.id) === String(id)) ||
  contracts[0];

const allApplications = () =>
  contracts.flatMap((contract) =>
    contract.applications.map((application) => ({
      ...application,
      contract,
      wagons: contract.wagons.filter(
        (wagon) => wagon.applicationId === application.id,
      ),
    })),
  );

const findApplication = (id: string | number) =>
  allApplications().find(
    (application) => String(application.id) === String(id),
  ) || allApplications()[0];

const response = (
  config: InternalAxiosRequestConfig,
  data: any,
  status = 200,
): AxiosResponse => ({
  data,
  status,
  statusText: status >= 400 ? "Error" : "OK",
  headers: {},
  config,
  request: {},
});

const collectionMap: Record<string, AnyRecord[]> = {
  company: companies,
  culture: cultures,
  sender: senders,
  receiver: receivers,
  stations,
  owner: owners,
};

const ownerName = (body: AnyRecord) =>
  body.owner || body.name || "Новый собственник";

const createCollectionItem = (collection: string, body: AnyRecord) => {
  const items = collectionMap[collection];
  const id = nextId(items);
  const item =
    collection === "owner"
      ? { id, owner: ownerName(body) }
      : collection === "stations"
        ? { id, name: body.name || "Новая станция", code: body.code || "" }
        : { id, name: body.name || "Новая запись" };

  items.unshift(item);
  return item;
};

const updateCollectionItem = (
  collection: string,
  idOrName: string | number | undefined,
  body: AnyRecord,
) => {
  const items = collectionMap[collection];
  const index = items.findIndex(
    (item) =>
      String(item.id) === String(idOrName) ||
      item.name === idOrName ||
      item.owner === idOrName,
  );

  if (index === -1) return body;

  items[index] = {
    ...items[index],
    ...body,
    ...(collection === "owner" ? { owner: ownerName(body) } : {}),
  };
  return items[index];
};

const deleteCollectionItem = (
  collection: string,
  idOrName: string | number | undefined,
) => {
  const items = collectionMap[collection];
  const index = items.findIndex(
    (item) =>
      String(item.id) === String(idOrName) ||
      item.name === idOrName ||
      item.owner === idOrName,
  );

  if (index >= 0) items.splice(index, 1);
  return { success: true };
};

const createContract = (body: AnyRecord) => {
  const id = nextId(contracts);
  const company =
    companies.find((item) => item.id === toNumber(body.companyId, 1)) ||
    companies[0];
  const totalVolume = toNumber(body.totalVolume ?? body.total_volume, 1000);
  const departureStations = toStringArray(body.departure_stations, [
    body.departureStation || body.departure_station || stations[0].name,
  ]);
  const destinationStations = toStringArray(body.destination_stations, [
    body.destinationStation || body.destination_station || stations[3].name,
  ]);
  const contract = {
    id,
    number: body.number || `SG-2026-${String(id).padStart(3, "0")}`,
    date: body.date || new Date().toISOString().split("T")[0],
    name: body.name || `${body.crop || "Контракт"} ${id}`,
    crop: body.crop || "Пшеница 3 класс",
    sender: body.sender || body.senderName || senders[0].name,
    receiver: body.receiver || body.receiverName || receivers[0].name,
    departure_station: departureStations[0] || "",
    destination_station: destinationStations[0] || "",
    departure_stations: departureStations,
    destination_stations: destinationStations,
    total_volume: totalVolume,
    estimated_cost: toNumber(body.estimated_cost, totalVolume * 80),
    currency: body.currency || "USD",
    companyId: company.id,
    company,
    unk: body.unk || `SNG-${String(id).padStart(3, "0")}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    files: [],
    applications: [],
    wagons: [],
  };

  contracts.unshift(contract);
  return contract;
};

const updateContract = (id: string | number, body: AnyRecord) => {
  const contract = findContract(id);
  const company =
    companies.find(
      (item) => item.id === toNumber(body.companyId, contract.companyId),
    ) || contract.company;
  const departureStations = toStringArray(body.departure_stations, [
    body.departureStation ||
      body.departure_station ||
      contract.departure_station,
  ]);
  const destinationStations = toStringArray(body.destination_stations, [
    body.destinationStation ||
      body.destination_station ||
      contract.destination_station,
  ]);

  Object.assign(contract, {
    ...body,
    company,
    companyId: company.id,
    total_volume: toNumber(
      body.totalVolume ?? body.total_volume,
      contract.total_volume,
    ),
    departure_station: departureStations[0] || "",
    destination_station: destinationStations[0] || "",
    departure_stations: departureStations,
    destination_stations: destinationStations,
    updated_at: new Date().toISOString(),
  });

  return contract;
};

const createApplication = (body: AnyRecord) => {
  const contract = findContract(
    body.contractId || body.contract_id || contracts[0].id,
  );
  const id = nextId(allApplications());
  const volume = toNumber(body.volume, 500);
  const pricePerTon = toNumber(
    body.price_per_ton,
    contract.currency === "KZT" ? 50000 : 80,
  );
  const application = makeApplication(
    id,
    contract.id,
    body.name || `Заявка ${id}`,
    volume,
    pricePerTon,
    body.currency || contract.currency,
    body.culture || contract.crop,
    0,
  );

  (application as AnyRecord).contract = contract;
  const contractRecord = contract as AnyRecord;
  (application as AnyRecord).departure_stations = toStringArray(
    body.departure_stations,
    toStringArray(contractRecord.departure_stations, [
      contract.departure_station,
    ]),
  );
  (application as AnyRecord).destination_stations = toStringArray(
    body.destination_stations,
    toStringArray(contractRecord.destination_stations, [
      contract.destination_station,
    ]),
  );
  contract.applications.unshift(application);
  return application;
};

const updateApplication = (id: string | number, body: AnyRecord) => {
  const application = findApplication(id);
  const applicationRecord = application as AnyRecord;
  const departureStations = toStringArray(
    body.departure_stations,
    applicationRecord.departure_stations || [],
  );
  const destinationStations = toStringArray(
    body.destination_stations,
    applicationRecord.destination_stations || [],
  );
  Object.assign(application, body, {
    departure_stations: departureStations,
    destination_stations: destinationStations,
    total_amount:
      toNumber(body.volume, application.volume) *
      toNumber(body.price_per_ton, application.price_per_ton),
    updated_at: new Date().toISOString(),
  });
  return application;
};

const createWagon = (body: AnyRecord) => {
  const contract = findContract(
    body.contract_id || body.contractId || contracts[0].id,
  );
  const application =
    contract.applications[0] || createApplication({ contractId: contract.id });
  const id = nextId(contracts.flatMap((contractItem) => contractItem.wagons));
  const wagon = makeWagon(
    id,
    contract.id,
    application.id,
    String(body.number || `7000${id}`),
    body.status || "en_route_to_loading",
    toNumber(body.capacity, 68),
    toNumber(body.real_weight, 0),
    body.owner || owners[0].owner,
    0,
  );

  contract.wagons.unshift(wagon);
  application.wagons = contract.wagons.filter(
    (item) => item.applicationId === application.id,
  );
  return wagon;
};

const updateWagon = (id: string | number, body: AnyRecord) => {
  const wagon = contracts
    .flatMap((contract) => contract.wagons)
    .find((item) => String(item.id) === String(id));

  if (!wagon) return body;

  Object.assign(wagon, body);
  wagon.wagon = { ...wagon };
  return wagon;
};

const createInvoice = (applicationId: string | number, body: AnyRecord) => {
  const id = `${applicationId}-${Date.now()}`;
  const amount = toNumber(body.amount, 0);
  const paidAmount =
    body.status === "paid"
      ? amount
      : toNumber(body.paidAmount ?? body.paid_amount, 0);
  const invoice = {
    id,
    applicationId,
    name: body.name || "Новый инвойс",
    number: body.number || `INV-${id}`,
    amount,
    paidAmount,
    date: body.date || new Date().toISOString(),
    file_url: "#",
    status:
      paidAmount >= amount && amount > 0
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : body.status || "pending",
    description: body.description || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  invoices.unshift(invoice);
  return invoice;
};

const getMyFiles = () => [
  ...contracts.flatMap((contract) => contract.files),
  ...contracts.flatMap((contract) =>
    contract.applications.flatMap((application) => application.files),
  ),
  ...contracts.flatMap((contract) =>
    contract.wagons.flatMap((wagon) => wagon.files),
  ),
];

const csvExport = () => {
  const headers = [
    "Номер",
    "Культура",
    "Отправитель",
    "Получатель",
    "Объем",
    "Валюта",
  ];
  const rows = contracts.map((contract) =>
    [
      contract.number,
      contract.crop,
      contract.sender,
      contract.receiver,
      contract.total_volume,
      contract.currency,
    ].join(";"),
  );
  const csv = [headers.join(";"), ...rows].join("\n");

  if (typeof Blob !== "undefined") {
    return new Blob([csv], { type: "text/csv;charset=utf-8" });
  }

  return csv;
};

const handleMockRequest = (config: InternalAxiosRequestConfig) => {
  const method = (config.method || "get").toLowerCase();
  const path = normalizePath(config.url);
  const parts = path.split("/").filter(Boolean);
  const body = parseBody(config.data);
  const params = (config.params || {}) as AnyRecord;

  if (path === "/auth/login" && method === "post") {
    return {
      access_token: "dev-sungrain-token",
      refresh_token: "dev-sungrain-refresh-token",
      userId: "dev-admin",
      uid: "dev-admin",
      role: "admin",
    };
  }

  if (path === "/auth/refresh" && method === "post") {
    return {
      access_token: "dev-sungrain-token",
      refresh_token: "dev-sungrain-refresh-token",
    };
  }

  if (path === "/admin/auth/logout" && method === "get") {
    return { success: true };
  }

  if (path === "/auth/register" && method === "post") {
    const user = {
      id: nextId(users),
      email: body.email || `user-${Date.now()}@sungrain.test`,
      full_name: body.full_name || body.name || "Новый пользователь",
      name: body.name || body.full_name || "Новый пользователь",
      username: body.username || body.email || "user",
      role: body.role || "manager",
      companies: [
        {
          company:
            companies.find((item) => item.id === toNumber(body.companyId, 1)) ||
            companies[0],
        },
      ],
      userContracts: [],
    };
    users.unshift(user);
    return user;
  }

  if (path === "/user/is-admin" && method === "get") return true;
  if (path === "/dispatch-map" && method === "get") {
    const point = (name: string, latitude: number, longitude: number) => ({
      name,
      latitude,
      longitude,
    });
    const chukursay = point("Чукурсай", 41.3755561, 69.2454829);
    const bekobod = point("Бекобод", 40.2320291, 69.2531407);
    const pavlodar = point("Павлодар", 52.2857573, 76.9455035);
    const yangiyer = point("Янгиер", 40.2785641, 68.8232497);
    const khujand = point("Худжанд", 40.2842191, 69.6191174);
    const zhanaSemey = point("Жана-Семей", 50.3705198, 80.2439568);
    const makeWagon = (
      id: number,
      number: string,
      currentStation: AnyRecord,
      destinationStation: AnyRecord,
      idleDays: number,
      distance: number,
      contractNumber: string,
      contractId: string,
    ) => ({
      id,
      number,
      owner: id % 2 ? 'ТОО "Самал Транс Логистикс"' : 'ТОО "Хоппер Экспресс"',
      status: "en_route_to_recipient",
      statusLabel: "Следует к получателю",
      idleDays,
      isStalled: idleDays >= 2,
      isStale: false,
      staleHours: 1,
      observedAt: "2026-08-02T11:05:00.000Z",
      lastOperationAt: "2026-08-02T08:00:00.000Z",
      operation: "Проследование станции",
      distanceToDestinationKm: distance,
      estimatedArrivalAt: "2026-08-03T11:05:00.000Z",
      etaSource: "calculated",
      currentStation,
      destinationStation,
      departureStation: pavlodar,
      contract: {
        id: contractId,
        number: contractNumber,
        name: "Экспорт зерна",
        receiver: "Кристина",
      },
      application: { id, name: `Приложение №${id}` },
    });
    const stationData = [
      {
        key: "чукурсай",
        ...chukursay,
        wagons: [
          makeWagon(1, "95005757", chukursay, yangiyer, 0.5, 162, "№SG-ZNA-1", String(contracts[0].id)),
          makeWagon(2, "95006607", chukursay, yangiyer, 3.2, 162, "№SG-ZNA-1", String(contracts[0].id)),
          makeWagon(3, "95113627", chukursay, yangiyer, 1.1, 162, "№SG-ZNA-1", String(contracts[0].id)),
        ],
        statusCounts: { en_route_to_recipient: 3 },
        staleCount: 0,
        stalledCount: 1,
      },
      {
        key: "бекобод",
        ...bekobod,
        wagons: [
          makeWagon(4, "98227457", bekobod, khujand, 2.4, 46, "№SG-MU-1", String(contracts[1].id)),
          makeWagon(5, "98263858", bekobod, khujand, 0.2, 46, "№SG-MU-1", String(contracts[1].id)),
        ],
        statusCounts: { en_route_to_recipient: 2 },
        staleCount: 0,
        stalledCount: 1,
      },
      {
        key: "павлодар",
        ...pavlodar,
        wagons: [
          makeWagon(6, "98962822", pavlodar, zhanaSemey, 0.1, 377, "№SG-TUS-1", String(contracts[2].id)),
        ],
        statusCounts: { en_route_to_recipient: 1 },
        staleCount: 0,
        stalledCount: 0,
      },
    ];

    return {
      updatedAt: new Date().toISOString(),
      stats: {
        activeWagons: 6,
        mappedWagons: 6,
        stations: 3,
        stalledWagons: 2,
        staleWagons: 0,
        arrivingSoon: 6,
        unresolvedWagons: 0,
      },
      stations: stationData,
      unresolvedStations: [],
      settings: { staleAfterHours: 36, stalledAfterDays: 2 },
    };
  }
  if (path === "/dislocation/imports" && method === "get") {
    return dislocationImports.slice(0, Math.max(1, toNumber(params.limit, 50)));
  }
  if (
    parts[0] === "dislocation" &&
    parts[1] === "imports" &&
    parts[3] === "unmatched" &&
    method === "get"
  ) {
    const unmatchedNumbers = [
      "95308419",
      "95308652",
      "95308736",
      "95309112",
      "95309487",
      "95607215",
      "95607504",
    ];

    return String(parts[2]) === "2"
      ? unmatchedNumbers.map((wagonNumber, index) => ({
          id: 100 + index,
          wagonNumber,
          departureStation: index < 4 ? "Сарыагаш" : "Шымкент",
          destinationStation: "Актау-Порт",
          lastOperationStation: index < 3 ? "Арыс-1" : "Шу",
          operation:
            index < 3 ? "Прибытие на станцию" : "Следование в составе поезда",
          distanceToDestinationKm: 1180 - index * 64,
          lastOperationAt: `2026-07-11T0${Math.min(index + 2, 9)}:20:00.000Z`,
          observedAt: "2026-07-11T05:12:04.000Z",
        }))
      : [];
  }
  if (path === "/dislocation/import" && method === "post") {
    const file = body.file as File | undefined;
    const now = new Date().toISOString();
    const item = {
      id: nextId(dislocationImports),
      sourceMessageId: null,
      sourceUid: null,
      sender: null,
      subject: "Ручной импорт",
      attachmentName: file?.name || "dislocation.xlsx",
      attachmentHash: `mock-dislocation-${Date.now()}`,
      sourceCreatedAt: now,
      receivedAt: now,
      status: "COMPLETED",
      rowsTotal: 18,
      matchedRows: 17,
      unmatchedRows: 1,
      errorMessage: null,
      createdAt: now,
      completedAt: now,
    };
    dislocationImports.unshift(item);
    return { duplicate: false, import: item };
  }
  if (path === "/dislocation/sync-email" && method === "post") {
    return { skipped: false, processed: 0, results: [] };
  }
  if (path === "/user/login-audits" && method === "get") {
    const successFilter =
      params.success === "true"
        ? true
        : params.success === "false"
          ? false
          : undefined;
    const filteredAudits = loginAudits.filter(
      (audit) =>
        (params.excludeAdmin !== "true" ||
          (audit.user?.role !== "ADMIN" &&
            !["admin@sungrain.kz", "admin@sungrain.test"].includes(
              String(audit.email).toLowerCase(),
            ))) &&
        (typeof successFilter !== "boolean" ||
          audit.success === successFilter) &&
        includesSearch(audit, params.search),
    );
    const paginated = paginate(filteredAudits, params);

    const scopedAudits = loginAudits.filter(
      (audit) =>
        params.excludeAdmin !== "true" ||
        (audit.user?.role !== "ADMIN" &&
          !["admin@sungrain.kz", "admin@sungrain.test"].includes(
            String(audit.email).toLowerCase(),
          )),
    );

    return {
      ...paginated,
      stats: {
        successful: scopedAudits.filter((audit) => audit.success).length,
        failed: scopedAudits.filter((audit) => !audit.success).length,
        recent: scopedAudits.length,
        uniqueIps: new Set(scopedAudits.map((audit) => audit.ipAddress)).size,
      },
    };
  }
  if (path === "/user/all" && method === "get") {
    const search = String(params.search || "").toLowerCase();
    const role = String(params.role || "all");
    const filteredUsers = users.filter(
      (user) =>
        (params.excludeAdmin !== "true" ||
          (String(user.role).toLowerCase() !== "admin" &&
            !["admin@sungrain.kz", "admin@sungrain.test"].includes(
              String(user.email).toLowerCase(),
            ))) &&
        (role === "all" || String(user.role) === role) &&
        (!search ||
          [user.full_name, user.name, user.username, user.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search))),
    );

    return paginate(filteredUsers, params);
  }
  if (path === "/user/my-contracts" && method === "get") {
    return paginate(contracts.slice(0, 4), params);
  }
  if (path === "/user/my-files" && method === "get") return getMyFiles();
  if (path === "/user/export-all" && method === "get") return csvExport();
  if (parts[0] === "user" && parts[1] === "get-user" && method === "get") {
    return users.find((user) => String(user.id) === parts[2]) || users[0];
  }
  if (parts[0] === "user" && parts[1] === "my-contract" && method === "get") {
    return findContract(parts[2]);
  }
  if (parts[0] === "user" && parts[1] && method === "get") {
    return users.find((user) => String(user.id) === parts[1]) || users[0];
  }
  if (parts[0] === "user" && parts[1] && method === "patch") {
    const user = users.find((item) => String(item.id) === parts[1]);
    if (!user) return body;
    Object.assign(user, body);
    return user;
  }
  if (parts[0] === "user" && parts[1] && method === "delete") {
    const index = users.findIndex((user) => String(user.id) === parts[1]);
    if (index >= 0) users.splice(index, 1);
    return { success: true };
  }

  if (path === "/contract" && method === "get")
    return paginate(contracts, params);
  if (path === "/contract/add-data" && method === "post")
    return createContract(body);
  if (
    parts[0] === "contract" &&
    parts[1] === "contract-wagons" &&
    method === "get"
  ) {
    return findContract(parts[2]).wagons;
  }
  if (
    parts[0] === "contract" &&
    parts[1] === "upload-files" &&
    method === "post"
  ) {
    return { success: true, files: findContract(parts[2]).files };
  }
  if (
    parts[0] === "contract" &&
    parts[1] === "delete-files" &&
    method === "patch"
  ) {
    return { success: true };
  }
  if (
    parts[0] === "contract" &&
    parts[1] &&
    parts[1] !== "attention-center" &&
    method === "get"
  ) {
    return findContract(parts[1]);
  }
  if (parts[0] === "contract" && parts[1] && method === "patch") {
    return updateContract(parts[1], body);
  }
  if (parts[0] === "contract" && parts[1] && method === "delete") {
    const index = contracts.findIndex(
      (contract) => String(contract.id) === parts[1],
    );
    if (index >= 0) contracts.splice(index, 1);
    return { success: true };
  }
  if (path === "/contracts/statistics" && method === "get") {
    return {
      totalContracts: contracts.length,
      totalVolume: contracts.reduce(
        (sum, contract) => sum + contract.total_volume,
        0,
      ),
      totalApplications: allApplications().length,
      totalWagons: contracts.reduce(
        (sum, contract) => sum + contract.wagons.length,
        0,
      ),
      totalAmount: contracts.reduce(
        (sum, contract) => sum + contract.estimated_cost,
        0,
      ),
    };
  }
  if (path === "/contract/attention-center" && method === "get") {
    const applications = allApplications();
    const openInvoices = invoices
      .map((invoice) => ({
        ...(invoice as AnyRecord),
        balance: Math.max(
          toNumber((invoice as AnyRecord).amount) -
            toNumber((invoice as AnyRecord).paidAmount),
          0,
        ),
      }))
      .filter((invoice) => invoice.balance > 0);
    const balanceByCurrency = openInvoices.reduce(
      (totals, invoice) => {
        const invoiceRecord = invoice as AnyRecord;
        const application = findApplication(invoiceRecord.applicationId);
        const currency = application.currency || "USD";
        totals[currency] =
          (totals[currency] || 0) + toNumber(invoiceRecord.balance);
        return totals;
      },
      {} as Record<string, number>,
    );
    const missingDocuments = applications.filter(
      (application) =>
        !Array.isArray(application.files) || application.files.length === 0,
    );
    const unmatchedCount = toNumber(dislocationImports[0]?.unmatchedRows);
    const makeItem = (
      key: string,
      title: string,
      description: string,
      count: number,
      href: string,
      severity: "ok" | "warning" | "danger" = count ? "warning" : "ok",
      details: AnyRecord[] = [],
      totals?: Record<string, number>,
    ) => ({
      key,
      title,
      description,
      count,
      href,
      severity,
      preview: details.slice(0, 3),
      details,
      totals,
    });
    const items = [
      makeItem(
        "stale_dislocations",
        "Без свежей дислокации",
        "Нет обновления более 36 часов",
        0,
        "/admin/dislocations",
      ),
      makeItem(
        "idle_wagons",
        "Вагоны с простоем",
        "Без операции от 2 суток",
        0,
        "/admin/dislocations",
      ),
      makeItem(
        "applications_without_documents",
        "Заявки без документов",
        "Нет ни одного загруженного документа",
        missingDocuments.length,
        "/admin/contracts",
        missingDocuments.length ? "warning" : "ok",
        missingDocuments.map((application) => ({
          id: application.id,
          label: application.name || `Заявка №${application.id}`,
          meta: application.contract?.number || "Договор",
          href: `/admin/contracts/${application.contractId}/applications/${application.id}`,
        })),
      ),
      makeItem(
        "invoices_with_balance",
        "Счета с остатком",
        "Оплачены частично или ожидают оплаты",
        openInvoices.length,
        "/admin/finance",
        openInvoices.length ? "warning" : "ok",
        openInvoices.map((invoice) => {
          const invoiceRecord = invoice as AnyRecord;
          const application = findApplication(invoiceRecord.applicationId);
          const currency = application.currency || "USD";
          return {
            id: invoiceRecord.id,
            label: invoiceRecord.name || `Счет №${invoiceRecord.id}`,
            meta: `${toNumber(invoiceRecord.balance).toLocaleString("ru-RU")} ${currency}`,
            href: "/admin/finance",
          };
        }),
        balanceByCurrency,
      ),
      makeItem(
        "unmatched_wagons",
        "Неопознанные вагоны",
        "Есть в Excel, но не найдены в CRM",
        unmatchedCount,
        "/admin/dislocations",
        unmatchedCount ? "danger" : "ok",
      ),
      makeItem(
        "volume_exceeded",
        "Превышение объема",
        "Вес по документам выше плана договора",
        0,
        "/admin/contracts",
      ),
    ];
    return {
      generatedAt: new Date().toISOString(),
      thresholds: { staleDislocationHours: 36, idleDays: 2 },
      items,
      summary: {
        total: items.reduce((sum, item) => sum + item.count, 0),
        affectedContracts: new Set(
          missingDocuments.map((application) => application.contractId),
        ).size,
      },
    };
  }

  if (path === "/application" && method === "post")
    return createApplication(body);
  if (parts[0] === "application" && parts[1] === "by-id" && method === "get") {
    return findApplication(parts[2]);
  }
  if (
    parts[0] === "application" &&
    parts[1] === "get-invoice" &&
    method === "get"
  ) {
    return invoices.filter(
      (invoice) => String(invoice.applicationId) === parts[2],
    );
  }
  if (
    parts[0] === "application" &&
    (parts[2] === "invoice" || parts[1] === "add-invoice") &&
    method === "post"
  ) {
    const applicationId = parts[1] === "add-invoice" ? parts[2] : parts[1];
    return createInvoice(applicationId, body);
  }
  if (
    parts[0] === "application" &&
    parts[1] === "update-invoice" &&
    method === "patch"
  ) {
    const invoice = invoices.find((item) => String(item.id) === parts[3]);
    if (!invoice) return body;
    Object.assign(invoice, body, { updatedAt: new Date().toISOString() });
    return invoice;
  }
  if (
    parts[0] === "application" &&
    parts[1] === "delete-invoice" &&
    method === "delete"
  ) {
    const index = invoices.findIndex((item) => String(item.id) === parts[3]);
    if (index >= 0) invoices.splice(index, 1);
    return { success: true };
  }
  if (
    parts[0] === "application" &&
    parts[1] === "upload-files" &&
    method === "patch"
  ) {
    return { success: true, files: findApplication(parts[2]).files };
  }
  if (
    parts[0] === "application" &&
    parts[1] === "update-file" &&
    method === "patch"
  ) {
    return { success: true };
  }
  if (
    parts[0] === "application" &&
    parts[1] === "delete-files" &&
    method === "delete"
  ) {
    return { success: true };
  }
  if (
    parts[0] === "application" &&
    parts[1] === "create-for-upload-documents" &&
    method === "post"
  ) {
    return makeFile(Date.now(), body.name || "Документ заявки");
  }
  if (
    parts[0] === "application" &&
    parts[1] === "delete-upload-documents" &&
    method === "delete"
  ) {
    return { success: true };
  }
  if (parts[0] === "application" && parts[1] && method === "get") {
    return findContract(parts[1]).applications;
  }
  if (parts[0] === "application" && parts[1] && method === "patch") {
    return updateApplication(parts[1], body);
  }
  if (parts[0] === "application" && parts[1] && method === "delete") {
    contracts.forEach((contract) => {
      const index = contract.applications.findIndex(
        (application) => String(application.id) === parts[1],
      );
      if (index >= 0) contract.applications.splice(index, 1);
    });
    return { success: true };
  }

  if (path === "/wagon" && method === "post") return createWagon(body);
  if (
    parts[0] === "wagon" &&
    parts[1] === "upload-files" &&
    method === "post"
  ) {
    return { success: true };
  }
  if (
    parts[0] === "wagon" &&
    parts[1] === "delete-files" &&
    method === "patch"
  ) {
    return { success: true };
  }
  if (parts[0] === "wagon" && parts[1] && method === "patch") {
    return updateWagon(parts[1], body);
  }
  if (parts[0] === "wagon" && parts[1] && method === "delete") {
    contracts.forEach((contract) => {
      const index = contract.wagons.findIndex(
        (wagon) => String(wagon.id) === parts[1],
      );
      if (index >= 0) contract.wagons.splice(index, 1);
    });
    return { success: true };
  }

  if (path === "/activities" && method === "get") return activities;
  if (path === "/table" && method === "get") return tableRows;
  if (path === "/table" && method === "post") {
    tableRows.unshift({ id: nextId(tableRows), ...body });
    return tableRows[0];
  }
  if (path === "/table/add-data" && method === "post") {
    tableRows.unshift({ id: nextId(tableRows), ...body });
    return tableRows[0];
  }
  if (path === "/table/add-column" && method === "patch") {
    return { success: true, column: body };
  }

  const collection = parts[0];
  if (collectionMap[collection]) {
    if (parts.length === 1 && method === "get")
      return paginate(collectionMap[collection], params);
    if (parts.length === 1 && method === "post")
      return createCollectionItem(collection, body);
    if (parts.length === 1 && method === "patch") {
      const idOrName = body.id || body.old_name || body.name;
      return updateCollectionItem(collection, idOrName, body);
    }
    if (parts[1] && method === "get") {
      return (
        collectionMap[collection].find(
          (item) =>
            String(item.id) === parts[1] ||
            item.name === parts[1] ||
            item.owner === parts[1],
        ) || collectionMap[collection][0]
      );
    }
    if (parts[1] && (method === "patch" || method === "put")) {
      return updateCollectionItem(
        collection,
        decodeURIComponent(parts[1]),
        body,
      );
    }
    if (parts[1] && method === "delete") {
      return deleteCollectionItem(collection, decodeURIComponent(parts[1]));
    }
  }

  return { success: true };
};

export const mockApiAdapter: AxiosAdapter = async (config) => {
  await wait(120);
  return response(
    config as InternalAxiosRequestConfig,
    handleMockRequest(config as InternalAxiosRequestConfig),
  );
};
