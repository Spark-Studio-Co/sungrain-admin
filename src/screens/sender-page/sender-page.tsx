"use client";

import type React from "react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { CreateSenderData } from "@/entities/sender/api/create/create-sender.api";
import type { Sender } from "@/entities/sender/api/get/get-senders.api";
import type { UpdateSenderData } from "@/entities/sender/api/update/update-sender.api";
import { useCreateSender } from "@/entities/sender/hooks/mutations/use-create-sender.mutation";
import { useDeleteSender } from "@/entities/sender/hooks/mutations/use-delete-sender.mutation";
import { useUpdateSender } from "@/entities/sender/hooks/mutations/use-update-sender.mutation";
import { useGetSenders } from "@/entities/sender/hooks/query/use-get-senders.query";
import {
  AlertTriangle,
  Building2,
  Edit3,
  Hash,
  Loader2,
  PackageCheck,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

const inputClassName =
  "h-11 rounded-md border-[#dce4da] bg-white text-[#223137] shadow-sm focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";

const getSenderInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "ГО";

function SenderTable({
  senders,
  isLoading,
  onEdit,
  onDelete,
}: {
  senders: Sender[];
  isLoading: boolean;
  onEdit: (sender: Sender) => void;
  onDelete: (sender: Sender) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:hidden">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Card
                key={`mobile-sender-skeleton-${index}`}
                className="rounded-md border-[#dfe7de] bg-white shadow-sm"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-11 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="hidden overflow-hidden rounded-md border border-[#e5ece4] sm:block">
          <table className="w-full">
            <thead className="bg-[#f7f8f5]">
              <tr className="border-b border-[#e5ece4]">
                <th className="h-11 px-5 text-left text-xs font-black uppercase text-[#7b857f]">
                  Грузоотправитель
                </th>
                <th className="h-11 text-left text-xs font-black uppercase text-[#7b857f]">
                  ID
                </th>
                <th className="h-11 text-left text-xs font-black uppercase text-[#7b857f]">
                  Статус
                </th>
                <th className="h-11 pr-5 text-right text-xs font-black uppercase text-[#7b857f]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <tr key={`desktop-sender-skeleton-${index}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-md" />
                        <Skeleton className="h-5 w-56" />
                      </div>
                    </td>
                    <td>
                      <Skeleton className="h-7 w-20 rounded-md" />
                    </td>
                    <td>
                      <Skeleton className="h-7 w-24 rounded-md" />
                    </td>
                    <td>
                      <Skeleton className="ml-auto h-9 w-24 rounded-md" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (senders.length === 0) {
    return (
      <div className="px-4 py-12 text-center sm:px-6">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
          <Send className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-black text-[#223137]">
          Грузоотправители не найдены
        </h3>
        <p className="mt-1 text-sm text-[#7b857f]">
          Попробуйте изменить поисковый запрос или добавьте нового партнера.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 p-4 sm:hidden">
        {senders.map((sender) => (
          <Card
            key={sender.id}
            className="rounded-md border-[#dfe7de] bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                    {getSenderInitials(sender.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[#223137]">
                      {sender.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#7b857f]">
                      <Hash className="h-3.5 w-3.5" />
                      ID {sender.id}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-md border-[#dce8dc] bg-[#f5faf5] px-2 py-1 text-[11px] font-black text-[#2f6b4f]"
                >
                  Активен
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => onEdit(sender)}
                  className="h-10 rounded-md border-[#dce4da] bg-white font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDelete(sender)}
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

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full">
          <thead className="bg-[#f7f8f5]">
            <tr className="border-b border-[#e5ece4]">
              <th className="h-11 px-5 text-left text-xs font-black uppercase text-[#7b857f]">
                Грузоотправитель
              </th>
              <th className="h-11 text-left text-xs font-black uppercase text-[#7b857f]">
                ID
              </th>
              <th className="h-11 text-left text-xs font-black uppercase text-[#7b857f]">
                Статус
              </th>
              <th className="h-11 pr-5 text-right text-xs font-black uppercase text-[#7b857f]">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {senders.map((sender) => (
              <tr
                key={sender.id}
                className="border-b border-[#edf1eb] transition-colors hover:bg-[#fbfcfa]"
              >
                <td className="px-5 py-4">
                  <div className="flex min-w-[280px] items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                      {getSenderInitials(sender.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-black text-[#223137]">
                        {sender.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[#7b857f]">
                        <Send className="h-3.5 w-3.5" />
                        Грузоотправитель
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-2.5 py-1 text-sm font-black text-[#53605a]">
                    <Hash className="h-3.5 w-3.5 text-[#8a928f]" />
                    {sender.id}
                  </span>
                </td>
                <td>
                  <Badge
                    variant="outline"
                    className="rounded-md border-[#dce8dc] bg-[#f5faf5] px-2.5 py-1 text-xs font-black text-[#2f6b4f]"
                  >
                    Активен
                  </Badge>
                </td>
                <td className="pr-5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(sender)}
                      className="h-9 w-9 rounded-md border-[#dce4da] bg-white text-[#53605a] shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                      aria-label="Редактировать грузоотправителя"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(sender)}
                      className="h-9 w-9 rounded-md border-[#f4d6ce] bg-white text-[#b9472d] shadow-sm hover:bg-[#fff1ed] hover:text-[#9f3925]"
                      aria-label="Удалить грузоотправителя"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SenderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newSender, setNewSender] = useState<CreateSenderData>({ name: "" });
  const [editingSender, setEditingSender] = useState<Sender | null>(null);
  const [deletingSender, setDeletingSender] = useState<Sender | null>(null);

  const { data, isLoading, isError, error } = useGetSenders(page, limit);
  const createMutation = useCreateSender();
  const updateMutation = useUpdateSender();
  const deleteMutation = useDeleteSender();

  const senders = data?.data || [];
  const filteredSenders = senders.filter((sender) =>
    sender.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );
  const totalItems = data?.total || 0;
  const currentPage = data?.page || 1;
  const lastPage = data?.totalPages || Math.ceil(totalItems / limit) || 1;
  const visibleCount = filteredSenders.length;
  const startIndex =
    totalItems === 0 || visibleCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIndex =
    totalItems === 0 || visibleCount === 0
      ? 0
      : Math.min((currentPage - 1) * limit + visibleCount, totalItems);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > lastPage) return;
    setPage(newPage);
  };

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1);
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    if (!open) setNewSender({ name: "" });
    setIsAddDialogOpen(open);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) setEditingSender(null);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) setDeletingSender(null);
  };

  const handleAddSender = () => {
    const name = newSender.name.trim();
    if (!name) return;

    createMutation.mutate(
      { name },
      {
        onSuccess: () => {
          setNewSender({ name: "" });
          setIsAddDialogOpen(false);
        },
      }
    );
  };

  const handleEditSender = () => {
    if (!editingSender?.name.trim()) return;

    const updateData: UpdateSenderData = {
      id: editingSender.id,
      name: editingSender.name.trim(),
    };

    updateMutation.mutate(updateData, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingSender(null);
      },
    });
  };

  const handleDeleteSender = () => {
    if (!deletingSender) return;

    deleteMutation.mutate(deletingSender.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setDeletingSender(null);
      },
    });
  };

  const openEditDialog = (sender: Sender) => {
    setEditingSender({ ...sender });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (sender: Sender) => {
    setDeletingSender(sender);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4 px-0">
        {isError && (
          <Alert variant="destructive" className="rounded-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message ||
                "Произошла ошибка при загрузке данных"}
            </AlertDescription>
          </Alert>
        )}

        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                  <Send className="h-3.5 w-3.5" />
                  Логистика отправки
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-[#223137]">
                  Грузоотправители
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm text-[#6f7774]">
                  Управление компаниями, которые отгружают продукцию по
                  контрактам SUNGRAIN.
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
                    отправителей
                  </div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Найдено
                  </div>
                  <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                    {visibleCount}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">на странице</div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Страница
                  </div>
                  <div className="mt-1 text-lg font-black text-[#d5740b]">
                    {currentPage}/{lastPage}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">реестра</div>
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
                      Реестр
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {totalItems}
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
                      Активные
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {visibleCount}
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
                      Роль
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      Отгрузка
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <PackageCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Лимит
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {limit}
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
            <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-center">
              <div className="min-w-0">
                <CardTitle className="text-xl font-black text-[#223137] xl:whitespace-nowrap">
                  Реестр грузоотправителей
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-[#6f7774]">
                  Поиск и управление партнерами отправки.
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto] sm:items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    placeholder="Поиск грузоотправителей..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="h-10 rounded-md border-[#dce4da] bg-white pl-10 text-[#223137] shadow-sm"
                  />
                </div>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="h-10 w-full gap-2 rounded-md bg-[#f38810] px-4 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c] sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Добавить грузоотправителя
                  </span>
                  <span className="sm:hidden">Добавить</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0">
            <SenderTable
              senders={filteredSenders}
              isLoading={isLoading}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
            {lastPage > 1 && (
              <div className="flex w-full items-center justify-between gap-3 sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-10 rounded-md border border-[#dce4da] bg-white px-4 text-sm font-bold text-[#53605a] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Назад
                </button>
                <div className="rounded-md border border-[#dfe7de] bg-white px-3 py-2 text-sm font-black text-[#223137]">
                  {currentPage} / {lastPage}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= lastPage}
                  className="h-10 rounded-md border border-[#dce4da] bg-white px-4 text-sm font-bold text-[#53605a] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            )}

            {lastPage > 1 && (
              <div className="hidden w-full justify-center sm:flex">
                <Pagination>
                  <PaginationContent className="flex-wrap gap-1">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "rounded-md border-[#dce4da] bg-white text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                        }
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                      let pageNumber;
                      if (lastPage <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= lastPage - 2) {
                        pageNumber = lastPage - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              handlePageChange(pageNumber);
                            }}
                            isActive={currentPage === pageNumber}
                            className={`min-w-[40px] rounded-md ${
                              currentPage === pageNumber
                                ? "bg-[#f38810] text-white hover:bg-[#db790c] hover:text-white"
                                : "border-[#dce4da] bg-white text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                            }`}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    {lastPage > 5 && currentPage < lastPage - 2 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              handlePageChange(lastPage);
                            }}
                            isActive={currentPage === lastPage}
                            className="min-w-[40px] rounded-md border-[#dce4da] bg-white text-[#53605a]"
                          >
                            {lastPage}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage >= lastPage
                            ? "pointer-events-none opacity-50"
                            : "rounded-md border-[#dce4da] bg-white text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            <div className="flex w-full flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center text-[#7b857f] sm:text-left">
                Показано{" "}
                <span className="font-black text-[#223137]">
                  {startIndex}-{endIndex}
                </span>{" "}
                из <span className="font-black text-[#223137]">{totalItems}</span>{" "}
                записей
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold text-[#7b857f]">
                  На странице:
                </span>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="h-9 w-[82px] rounded-md border-[#dce4da] bg-white font-bold text-[#223137]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] !max-w-[520px] gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
          <DialogHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
              <Send className="h-3.5 w-3.5" />
              Новый отправитель
            </div>
            <DialogTitle className="text-2xl font-black text-[#223137]">
              Добавить грузоотправителя
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6f7774]">
              Создайте партнера для выбора в контрактах и заявках.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="sender-name" className="font-black text-[#223137]">
                Название грузоотправителя{" "}
                <span className="text-[#f38810]">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                <Input
                  id="sender-name"
                  value={newSender.name}
                  onChange={(event) =>
                    setNewSender({ ...newSender, name: event.target.value })
                  }
                  placeholder="ТОО Северный элеватор"
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-5 py-4">
            <Button
              variant="outline"
              onClick={() => handleAddDialogOpenChange(false)}
              className="h-10 w-full rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f] sm:w-auto"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              onClick={handleAddSender}
              disabled={createMutation.isPending || !newSender.name.trim()}
              className="h-10 w-full rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить грузоотправителя"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingSender && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogOpenChange}
        >
          <DialogContent className="w-[calc(100vw-2rem)] !max-w-[520px] gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
            <DialogHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14">
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                <Send className="h-3.5 w-3.5" />
                Грузоотправитель
              </div>
              <DialogTitle className="text-2xl font-black text-[#223137]">
                Редактировать грузоотправителя
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6f7774]">
                Редактирование партнера: {editingSender.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-sender-name"
                  className="font-black text-[#223137]"
                >
                  Название грузоотправителя{" "}
                  <span className="text-[#f38810]">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    id="edit-sender-name"
                    value={editingSender.name}
                    onChange={(event) =>
                      setEditingSender({
                        ...editingSender,
                        name: event.target.value,
                      })
                    }
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-5 py-4">
              <Button
                variant="outline"
                onClick={() => handleEditDialogOpenChange(false)}
                className="h-10 w-full rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f] sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleEditSender}
                disabled={
                  updateMutation.isPending || !editingSender.name.trim()
                }
                className="h-10 w-full rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deletingSender && (
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogOpenChange}
        >
          <DialogContent className="w-[calc(100vw-2rem)] !max-w-[480px] gap-0 overflow-hidden rounded-md border-[#f4d6ce] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
            <DialogHeader className="border-b border-[#f4d6ce] bg-[#fff8f6] px-5 py-5 pr-14">
              <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-[#fff1ed] text-[#b9472d]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-black text-[#223137]">
                Удалить грузоотправителя
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6f7774]">
                Вы уверены, что хотите удалить грузоотправителя "
                {deletingSender.name}"?
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 py-5">
              <p className="rounded-md border border-[#f4d6ce] bg-[#fff8f6] px-4 py-3 text-sm font-medium text-[#7b857f]">
                Это действие нельзя отменить. Партнер будет удален из
                справочника отправителей.
              </p>
            </div>

            <DialogFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-5 py-4">
              <Button
                variant="outline"
                onClick={() => handleDeleteDialogOpenChange(false)}
                className="h-10 w-full rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f] sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSender}
                disabled={deleteMutation.isPending}
                className="h-10 w-full rounded-md bg-[#b9472d] px-5 font-black text-white shadow-[0_10px_24px_rgba(185,71,45,0.20)] hover:bg-[#9f3925] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
