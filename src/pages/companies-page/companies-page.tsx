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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  Info,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useCreateCompany } from "@/entities/companies/hooks/mutations/use-create-company.mutation";
import { useGetUsers } from "@/entities/users/hooks/query/use-get-users.query";
import { useUpdateCompanies } from "@/entities/companies/hooks/mutations/use-update-company.mutation";
import { useDeleteCompany } from "@/entities/companies/hooks/mutations/use-delete-company.mutation";
import { MultiSelect } from "@/components/ui/multi-select";

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form state
  const [newCompany, setNewCompany] = useState({
    name: "",
  });

  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [viewingCompany, setViewingCompany] = useState<any>(null);
  const [deletingCompany, setDeletingCompany] = useState<any>(null);

  // Fetch companies and users
  const {
    data: companiesData,
    isLoading,
    isError,
    error,
  } = useGetCompanies(page, limit);
  const { data: usersData, isLoading: usersLoading } = useGetUsers();

  // Mutations
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompanies();
  const deleteMutation = useDeleteCompany();

  // Extract pagination data
  const totalItems = companiesData?.total || 0;
  const currentPage = companiesData?.page || 1;
  const lastPage = companiesData?.lastPage || 1;

  // Filter companies based on search term
  const filteredCompanies =
    companiesData?.data?.filter((company) => {
      return (
        !searchTerm ||
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleAddCompany = () => {
    createMutation.mutate(newCompany, {
      onSuccess: () => {
        setNewCompany({
          name: "",
        });
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleEditCompany = () => {
    if (!editingCompany) return;

    updateMutation.mutate(
      {
        name: editingCompany.name,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteCompany = () => {
    if (!deletingCompany) return;

    deleteMutation.mutate(deletingCompany.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const openViewDialog = (company: any) => {
    setViewingCompany(company);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (company: any) => {
    setEditingCompany({
      ...company,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (company: any) => {
    setDeletingCompany(company);
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
            УПРАВЛЕНИЕ КОМПАНИЯМИ
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
              placeholder="Поиск компаний..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить компанию
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Компании</CardTitle>
            <CardDescription>
              Управление списком компаний и их пользователей
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
                          <Skeleton className="h-6 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-24" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredCompanies.length > 0 ? (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        {company.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openViewDialog(company)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(company)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(company)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Компании не найдены.
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

      {/* Add Company Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Добавить новую компанию</DialogTitle>
            <DialogDescription>
              Заполните информацию о новой компании
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid grid-cols-1 mb-4">
              <TabsTrigger value="info">Информация</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      Название компании{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={newCompany.name}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, name: e.target.value })
                      }
                      placeholder="ООО Компания"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button
              type="submit"
              onClick={handleAddCompany}
              disabled={createMutation.isPending || !newCompany.name.trim()}
            >
              {createMutation.isPending ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Добавление...
                </>
              ) : (
                "Добавить компанию"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      {editingCompany && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Редактировать компанию</DialogTitle>
              <DialogDescription>
                Редактирование компании: {editingCompany.name}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid grid-cols-1 mb-4">
                <TabsTrigger value="info">Информация</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name" className="font-medium">
                        Название компании{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-name"
                        value={editingCompany.name}
                        onChange={(e) =>
                          setEditingCompany({
                            ...editingCompany,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter className="mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                onClick={handleEditCompany}
                disabled={
                  updateMutation.isPending || !editingCompany.name.trim()
                }
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
      {viewingCompany && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Информация о компании</DialogTitle>
              <DialogDescription>
                Детальная информация о компании: {viewingCompany.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {viewingCompany.name}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewDialogOpen(false)}
              >
                Закрыть
              </Button>
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(viewingCompany);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingCompany && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить компанию</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить компанию "{deletingCompany.name}
                "?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Это действие нельзя отменить. Компания будет удалена из системы.
                {deletingCompany.users && deletingCompany.users.length > 0 && (
                  <span className="block mt-2 text-destructive">
                    Внимание: У компании есть {deletingCompany.users.length}{" "}
                    пользователей, которые будут отвязаны от компании.
                  </span>
                )}
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
                onClick={handleDeleteCompany}
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
