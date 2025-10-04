"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Layout } from "@/shared/ui/layout";
import {
  Card,
  CardContent,
  CardDescription,
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

// Import React Query hooks
import { useCreateReceiver } from "@/entities/receiver/hooks/mutations/use-create-receiver.mutation";
import { useUpdateReceiver } from "@/entities/receiver/hooks/mutations/use-update-receiver.mutation";
import { useDeleteReceiver } from "@/entities/receiver/hooks/mutations/use-delete-receiver.mutation";
import type { CreateReceiverData } from "@/entities/receiver/api/create/create-receiver.api";
import type { UpdateReceiverData } from "@/entities/receiver/api/update/update-receiver.api";
import { useGetReceivers } from "@/entities/receiver/hooks/query/use-get-receiver.query";

// Types
interface Receiver {
  id: string;
  name: string;
}

export default function ReceiversPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [newReceiver, setNewReceiver] = useState<CreateReceiverData>({
    name: "",
  });

  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [deletingReceiver, setDeletingReceiver] = useState<Receiver | null>(
    null
  );

  // React Query hooks
  const { data, isLoading, isError, error } = useGetReceivers(
    page,
    limit,
    debouncedSearchTerm
  );
  const createMutation = useCreateReceiver();
  const updateMutation = useUpdateReceiver();
  const deleteMutation = useDeleteReceiver();

  // Extract pagination data
  const totalItems = data?.total || 0;
  const currentPage = data?.page || 1;
  const totalPages = data?.totalPages || 1;

  // Use data directly without local filtering since search should be handled by API
  const receivers = Array.isArray(data?.data) ? data.data : [];

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

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

  const handleAddReceiver = () => {
    createMutation.mutate(newReceiver, {
      onSuccess: () => {
        setNewReceiver({
          name: "",
        });
        setIsAddDialogOpen(false);
      },
      onError: (error) => {
        console.error("Error creating receiver:", error);
      },
    });
  };

  const handleEditReceiver = () => {
    if (!editingReceiver) return;

    const updateData: UpdateReceiverData = {
      id: editingReceiver.id,
      name: editingReceiver.name,
    };

    console.log("Updating receiver with data:", updateData);

    updateMutation.mutate(updateData, {
      onSuccess: () => {
        console.log("Update successful");
        setIsEditDialogOpen(false);
      },
      onError: (error) => {
        console.error("Error updating receiver:", error);
      },
    });
  };

  const handleDeleteReceiver = () => {
    if (!deletingReceiver) return;

    console.log("Deleting receiver with ID:", deletingReceiver.id);

    // Make sure we're passing the ID as a string
    deleteMutation.mutate(String(deletingReceiver.id), {
      onSuccess: () => {
        console.log("Delete successful");
        setIsDeleteDialogOpen(false);
      },
      onError: (error) => {
        console.error("Error deleting receiver:", error);
      },
    });
  };

  const openEditDialog = (receiver: Receiver) => {
    console.log("Opening edit dialog for receiver:", receiver);
    setEditingReceiver({
      ...receiver,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (receiver: Receiver) => {
    console.log("Opening delete dialog for receiver:", receiver);
    setDeletingReceiver(receiver);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            <span className="hidden sm:inline">
              УПРАВЛЕНИЕ ГРУЗОПОЛУЧАТЕЛЯМИ
            </span>
            <span className="sm:hidden">Грузополучатели</span>
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

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-5 w-5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск грузополучателей..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-10 h-12 sm:h-10 text-base sm:text-sm"
            />
            {searchTerm !== debouncedSearchTerm && (
              <Loader2 className="absolute right-3 top-1/2 h-5 w-5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm gap-3 sm:gap-2"
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Добавить грузополучателя</span>
              <span className="sm:hidden">Добавить</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 px-4 sm:px-6 sm:pb-2">
            <CardTitle className="text-lg sm:text-xl">
              Грузополучатели
            </CardTitle>
            <CardDescription className="text-sm sm:text-sm mt-1">
              Управление списком грузополучателей для контрактов
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Название</TableHead>
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
                          <TableCell className="text-right">
                            <Skeleton className="h-6 w-20 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : receivers.length > 0 ? (
                    receivers.map((receiver: any) => (
                      <TableRow key={receiver.id}>
                        <TableCell>{receiver.id}</TableCell>
                        <TableCell className="font-medium">
                          {receiver.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(receiver)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => openDeleteDialog(receiver)}
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
                        Грузополучатели не найдены.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <Card key={`skeleton-${index}`} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-9" />
                        </div>
                      </div>
                    </Card>
                  ))
              ) : receivers.length > 0 ? (
                receivers.map((receiver: any) => (
                  <Card
                    key={receiver.id}
                    className="p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-muted-foreground mb-1">
                          ID: {receiver.id}
                        </div>
                        <div className="font-semibold text-base break-words">
                          {receiver.name}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEditDialog(receiver)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openDeleteDialog(receiver)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground text-base">
                    Грузополучатели не найдены.
                  </div>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить первого
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center px-2">
            <Pagination className="mx-0 w-full justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 1);
                      }
                    }}
                    className={
                      currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(totalPages);
                        }}
                        isActive={currentPage === totalPages}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                      }
                    }}
                    className={
                      currentPage >= totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Info about pagination */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 sm:px-0">
            <div className="text-sm sm:text-sm text-muted-foreground">
              Показано{" "}
              <span className="font-medium">
                {Math.min(limit, receivers.length)}
              </span>{" "}
              из <span className="font-medium">{totalItems}</span> записей
              <span className="hidden sm:inline">
                {" "}
                (страница {currentPage} из {totalPages})
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">
              <span className="text-sm sm:text-sm text-muted-foreground whitespace-nowrap font-medium">
                На странице:
              </span>
              <Select
                value={limit.toString()}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-[80px] h-10 sm:w-[70px] sm:h-8">
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Добавить нового грузополучателя
            </DialogTitle>
            <DialogDescription className="text-sm">
              Заполните информацию о новом грузополучателе
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={newReceiver.name}
                onChange={(e) =>
                  setNewReceiver({
                    ...newReceiver,
                    name: e.target.value,
                  })
                }
                className="h-12 sm:h-10 text-base sm:text-sm"
                placeholder="Введите название грузополучателя"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleAddReceiver}
              disabled={createMutation.isPending || !newReceiver.name.trim()}
              className="w-full sm:w-auto order-1 sm:order-2 py-3 sm:py-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingReceiver && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Редактировать грузополучателя
              </DialogTitle>
              <DialogDescription className="text-sm">
                Редактирование грузополучателя: {editingReceiver.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Название <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editingReceiver.name}
                  onChange={(e) => {
                    console.log("Changing name to:", e.target.value);
                    setEditingReceiver({
                      ...editingReceiver,
                      name: e.target.value,
                    });
                  }}
                  className="h-12 sm:h-10 text-base sm:text-sm"
                  placeholder="Введите название грузополучателя"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleEditReceiver}
                disabled={
                  updateMutation.isPending || !editingReceiver.name.trim()
                }
                className="w-full sm:w-auto order-1 sm:order-2 py-3 sm:py-2"
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
      {deletingReceiver && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[450px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg text-red-600">
                Удалить грузополучателя
              </DialogTitle>
              <DialogDescription className="text-sm">
                Вы уверены, что хотите удалить грузополучателя "
                <span className="font-medium">{deletingReceiver.name}</span>"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 leading-relaxed">
                  <strong>Внимание:</strong> Это действие нельзя отменить.
                  Грузополучатель будет полностью удален из системы.
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteReceiver}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto order-1 sm:order-2 py-3 sm:py-2"
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
