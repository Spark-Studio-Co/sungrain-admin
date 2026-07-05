export const API_ERROR_TOAST_EVENT = "sungrain:api-error-toast";

export type ApiErrorToastDetail = {
  title: string;
  description: string;
  status?: number;
  duration?: number;
};

type ErrorLike = {
  message?: string;
  request?: unknown;
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
};

const DEFAULT_MESSAGE = "Не удалось выполнить запрос к backend.";
const NETWORK_MESSAGE = "Нет связи с backend. Проверьте интернет или сервер.";

const knownTranslations: Array<[RegExp, string]> = [
  [/^email already exists$/i, "Пользователь с таким email уже существует."],
  [/^invalid email format$/i, "Некорректный email."],
  [/email must be an email/i, "Некорректный email."],
  [
    /password must be at least 6 characters/i,
    "Пароль должен быть не короче 6 символов.",
  ],
  [/^not found$/i, "Данные не найдены."],
  [/^unauthorized$/i, "Сессия истекла. Войдите снова."],
  [/^forbidden$/i, "Недостаточно прав для этого действия."],
  [
    /^internal server error$/i,
    "Ошибка сервера. Попробуйте еще раз или проверьте backend.",
  ],
];

let lastToastSignature = "";
let lastToastAt = 0;
const DEDUPE_WINDOW_MS = 6000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const translateMessage = (message: string) => {
  const normalized = message.trim();
  if (!normalized) return "";

  const known = knownTranslations.find(([pattern]) => pattern.test(normalized));
  if (known) return known[1];

  if (/^cannot\s+(get|post|patch|put|delete)\s+/i.test(normalized)) {
    return `Маршрут backend не найден: ${normalized}`;
  }

  return normalized;
};

const extractRawMessages = (value: unknown): string[] => {
  if (!value) return [];

  if (typeof value === "string") return [value];

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractRawMessages(item));
  }

  if (isRecord(value)) {
    const message = extractRawMessages(value.message);
    if (message.length > 0) return message;

    const error = extractRawMessages(value.error);
    if (error.length > 0) return error;
  }

  return [];
};

const getErrorStatus = (error: unknown) =>
  (error as ErrorLike)?.response?.status;

export const getApiErrorMessage = (
  error: unknown,
  fallback = DEFAULT_MESSAGE
) => {
  const errorLike = error as ErrorLike;
  const rawMessages = extractRawMessages(errorLike?.response?.data);
  const translatedMessages = rawMessages
    .map(translateMessage)
    .filter(Boolean);

  if (translatedMessages.length > 0) {
    return Array.from(new Set(translatedMessages)).join(" ");
  }

  if (errorLike?.response?.statusText) {
    return translateMessage(errorLike.response.statusText);
  }

  if (
    errorLike?.request ||
    /network error/i.test(String(errorLike?.message || ""))
  ) {
    return NETWORK_MESSAGE;
  }

  if (
    errorLike?.message &&
    !/^request failed with status code/i.test(errorLike.message)
  ) {
    return translateMessage(errorLike.message);
  }

  return fallback;
};

export const getApiErrorTitle = (status?: number) => {
  if (status === 400 || status === 422) return "Проверьте данные";
  if (status === 401) return "Нужно войти заново";
  if (status === 403) return "Нет доступа";
  if (status === 404) return "Не найдено";
  if (status && status >= 500) return "Ошибка сервера";
  return "Ошибка backend";
};

export const buildApiErrorToastDetail = (
  error: unknown,
  fallback = DEFAULT_MESSAGE
): ApiErrorToastDetail => {
  const status = getErrorStatus(error);

  return {
    title: getApiErrorTitle(status),
    description: getApiErrorMessage(error, fallback),
    status,
  };
};

export const notifyApiError = (error: unknown) => {
  if (typeof window === "undefined") return;

  const detail = buildApiErrorToastDetail(error);
  const signature = `${detail.status || "no-status"}:${detail.description}`;
  const now = Date.now();

  if (signature === lastToastSignature && now - lastToastAt < DEDUPE_WINDOW_MS) {
    return;
  }

  lastToastSignature = signature;
  lastToastAt = now;

  window.dispatchEvent(
    new CustomEvent<ApiErrorToastDetail>(API_ERROR_TOAST_EVENT, { detail })
  );
};
