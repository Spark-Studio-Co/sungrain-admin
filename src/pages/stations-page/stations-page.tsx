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

import { useFetchStations } from "@/entities/stations/hooks/query/use-get-stations.query";
import { useCreateStation } from "@/entities/stations/hooks/mutations/use-create-stations.mutation";
import { useUpdateStation } from "@/entities/stations/hooks/mutations/use-update-stations.mutation";
import { useDeleteStations } from "@/entities/stations/hooks/mutations/use-delete-stations.mutation";
import type { StationData } from "@/entities/stations/api/post/create-stations.api";
import type { UpdateStationData } from "@/entities/stations/api/patch/update-stations.api";

export default function StationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [newStation, setNewStation] = useState<StationData>({
    name: "",
    code: "",
  });

  const [editingStation, setEditingStation] = useState<any>(null);
  const [deletingStation, setDeletingStation] = useState<any>(null);

  const { data, isLoading, isError, error } = useFetchStations(page, limit);
  const createMutation = useCreateStation();
  const updateMutation = useUpdateStation();
  const deleteMutation = useDeleteStations();

  // Extract pagination data
  const totalItems = data?.total || 0;
  const lastPage = data?.lastPage || 1;
  const currentPage = data?.page || 1;

  const filteredStations = Array.isArray(data?.data)
    ? data.data.filter((station) => {
        return (
          !searchTerm ||
          station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          station.code.includes(searchTerm)
        );
      })
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleAddStation = () => {
    createMutation.mutate(newStation, {
      onSuccess: () => {
        setNewStation({
          name: "",
          code: "",
        });
        setIsAddDialogOpen(false);
      },
    });
  };

  // Update the handleEditStation function to match your API
  const handleEditStation = () => {
    if (!editingStation) return;

    const updateData: UpdateStationData = {
      code: editingStation.code,
      name: editingStation.name,
    };

    updateMutation.mutate(
      {
        id: editingStation.id,
        data: updateData,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteStation = () => {
    if (!deletingStation) return;

    deleteMutation.mutate(Number(deletingStation.id), {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const openEditDialog = (station: any) => {
    setEditingStation({
      ...station,
      originalName: station.name,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (station: any) => {
    setDeletingStation(station);
    setIsDeleteDialogOpen(true);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (value: string) => {
    const newLimitNum = Number(value);
    setLimit(newLimitNum);

    // If current page would be out of bounds with new limit, go to last valid page
    const totalItems = data?.total || 0;
    const maxPage = Math.ceil(totalItems / newLimitNum);
    if (page > maxPage) {
      setPage(Math.max(1, maxPage));
    } else {
      setPage(1); // Reset to first page
    }
  };

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
            <span className="hidden sm:inline">УПРАВЛЕНИЕ СТАНЦИЯМИ</span>
            <span className="sm:hidden">Станции</span>
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
              placeholder="Поиск станций..."
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
              <span className="hidden sm:inline">Добавить станцию</span>
              <span className="sm:hidden">Добавить</span>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3 px-4 sm:px-6 sm:pb-2">
            <CardTitle className="text-lg sm:text-xl">Станции</CardTitle>
            <CardDescription className="text-sm sm:text-sm mt-1">
              Управление списком станций отправления и назначения для контрактов
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {/* Desktop Table View */}
            <div className="hidden md:block">
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
                      <TableCell colSpan={3} className="h-24 text-center">
                        Станции не найдены.
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
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-9" />
                        </div>
                      </div>
                    </Card>
                  ))
              ) : filteredStations.length > 0 ? (
                filteredStations.map((station) => (
                  <Card
                    key={station.id}
                    className="p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base break-words mb-1">
                          {station.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Код: {station.code}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEditDialog(station)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openDeleteDialog(station)}
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
                    Станции не найдены.
                  </div>
                  <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить первую
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4 px-4 sm:px-6">
            <div className="hidden sm:flex items-center justify-between w-full">
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
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
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
                          currentPage <= 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                      let pageNum;
                      if (lastPage <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= lastPage - 2) {
                        pageNum = lastPage - 4 + i;
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

                    {lastPage > 5 && currentPage < lastPage - 2 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(lastPage);
                            }}
                            isActive={currentPage === lastPage}
                          >
                            {lastPage}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < lastPage) {
                            handlePageChange(currentPage + 1);
                          }
                        }}
                        className={
                          currentPage >= lastPage
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
            {(data?.total || 0) > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2 sm:px-0">
                <div className="text-sm sm:text-sm text-muted-foreground">
                  Показано{" "}
                  <span className="font-medium">
                    {Math.min(limit, data?.data?.length || 0)}
                  </span>{" "}
                  из <span className="font-medium">{data?.total || 0}</span>{" "}
                  записей
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
          </CardFooter>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Добавить новую станцию
            </DialogTitle>
            <DialogDescription className="text-sm">
              Заполните информацию о новой станции
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Название <span className="text-red-500">*</span>
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
                className="h-12 sm:h-10 text-base sm:text-sm"
                placeholder="Введите название станции"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Код <span className="text-red-500">*</span>
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
                className="h-12 sm:h-10 text-base sm:text-sm"
                placeholder="Введите код станции"
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
              onClick={handleAddStation}
              disabled={
                createMutation.isPending ||
                !newStation.name.trim() ||
                !newStation.code.trim()
              }
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
      {editingStation && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Редактировать станцию
              </DialogTitle>
              <DialogDescription className="text-sm">
                Редактирование станции: {editingStation.originalName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  Название <span className="text-red-500">*</span>
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
                  className="h-12 sm:h-10 text-base sm:text-sm"
                  placeholder="Введите название станции"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code" className="text-sm font-medium">
                  Код <span className="text-red-500">*</span>
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
                  className="h-12 sm:h-10 text-base sm:text-sm"
                  placeholder="Введите код станции"
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
                onClick={handleEditStation}
                disabled={
                  updateMutation.isPending ||
                  !editingStation.name.trim() ||
                  !editingStation.code.trim()
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
      {deletingStation && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[450px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg text-red-600">
                Удалить станцию
              </DialogTitle>
              <DialogDescription className="text-sm">
                Вы уверены, что хотите удалить станцию "
                <span className="font-medium">{deletingStation.name}</span>"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 leading-relaxed">
                  <strong>Внимание:</strong> Это действие нельзя отменить.
                  Станция будет полностью удалена из системы.
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
                onClick={handleDeleteStation}
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
