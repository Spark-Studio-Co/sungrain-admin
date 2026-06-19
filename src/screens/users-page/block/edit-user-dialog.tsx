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
import {
  Building2,
  FileText,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useGetUserById } from "@/entities/users/hooks/query/use-get-user-by-id.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";
import { useUpdateUsers } from "@/entities/users/hooks/mutations/use-update-user.mutation";

const roleOptions = [
  { label: "Администратор", value: "admin" },
  { label: "Менеджер", value: "manager" },
  { label: "Логистика", value: "logist" },
  { label: "Финансы", value: "finance" },
  { label: "Пользователь", value: "user" },
];

const inputClassName =
  "h-11 rounded-md border-[#dce4da] bg-white text-[#223137] shadow-sm focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";

const getRoleLabel = (role?: string) => {
  const normalizedRole = String(role || "").toLowerCase();

  return (
    roleOptions.find((option) => option.value === normalizedRole)?.label ||
    role ||
    "Без роли"
  );
};

const getCompanyId = (companyRelation: any) =>
  String(companyRelation?.company?.id || companyRelation?.id || "");

const getCompanyName = (companyRelation: any) =>
  companyRelation?.company?.name || companyRelation?.name || "Компания";

const getContractId = (userContract: any) =>
  String(
    userContract?.contract_id ||
      userContract?.contractId ||
      userContract?.contract?.id ||
      userContract?.id ||
      ""
  );

const getContractTitle = (contract: any) =>
  contract?.name || contract?.title || "Без названия";

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
      role: String(userDetailData.role || "user").toLowerCase(),
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

  const selectedCompanies = editingUser?.companies
    ? editingUser.companies
        .map((companyId: string) =>
          companies.find(
            (company: any) => String(company.id) === String(companyId)
          )
        )
        .filter(Boolean)
    : [];

  const selectedContracts = editingUser?.contractIds
    ? editingUser.contractIds
        .map((contractId: string) => {
          const fromAllContracts = contracts.find(
            (contract: any) => String(contract.id) === String(contractId)
          );
          const fromDetails = editingUser.contractDetails?.find(
            (contract: any) => String(contract?.id) === String(contractId)
          );

          return fromAllContracts || fromDetails;
        })
        .filter(Boolean)
    : [];

  const availableContracts = editingUser?.companies?.length
    ? contracts.filter((contract: any) => {
        const belongsToSelectedCompany = editingUser.companies.some(
          (companyId: string) => String(contract.companyId) === String(companyId)
        );
        const alreadyAssigned = editingUser.contractIds?.some(
          (contractId: string) => String(contract.id) === String(contractId)
        );

        return belongsToSelectedCompany && !alreadyAssigned;
      })
    : [];

  const handleCompanyChange = (companyId: string) => {
    if (companyId === "none" || !editingUser) return;

    if (!editingUser.companies?.includes(companyId)) {
      setEditingUser({
        ...editingUser,
        companies: [...(editingUser.companies || []), companyId],
      });
    }
  };

  const handleRemoveCompany = (companyId: string) => {
    if (!editingUser) return;

    const nextCompanyIds = editingUser.companies.filter(
      (id: string) => String(id) !== String(companyId)
    );
    const nextContractIds = editingUser.contractIds.filter((contractId: string) => {
      const contract = contracts.find(
        (item: any) => String(item.id) === String(contractId)
      );

      return !contract || nextCompanyIds.includes(String(contract.companyId));
    });

    setEditingUser({
      ...editingUser,
      companies: nextCompanyIds,
      contractIds: nextContractIds,
    });
  };

  const handleAddContract = (contractId: string) => {
    if (contractId === "none" || !editingUser) return;

    if (!editingUser.contractIds?.includes(contractId)) {
      setEditingUser({
        ...editingUser,
        contractIds: [...(editingUser.contractIds || []), contractId],
      });
    }
  };

  const handleRemoveContract = (contractId: string) => {
    if (!editingUser) return;

    setEditingUser({
      ...editingUser,
      contractIds: editingUser.contractIds.filter(
        (id: string) => String(id) !== String(contractId)
      ),
    });
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    if (
      !editingUser.email.trim() ||
      !editingUser.full_name?.trim() ||
      !editingUser.role ||
      !editingUser.companies ||
      editingUser.companies.length === 0
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
    !editingUser?.companies ||
    editingUser.companies.length === 0;

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
                      value={String(editingUser.role || "").toLowerCase()}
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
                        {roleOptions.map((role) => (
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
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-[#223137]">
                        Компании
                        <span className="ml-1 text-[#f38810]">*</span>
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Пользователь видит данные выбранных компаний.
                      </p>
                    </div>
                  </div>
                  <div className="sm:w-[260px]">
                    {isCompaniesLoading ? (
                      <Skeleton className="h-10 w-full rounded-md" />
                    ) : (
                      <Select onValueChange={handleCompanyChange}>
                        <SelectTrigger className={`${inputClassName} w-full`}>
                          <SelectValue placeholder="Добавить компанию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Выберите компанию</SelectItem>
                          {companies.map((company: any) => (
                            <SelectItem
                              key={company.id}
                              value={String(company.id)}
                            >
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {selectedCompanies.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedCompanies.map((company: any) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Building2 className="h-4 w-4 shrink-0 text-[#2f6b4f]" />
                          <span className="truncate text-sm font-bold text-[#223137]">
                            {getCompanyName(company)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCompany(String(company.id))}
                          className="h-8 w-8 shrink-0 rounded-md text-[#9aa49f] hover:bg-[#fff1ed] hover:text-[#b9472d]"
                          aria-label="Удалить компанию"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-[#dfe7de] bg-[#fbfcfa] px-4 py-5 text-sm font-medium text-[#7b857f]">
                    Добавьте хотя бы одну компанию.
                  </div>
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
                          {selectedContracts.length}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="sm:w-[300px]">
                    {isContractsLoading ? (
                      <Skeleton className="h-10 w-full rounded-md" />
                    ) : (
                      <Select onValueChange={handleAddContract}>
                        <SelectTrigger className={`${inputClassName} w-full`}>
                          <SelectValue placeholder="Добавить контракт" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Выберите контракт</SelectItem>
                          {availableContracts.map((contract: any) => (
                            <SelectItem
                              key={contract.id}
                              value={String(contract.id)}
                            >
                              {contract.number} - {getContractTitle(contract)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {selectedContracts.length > 0 ? (
                  <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                    {selectedContracts.map((contract: any) => (
                      <div
                        key={contract.id}
                        className="grid gap-3 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-[#2f6b4f] shadow-sm">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-[#223137]">
                              {contract.number} - {getContractTitle(contract)}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {contract.crop && (
                                <span className="rounded-md border border-[#dce8dc] bg-white px-2 py-0.5 text-[11px] font-bold text-[#2f6b4f]">
                                  {contract.crop}
                                </span>
                              )}
                              {contract.currency && (
                                <span className="rounded-md border border-[#f2dfca] bg-white px-2 py-0.5 text-[11px] font-bold text-[#d5740b]">
                                  {contract.currency}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveContract(String(contract.id))}
                          className="h-8 w-8 justify-self-end rounded-md text-[#9aa49f] hover:bg-[#fff1ed] hover:text-[#b9472d]"
                          aria-label="Удалить контракт"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-[#dfe7de] bg-[#fbfcfa] px-4 py-5 text-sm font-medium text-[#7b857f]">
                    Контракты не назначены. Выберите компанию и добавьте контракт.
                  </div>
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
