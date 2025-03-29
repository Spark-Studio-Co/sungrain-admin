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
import { Tabs, TabsContent } from "@/components/ui/tabs";
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

interface Agriculture {
  id: string;
  name: string;
}

const initialAgricultures: Agriculture[] = [
  {
    id: "1",
    name: "Пшеница",
  },
  {
    id: "2",
    name: "Подсолнечник",
  },
  {
    id: "3",
    name: "Кукуруза",
  },
  {
    id: "4",
    name: "Ячмень",
  },
  {
    id: "5",
    name: "Рапс",
  },
];

export default function AgricultureManagementPage() {
  // State
  const [agricultures, setAgricultures] =
    useState<Agriculture[]>(initialAgricultures);
  const [filteredAgricultures, setFilteredAgricultures] =
    useState<Agriculture[]>(initialAgricultures);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newAgriculture, setNewAgriculture] = useState<
    Omit<Agriculture, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
  });

  const [editingAgriculture, setEditingAgriculture] =
    useState<Agriculture | null>(null);
  const [deletingAgriculture, setDeletingAgriculture] =
    useState<Agriculture | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter agricultures based on search term, type, and status
  useEffect(() => {
    let results = agricultures;

    if (searchTerm) {
      results = results.filter((agriculture) =>
        agriculture.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAgricultures(results);
  }, [searchTerm, agricultures]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddAgriculture = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const id = (agricultures.length + 1).toString();
        const newAgricultureWithId: Agriculture = {
          ...newAgriculture,
          id,
        };
        setAgricultures([...agricultures, newAgricultureWithId]);
        setNewAgriculture({
          name: "",
        });
        setIsAddDialogOpen(false);
      } catch (err) {
        setError("Не удалось добавить культуру. Пожалуйста, попробуйте снова.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleEditAgriculture = () => {
    if (!editingAgriculture) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const now = new Date().toISOString().split("T")[0];
        const updatedAgricultures = agricultures.map((agriculture) =>
          agriculture.id === editingAgriculture.id
            ? { ...editingAgriculture, updatedAt: now }
            : agriculture
        );
        setAgricultures(updatedAgricultures);
        setIsEditDialogOpen(false);
      } catch (err) {
        setError("Не удалось обновить культуру. Пожалуйста, попробуйте снова.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleDeleteAgriculture = () => {
    if (!deletingAgriculture) return;

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        const updatedAgricultures = agricultures.filter(
          (agriculture) => agriculture.id !== deletingAgriculture.id
        );

        setAgricultures(updatedAgricultures);

        // Close dialog
        setIsDeleteDialogOpen(false);
      } catch (err) {
        setError("Не удалось удалить культуру. Пожалуйста, попробуйте снова.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const openEditDialog = (agriculture: Agriculture) => {
    setEditingAgriculture(agriculture);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (agriculture: Agriculture) => {
    setDeletingAgriculture(agriculture);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            УПРАВЛЕНИЕ СЕЛЬХОЗКУЛЬТУРАМИ
          </h1>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsContent value="list" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск культур..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить культуру
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Сельскохозяйственные культуры</CardTitle>
                <CardDescription>
                  Управление списком сельскохозяйственных культур
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
                              <Skeleton className="h-6 w-20" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-40" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-16" />
                            </TableCell>
                            <TableCell>
                              <Skeleton className="h-6 w-32" />
                            </TableCell>
                          </TableRow>
                        ))
                    ) : filteredAgricultures.length > 0 ? (
                      filteredAgricultures.map((agriculture) => (
                        <TableRow key={agriculture.id}>
                          <TableCell className="font-medium">
                            {agriculture.name}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(agriculture)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => openDeleteDialog(agriculture)}
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
                          Культуры не найдены.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Добавить новую культуру</DialogTitle>
            <DialogDescription>
              Заполните информацию о новой сельскохозяйственной культуре
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
              </Label>
              <Input
                id="name"
                value={newAgriculture.name}
                onChange={(e) =>
                  setNewAgriculture({
                    ...newAgriculture,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddAgriculture} disabled={isSubmitting}>
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
      {editingAgriculture && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Редактировать культуру</DialogTitle>
              <DialogDescription>
                Редактирование культуры: {editingAgriculture.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Название
                </Label>
                <Input
                  id="edit-name"
                  value={editingAgriculture.name}
                  onChange={(e) =>
                    setEditingAgriculture({
                      ...editingAgriculture,
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
              <Button onClick={handleEditAgriculture} disabled={isSubmitting}>
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
      {deletingAgriculture && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить культуру</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить культуру "
                {deletingAgriculture.name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Это действие нельзя отменить. Культура будет удалена из системы.
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
                onClick={handleDeleteAgriculture}
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
