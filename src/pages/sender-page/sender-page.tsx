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
import { useCreateSender } from "@/entities/sender/api/create/use-create-sender";
import { useUpdateSender } from "@/entities/sender/api/update/use-update-sender";
import { useDeleteSender } from "@/entities/sender/api/delete/use-delete-sender";
import { useGetSenders } from "@/entities/sender/api/get/use-get-senders";
import { CreateSenderData } from "@/entities/sender/api/create/create-sender";
import { UpdateSenderData } from "@/entities/sender/api/update/update-sender";

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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            УПРАВЛЕНИЕ ГРУЗООТПРАВИТЕЛЯМИ
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
              placeholder="Поиск грузоотправителей..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить грузоотправителя
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Грузоотправители</CardTitle>
            <CardDescription>
              Управление списком грузоотправителей для контрактов
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div>
                Страница {currentPage} из {lastPage}
              </div>
              <div>|</div>
              <div>
                Всего: {totalItems}{" "}
                {totalItems === 1
                  ? "запись"
                  : totalItems % 10 === 1 && totalItems % 100 !== 11
                  ? "запись"
                  : totalItems % 10 >= 2 &&
                    totalItems % 10 <= 4 &&
                    (totalItems % 100 < 10 || totalItems % 100 >= 20)
                  ? "записи"
                  : "записей"}
              </div>
              <div>|</div>
              <div className="flex items-center space-x-2">
                <span>Показывать:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
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
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToFirstPage}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousPage}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === lastPage || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToLastPage}
                disabled={currentPage === lastPage || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Добавить нового грузоотправителя</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом грузоотправителе
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
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
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddSender}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Редактировать грузоотправителя</DialogTitle>
              <DialogDescription>
                Редактирование грузоотправителя: {editingSender.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Название
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
                  className="col-span-3"
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
                onClick={handleEditSender}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить грузоотправителя</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить грузоотправителя "
                {deletingSender.name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Это действие нельзя отменить. Грузоотправитель будет удален из
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
                onClick={handleDeleteSender}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
