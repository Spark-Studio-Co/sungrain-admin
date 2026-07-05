import type { AddUserRequest } from "@/entities/auth/api/post/register.api";

export type CreateUserFormState = {
  email: string;
  password: string;
  full_name: string;
  role: string;
  companyId: string[];
  contractIds: string[];
};

export const createUserRoles = [
  { value: "ADMIN", label: "Администратор" },
  { value: "USER", label: "Пользователь" },
  { value: "ACCOUNTANT", label: "Бухгалтер" },
];

const normalizeRole = (role: string) => role.trim().toUpperCase();

const normalizeCompanyId = (companyId: string) => {
  const numericId = Number(companyId);
  return Number.isFinite(numericId) ? numericId : companyId;
};

export const isCompanyRequiredForRole = (role: string) =>
  normalizeRole(role) !== "ACCOUNTANT";

export const getCreateUserValidationError = (
  form: CreateUserFormState
): string | null => {
  if (
    !form.email.trim() ||
    !form.password.trim() ||
    !form.full_name.trim() ||
    !form.role.trim()
  ) {
    return "Заполните email, пароль, ФИО и роль пользователя.";
  }

  if (isCompanyRequiredForRole(form.role) && form.companyId.length === 0) {
    return "Для этой роли выберите хотя бы одну компанию.";
  }

  return null;
};

export const buildCreateUserPayload = (
  form: CreateUserFormState
): AddUserRequest => {
  const payload: AddUserRequest = {
    email: form.email.trim(),
    password: form.password.trim(),
    full_name: form.full_name.trim(),
    role: normalizeRole(form.role),
  };

  const companyIds = form.companyId.filter(Boolean).map(normalizeCompanyId);
  const contractIds = form.contractIds.map((id) => id.trim()).filter(Boolean);

  if (companyIds.length > 0) {
    payload.companyId = companyIds;
  }

  if (contractIds.length > 0) {
    payload.contractIds = contractIds;
  }

  return payload;
};
