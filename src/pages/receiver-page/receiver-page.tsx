"use client";

import type React from "react";
import { useState } from "react";
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
import { Plus, Search, Edit, Trash2, Save, AlertCircle } from "lucide-react";
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
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

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
  const { data, isLoading, isError, error } = useGetReceivers(page, limit);
  const createMutation = useCreateReceiver();
  const updateMutation = useUpdateReceiver();
  const deleteMutation = useDeleteReceiver();

  // Extract pagination data
  // const totalItems = data?.total || 0;
  // const currentPage = data?.page || 1;
  // const lastPage = Math.ceil(totalItems / limit) || 1;

  const filteredReceivers = Array.isArray(data?.data)
    ? data.data.filter((receiver) => {
        return (
          !searchTerm ||
          receiver.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            УПРАВЛЕНИЕ ГРУЗОПОЛУЧАТЕЛЯМИ
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
              placeholder="Поиск грузополучателей..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить грузополучателя
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Грузополучатели</CardTitle>
            <CardDescription>
              Управление списком грузополучателей для контрактов
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
                ) : filteredReceivers.length > 0 ? (
                  filteredReceivers.map((receiver: any) => (
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
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Добавить нового грузополучателя</DialogTitle>
            <DialogDescription>
              Заполните информацию о новом грузополучателе
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
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
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddReceiver}
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
      {editingReceiver && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Редактировать грузополучателя</DialogTitle>
              <DialogDescription>
                Редактирование грузополучателя: {editingReceiver.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Название
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
                onClick={handleEditReceiver}
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
      {deletingReceiver && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить грузополучателя</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить грузополучателя "
                {deletingReceiver.name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Это действие нельзя отменить. Грузополучатель будет удален из
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
                onClick={handleDeleteReceiver}
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
