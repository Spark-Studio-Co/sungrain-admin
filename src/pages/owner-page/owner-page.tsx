"use client";

import type React from "react";
import { useState } from "react";
import { Layout } from "@/shared/ui/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCreateOwner } from "@/entities/owner/hooks/mutations/use-create-owner.mutation";
import { useUpdateOwner } from "@/entities/owner/hooks/mutations/use-update-owner.mutation";
import { useDeleteOwner } from "@/entities/owner/hooks/mutations/use-delete-owner.mutation";
import { useGetOwners } from "@/entities/owner/hooks/query/use-get-owners.query";

export default function OwnerPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newOwner, setNewOwner] = useState({
    owner: "",
  });

  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [deletingOwner, setDeletingOwner] = useState<any>(null);

  // Fetch owners using our real API hook
  const {
    data: ownersData,
    isLoading,
    isError,
    error,
  } = useGetOwners(page, limit, searchTerm);

  // Mutations using our real API hooks
  const createMutation = useCreateOwner();
  const updateMutation = useUpdateOwner();
  const deleteMutation = useDeleteOwner();

  // Extract pagination data
  const totalItems = ownersData?.total || 0;
  const currentPage = ownersData?.page || 1;
  const lastPage = ownersData?.lastPage || 1;
  const owners = ownersData?.data || [];

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleAddOwner = () => {
    createMutation.mutate(newOwner);
    setNewOwner({ owner: "" });
    setIsAddDialogOpen(false);
  };

  const handleEditOwner = () => {
    if (!editingOwner) return;

    updateMutation.mutate({
      id: editingOwner.id,
      data: { owner: editingOwner.owner },
    });
    setIsEditDialogOpen(false);
  };

  const handleDeleteOwner = () => {
    if (!deletingOwner) return;

    deleteMutation.mutate(deletingOwner.id);
    setIsDeleteDialogOpen(false);
  };

  const openEditDialog = (owner: any) => {
    setEditingOwner({
      ...owner,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (owner: any) => {
    setDeletingOwner(owner);
    setIsDeleteDialogOpen(true);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: string) => {
    const newLimitNum = Number(newLimit);
    setLimit(newLimitNum);

    // If current page would be out of bounds with new limit, go to last valid page
    const maxPage = Math.ceil(totalItems / newLimitNum);
    if (page > maxPage) {
      setPage(Math.max(1, maxPage));
    } else {
      setPage(1); // Reset to first page
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            УПРАВЛЕНИЕ СОБСТВЕННИКАМИ
          </h1>
        </div>

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message ||
                "Произошла ошибка при загрузке данных"}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск собственников..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить собственника
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Собственники вагонов</CardTitle>
            <CardDescription>
              Управление списком собственников вагонов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <Skeleton className="h-6 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : owners.length > 0 ? (
                  owners.map((owner) => (
                    <TableRow key={owner.id}>
                      <TableCell>{owner.id}</TableCell>
                      <TableCell className="font-medium">
                        {owner.owner}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(owner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(owner)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Собственники не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Показано {ownersData?.data?.length || 0} из{" "}
              {ownersData?.total || 0} записей
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Записей на странице:
                </span>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((limitOption) => (
                      <SelectItem
                        key={limitOption}
                        value={limitOption.toString()}
                      >
                        {limitOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                      className={
                        page <= 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {/* Page numbers */}
                  {(() => {
                    const totalPages = ownersData?.lastPage || 1;
                    const currentPage = page;
                    const pages = [];

                    if (totalPages <= 7) {
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      if (currentPage <= 3) {
                        pages.push(1, 2, 3, 4, 5, "...", totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        pages.push(
                          1,
                          "...",
                          totalPages - 4,
                          totalPages - 3,
                          totalPages - 2,
                          totalPages - 1,
                          totalPages
                        );
                      } else {
                        pages.push(
                          1,
                          "...",
                          currentPage - 1,
                          currentPage,
                          currentPage + 1,
                          "...",
                          totalPages
                        );
                      }
                    }

                    return pages.map((pageNum, index) => (
                      <PaginationItem key={index}>
                        {pageNum === "..." ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(Number(pageNum))}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ));
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                      className={
                        page >= (ownersData?.lastPage || 1)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardFooter>
        </Card>

        {/* Info about pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Показано {Math.min(limit, owners.length)} из {totalItems} записей
              (страница {currentPage} из {lastPage})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Записей на странице:
              </span>
              <Select
                value={limit.toString()}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Add Owner Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Добавить нового собственника</DialogTitle>
            <DialogDescription>
              Введите имя нового собственника вагонов
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="owner" className="font-medium">
                Имя собственника <span className="text-destructive">*</span>
              </Label>
              <Input
                id="owner"
                value={newOwner.owner}
                onChange={(e) =>
                  setNewOwner({ ...newOwner, owner: e.target.value })
                }
                placeholder="Имя"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleAddOwner}
              disabled={createMutation.isPending || !newOwner.owner.trim()}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить собственника"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Owner Dialog */}
      {editingOwner && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Редактировать собственника</DialogTitle>
              <DialogDescription>
                Редактирование собственника: {editingOwner.owner}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-owner" className="font-medium">
                  Имя собственника <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-owner"
                  value={editingOwner.owner}
                  onChange={(e) =>
                    setEditingOwner({
                      ...editingOwner,
                      owner: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleEditOwner}
                disabled={
                  updateMutation.isPending || !editingOwner.owner.trim()
                }
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingOwner && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить собственника</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить собственника "
                {deletingOwner.owner}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Это действие нельзя отменить. Собственник будет удален из
                системы.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteOwner}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Удаление...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
