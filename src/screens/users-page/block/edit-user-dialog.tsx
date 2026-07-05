"use client";

import { useEffect, useState } from "react";
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
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Building2,
  FileText,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useGetUserById } from "@/entities/users/hooks/query/use-get-user-by-id.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";
import { useUpdateUsers } from "@/entities/users/hooks/mutations/use-update-user.mutation";
import {
  createUserRoles,
  isCompanyRequiredForRole,
} from "@/shared/users/create-user-payload";
import {
  getCompanyOptions,
  getContractOptions,
  getContractsForCompanies,
  pruneContractIdsForCompanies,
} from "@/shared/users/user-access-options";

const inputClassName =
  "h-11 rounded-md border-[#dce4da] bg-white text-[#223137] shadow-sm focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";

const getRoleLabel = (role?: string) => {
  const normalizedRole = String(role || "").toUpperCase();

  return (
    createUserRoles.find((option) => option.value === normalizedRole)?.label ||
    role ||
    "Без роли"
  );
};

const getCompanyId = (companyRelation: any) =>
  String(companyRelation?.company?.id || companyRelation?.id || "");

const getContractId = (userContract: any) =>
  String(
    userContract?.contract_id ||
      userContract?.contractId ||
      userContract?.contract?.id ||
      userContract?.id ||
      ""
  );

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

  const { data: userDetailData, isLoading: isUserDetailLoading } =
    useGetUserById(userId);
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);
  const { data: contractsData, isLoading: isContractsLoading } =
    useGetContracts({ page: 1, limit: 1000 });
  const updateUserMutation = useUpdateUsers();

  const companies = companiesData?.data || [];
  const contracts = contractsData?.data || [];
  const selectedCompanyIds = editingUser?.companies || [];
  const selectedContractIds = editingUser?.contractIds || [];
  const companyOptions = getCompanyOptions(companies);
  const contractOptions = getContractOptions(
    getContractsForCompanies(contracts, selectedCompanyIds)
  );
  const isCompanyRequired = editingUser
    ? isCompanyRequiredForRole(editingUser.role)
    : true;

  useEffect(() => {
    if (!userDetailData || !userId) return;

    const companyIds =
      userDetailData.companies
        ?.map((companyRelation: any) => getCompanyId(companyRelation))
        .filter(Boolean) || [];
    const contractIds =
      userDetailData.userContracts
        ?.map((userContract: any) => getContractId(userContract))
        .filter(Boolean) || [];
    const contractDetails =
      userDetailData.userContracts
        ?.map((userContract: any) => userContract.contract)
        .filter(Boolean) || [];

    setEditingUser({
      ...userDetailData,
      role: String(userDetailData.role || "USER").toUpperCase(),
      companies: companyIds,
      contractIds,
      contractDetails,
    });
  }, [userDetailData, userId]);

  useEffect(() => {
    if (!isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  const handleCompanySelectionChange = (companyIds: string[]) => {
    if (!editingUser) return;

    setEditingUser({
      ...editingUser,
      companies: companyIds,
      contractIds: pruneContractIdsForCompanies(
        editingUser.contractIds,
        contracts,
        companyIds
      ),
    });
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    if (
      !editingUser.email.trim() ||
      !editingUser.full_name?.trim() ||
      !editingUser.role ||
      (isCompanyRequired &&
        (!editingUser.companies || editingUser.companies.length === 0))
    ) {
      return;
    }

    const userData: any = {
      name: editingUser.name,
      email: editingUser.email,
      full_name: editingUser.full_name,
      role: editingUser.role,
      companyIds: editingUser.companies || [],
      contractIds: editingUser.contractIds || [],
    };

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

  const isSaveDisabled =
    updateUserMutation.isPending ||
    !editingUser?.email?.trim() ||
    !editingUser?.full_name?.trim() ||
    !editingUser?.role ||
    (isCompanyRequired &&
      (!editingUser?.companies || editingUser.companies.length === 0));

  const loadingContent = isUserDetailLoading || !editingUser;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] !max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)] sm:w-[92vw] sm:!max-w-[980px]">
        <DialogHeader className="shrink-0 border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Доступ команды
              </div>
              <DialogTitle className="text-2xl font-black tracking-tight text-[#223137] sm:text-3xl">
                Редактировать пользователя
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-[#6f7774]">
                Измените роль, компании и доступные контракты пользователя.
              </DialogDescription>
            </div>
            {editingUser && (
              <div className="rounded-md border border-[#e5ece4] bg-white px-3 py-2 text-sm shadow-sm">
                <div className="text-[11px] font-black uppercase text-[#7b857f]">
                  Роль
                </div>
                <div className="mt-1 font-black text-[#223137]">
                  {getRoleLabel(editingUser.role)}
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          {loadingContent ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-md" />
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="h-52 w-full rounded-md" />
            </div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-md border border-[#e5ece4] bg-[#fbfcfa] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                      <UserRound className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#223137]">
                        Основные данные
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Контакты и системная роль.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-email"
                      className="text-sm font-black text-[#223137]"
                    >
                      Email <span className="text-[#f38810]">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                      <Input
                        id="edit-email"
                        type="email"
                        value={editingUser.email}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            email: e.target.value,
                          })
                        }
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-full-name"
                      className="text-sm font-black text-[#223137]"
                    >
                      ФИО <span className="text-[#f38810]">*</span>
                    </Label>
                    <Input
                      id="edit-full-name"
                      type="text"
                      value={editingUser.full_name || ""}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          full_name: e.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-password"
                      className="text-sm font-black text-[#223137]"
                    >
                      Пароль
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                      <Input
                        id="edit-password"
                        type="password"
                        placeholder="Оставьте пустым, чтобы не менять"
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            password: e.target.value,
                          })
                        }
                        className={`${inputClassName} pl-10`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-role"
                      className="text-sm font-black text-[#223137]"
                    >
                      Роль <span className="text-[#f38810]">*</span>
                    </Label>
                    <Select
                      value={String(editingUser.role || "").toUpperCase()}
                      onValueChange={(value) =>
                        setEditingUser({ ...editingUser, role: value })
                      }
                    >
                      <SelectTrigger
                        id="edit-role"
                        className={`${inputClassName} w-full`}
                      >
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
              </section>

              <section className="rounded-md border border-[#e5ece4] bg-white p-4">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex size-9 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-[#223137]">
                      Компании
                      {isCompanyRequired && (
                        <span className="ml-1 text-[#f38810]">*</span>
                      )}
                    </h3>
                    <p className="text-xs text-[#7b857f]">
                      Выберите одну или несколько компаний в одном поле.
                    </p>
                  </div>
                </div>

                {isCompaniesLoading ? (
                  <Skeleton className="h-11 w-full rounded-md" />
                ) : (
                  <MultiSelect
                    options={companyOptions}
                    selected={selectedCompanyIds}
                    onChange={handleCompanySelectionChange}
                    placeholder="Выберите компании"
                    emptyMessage="Компании не найдены"
                  />
                )}
              </section>

              <section className="rounded-md border border-[#e5ece4] bg-white p-4">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#223137]">
                        Контракты пользователя
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Сейчас назначено:{" "}
                        <span className="font-black text-[#223137]">
                          {selectedContractIds.length}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {isContractsLoading ? (
                  <Skeleton className="h-11 w-full rounded-md" />
                ) : (
                  <MultiSelect
                    options={contractOptions}
                    selected={selectedContractIds}
                    onChange={(contractIds) =>
                      setEditingUser({ ...editingUser, contractIds })
                    }
                    placeholder={
                      selectedCompanyIds.length > 0
                        ? "Выберите контракты"
                        : "Сначала выберите компанию"
                    }
                    emptyMessage="Доступных контрактов нет"
                    disabled={selectedCompanyIds.length === 0}
                  />
                )}
              </section>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-[#e5ece4] bg-[#fbfcfa] px-5 py-4 sm:px-7">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            onClick={handleEditUser}
            disabled={isSaveDisabled}
            className="h-10 rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] disabled:bg-[#d8ded6] disabled:text-[#7b857f]"
          >
            {updateUserMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
