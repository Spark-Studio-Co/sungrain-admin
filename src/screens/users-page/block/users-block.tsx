"use client";

import type React from "react";

import { useState } from "react";
import {
  Building2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  UsersRound,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CrmErrorState } from "@/components/ui/crm-state";
import { AdminPageSizeControl } from "@/components/ui/admin-page-size-control";
import { useGetUsers } from "@/entities/users/hooks/query/use-get-users.query";
import AddUserDialog from "./add-user-dialog";
import UserTable from "./user-table";
import EditUserDialog from "./edit-user-dialog";
import DeleteUserDialog from "./delete-user-dialog";

const getRoleLabel = (role: string) => {
  const normalizedRole = role.toLowerCase();

  if (normalizedRole === "admin") return "Администратор";
  if (normalizedRole === "accountant" || normalizedRole === "finance") {
    return "Финансы";
  }
  if (normalizedRole === "manager") return "Менеджер";
  if (normalizedRole === "logist") return "Логистика";
  if (normalizedRole === "user") return "Пользователь";

  return role;
};

export default function UsersBlock() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState("all");

  // API hooks
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useGetUsers({ page, limit });

  // Extract pagination data
  const totalItems = usersData?.total || 0;
  const users = usersData?.data || [];
  const uniqueRoles = Array.from(
    new Set(
      users
        .map((user: any) => String(user.role || ""))
        .filter((role: string) => role.length > 0)
    )
  );

  // Filter users based on search term
  const filteredUsers =
    users?.filter((user: any) => {
      const matchesSearch =
        !searchTerm ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    }) || [];
  const adminsCount = users.filter((user: any) =>
    ["admin", "ADMIN"].includes(String(user.role))
  ).length;
  const companiesCount = new Set(
    users.flatMap((user: any) =>
      (user.companies || [])
        .map((companyRelation: any) =>
          String(companyRelation.company?.id || companyRelation.companyId || "")
        )
        .filter(Boolean)
    )
  ).size;
  const assignedContractsCount = users.reduce(
    (sum: number, user: any) => sum + (user.userContracts?.length || 0),
    0
  );

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleLimitChange = (value: number) => {
    setLimit(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setPage(1);
  };

  const openEditDialog = (user: any) => {
    setSelectedUserId(user.id);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: any) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden px-0">
        {isError && (
          <CrmErrorState
            className="min-h-[10rem]"
            title="Ошибка загрузки пользователей"
            description={
              (error as Error)?.message ||
              "Произошла ошибка при загрузке данных"
            }
          />
        )}

        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-bold uppercase text-[#2f6b4f]">
                  <UsersRound className="h-3.5 w-3.5" />
                  Центр доступа
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-[#223137]">
                  Пользователи
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm text-[#6f7774]">
                  Управление ролями, компаниями и доступом команды к CRM.
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[620px]">
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Всего
                  </div>
                  <div className="mt-1 text-lg font-black text-[#223137]">
                    {totalItems}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    пользователей
                  </div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Администраторы
                  </div>
                  <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                    {adminsCount}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    полный доступ
                  </div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Компании
                  </div>
                  <div className="mt-1 text-lg font-black text-[#d5740b]">
                    {companiesCount}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    назначено
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Аккаунты
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {filteredUsers.length}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Роли
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {uniqueRoles.length || 0}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Компании
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {companiesCount}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Контракты
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {assignedContractsCount}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-white px-4 py-4 sm:px-5 lg:px-6">
            <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-center">
              <div className="min-w-0">
                <CardTitle className="text-xl font-black text-[#223137] xl:whitespace-nowrap">
                  Реестр пользователей
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-[#6f7774]">
                  Поиск, фильтрация и управление доступом пользователей.
                </CardDescription>
              </div>
              <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_180px_auto] xl:items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    placeholder="Поиск по имени, email или username..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="h-10 rounded-md border-[#dce4da] bg-white pl-10 text-[#223137] shadow-sm"
                  />
                </div>
                <Select
                  value={roleFilter}
                  onValueChange={handleRoleFilterChange}
                >
                  <SelectTrigger className="!h-10 min-h-10 w-full rounded-md border-[#dce4da] bg-white font-bold text-[#223137] shadow-sm">
                    <SelectValue placeholder="Все роли" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все роли</SelectItem>
                    {uniqueRoles.map((role: string) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div>
                  <AddUserDialog
                    isOpen={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <UserTable
              users={filteredUsers}
              isLoading={isLoading}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          </CardContent>
          <CardFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
            <AdminPageSizeControl
              value={limit}
              onChange={handleLimitChange}
              totalItems={totalItems}
              visibleItems={filteredUsers.length}
              itemLabel="пользователей"
            />
          </CardFooter>
        </Card>
      </div>

      {selectedUserId && (
        <EditUserDialog
          userId={selectedUserId}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        />
      )}
    </>
  );
}
