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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { CultureData } from "@/entities/cultures/api/create-cultures.api";
import { useFetchCultures } from "@/entities/cultures/api/use-get-cultures";
import { useCreateCultures } from "@/entities/cultures/api/use-create-culture";
import { useUpdateCulture } from "@/entities/cultures/api/use-update-culture";
import { useDeleteCulture } from "@/entities/cultures/api/use-delete-culture";

export default function AgricultureManagementPage() {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newCulture, setNewCulture] = useState<CultureData>({
    name: "",
  });

  const [editingCulture, setEditingCulture] = useState<any>(null);
  const [deletingCulture, setDeletingCulture] = useState<any>(null);

  // Queries and mutations
  const { data, isLoading, isError, error } = useFetchCultures(page, limit);
  const { mutate: createCulture, isPending: isCreating } = useCreateCultures();
  const { mutate: updateCultureMutation, isPending: isUpdating } =
    useUpdateCulture();
  const { mutate: deleteCultureMutation, isPending: isDeleting } =
    useDeleteCulture();

  // Filter cultures based on search term
  const filteredCultures =
    data?.data.filter((culture) => {
      return (
        !searchTerm ||
        culture.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddCulture = () => {
    createCulture(newCulture, {
      onSuccess: () => {
        setNewCulture({
          name: "",
        });
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleEditCulture = () => {
    if (!editingCulture || !editingCulture.originalName) return;
    updateCultureMutation(
      {
        old_name: editingCulture.originalName,
        name: editingCulture.name,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteCulture = () => {
    if (!deletingCulture) return;
    deleteCultureMutation(deletingCulture.name, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const openEditDialog = (culture: any) => {
    setEditingCulture({
      ...culture,
      originalName: culture.name,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (culture: any) => {
    setDeletingCulture(culture);
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
                            <TableCell className="text-right">
                              <Skeleton className="h-6 w-20 ml-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                    ) : filteredCultures.length > 0 ? (
                      filteredCultures.map((culture) => (
                        <TableRow key={culture.id}>
                          <TableCell className="font-medium">
                            {culture.name}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditDialog(culture)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => openDeleteDialog(culture)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="h-24 text-center">
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

      {/* Add Dialog */}
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
                value={newCulture.name}
                onChange={(e) =>
                  setNewCulture({
                    ...newCulture,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCulture} disabled={isCreating}>
              {isCreating ? (
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
      {editingCulture && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Редактировать культуру</DialogTitle>
              <DialogDescription>
                Редактирование культуры: {editingCulture.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Название
                </Label>
                <Input
                  id="edit-name"
                  value={editingCulture.name}
                  onChange={(e) =>
                    setEditingCulture({
                      ...editingCulture,
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
              <Button onClick={handleEditCulture} disabled={isUpdating}>
                {isUpdating ? (
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
      {deletingCulture && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить культуру</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить культуру "{deletingCulture.name}
                "?
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
                onClick={handleDeleteCulture}
                disabled={isDeleting}
              >
                {isDeleting ? (
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
