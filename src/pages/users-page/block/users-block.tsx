"use client";

import type React from "react";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  UserPlus,
  Search,
  Save,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAddUser } from "@/entities/users/api/post/use-add-user";
import { useGetUsers } from "@/entities/users/api/get/use-get-users";
import { useUpdateUsers } from "@/entities/users/api/patch/use-update-user";
import { useDeleteUser } from "@/entities/users/api/delete/use-delete-user";
import { useGetCompanies } from "@/entities/companies/api/use-get-company";

const roles = ["ADMIN", "USER"];

export function CompanyDisplay() {
  // This is using the data structure you provided in your message
  const userData = [
    {
      id: 1,
      email: "ruslanmakhmatov@gmail.com",
      password: "$2b$10$p23xwNsYXQVDZ/xX6ESqceyDPYebJD83CkZ6PxuljLVDC6cmjvV52",
      full_name: "Ruslan Makhmatov",
      role: "ADMIN",
      created_at: "03.04.2025",
      companies: [
        {
          id: 1,
          userId: 1,
          companyId: 1,
          company: {
            id: 1,
            name: "OOO TEST",
          },
        },
      ],
    },
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>User's associated company</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">
            {userData[0].companies[0].company.name}
          </span>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          User: {userData[0].full_name} ({userData[0].email})
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "USER",
    companyId: "",
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);

  // API hooks
  const {
    data: usersData,
    isLoading,
    isError,
    error,
  } = useGetUsers({ page, limit });

  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100); // Get all companies for dropdown

  const addUserMutation = useAddUser();
  const updateUserMutation = useUpdateUsers();
  const deleteUserMutation = useDeleteUser();

  // Extract pagination data
  const totalItems = usersData?.total || 0;
  const currentPage = usersData?.page || 1;
  const lastPage = usersData?.lastPage || 1;

  // Filter users based on search term
  const filteredUsers =
    usersData?.data?.filter((user: any) => {
      return (
        !searchTerm ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleAddUser = () => {
    const userData = {
      email: newUser.email,
      password: newUser.password,
      full_name: newUser.full_name,
      role: newUser.role,
      ...(newUser.companyId && { companyId: newUser.companyId }),
    };

    addUserMutation.mutate(userData, {
      onSuccess: () => {
        setNewUser({
          email: "",
          password: "",
          full_name: "",
          role: "USER",
          companyId: "",
        });
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    const userData = {
      name: editingUser.name,
      password: editingUser.password,
      email: editingUser.email,
      full_name: editingUser.full_name,
      role: editingUser.role,
      companyId: editingUser.companyId || undefined,
    };

    // Add password to update data only if it's provided
    if (editingUser.password) {
      userData.password = editingUser.password;
    }

    updateUserMutation.mutate(
      {
        id: editingUser.id,
        data: userData,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
        },
      }
    );
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;

    deleteUserMutation.mutate(deletingUser.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  };

  const openEditDialog = (user: any) => {
    setEditingUser({
      ...user,
      status: user.status === "ACTIVE" ? "Активен" : "Неактивен",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: any) => {
    setDeletingUser(user);
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
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
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
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Добавить пользователя
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить нового пользователя</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о новом пользователе
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Пароль <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="full_name" className="text-right">
                      ФИО
                    </Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, full_name: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Роль
                    </Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">
                      Компания
                    </Label>
                    <div className="col-span-3">
                      {isCompaniesLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Select
                          value={newUser.companyId}
                          onValueChange={(value) =>
                            setNewUser({ ...newUser, companyId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите компанию" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Не выбрано</SelectItem>
                            {companiesData?.data?.map((company: any) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  {newUser.companyId && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="col-span-1"></div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {
                              companiesData?.data?.find(
                                (c: any) => c.id === newUser.companyId
                              )?.name
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleAddUser}
                    disabled={
                      addUserMutation.isPending || !newUser.email.trim()
                    }
                  >
                    {addUserMutation.isPending ? (
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
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Пользователи</CardTitle>
            <CardDescription>Управление пользователями системы</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[200px]">Email</TableHead>
                  <TableHead className="w-[200px]">ФИО</TableHead>
                  <TableHead className="w-[150px]">Роль</TableHead>
                  <TableHead className="w-[150px]">Компания</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Действия
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <Skeleton className="h-6 w-10" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-40" />
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
                        <TableCell className="text-right">
                          <Skeleton className="h-6 w-20 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.full_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.id === 1 ? (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>OOO TEST</span>
                          </div>
                        ) : user.company ? (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{user.company.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Не указана
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Пользователи не найдены.
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
      {editingUser && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать пользователя</DialogTitle>
              <DialogDescription>
                Измените информацию о пользователе
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-password" className="text-right">
                  Пароль
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Оставьте пустым, чтобы не менять"
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, password: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-full_name" className="text-right">
                  ФИО
                </Label>
                <Input
                  id="edit-full_name"
                  type="text"
                  value={editingUser.full_name || ""}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    })
                  }
                  className="col-span-3 w-full"
                />
              </div>
              <div className="grid grid-cols-4 w-full items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Роль
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger className="col-span-3 w-full">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-company" className="text-right">
                  Компания
                </Label>
                <div className="col-span-3">
                  {isCompaniesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={editingUser.companyId || ""}
                      onValueChange={(value) =>
                        setEditingUser({ ...editingUser, companyId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите компанию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не выбрано</SelectItem>
                        {companiesData?.data?.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              {editingUser.companyId && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {
                          companiesData?.data?.find(
                            (c: any) => c.id === editingUser.companyId
                          )?.name
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleEditUser}
                disabled={
                  updateUserMutation.isPending || !editingUser.email.trim()
                }
              >
                {updateUserMutation.isPending ? (
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
      {deletingUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Удалить пользователя</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите удалить пользователя "
                {deletingUser.email}"?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Это действие нельзя отменить. Пользователь будет удален из
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
                onClick={handleDeleteUser}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? (
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
    </>
  );
}
