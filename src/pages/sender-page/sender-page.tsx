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

// Types
interface Shipper {
  id: string;
  name: string;
  fullName: string;
}

// Sample data
const initialShippers: Shipper[] = [
  {
    id: "1",
    name: "ООО Агрохолдинг",
    fullName: "Общество с ограниченной ответственностью 'Агрохолдинг'",
  },
  {
    id: "2",
    name: "АО СельхозПром",
    fullName: "Акционерное общество 'СельхозПром'",
  },
  {
    id: "3",
    name: "ООО ЮгАгро",
    fullName: "Общество с ограниченной ответственностью 'ЮгАгро'",
  },
  {
    id: "4",
    name: "КФХ Колос",
    fullName: "Крестьянское (фермерское) хозяйство 'Колос'",
  },
  {
    id: "5",
    name: "АО АгроИнвест",
    fullName: "Акционерное общество 'АгроИнвест'",
  },
];

export default function SenderPage() {
  const [shippers, setShippers] = useState<Shipper[]>(initialShippers);
  const [filteredShippers, setFilteredShippers] =
    useState<Shipper[]>(initialShippers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newShipper, setNewShipper] = useState<
    Omit<Shipper, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
    fullName: "",
  });

  const [editingShipper, setEditingShipper] = useState<Shipper | null>(null);
  const [deletingShipper, setDeletingShipper] = useState<Shipper | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter shippers based on search term and status
  useEffect(() => {
    let results = shippers;

    if (searchTerm) {
      results = results.filter(
        (shipper) =>
          shipper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipper.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredShippers(results);
  }, [searchTerm, statusFilter, shippers]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleAddShipper = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const id = (shippers.length + 1).toString();

        const newShipperWithId: Shipper = {
          ...newShipper,
          id,
        };

        setShippers([...shippers, newShipperWithId]);

        // Reset form
        setNewShipper({
          name: "",
          fullName: "",
        });

        // Close dialog
        setIsAddDialogOpen(false);
      } catch (err) {
        setError(
          "Не удалось добавить грузоотправителя. Пожалуйста, попробуйте снова."
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleEditShipper = () => {
    if (!editingShipper) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const now = new Date().toISOString().split("T")[0];

        const updatedShippers = shippers.map((shipper) =>
          shipper.id === editingShipper.id
            ? { ...editingShipper, updatedAt: now }
            : shipper
        );

        setShippers(updatedShippers);

        // Close dialog
        setIsEditDialogOpen(false);
      } catch (err) {
        setError(
          "Не удалось обновить грузоотправителя. Пожалуйста, попробуйте снова."
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleDeleteShipper = () => {
    if (!deletingShipper) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const updatedShippers = shippers.filter(
          (shipper) => shipper.id !== deletingShipper.id
        );

        setShippers(updatedShippers);

        // Close dialog
        setIsDeleteDialogOpen(false);
      } catch (err) {
        setError(
          "Не удалось удалить грузоотправителя. Пожалуйста, попробуйте снова."
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const openEditDialog = (shipper: Shipper) => {
    setEditingShipper(shipper);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (shipper: Shipper) => {
    setDeletingShipper(shipper);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            УПРАВЛЕНИЕ ГРУЗООТПРАВИТЕЛЯМИ
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
                ) : filteredShippers.length > 0 ? (
                  filteredShippers.map((shipper) => (
                    <TableRow key={shipper.id}>
                      <TableCell className="font-medium">
                        {shipper.name}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(shipper)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(shipper)}
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
                      Грузоотправители не найдены.
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
                value={newShipper.name}
                onChange={(e) =>
                  setNewShipper({
                    ...newShipper,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddShipper} disabled={isSubmitting}>
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
      {editingShipper && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Редактировать грузоотправителя</DialogTitle>
              <DialogDescription>
                Редактирование грузоотправителя: {editingShipper.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Название
                </Label>
                <Input
                  id="edit-name"
                  value={editingShipper.name}
                  onChange={(e) =>
                    setEditingShipper({
                      ...editingShipper,
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
              <Button onClick={handleEditShipper} disabled={isSubmitting}>
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
      {deletingShipper && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить грузоотправителя</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить грузоотправителя "
                {deletingShipper.name}"?
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
                onClick={handleDeleteShipper}
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
