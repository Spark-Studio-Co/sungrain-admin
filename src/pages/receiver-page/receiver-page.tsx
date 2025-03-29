"use client";

import { DialogFooter } from "@/components/ui/dialog";

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
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Save, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
interface Receiver {
  id: string;
  name: string;
}

// Sample data
const initialReceivers: Receiver[] = [
  {
    id: "1",
    name: "ООО ЗерноТрейд",
  },
  {
    id: "2",
    name: "ООО МаслоЭкспорт",
  },
  {
    id: "3",
    name: "ООО БалтЭкспорт",
  },
  {
    id: "4",
    name: "ООО ЮжныйПорт",
  },
  {
    id: "5",
    name: "ООО ЗерноЭкспорт",
  },
];

export default function ReceiversPage() {
  // State
  const [receivers, setReceivers] = useState<Receiver[]>(initialReceivers);
  const [filteredReceivers, setFilteredReceivers] =
    useState<Receiver[]>(initialReceivers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newReceiver, setNewReceiver] = useState<
    Omit<Receiver, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
  });

  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [deletingReceiver, setDeletingReceiver] = useState<Receiver | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter receivers based on search term and status
  useEffect(() => {
    let results = receivers;

    if (searchTerm) {
      results = results.filter((receiver) =>
        receiver.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReceivers(results);
  }, [searchTerm, statusFilter, receivers]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddReceiver = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const id = (receivers.length + 1).toString();

        const newReceiverWithId: Receiver = {
          ...newReceiver,
          id,
        };

        setReceivers([...receivers, newReceiverWithId]);

        // Reset form
        setNewReceiver({
          name: "",
        });

        // Close dialog
        setIsAddDialogOpen(false);
      } catch (err) {
        setError(
          "Не удалось добавить грузополучателя. Пожалуйста, попробуйте снова."
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleEditReceiver = () => {
    if (!editingReceiver) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const now = new Date().toISOString().split("T")[0];

        const updatedReceivers = receivers.map((receiver) =>
          receiver.id === editingReceiver.id
            ? { ...editingReceiver, updatedAt: now }
            : receiver
        );

        setReceivers(updatedReceivers);

        // Close dialog
        setIsEditDialogOpen(false);
      } catch (err) {
        setError(
          "Не удалось обновить грузополучателя. Пожалуйста, попробуйте снова."
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleDeleteReceiver = () => {
    if (!deletingReceiver) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const updatedReceivers = receivers.filter(
          (receiver) => receiver.id !== deletingReceiver.id
        );

        setReceivers(updatedReceivers);

        // Close dialog
        setIsDeleteDialogOpen(false);
      } catch (err) {
        setError(
          "Не удалось удалить грузополучателя. Пожалуйста, попробуйте снова."
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const openEditDialog = (receiver: Receiver) => {
    setEditingReceiver(receiver);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (receiver: Receiver) => {
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
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
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16" />
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
                  filteredReceivers.map((receiver) => (
                    <TableRow key={receiver.id}>
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
                    <TableCell colSpan={7} className="h-24 text-center">
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
            <Button onClick={handleAddReceiver} disabled={isSubmitting}>
              {isSubmitting ? (
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
                  onChange={(e) =>
                    setEditingReceiver({
                      ...editingReceiver,
                      name: e.target.value,
                    })
                  }
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
              <Button onClick={handleEditReceiver} disabled={isSubmitting}>
                {isSubmitting ? (
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
                disabled={isSubmitting}
              >
                {isSubmitting ? (
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
