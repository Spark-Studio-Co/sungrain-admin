"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrmEmptyState } from "@/components/ui/crm-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Edit3,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

interface UserTableProps {
  users: any[];
  isLoading: boolean;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
}

const getRoleLabel = (role?: string) => {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "admin") return "Администратор";
  if (normalizedRole === "accountant" || normalizedRole === "finance") {
    return "Финансы";
  }
  if (normalizedRole === "manager") return "Менеджер";
  if (normalizedRole === "logist") return "Логистика";
  if (normalizedRole === "user") return "Пользователь";

  return role || "Без роли";
};

const getRoleClassName = (role?: string) => {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "admin") {
    return "border-[#f2dfca] bg-[#fff3e5] text-[#d5740b]";
  }
  if (normalizedRole === "accountant" || normalizedRole === "finance") {
    return "border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]";
  }
  if (normalizedRole === "logist") {
    return "border-[#dfe7de] bg-[#eef5ef] text-[#2f6b4f]";
  }

  return "border-[#dfe7de] bg-[#fbfcfa] text-[#53605a]";
};

const getInitials = (user: any) => {
  const name = user.full_name || user.name || user.username || user.email || "";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return String(name).slice(0, 2).toUpperCase() || "US";
};

const getCompanyName = (companyRelation: any) =>
  companyRelation?.company?.name ||
  companyRelation?.name ||
  companyRelation?.companyName ||
  "Компания";

export default function UserTable({
  users,
  isLoading,
  onEdit,
  onDelete,
}: UserTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:hidden">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Card
                key={`mobile-skeleton-${index}`}
                className="rounded-md border-[#dfe7de] bg-white shadow-sm"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-11 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-44" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="crm-scrollbar hidden overflow-x-auto rounded-md border border-[#e5ece4] sm:block">
          <Table className="min-w-[920px]">
            <TableHeader className="bg-[#f7f8f5]">
              <TableRow className="border-[#e5ece4] hover:bg-[#f7f8f5]">
                <TableHead>Пользователь</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Компании</TableHead>
                <TableHead>Контракты</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={`desktop-skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-md" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-28 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-44 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-20 rounded-md" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-20 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <CrmEmptyState
          icon={UserRound}
          title="Пользователи не найдены"
          description="Попробуйте изменить поиск или фильтр роли."
        />
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 p-4 sm:hidden">
        {users.map((user: any) => (
          <Card
            key={user.id}
            className="rounded-md border-[#dfe7de] bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                    {getInitials(user)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[#223137]">
                      {user.full_name || user.name || "Без имени"}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#7b857f]">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-black ${getRoleClassName(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </Badge>
              </div>

              <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                  <Building2 className="h-3.5 w-3.5 text-[#2f6b4f]" />
                  Компании
                </div>
                {user.companies && user.companies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.companies.slice(0, 2).map((company: any, index: number) => (
                      <span
                        key={`${user.id}-company-${index}`}
                        className="rounded-md border border-[#dfe7de] bg-white px-2 py-1 text-xs font-bold text-[#53605a]"
                      >
                        {getCompanyName(company)}
                      </span>
                    ))}
                    {user.companies.length > 2 && (
                      <span className="rounded-md border border-[#dfe7de] bg-white px-2 py-1 text-xs font-bold text-[#7b857f]">
                        +{user.companies.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-[#7b857f]">Не указаны</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => onEdit(user)}
                  className="h-10 rounded-md border-[#dce4da] bg-white font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDelete(user)}
                  className="h-10 rounded-md border-[#f4d6ce] bg-white font-bold text-[#b9472d] hover:bg-[#fff1ed] hover:text-[#9f3925]"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="crm-scrollbar hidden overflow-x-auto sm:block">
        <Table className="min-w-[920px]">
          <TableHeader className="bg-[#f7f8f5]">
            <TableRow className="border-[#e5ece4] hover:bg-[#f7f8f5]">
              <TableHead className="h-11 px-5 text-xs font-black uppercase text-[#7b857f]">
                Пользователь
              </TableHead>
              <TableHead className="h-11 text-xs font-black uppercase text-[#7b857f]">
                Роль
              </TableHead>
              <TableHead className="h-11 text-xs font-black uppercase text-[#7b857f]">
                Компании
              </TableHead>
              <TableHead className="h-11 text-xs font-black uppercase text-[#7b857f]">
                Контракты
              </TableHead>
              <TableHead className="h-11 pr-5 text-right text-xs font-black uppercase text-[#7b857f]">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow
                key={user.id}
                className="border-[#edf1eb] transition-colors hover:bg-[#fbfcfa]"
              >
                <TableCell className="px-5 py-4">
                  <div className="flex min-w-[260px] items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                      {getInitials(user)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-black text-[#223137]">
                        {user.full_name || user.name || "Без имени"}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[#7b857f]">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`rounded-md px-2.5 py-1 text-xs font-black ${getRoleClassName(
                      user.role
                    )}`}
                  >
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    {getRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.companies && user.companies.length > 0 ? (
                    <div className="flex max-w-[360px] flex-wrap gap-1.5">
                      {user.companies.slice(0, 2).map((company: any, index: number) => (
                        <span
                          key={`${user.id}-desktop-company-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-2.5 py-1 text-xs font-bold text-[#53605a]"
                        >
                          <Building2 className="h-3.5 w-3.5 text-[#2f6b4f]" />
                          {getCompanyName(company)}
                        </span>
                      ))}
                      {user.companies.length > 2 && (
                        <span className="rounded-md border border-[#dfe7de] bg-white px-2.5 py-1 text-xs font-bold text-[#7b857f]">
                          +{user.companies.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-[#9aa49f]">
                      Не указаны
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-2.5 py-1 text-sm font-black text-[#223137]">
                    {user.userContracts?.length || 0}
                  </div>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(user)}
                      className="h-9 w-9 rounded-md border-[#dce4da] bg-white text-[#53605a] shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                      aria-label="Редактировать пользователя"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(user)}
                      className="h-9 w-9 rounded-md border-[#f4d6ce] bg-white text-[#b9472d] shadow-sm hover:bg-[#fff1ed] hover:text-[#9f3925]"
                      aria-label="Удалить пользователя"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
