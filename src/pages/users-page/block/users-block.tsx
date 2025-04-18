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
  FileText,
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
import { useGetUsers } from "@/entities/users/hooks/query/use-get-users.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useAddUser } from "@/entities/users/hooks/mutations/use-add-user.mutation";
import { useUpdateUsers } from "@/entities/users/hooks/mutations/use-update-user.mutation";
import { useDeleteUser } from "@/entities/users/hooks/mutations/use-delete-user.mutation";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";

const roles = ["ADMIN", "USER"];

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
    companyId: [] as string[],
    contractIds: [] as string[],
  });
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);

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

  const { data: contractsData, isLoading: isContractsLoading } =
    useGetContracts({ page: 1, limit: 1000 }); // Get all contracts

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
    // Validate all required fields
    if (
      !newUser.email.trim() ||
      !newUser.password.trim() ||
      !newUser.full_name.trim() ||
      !newUser.role ||
      newUser.companyId.length === 0
    ) {
      return;
    }

    const userData = {
      email: newUser.email,
      password: newUser.password,
      full_name: newUser.full_name,
      role: newUser.role,
      ...(newUser.companyId.length > 0 && { companyId: newUser.companyId }),
      ...(newUser.contractIds.length > 0 && {
        contractIds: newUser.contractIds,
      }),
    };

    addUserMutation.mutate(userData, {
      onSuccess: () => {
        setNewUser({
          email: "",
          password: "",
          full_name: "",
          role: "USER",
          companyId: [],
          contractIds: [],
        });
        setIsAddDialogOpen(false);
      },
    });
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    // Validate all required fields
    if (
      !editingUser.email.trim() ||
      !editingUser.full_name?.trim() ||
      !editingUser.role ||
      !editingUser.companies ||
      editingUser.companies.length === 0
    ) {
      return;
    }

    const userData = {
      name: editingUser.name,
      email: editingUser.email,
      full_name: editingUser.full_name,
      role: editingUser.role,
      companies: editingUser.companies || [],
      contractsId: editingUser.contractsId || [],
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
    // Ensure companies is an array
    const companies = user.companies?.map((c: any) => c.company.id) || [];

    // Ensure contractsId is an array
    const contractsId = user.contracts?.map((c: any) => c.id) || [];

    setEditingUser({
      ...user,
      status: user.status === "ACTIVE" ? "Активен" : "Неактивен",
      companies,
      contractsId,
    });

    // Filter contracts for the first company if available
    if (companies.length > 0) {
      const filtered = filterContractsByCompany(companies[0]);
      setFilteredContracts(filtered);
    }

    setIsEditDialogOpen(true);
  };

  // Add the missing openDeleteDialog function
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

  const filterContractsByCompany = (companyId: string) => {
    if (!contractsData?.data) return [];

    return contractsData.data.filter(
      (contract: any) => contract.companyId === companyId
    );
  };

  // Update filtered contracts when company selection changes
  const handleCompanyChange = (companyId: string, isEditMode = false) => {
    if (companyId === "none") return;

    // Add company to the appropriate state
    if (isEditMode) {
      if (!editingUser.companies.includes(companyId)) {
        setEditingUser({
          ...editingUser,
          companies: [...(editingUser.companies || []), companyId],
          // Clear contracts when company changes
          contractsId: [],
        });
      }
    } else {
      if (!newUser.companyId.includes(companyId)) {
        setNewUser({
          ...newUser,
          companyId: [...newUser.companyId, companyId],
          // Clear contracts when company changes
          contractIds: [],
        });
      }
    }

    // Filter contracts for the selected company
    const filtered = filterContractsByCompany(companyId);
    setFilteredContracts(filtered);
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
                      ФИО <span className="text-destructive">*</span>
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
                      Роль <span className="text-destructive">*</span>
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
                    <Label htmlFor="companies" className="text-right">
                      Компании <span className="text-destructive">*</span>
                    </Label>
                    <div className="col-span-3">
                      {isCompaniesLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <div className="space-y-4">
                          <Select
                            onValueChange={(value) =>
                              handleCompanyChange(value, false)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Добавить компанию" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Выберите компанию
                              </SelectItem>
                              {companiesData?.data?.map((company: any) => (
                                <SelectItem key={company.id} value={company.id}>
                                  {company.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {newUser.companyId.length > 0 && (
                            <div className="space-y-2">
                              {newUser.companyId.map((companyId) => {
                                const company = companiesData?.data?.find(
                                  (c: any) => c.id === companyId
                                );
                                return (
                                  <div
                                    key={companyId}
                                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {company?.name}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setNewUser({
                                          ...newUser,
                                          companyId: newUser.companyId.filter(
                                            (id) => id !== companyId
                                          ),
                                        });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contracts" className="text-right">
                      Контракты
                    </Label>
                    <div className="col-span-3">
                      {isContractsLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <div className="space-y-4">
                          {newUser.companyId.length > 0 ? (
                            <>
                              <Select
                                onValueChange={(value) => {
                                  if (value === "none") return;
                                  if (!newUser.contractIds.includes(value)) {
                                    setNewUser({
                                      ...newUser,
                                      contractIds: [
                                        ...newUser.contractIds,
                                        value,
                                      ],
                                    });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Добавить контракт" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    Выберите контракт
                                  </SelectItem>
                                  {filteredContracts.map((contract: any) => (
                                    <SelectItem
                                      key={contract.id}
                                      value={contract.id}
                                    >
                                      {contract.number} -{" "}
                                      {contract.title || "Без названия"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {newUser.contractIds.length > 0 && (
                                <div className="space-y-2">
                                  {newUser.contractIds.map((contractId) => {
                                    const contract = contractsData?.data?.find(
                                      (c: any) => c.id === contractId
                                    );
                                    return (
                                      <div
                                        key={contractId}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">
                                            {contract?.number} -{" "}
                                            {contract?.title || "Без названия"}
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setNewUser({
                                              ...newUser,
                                              contractIds:
                                                newUser.contractIds.filter(
                                                  (id) => id !== contractId
                                                ),
                                            });
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Сначала выберите компанию для отображения
                              доступных контрактов
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleAddUser}
                    disabled={
                      addUserMutation.isPending ||
                      !newUser.email.trim() ||
                      !newUser.password.trim() ||
                      !newUser.full_name.trim() ||
                      !newUser.role ||
                      newUser.companyId.length === 0
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
                        {user.companies && user.companies.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {user.companies
                              .slice(0, 2)
                              .map((companyRelation: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">
                                    {companyRelation.company.name}
                                  </span>
                                </div>
                              ))}
                            {user.companies.length > 2 && (
                              <span className="text-xs text-muted-foreground ml-6">
                                +{user.companies.length - 2} еще
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Не указаны
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
                  Email <span className="text-destructive">*</span>
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
                  Пароль <span className="text-destructive">*</span>
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
                  ФИО <span className="text-destructive">*</span>
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
                  Роль <span className="text-destructive">*</span>
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
                <Label htmlFor="edit-companies" className="text-right">
                  Компании <span className="text-destructive">*</span>
                </Label>
                <div className="col-span-3">
                  {isCompaniesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <div className="space-y-4">
                      <Select
                        onValueChange={(value) =>
                          handleCompanyChange(value, true)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Добавить компанию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Выберите компанию
                          </SelectItem>
                          {companiesData?.data?.map((company: any) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {editingUser.companies &&
                        editingUser.companies.length > 0 && (
                          <div className="space-y-2">
                            {editingUser.companies.map((companyId: string) => {
                              const company = companiesData?.data?.find(
                                (c: any) => c.id === companyId
                              );
                              return (
                                <div
                                  key={companyId}
                                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {company?.name}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingUser({
                                        ...editingUser,
                                        companies: editingUser.companies.filter(
                                          (id: string) => id !== companyId
                                        ),
                                      });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-contracts" className="text-right">
                  Контракты
                </Label>
                <div className="col-span-3">
                  {isContractsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {editingUser.companies &&
                      editingUser.companies.length > 0 ? (
                        <>
                          <Select
                            onValueChange={(value) => {
                              if (value === "none") return;
                              if (!editingUser.contractsId?.includes(value)) {
                                setEditingUser({
                                  ...editingUser,
                                  contractsId: [
                                    ...(editingUser.contractsId || []),
                                    value,
                                  ],
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Добавить контракт" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Выберите контракт
                              </SelectItem>
                              {filteredContracts.map((contract: any) => (
                                <SelectItem
                                  key={contract.id}
                                  value={contract.id}
                                >
                                  {contract.number} -{" "}
                                  {contract.title || "Без названия"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {editingUser.contractsId &&
                            editingUser.contractsId.length > 0 && (
                              <div className="space-y-2">
                                {editingUser.contractsId.map(
                                  (contractId: string) => {
                                    const contract = contractsData?.data?.find(
                                      (c: any) => c.id === contractId
                                    );
                                    return (
                                      <div
                                        key={contractId}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm">
                                            {contract?.number} -{" "}
                                            {contract?.title || "Без названия"}
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setEditingUser({
                                              ...editingUser,
                                              contractsId:
                                                editingUser.contractsId.filter(
                                                  (id: string) =>
                                                    id !== contractId
                                                ),
                                            });
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Сначала выберите компанию для отображения доступных
                          контрактов
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleEditUser}
                disabled={
                  updateUserMutation.isPending ||
                  !editingUser.email.trim() ||
                  !editingUser.full_name?.trim() ||
                  !editingUser.role ||
                  !editingUser.companies ||
                  editingUser.companies.length === 0
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
