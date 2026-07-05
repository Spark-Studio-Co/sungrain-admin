"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useToast } from "@/components/ui/toast";
import { MultiSelect } from "@/components/ui/multi-select";
import { UserPlus } from "lucide-react";
import { useAddUser } from "@/entities/users/hooks/mutations/use-add-user.mutation";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";
import {
  buildCreateUserPayload,
  createUserRoles,
  getCreateUserValidationError,
  isCompanyRequiredForRole,
} from "@/shared/users/create-user-payload";
import {
  getCompanyOptions,
  getContractOptions,
  getContractsForCompanies,
  pruneContractIdsForCompanies,
} from "@/shared/users/user-access-options";

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddUserDialog({
  isOpen,
  onOpenChange,
}: AddUserDialogProps) {
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "USER",
    companyId: [] as string[],
    contractIds: [] as string[],
  });

  // API hooks
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);
  const { data: contractsData, isLoading: isContractsLoading } =
    useGetContracts({ page: 1, limit: 1000 });
  const addUserMutation = useAddUser();
  const toast = useToast();
  const companies = companiesData?.data || [];
  const contracts = contractsData?.data || [];
  const companyOptions = getCompanyOptions(companies);
  const contractOptions = getContractOptions(
    getContractsForCompanies(contracts, newUser.companyId)
  );

  const handleAddUser = () => {
    const validationError = getCreateUserValidationError(newUser);
    if (validationError) {
      toast.error("Не получилось создать пользователя", validationError);
      return;
    }

    const userData = buildCreateUserPayload(newUser);

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
        onOpenChange(false);
        toast.success("Пользователь создан");
      },
    });
  };

  const handleCompanySelectionChange = (companyIds: string[]) => {
    setNewUser((currentUser) => ({
      ...currentUser,
      companyId: companyIds,
      contractIds: pruneContractIdsForCompanies(
        currentUser.contractIds,
        contracts,
        companyIds
      ),
    }));
  };

  // Check if company selection is required based on role
  const isCompanyRequired = isCompanyRequiredForRole(newUser.role);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 w-full gap-2 rounded-md bg-[#f38810] px-4 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] transition-colors hover:bg-[#db790c] xl:w-auto">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Добавить пользователя</span>
          <span className="sm:hidden">Добавить</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            <span className="hidden sm:inline">
              Добавить нового пользователя
            </span>
            <span className="sm:hidden">Новый пользователь</span>
          </DialogTitle>
          <DialogDescription className="hidden sm:block">
            Заполните информацию о новом пользователе
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Mobile: Stacked layout */}
          <div className="sm:hidden space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Пароль <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="full_name" className="text-sm font-medium">
                ФИО <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                type="text"
                value={newUser.full_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, full_name: e.target.value })
                }
                className="mt-1"
              />
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email-desktop" className="text-right">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email-desktop"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="password-desktop" className="text-right">
                Пароль <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password-desktop"
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="full_name-desktop" className="text-right">
                ФИО <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name-desktop"
                type="text"
                value={newUser.full_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, full_name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>

          {/* Mobile: Role */}
          <div className="sm:hidden">
            <Label htmlFor="role-mobile" className="text-sm font-medium">
              Роль <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newUser.role}
              onValueChange={(value) => setNewUser({ ...newUser, role: value })}
            >
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                {createUserRoles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Role */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-4 items-center gap-4 mt-4">
              <Label htmlFor="role" className="text-right">
                Роль <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  {createUserRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:mt-4 sm:grid-cols-4 sm:items-start sm:gap-4">
            <Label
              htmlFor="companies"
              className="text-sm font-medium sm:pt-3 sm:text-right"
            >
              Компании{" "}
              {isCompanyRequired && <span className="text-destructive">*</span>}
            </Label>
            <div id="companies" className="sm:col-span-3">
              {isCompaniesLoading ? (
                <Skeleton className="h-11 w-full rounded-md" />
              ) : (
                <MultiSelect
                  options={companyOptions}
                  selected={newUser.companyId}
                  onChange={handleCompanySelectionChange}
                  placeholder="Выберите компании"
                  emptyMessage="Компании не найдены"
                />
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:mt-4 sm:grid-cols-4 sm:items-start sm:gap-4">
            <Label
              htmlFor="contracts"
              className="text-sm font-medium sm:pt-3 sm:text-right"
            >
              Контракты
            </Label>
            <div id="contracts" className="sm:col-span-3">
              {isContractsLoading ? (
                <Skeleton className="h-11 w-full rounded-md" />
              ) : (
                <MultiSelect
                  options={contractOptions}
                  selected={newUser.contractIds}
                  onChange={(contractIds) =>
                    setNewUser({ ...newUser, contractIds })
                  }
                  placeholder={
                    newUser.companyId.length > 0
                      ? "Выберите контракты"
                      : "Сначала выберите компанию"
                  }
                  emptyMessage="Доступных контрактов нет"
                  disabled={newUser.companyId.length === 0}
                />
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="submit"
            onClick={handleAddUser}
            disabled={
              addUserMutation.isPending ||
              !newUser.email.trim() ||
              !newUser.password.trim() ||
              !newUser.full_name.trim() ||
              !newUser.role ||
              (isCompanyRequired && newUser.companyId.length === 0)
            }
            className="w-full rounded-md bg-[#f38810] font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
          >
            {addUserMutation.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Добавление...</span>
                <span className="sm:hidden">Добавляем</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Добавить пользователя</span>
                <span className="sm:hidden">Добавить</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
