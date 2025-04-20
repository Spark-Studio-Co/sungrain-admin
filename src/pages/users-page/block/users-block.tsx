"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useGetUserContracts } from "@/entities/contracts/hooks/query/use-get-user-contracts.query";
import { useGetUserById } from "@/entities/users/hooks/query/use-get-user-by-id.query";

const roles = ["ADMIN", "USER"];

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isContractsLoadingInDialog, setIsContractsLoadingInDialog] =
    useState(true);

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
  const [userFilteredContracts, setUserFilteredContracts] = useState<any[]>([]);

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
  const { data: userContractsData } = useGetUserContracts(
    editingUser?.id || ""
  );
  const { data: userDetailData, isLoading: isUserDetailLoading } =
    useGetUserById(selectedUserId || 0);

  const queryClient = useQueryClient();

  // Log when editingUser changes
  useEffect(() => {
    if (editingUser) {
      console.log("Editing user state updated:", {
        id: editingUser.id,
        email: editingUser.email,
        full_name: editingUser.full_name,
        role: editingUser.role,
        companies: editingUser.companies,
        contractIds: editingUser.contractIds,
        contractDetails: editingUser.contractDetails,
      });
    }
  }, [editingUser]);

  // Update editing user when user details are fetched
  useEffect(() => {
    if (userDetailData && selectedUserId) {
      console.log("User detail data received:", userDetailData);

      // Ensure companies is an array
      const companies =
        userDetailData.companies?.map((c: any) => c.company.id) || [];
      console.log("Extracted company IDs:", companies);

      // Get contract details from userContracts if available
      const contractIds =
        userDetailData.userContracts?.map((c: any) => c.contract_id) || [];
      console.log("Extracted contract IDs from userContracts:", contractIds);

      // Store contract details for display
      const contractDetails =
        userDetailData.userContracts?.map((uc: any) => uc.contract) || [];
      console.log(
        "Contract details for display from userContracts:",
        contractDetails
      );

      const editUserData = {
        ...userDetailData,
        status: userDetailData.status === "ACTIVE" ? "Активен" : "Неактивен",
        companies,
        contractIds,
        contractDetails, // Add contract details for display
      };

      console.log("Setting editingUser state to:", editUserData);
      setEditingUser(editUserData);

      // Filter contracts for the first company if available
      if (companies.length > 0) {
        console.log("Filtering contracts for company ID:", companies[0]);
        const filtered = filterContractsByCompany(companies[0]);
        console.log("Filtered contracts:", filtered);
        setFilteredContracts(filtered);
      }
    }
  }, [userDetailData, selectedUserId]);

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
    if (!editingUser) {
      console.error("Cannot edit user: editingUser is null or undefined");
      return;
    }

    console.log("Starting user edit process...");
    console.log("Original editing user data:", editingUser);

    // Validate all required fields
    if (
      !editingUser.email.trim() ||
      !editingUser.full_name?.trim() ||
      !editingUser.role ||
      !editingUser.companies ||
      editingUser.companies.length === 0
    ) {
      console.error("Validation failed for user edit:", {
        email: !editingUser.email.trim() ? "Missing email" : "Email OK",
        full_name: !editingUser.full_name?.trim()
          ? "Missing full name"
          : "Full name OK",
        role: !editingUser.role ? "Missing role" : "Role OK",
        companies: !editingUser.companies
          ? "Missing companies"
          : "Companies array exists",
        companiesLength: editingUser.companies
          ? editingUser.companies.length
          : "N/A",
      });
      return;
    }

    // Make sure companyIds is an array with all company IDs
    const userData = {
      name: editingUser.name,
      email: editingUser.email,
      full_name: editingUser.full_name,
      role: editingUser.role,
      companyIds: editingUser.companies || [], // Send all company IDs as an array
      contractIds: editingUser.contractIds || [],
    };

    // Add password to update data only if it's provided
    if (editingUser.password) {
      userData.password = editingUser.password;
      console.log("Password included in update data");
    } else {
      console.log("No password change requested");
    }

    console.log("Prepared user data for update:", userData);
    console.log("Company IDs being sent:", userData.companyIds);
    console.log("Contract IDs being sent:", userData.contractIds);

    updateUserMutation.mutate(
      {
        id: editingUser.id,
        data: userData,
      },
      {
        onSuccess: (response) => {
          console.log("User update successful:", response);
          setIsEditDialogOpen(false);
        },
        onError: (error) => {
          console.error("Failed to update user:", error);
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
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

  const filterUserContracts = (userId: string) => {
    if (!contractsData?.data) {
      console.log("No contracts data available to filter");
      return [];
    }

    console.log("Filtering contracts for user ID:", userId);
    console.log("Total contracts available:", contractsData.data.length);

    // Filter contracts that belong to the user
    const userContracts = contractsData.data.filter((contract: any) => {
      // Check if the contract has users and if the current user is in that list
      return (
        contract.users && contract.users.some((user: any) => user.id === userId)
      );
    });

    console.log("Found user contracts:", userContracts.length);
    return userContracts;
  };

  // Update filtered contracts when company selection changes
  const handleCompanyChange = (companyId: string, isEditMode = false) => {
    if (companyId === "none") return;

    console.log("Company selection changed:", {
      companyId,
      isEditMode,
    });

    // Add company to the appropriate state
    if (isEditMode) {
      if (!editingUser.companies.includes(companyId)) {
        console.log("Adding company to editingUser:", companyId);
        setEditingUser({
          ...editingUser,
          companies: [...(editingUser.companies || []), companyId],
          // Clear contracts when company changes
          contractIds: [],
        });
      } else {
        console.log("Company already in editingUser companies:", companyId);
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
    console.log("Filtered contracts for company:", {
      companyId,
      filteredCount: filtered.length,
      filtered,
    });
    setFilteredContracts(filtered);
  };

  // Modify the openEditDialog function to reset the loading state each time the dialog is opened
  const openEditDialog = (user: any) => {
    console.log("Opening edit dialog for user:", user);

    // Set loading state to true when dialog opens
    setIsContractsLoadingInDialog(true);

    // Set basic user data initially
    setEditingUser({
      id: user.id,
      email: user.email,
      full_name: user.full_name || "",
      role: user.role || "USER",
      companies: [],
      contractIds: [],
    });

    // Set the selected user ID to trigger the fetch
    setSelectedUserId(user.id);

    // Invalidate queries to force refetch
    queryClient.invalidateQueries({ queryKey: ["user", user.id] });
    queryClient.invalidateQueries({ queryKey: ["userContracts", user.id] });

    // Open the dialog
    setIsEditDialogOpen(true);
  };

  // Add an effect to turn off loading after data is fetched
  useEffect(() => {
    // Reset loading state when dialog closes
    if (!isEditDialogOpen) {
      // Clear selected user ID when dialog closes
      if (selectedUserId) {
        setSelectedUserId(null);
      }
      return;
    }

    // When dialog is open and we have user data, turn off loading after a delay
    if (userDetailData && selectedUserId && isContractsLoadingInDialog) {
      const timer = setTimeout(() => {
        setIsContractsLoadingInDialog(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [
    userDetailData,
    selectedUserId,
    isContractsLoadingInDialog,
    isEditDialogOpen,
  ]);

  // Also reset loading state when dialog is closed
  useEffect(() => {
    if (!isEditDialogOpen) {
      // Reset editing user when dialog closes
      setEditingUser(null);
    }
  }, [isEditDialogOpen]);

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
            {isUserDetailLoading && (
              <div className="flex justify-center items-center py-4">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                <span>Загрузка данных пользователя...</span>
              </div>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => {
                    console.log("Email changed:", e.target.value);
                    setEditingUser({ ...editingUser, email: e.target.value });
                  }}
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
                  onChange={(e) => {
                    console.log("Password field changed");
                    setEditingUser({
                      ...editingUser,
                      password: e.target.value,
                    });
                  }}
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
                  onChange={(e) => {
                    console.log("Full name changed:", e.target.value);
                    setEditingUser({
                      ...editingUser,
                      full_name: e.target.value,
                    });
                  }}
                  className="col-span-3 w-full"
                />
              </div>
              <div className="grid grid-cols-4 w-full items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Роль <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => {
                    console.log("Role changed:", value);
                    setEditingUser({ ...editingUser, role: value });
                  }}
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
                                      console.log(
                                        "Removing company:",
                                        companyId
                                      );
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
                      {/* Display existing contracts if available */}
                      {isUserDetailLoading || isContractsLoadingInDialog ? (
                        <div className="space-y-2 mb-4">
                          <div className="text-sm font-medium">
                            Загрузка контрактов...
                          </div>
                          {Array(3)
                            .fill(0)
                            .map((_, index) => (
                              <div key={index} className="p-2 rounded-md">
                                <Skeleton className="h-6 w-full mb-1" />
                                <Skeleton className="h-4 w-1/3" />
                              </div>
                            ))}
                        </div>
                      ) : (
                        <>
                          {editingUser.contractDetails &&
                            editingUser.contractDetails.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <div className="text-sm font-medium">
                                  Контракты пользователя:
                                </div>
                                {editingUser.contractDetails.map(
                                  (contract: any) => (
                                    <div
                                      key={contract.id}
                                      className="flex items-center justify-between p-2 bg-blue-50 rounded-md"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm">
                                          {contract.number} -{" "}
                                          {contract.name ||
                                            contract.title ||
                                            "Без названия"}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {contract.crop && (
                                          <span>Культура: {contract.crop}</span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                          {/* Display user filtered contracts */}
                          {userContractsData &&
                            userContractsData.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <div className="text-sm font-medium">
                                  Контракты пользователя:
                                </div>
                                {userContractsData.map((contract: any) => (
                                  <div
                                    key={contract.id}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-blue-500" />
                                      <span className="text-sm">
                                        {contract.number} -{" "}
                                        {contract.title || "Без названия"}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </>
                      )}

                      {editingUser.companies &&
                      editingUser.companies.length > 0 ? (
                        <>
                          {isContractsLoading || isContractsLoadingInDialog ? (
                            <div className="space-y-4">
                              <Skeleton className="h-10 w-full" />
                              <div className="space-y-2">
                                <div className="text-sm font-medium">
                                  Доступные контракты:
                                </div>
                                {Array(2)
                                  .fill(0)
                                  .map((_, index) => (
                                    <div key={index} className="p-2 rounded-md">
                                      <Skeleton className="h-6 w-full" />
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              <Select
                                onValueChange={(value) => {
                                  if (value === "none") return;
                                  if (
                                    !editingUser.contractIds?.includes(value)
                                  ) {
                                    console.log("Adding contract:", value);
                                    setEditingUser({
                                      ...editingUser,
                                      contractIds: [
                                        ...(editingUser.contractIds || []),
                                        value,
                                      ],
                                    });
                                  } else {
                                    console.log(
                                      "Contract already selected:",
                                      value
                                    );
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

                              {editingUser.contractIds &&
                                editingUser.contractIds.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium">
                                      Выбранные контракты:
                                    </div>
                                    {editingUser.contractIds.map(
                                      (contractId: string) => {
                                        const contract =
                                          contractsData?.data?.find(
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
                                                {contract?.title ||
                                                  "Без названия"}
                                              </span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                console.log(
                                                  "Removing contract:",
                                                  contractId
                                                );
                                                setEditingUser({
                                                  ...editingUser,
                                                  contractIds:
                                                    editingUser.contractIds.filter(
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
                onClick={() => {
                  console.log("Save button clicked");
                  console.log(
                    "Current editingUser state before save:",
                    editingUser
                  );
                  handleEditUser();
                }}
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
