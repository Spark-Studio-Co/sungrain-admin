"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, FileText, Save, Trash2 } from "lucide-react";
import { useGetUserById } from "@/entities/users/hooks/query/use-get-user-by-id.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";
import { useGetUserContracts } from "@/entities/contracts/hooks/query/use-get-user-contracts.query";
import { useUpdateUsers } from "@/entities/users/hooks/mutations/use-update-user.mutation";

const roles = ["ADMIN", "USER"];

interface EditUserDialogProps {
  userId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export default function EditUserDialog({
  userId,
  isOpen,
  onOpenChange,
  onClose,
}: EditUserDialogProps) {
  const [editingUser, setEditingUser] = useState<any>(null);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [isContractsLoadingInDialog, setIsContractsLoadingInDialog] =
    useState(true);

  // API hooks
  const { data: userDetailData, isLoading: isUserDetailLoading } =
    useGetUserById(userId);
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);
  const { data: contractsData, isLoading: isContractsLoading } =
    useGetContracts({ page: 1, limit: 1000 });
  const { data: userContractsData } = useGetUserContracts(userId.toString());
  const updateUserMutation = useUpdateUsers();
  const queryClient = useQueryClient();

  // Update editing user when user details are fetched
  useEffect(() => {
    if (userDetailData && userId) {
      // Ensure companies is an array
      const companies =
        userDetailData.companies?.map((c: any) => c.company.id) || [];

      // Get contract details from userContracts if available
      const contractIds =
        userDetailData.userContracts?.map((c: any) => c.contract_id) || [];

      // Store contract details for display
      const contractDetails =
        userDetailData.userContracts?.map((uc: any) => uc.contract) || [];

      const editUserData = {
        ...userDetailData,
        status: userDetailData.status === "ACTIVE" ? "Активен" : "Неактивен",
        companies,
        contractIds,
        contractDetails,
      };

      setEditingUser(editUserData);

      // Filter contracts for the first company if available
      if (companies.length > 0) {
        const filtered = filterContractsByCompany(companies[0]);
        setFilteredContracts(filtered);
      }
    }
  }, [userDetailData, userId]);

  // Filter contracts by company
  const filterContractsByCompany = (companyId: string) => {
    if (!contractsData?.data) return [];
    return contractsData.data.filter(
      (contract: any) => contract.companyId === companyId
    );
  };

  // Handle company selection change
  const handleCompanyChange = (companyId: string) => {
    if (companyId === "none") return;

    if (!editingUser.companies.includes(companyId)) {
      setEditingUser({
        ...editingUser,
        companies: [...(editingUser.companies || []), companyId],
        // Clear contracts when company changes
        contractIds: [],
      });
    }

    // Filter contracts for the selected company
    const filtered = filterContractsByCompany(companyId);
    setFilteredContracts(filtered);
  };

  // Handle edit user submission
  const handleEditUser = () => {
    if (!editingUser) {
      return;
    }

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

    // Make sure companyIds is an array with all company IDs
    const userData = {
      name: editingUser.name,
      email: editingUser.email,
      full_name: editingUser.full_name,
      role: editingUser.role,
      companyIds: editingUser.companies || [],
      contractIds: editingUser.contractIds || [],
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
          onOpenChange(false);
        },
      }
    );
  };

  // Reset loading state when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      onClose();
      return;
    }

    // When dialog is open and we have user data, turn off loading after a delay
    if (userDetailData && userId && isContractsLoadingInDialog) {
      const timer = setTimeout(() => {
        setIsContractsLoadingInDialog(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [userDetailData, userId, isContractsLoadingInDialog, isOpen, onClose]);

  if (!editingUser) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            <span className="hidden sm:inline">Редактировать пользователя</span>
            <span className="sm:hidden">Редактирование</span>
          </DialogTitle>
          <DialogDescription className="hidden sm:block">
            Измените информацию о пользователе
          </DialogDescription>
        </DialogHeader>
        {isUserDetailLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
            <span className="text-sm sm:text-base">Загрузка...</span>
          </div>
        )}
        <div className="grid gap-4 py-4">
          {/* Mobile: Stacked layout */}
          <div className="sm:hidden space-y-4">
            <div>
              <Label
                htmlFor="edit-email-mobile"
                className="text-sm font-medium"
              >
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email-mobile"
                type="email"
                value={editingUser.email}
                onChange={(e) => {
                  setEditingUser({ ...editingUser, email: e.target.value });
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="edit-password-mobile"
                className="text-sm font-medium"
              >
                Пароль
              </Label>
              <Input
                id="edit-password-mobile"
                type="password"
                placeholder="Не менять"
                onChange={(e) => {
                  setEditingUser({
                    ...editingUser,
                    password: e.target.value,
                  });
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="edit-full_name-mobile"
                className="text-sm font-medium"
              >
                ФИО <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-full_name-mobile"
                type="text"
                value={editingUser.full_name || ""}
                onChange={(e) => {
                  setEditingUser({
                    ...editingUser,
                    full_name: e.target.value,
                  });
                }}
                className="mt-1"
              />
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editingUser.email}
                onChange={(e) => {
                  setEditingUser({ ...editingUser, email: e.target.value });
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="edit-password" className="text-right">
                Пароль
              </Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Оставьте пустым, чтобы не менять"
                onChange={(e) => {
                  setEditingUser({
                    ...editingUser,
                    password: e.target.value,
                  });
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="edit-full_name" className="text-right">
                ФИО <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-full_name"
                type="text"
                value={editingUser.full_name || ""}
                onChange={(e) => {
                  setEditingUser({
                    ...editingUser,
                    full_name: e.target.value,
                  });
                }}
                className="col-span-3 w-full"
              />
            </div>
          </div>

          {/* Mobile: Role */}
          <div className="sm:hidden">
            <Label htmlFor="edit-role-mobile" className="text-sm font-medium">
              Роль <span className="text-destructive">*</span>
            </Label>
            <Select
              value={editingUser.role}
              onValueChange={(value) => {
                setEditingUser({ ...editingUser, role: value });
              }}
            >
              <SelectTrigger className="w-full mt-1">
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

          {/* Desktop: Role */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-4 w-full items-center gap-4 mt-4">
              <Label htmlFor="edit-role" className="text-right">
                Роль <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editingUser.role}
                onValueChange={(value) => {
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
          </div>

          {/* Mobile: Companies */}
          <div className="sm:hidden">
            <Label
              htmlFor="edit-companies-mobile"
              className="text-sm font-medium"
            >
              Компании <span className="text-destructive">*</span>
            </Label>
            <div className="mt-1">
              {isCompaniesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="space-y-4">
                  <Select onValueChange={(value) => handleCompanyChange(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Добавить компанию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Выберите компанию</SelectItem>
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
                                <span className="text-sm">{company?.name}</span>
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

          {/* Desktop: Companies */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="edit-companies" className="text-right">
                Компании <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3">
                {isCompaniesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="space-y-4">
                    <Select
                      onValueChange={(value) => handleCompanyChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Добавить компанию" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Выберите компанию</SelectItem>
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
          </div>

          {/* Mobile: Contracts */}
          <div className="sm:hidden">
            <Label
              htmlFor="edit-contracts-mobile"
              className="text-sm font-medium"
            >
              Контракты
            </Label>
            <div className="mt-1">
              {isContractsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="space-y-4">
                  {isUserDetailLoading || isContractsLoadingInDialog ? (
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-medium">Загрузка...</div>
                      {Array(2)
                        .fill(0)
                        .map((_, index) => (
                          <Skeleton key={index} className="h-12 w-full" />
                        ))}
                    </div>
                  ) : (
                    <>
                      {editingUser.contractDetails &&
                        editingUser.contractDetails.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <div className="text-sm font-medium">
                              Текущие контракты:
                            </div>
                            {editingUser.contractDetails.map(
                              (contract: any) => (
                                <div
                                  key={contract.id}
                                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                      {contract.number} -{" "}
                                      {contract.title || "Без названия"}
                                    </span>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      {editingUser.companies &&
                      editingUser.companies.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Контракты можно редактировать на десктопе
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Сначала выберите компанию
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Desktop: Contracts */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
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

                        {/* Contract selection */}
                        {editingUser.companies &&
                        editingUser.companies.length > 0 ? (
                          <>
                            <Select
                              onValueChange={(value) => {
                                if (value === "none") return;
                                if (!editingUser.contractIds?.includes(value)) {
                                  setEditingUser({
                                    ...editingUser,
                                    contractIds: [
                                      ...(editingUser.contractIds || []),
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
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Сначала выберите компанию для отображения доступных
                            контрактов
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
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
  );
}
