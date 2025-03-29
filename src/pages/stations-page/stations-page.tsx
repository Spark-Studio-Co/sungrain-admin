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
interface Station {
  id: string;
  name: string;
  code: string;
}

// Sample data
const initialStations: Station[] = [
  {
    id: "1",
    name: "Краснодар-Сортировочный",
    code: "520004",
  },
  {
    id: "2",
    name: "Новороссийск-Порт",
    code: "521500",
  },
  {
    id: "3",
    name: "Ростов-Товарный",
    code: "510102",
  },
  {
    id: "4",
    name: "Таганрог-Порт",
    code: "511401",
  },
  {
    id: "5",
    name: "Ставрополь-Грузовой",
    code: "530001",
  },
];

export default function StationsPage() {
  // State
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [filteredStations, setFilteredStations] =
    useState<Station[]>(initialStations);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newStation, setNewStation] = useState<
    Omit<Station, "id" | "createdAt" | "updatedAt">
  >({
    name: "",
    code: "",
  });

  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [deletingStation, setDeletingStation] = useState<Station | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Filter stations based on search term, status, and type
  useEffect(() => {
    let results = stations;

    if (searchTerm) {
      results = results.filter(
        (station) =>
          station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.code.includes(searchTerm)
      );
    }

    setFilteredStations(results);
  }, [searchTerm, statusFilter, typeFilter, stations]);

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
  };

  const handleAddStation = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const id = (stations.length + 1).toString();

        const newStationWithId: Station = {
          ...newStation,
          id,
        };

        setStations([...stations, newStationWithId]);

        // Reset form
        setNewStation({
          name: "",
          code: "",
        });

        // Close dialog
        setIsAddDialogOpen(false);
      } catch (err) {
        setError("Не удалось добавить станцию. Пожалуйста, попробуйте снова.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleEditStation = () => {
    if (!editingStation) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const now = new Date().toISOString().split("T")[0];

        const updatedStations = stations.map((station) =>
          station.id === editingStation.id
            ? { ...editingStation, updatedAt: now }
            : station
        );

        setStations(updatedStations);

        // Close dialog
        setIsEditDialogOpen(false);
      } catch (err) {
        setError("Не удалось обновить станцию. Пожалуйста, попробуйте снова.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const handleDeleteStation = () => {
    if (!deletingStation) return;

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        const updatedStations = stations.filter(
          (station) => station.id !== deletingStation.id
        );

        setStations(updatedStations);

        // Close dialog
        setIsDeleteDialogOpen(false);
      } catch (err) {
        setError("Не удалось удалить станцию. Пожалуйста, попробуйте снова.");
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const openEditDialog = (station: Station) => {
    setEditingStation(station);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (station: Station) => {
    setDeletingStation(station);
    setIsDeleteDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            УПРАВЛЕНИЕ СТАНЦИЯМИ
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
              placeholder="Поиск станций..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить станцию
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Станции</CardTitle>
            <CardDescription>
              Управление списком станций отправления и назначения для контрактов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Код</TableHead>
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
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20" />
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
                ) : filteredStations.length > 0 ? (
                  filteredStations.map((station) => (
                    <TableRow key={station.id}>
                      <TableCell className="font-medium">
                        {station.name}
                      </TableCell>
                      <TableCell>{station.code}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(station)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(station)}
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
                      Станции не найдены.
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
            <DialogTitle>Добавить новую станцию</DialogTitle>
            <DialogDescription>
              Заполните информацию о новой станции
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Название
              </Label>
              <Input
                id="name"
                value={newStation.name}
                onChange={(e) =>
                  setNewStation({
                    ...newStation,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Код
              </Label>
              <Input
                id="code"
                value={newStation.code}
                onChange={(e) =>
                  setNewStation({
                    ...newStation,
                    code: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddStation} disabled={isSubmitting}>
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
      {editingStation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Редактировать станцию</DialogTitle>
              <DialogDescription>
                Редактирование станции: {editingStation.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Название
                </Label>
                <Input
                  id="edit-name"
                  value={editingStation.name}
                  onChange={(e) =>
                    setEditingStation({
                      ...editingStation,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-code" className="text-right">
                  Код
                </Label>
                <Input
                  id="edit-code"
                  value={editingStation.code}
                  onChange={(e) =>
                    setEditingStation({
                      ...editingStation,
                      code: e.target.value,
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
              <Button onClick={handleEditStation} disabled={isSubmitting}>
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
      {deletingStation && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить станцию</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить станцию "{deletingStation.name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Это действие нельзя отменить. Станция будет удалена из системы.
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
                onClick={handleDeleteStation}
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
