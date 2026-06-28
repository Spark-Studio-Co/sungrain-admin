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
import { AdminPageSizeControl } from "@/components/ui/admin-page-size-control";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Boxes,
  Edit3,
  Hash,
  Loader2,
  Plus,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Truck,
} from "lucide-react";
import { useCreateOwner } from "@/entities/owner/hooks/mutations/use-create-owner.mutation";
import { useUpdateOwner } from "@/entities/owner/hooks/mutations/use-update-owner.mutation";
import { useDeleteOwner } from "@/entities/owner/hooks/mutations/use-delete-owner.mutation";
import { useGetOwners } from "@/entities/owner/hooks/query/use-get-owners.query";

interface Owner {
  id: number;
  owner: string;
}

const inputClassName =
  "h-11 rounded-md border-[#dce4da] bg-white text-[#223137] shadow-sm focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "OW";

function OwnerTable({
  owners,
  isLoading,
  onEdit,
  onDelete,
}: {
  owners: Owner[];
  isLoading: boolean;
  onEdit: (owner: Owner) => void;
  onDelete: (owner: Owner) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:hidden">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Card
                key={`mobile-owner-skeleton-${index}`}
                className="rounded-md border-[#dfe7de] bg-white shadow-sm"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-11 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
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
          <table className="min-w-[720px] w-full">
            <thead className="bg-[#f7f8f5]">
              <tr className="border-b border-[#e5ece4]">
                <th className="h-11 px-5 text-left text-xs font-black uppercase text-[#7b857f]">
                  Собственник
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
                  <tr key={`desktop-owner-skeleton-${index}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-md" />
                        <Skeleton className="h-5 w-52" />
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

  if (owners.length === 0) {
    return (
      <div className="px-4 py-12 text-center sm:px-6">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
          <Truck className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-black text-[#223137]">
          Собственники не найдены
        </h3>
        <p className="mt-1 text-sm text-[#7b857f]">
          Попробуйте изменить поисковый запрос.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 p-4 sm:hidden">
        {owners.map((owner) => (
          <Card
            key={owner.id}
            className="rounded-md border-[#dfe7de] bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                    {getInitials(owner.owner)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[#223137]">
                      {owner.owner}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#7b857f]">
                      <Hash className="h-3.5 w-3.5" />
                      ID {owner.id}
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
                  onClick={() => onEdit(owner)}
                  className="h-10 rounded-md border-[#dce4da] bg-white font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Изменить
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDelete(owner)}
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
        <table className="min-w-[720px] w-full">
          <thead className="bg-[#f7f8f5]">
            <tr className="border-b border-[#e5ece4]">
              <th className="h-11 px-5 text-left text-xs font-black uppercase text-[#7b857f]">
                Собственник
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
            {owners.map((owner) => (
              <tr
                key={owner.id}
                className="border-b border-[#edf1eb] transition-colors hover:bg-[#fbfcfa]"
              >
                <td className="px-5 py-4">
                  <div className="flex min-w-[260px] items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                      {getInitials(owner.owner)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-black text-[#223137]">
                        {owner.owner}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[#7b857f]">
                        <Truck className="h-3.5 w-3.5" />
                        Собственник вагонов
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-2.5 py-1 text-sm font-black text-[#53605a]">
                    <Hash className="h-3.5 w-3.5 text-[#8a928f]" />
                    {owner.id}
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
                      onClick={() => onEdit(owner)}
                      className="h-9 w-9 rounded-md border-[#dce4da] bg-white text-[#53605a] shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                      aria-label="Редактировать собственника"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(owner)}
                      className="h-9 w-9 rounded-md border-[#f4d6ce] bg-white text-[#b9472d] shadow-sm hover:bg-[#fff1ed] hover:text-[#9f3925]"
                      aria-label="Удалить собственника"
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

export default function OwnerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newOwner, setNewOwner] = useState({ owner: "" });
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [deletingOwner, setDeletingOwner] = useState<Owner | null>(null);

  const {
    data: ownersData,
    isLoading,
    isError,
    error,
  } = useGetOwners(page, limit, searchTerm);

  const createMutation = useCreateOwner();
  const updateMutation = useUpdateOwner();
  const deleteMutation = useDeleteOwner();

  const totalItems = ownersData?.total || 0;
  const owners = (ownersData?.data || []) as Owner[];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleAddOwner = () => {
    if (!newOwner.owner.trim()) return;

    createMutation.mutate(newOwner, {
      onSuccess: () => {
        setNewOwner({ owner: "" });
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleEditOwner = () => {
    if (!editingOwner?.owner.trim()) return;

    updateMutation.mutate(
      {
        id: editingOwner.id,
        data: { owner: editingOwner.owner },
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setEditingOwner(null);
        },
      }
    );
  };

  const handleDeleteOwner = () => {
    if (!deletingOwner) return;

    deleteMutation.mutate(deletingOwner.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setDeletingOwner(null);
      },
    });
  };

  const openEditDialog = (owner: Owner) => {
    setEditingOwner({ ...owner });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (owner: Owner) => {
    setDeletingOwner(owner);
    setIsDeleteDialogOpen(true);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    if (!open) setNewOwner({ owner: "" });
    setIsAddDialogOpen(open);
  };

  return (
    <>
      <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden px-0">
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
                  <Truck className="h-3.5 w-3.5" />
                  Вагонный парк
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-[#223137]">
                  Собственники
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm text-[#6f7774]">
                  Управление собственниками вагонов и перевозчиками,
                  участвующими в логистике SUNGRAIN.
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
                    собственников
                  </div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    На экране
                  </div>
                  <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                    {owners.length}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">записей</div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Лимит
                  </div>
                  <div className="mt-1 text-lg font-black text-[#d5740b]">
                    {limit}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">на экране</div>
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
                    <Truck className="h-5 w-5" />
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
                      {owners.length}
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
                      Направление
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      Вагоны
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <Boxes className="h-5 w-5" />
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
            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-center">
              <div className="min-w-0">
                <CardTitle className="text-xl font-black text-[#223137] xl:whitespace-nowrap">
                  Реестр собственников
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-[#6f7774]">
                  Поиск и управление собственниками вагонов.
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto] sm:items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    placeholder="Поиск собственников..."
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
                  <span className="hidden sm:inline">Добавить собственника</span>
                  <span className="sm:hidden">Добавить</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0">
            <OwnerTable
              owners={owners}
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
              visibleItems={owners.length}
              itemLabel="собственников"
            />
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] !max-w-[520px] gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
          <DialogHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
              <Truck className="h-3.5 w-3.5" />
              Новый собственник
            </div>
            <DialogTitle className="text-2xl font-black text-[#223137]">
              Добавить собственника
            </DialogTitle>
            <DialogDescription className="text-sm text-[#6f7774]">
              Создайте новую запись для вагонного парка.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label htmlFor="owner" className="font-black text-[#223137]">
                Имя собственника <span className="text-[#f38810]">*</span>
              </Label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                <Input
                  id="owner"
                  value={newOwner.owner}
                  onChange={(e) =>
                    setNewOwner({ ...newOwner, owner: e.target.value })
                  }
                  placeholder="KTZ Express"
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
              onClick={handleAddOwner}
              disabled={createMutation.isPending || !newOwner.owner.trim()}
              className="h-10 w-full rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить собственника"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingOwner && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setEditingOwner(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-2rem)] !max-w-[520px] gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
            <DialogHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14">
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                <Truck className="h-3.5 w-3.5" />
                Собственник
              </div>
              <DialogTitle className="text-2xl font-black text-[#223137]">
                Редактировать собственника
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6f7774]">
                Редактирование записи: {editingOwner.owner}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-5 py-5">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-owner"
                  className="font-black text-[#223137]"
                >
                  Имя собственника <span className="text-[#f38810]">*</span>
                </Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    id="edit-owner"
                    value={editingOwner.owner}
                    onChange={(e) =>
                      setEditingOwner({
                        ...editingOwner,
                        owner: e.target.value,
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
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingOwner(null);
                }}
                className="h-10 w-full rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f] sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleEditOwner}
                disabled={
                  updateMutation.isPending || !editingOwner.owner.trim()
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

      {deletingOwner && (
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setDeletingOwner(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-2rem)] !max-w-[480px] gap-0 overflow-hidden rounded-md border-[#f4d6ce] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
            <DialogHeader className="border-b border-[#f4d6ce] bg-[#fff8f6] px-5 py-5 pr-14">
              <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-[#fff1ed] text-[#b9472d]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-black text-[#223137]">
                Удалить собственника
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6f7774]">
                Вы уверены, что хотите удалить собственника "
                {deletingOwner.owner}"?
              </DialogDescription>
            </DialogHeader>

            <div className="px-5 py-5">
              <p className="rounded-md border border-[#f4d6ce] bg-[#fff8f6] px-4 py-3 text-sm font-medium text-[#7b857f]">
                Это действие нельзя отменить. Собственник будет удален из
                системы.
              </p>
            </div>

            <DialogFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-5 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeletingOwner(null);
                }}
                className="h-10 w-full rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f] sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOwner}
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
