"use client";

import type React from "react";

import { useDeferredValue, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  CircleX,
  Clock3,
  Globe2,
  History,
  Laptop2,
  RefreshCw,
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useGetLoginAudits } from "@/entities/users/hooks/query/use-get-login-audits.query";
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

const formatLoginDate = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Almaty",
  }).format(new Date(value));

const getDeviceLabel = (userAgent: string | null) => {
  if (!userAgent) return "Устройство не определено";

  const browser = userAgent.includes("Edg/")
    ? "Edge"
    : userAgent.includes("Chrome/")
      ? "Chrome"
      : userAgent.includes("Safari/")
        ? "Safari"
        : userAgent.includes("Firefox/")
          ? "Firefox"
          : "Браузер";
  const system = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac OS")
      ? "macOS"
      : userAgent.includes("Android")
        ? "Android"
        : /iPhone|iPad/.test(userAgent)
          ? "iOS"
          : userAgent.includes("Linux")
            ? "Linux"
            : "неизвестная ОС";

  return `${browser} · ${system}`;
};

const getFailureLabel = (reason: string | null) => {
  if (reason === "INVALID_PASSWORD") return "Неверный пароль";
  if (reason === "USER_NOT_FOUND") return "Пользователь не найден";

  return "Вход отклонен";
};

export default function UsersBlock() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditStatus, setAuditStatus] = useState("all");
  const [auditLimit, setAuditLimit] = useState(50);
  const deferredAuditSearch = useDeferredValue(auditSearch);

  // API hooks
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useGetUsers({ page, limit });
  const {
    data: auditData,
    isLoading: isAuditLoading,
    isError: isAuditError,
    refetch: refetchAudits,
  } = useGetLoginAudits(
    {
      page: 1,
      limit: auditLimit,
      search: deferredAuditSearch,
      success: auditStatus,
    },
    activeTab === "audits",
  );

  // Extract pagination data
  const totalItems = usersData?.total || 0;
  const users = usersData?.data || [];
  const uniqueRoles = Array.from(
    new Set(
      users
        .map((user: any) => String(user.role || ""))
        .filter((role: string) => role.length > 0),
    ),
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
    ["admin", "ADMIN"].includes(String(user.role)),
  ).length;
  const companiesCount = new Set(
    users.flatMap((user: any) =>
      (user.companies || [])
        .map((companyRelation: any) =>
          String(
            companyRelation.company?.id || companyRelation.companyId || "",
          ),
        )
        .filter(Boolean),
    ),
  ).size;
  const assignedContractsCount = users.reduce(
    (sum: number, user: any) => sum + (user.userContracts?.length || 0),
    0,
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

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-md border border-[#dfe7de] bg-[#f5f7f3] p-1.5 shadow-[0_12px_28px_rgba(34,49,55,0.05)]">
            <TabsTrigger
              value="users"
              className="gap-2 rounded-md border border-transparent py-2.5 text-sm font-black text-[#6f7774] data-[state=active]:border-[#f2b765] data-[state=active]:!text-white data-[state=active]:[&_svg]:!text-white"
            >
              <UsersRound className="h-4 w-4" />
              Пользователи
            </TabsTrigger>
            <TabsTrigger
              value="audits"
              className="gap-2 rounded-md border border-transparent py-2.5 text-sm font-black text-[#6f7774] data-[state=active]:border-[#f2b765] data-[state=active]:!text-white data-[state=active]:[&_svg]:!text-white"
            >
              <History className="h-4 w-4" />
              Журнал входов
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0">
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
          </TabsContent>

          <TabsContent value="audits" className="mt-0 space-y-4">
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-[#dce8dc] bg-white p-4 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase text-[#7b857f]">
                    Успешно
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-[#2f6b4f]" />
                </div>
                <div className="mt-3 text-2xl font-black text-[#2f6b4f] tabular-nums">
                  {auditData?.stats.successful || 0}
                </div>
              </div>
              <div className="rounded-md border border-[#f4d6ce] bg-white p-4 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase text-[#7b857f]">
                    Отклонено
                  </span>
                  <CircleX className="h-5 w-5 text-[#b9472d]" />
                </div>
                <div className="mt-3 text-2xl font-black text-[#b9472d] tabular-nums">
                  {auditData?.stats.failed || 0}
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase text-[#7b857f]">
                    За 24 часа
                  </span>
                  <Clock3 className="h-5 w-5 text-[#527f95]" />
                </div>
                <div className="mt-3 text-2xl font-black text-[#223137] tabular-nums">
                  {auditData?.stats.recent || 0}
                </div>
              </div>
              <div className="rounded-md border border-[#f2dfca] bg-white p-4 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase text-[#7b857f]">
                    IP-адресов
                  </span>
                  <Globe2 className="h-5 w-5 text-[#d5740b]" />
                </div>
                <div className="mt-3 text-2xl font-black text-[#223137] tabular-nums">
                  {auditData?.stats.uniqueIps || 0}
                </div>
              </div>
            </div>

            <Card className="sungrain-analytics-card overflow-hidden">
              <CardHeader className="border-b border-[#e5ece4] bg-white px-4 py-4 sm:px-5 lg:px-6">
                <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl font-black text-[#223137]">
                      <Activity className="h-5 w-5 text-[#f38810]" />
                      Журнал входов
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-[#6f7774]">
                      Кто, когда и с какого IP входил в CRM.
                    </CardDescription>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_190px_auto] sm:items-center">
                    <div className="relative min-w-0">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                      <Input
                        value={auditSearch}
                        onChange={(event) => setAuditSearch(event.target.value)}
                        placeholder="Поиск по имени, email или IP..."
                        className="h-10 rounded-md border-[#dce4da] bg-white pl-10 shadow-sm"
                      />
                    </div>
                    <Select value={auditStatus} onValueChange={setAuditStatus}>
                      <SelectTrigger className="!h-10 min-h-10 rounded-md border-[#dce4da] bg-white font-bold text-[#223137] shadow-sm">
                        <SelectValue placeholder="Все попытки" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все попытки</SelectItem>
                        <SelectItem value="true">Успешные</SelectItem>
                        <SelectItem value="false">Отклоненные</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => refetchAudits()}
                      className="size-10 rounded-md border-[#dce4da] text-[#53605a] shadow-sm"
                      title="Обновить журнал"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[960px]">
                    <TableHeader className="bg-[#f7f8f5]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-5">Пользователь</TableHead>
                        <TableHead>IP-адрес</TableHead>
                        <TableHead>Устройство</TableHead>
                        <TableHead>Дата и время</TableHead>
                        <TableHead className="pr-5 text-right">
                          Результат
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isAuditLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-32 text-center text-[#7b857f]"
                          >
                            Загружаем журнал входов...
                          </TableCell>
                        </TableRow>
                      ) : isAuditError ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-32 text-center text-[#b9472d]"
                          >
                            Не удалось загрузить журнал входов.
                          </TableCell>
                        </TableRow>
                      ) : auditData?.data.length ? (
                        auditData.data.map((audit) => (
                          <TableRow
                            key={audit.id}
                            className="hover:bg-[#f8faf7]"
                          >
                            <TableCell className="pl-5">
                              <div className="font-black text-[#223137]">
                                {audit.user?.full_name || audit.email}
                              </div>
                              <div className="mt-0.5 text-xs text-[#7b857f]">
                                {audit.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-2 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-2.5 py-1.5 font-mono text-xs font-bold text-[#31413b]">
                                <Globe2 className="h-3.5 w-3.5 text-[#2f6b4f]" />
                                {audit.ipAddress}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm font-semibold text-[#53605a]">
                                <Laptop2 className="h-4 w-4 text-[#8a928f]" />
                                {getDeviceLabel(audit.userAgent)}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-[#53605a]">
                              {formatLoginDate(audit.createdAt)}
                            </TableCell>
                            <TableCell className="pr-5 text-right">
                              {audit.success ? (
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-2.5 py-1.5 text-xs font-black text-[#2f6b4f]">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Вход выполнен
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-md border border-[#f4d6ce] bg-[#fff1ed] px-2.5 py-1.5 text-xs font-black text-[#b9472d]">
                                  <CircleX className="h-3.5 w-3.5" />
                                  {getFailureLabel(audit.failureReason)}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-36 text-center text-[#7b857f]"
                          >
                            Журнал пока пуст. Новые входы появятся здесь
                            автоматически.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
                <AdminPageSizeControl
                  value={auditLimit}
                  onChange={setAuditLimit}
                  totalItems={auditData?.total || 0}
                  visibleItems={auditData?.data.length || 0}
                  itemLabel="записей"
                />
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
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
