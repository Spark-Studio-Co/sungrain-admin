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
import { Building, FileText, Trash2, UserPlus } from "lucide-react";
import { useAddUser } from "@/entities/users/hooks/mutations/use-add-user.mutation";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";

const roles = ["ADMIN", "USER", "ACCOUNTANT"];

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
  // Track contracts for each company
  const [contractsByCompany, setContractsByCompany] = useState<
    Record<string, any[]>
  >({});

  // API hooks
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);
  const { data: contractsData, isLoading: isContractsLoading } =
    useGetContracts({ page: 1, limit: 1000 });
  const addUserMutation = useAddUser();

  const handleAddUser = () => {
    // Validate all required fields
    if (
      !newUser.email.trim() ||
      !newUser.password.trim() ||
      !newUser.full_name.trim() ||
      !newUser.role
    ) {
      return;
    }

    // For accountant role, company is not required
    if (newUser.role !== "ACCOUNTANT" && newUser.companyId.length === 0) {
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
        onOpenChange(false);
      },
    });
  };

  const filterContractsByCompany = (companyId: string) => {
    if (!contractsData?.data) return [];
    return contractsData.data.filter(
      (contract: any) => contract.companyId === companyId
    );
  };

  // Get all contracts for all selected companies
  const getAllFilteredContracts = () => {
    if (!contractsData?.data || newUser.companyId.length === 0) return [];

    // Combine all contracts from all selected companies
    return contractsData.data.filter((contract: any) =>
      newUser.companyId.includes(contract.companyId)
    );
  };

  const handleCompanyChange = (companyId: string) => {
    if (companyId === "none") return;

    if (!newUser.companyId.includes(companyId)) {
      // Add the company to the list
      const updatedCompanyIds = [...newUser.companyId, companyId];

      setNewUser({
        ...newUser,
        companyId: updatedCompanyIds,
        // Don't clear contracts when adding a company
      });

      // Store contracts for this company
      const companyContracts = filterContractsByCompany(companyId);
      setContractsByCompany((prev) => ({
        ...prev,
        [companyId]: companyContracts,
      }));
    }
  };

  // Check if company selection is required based on role
  const isCompanyRequired = newUser.role !== "ACCOUNTANT";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Добавить пользователя
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
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
              onValueChange={(value) => setNewUser({ ...newUser, role: value })}
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
            <Label htmlFor="companies" className="text-right">
              Компании{" "}
              {isCompanyRequired && <span className="text-destructive">*</span>}
            </Label>
            <div className="col-span-3">
              {isCompaniesLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="space-y-4">
                  <Select onValueChange={(value) => handleCompanyChange(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder="Добавить компанию"
                        className="w-full"
                      />
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
                              <span className="text-sm">{company?.name}</span>
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
                              contractIds: [...newUser.contractIds, value],
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Добавить контракт" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Выберите контракт
                          </SelectItem>
                          {getAllFilteredContracts().map((contract: any) => (
                            <SelectItem key={contract.id} value={contract.id}>
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
                                      contractIds: newUser.contractIds.filter(
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
            onClick={handleAddUser}
            disabled={
              addUserMutation.isPending ||
              !newUser.email.trim() ||
              !newUser.password.trim() ||
              !newUser.full_name.trim() ||
              !newUser.role ||
              (isCompanyRequired && newUser.companyId.length === 0)
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
  );
}
