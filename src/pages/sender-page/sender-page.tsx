"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import { useCreateSender } from "@/entities/sender/hooks/mutations/use-create-sender.mutation";
import { useUpdateSender } from "@/entities/sender/hooks/mutations/use-update-sender.mutation";
import { useDeleteSender } from "@/entities/sender/hooks/mutations/use-delete-sender.mutation";
import { useGetSenders } from "@/entities/sender/hooks/query/use-get-senders.query";
import { CreateSenderData } from "@/entities/sender/api/create/create-sender.api";
import { UpdateSenderData } from "@/entities/sender/api/update/update-sender.api";

// Types
interface Sender {
  id: string;
  name: string;
}

export default function SenderPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newSender, setNewSender] = useState<CreateSenderData>({
    name: "",
  });

  const [editingSender, setEditingSender] = useState<Sender | null>(null);
  const [deletingSender, setDeletingSender] = useState<Sender | null>(null);

  // React Query hooks
  const { data, isLoading, isError, error } = useGetSenders(page, limit);
  const createMutation = useCreateSender();
  const updateMutation = useUpdateSender();
  const deleteMutation = useDeleteSender();

  // Extract pagination data
  const totalItems = data?.total || 0;
  const currentPage = data?.page || 1;
  const lastPage = Math.ceil(totalItems / limit) || 1;

  // Filter senders based on search term
  const filteredSenders = Array.isArray(data?.data)
    ? data.data.filter((sender) => {
        return (
          !searchTerm ||
          sender.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Debug logs for data
  useEffect(() => {
    if (data) {
      console.log("Loaded senders data:", data);
    }
  }, [data]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleAddSender = () => {
    createMutation.mutate(newSender, {
      onSuccess: () => {
        setNewSender({
          name: "",
        });
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleEditSender = () => {
    if (!editingSender) return;

    const updateData: UpdateSenderData = {
      id: editingSender.id,
      name: editingSender.name,
    };

    console.log("Sending update with data:", updateData);

    updateMutation.mutate(updateData, {
      onSuccess: () => {
        console.log("Update successful");
        setIsEditDialogOpen(false);
      },
      onError: (error) => {
        console.error("Error updating sender:", error);
      },
    });
  };

  const handleDeleteSender = () => {
    if (!deletingSender) return;

    console.log("Deleting sender with ID:", deletingSender.id);

    // Make sure we're passing the ID as a string
    deleteMutation.mutate(deletingSender.id, {
      onSuccess: () => {
        console.log("Delete successful");
        setIsDeleteDialogOpen(false);
      },
      onError: (error) => {
        console.error("Error deleting sender:", error);
      },
    });
  };

  const openEditDialog = (sender: Sender) => {
    console.log("Opening edit dialog for sender:", sender);
    setEditingSender({
      ...sender,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (sender: Sender) => {
    console.log("Opening delete dialog for sender:", sender);
    setDeletingSender(sender);
    setIsDeleteDialogOpen(true);
  };

  // Pagination handlers
  const goToFirstPage = () => setPage(1);
  const goToPreviousPage = () =>
    setPage((prev) => (prev > 1 ? prev - 1 : prev));
  const goToNextPage = () =>
    setPage((prev) => (prev < lastPage ? prev + 1 : prev));
  const goToLastPage = () => setPage(lastPage);

  const handleLimitChange = (value: string) => {
    setLimit(Number(value));
    setPage(1); // Reset to first page when changing limit
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            <span className="hidden sm:inline">
              УПРАВЛЕНИЕ ГРУЗООТПРАВИТЕЛЯМИ
            </span>
            <span className="sm:hidden">Грузоотправители</span>
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
              placeholder="Поиск грузоотправителей..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 h-12 sm:h-10 text-base sm:text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm gap-3 sm:gap-2"
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">
                Добавить грузоотправителя
              </span>
              <span className="sm:hidden">Добавить</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 px-4 sm:px-6 sm:pb-2">
            <CardTitle className="text-lg sm:text-xl">
              Грузоотправители
            </CardTitle>
            <CardDescription className="text-sm sm:text-sm mt-1">
              Управление списком грузоотправителей для контрактов
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
                  ) : filteredSenders.length > 0 ? (
                    filteredSenders.map((sender: any) => (
                      <TableRow key={sender.id}>
                        <TableCell>{sender.id}</TableCell>
                        <TableCell className="font-medium">
                          {sender.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditDialog(sender)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => openDeleteDialog(sender)}
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
                        Грузоотправители не найдены.
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
              ) : filteredSenders.length > 0 ? (
                filteredSenders.map((sender: any) => (
                  <Card
                    key={sender.id}
                    className="p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-muted-foreground mb-1">
                          ID: {sender.id}
                        </div>
                        <div className="font-semibold text-base break-words">
                          {sender.name}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEditDialog(sender)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openDeleteDialog(sender)}
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
                    Грузоотправители не найдены.
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
          <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-sm sm:text-sm text-muted-foreground">
                Показано{" "}
                <span className="font-medium">
                  {Math.min(limit, filteredSenders.length)}
                </span>{" "}
                из <span className="font-medium">{totalItems}</span> записей
                <span className="hidden sm:inline">
                  {" "}
                  (страница {currentPage} из {lastPage})
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
                    <SelectValue placeholder={limit.toString()} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToFirstPage}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousPage}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextPage}
                disabled={currentPage === lastPage || isLoading}
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={goToLastPage}
                disabled={currentPage === lastPage || isLoading}
              >
                <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Добавить нового грузоотправителя
            </DialogTitle>
            <DialogDescription className="text-sm">
              Заполните информацию о новом грузоотправителе
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Название <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={newSender.name}
                onChange={(e) =>
                  setNewSender({
                    ...newSender,
                    name: e.target.value,
                  })
                }
                className="h-12 sm:h-10 text-base sm:text-sm"
                placeholder="Введите название грузоотправителя"
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
              onClick={handleAddSender}
              disabled={createMutation.isPending || !newSender.name.trim()}
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
      {editingSender && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Редактировать грузоотправителя
              </DialogTitle>
              <DialogDescription className="text-sm">
                Редактирование грузоотправителя: {editingSender.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Название <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={editingSender.name}
                  onChange={(e) => {
                    console.log("Changing name to:", e.target.value);
                    setEditingSender({
                      ...editingSender,
                      name: e.target.value,
                    });
                  }}
                  className="h-12 sm:h-10 text-base sm:text-sm"
                  placeholder="Введите название грузоотправителя"
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
                onClick={handleEditSender}
                disabled={
                  updateMutation.isPending || !editingSender.name.trim()
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
      {deletingSender && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[450px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg text-red-600">
                Удалить грузоотправителя
              </DialogTitle>
              <DialogDescription className="text-sm">
                Вы уверены, что хотите удалить грузоотправителя "
                <span className="font-medium">{deletingSender.name}</span>"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 leading-relaxed">
                  <strong>Внимание:</strong> Это действие нельзя отменить.
                  Грузоотправитель будет полностью удален из системы.
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
                onClick={handleDeleteSender}
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
