"use client";

import type React from "react";

import { useState } from "react";
import {
  Building2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { CrmErrorState } from "@/components/ui/crm-state";

import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import AddCompanyDialog from "./add-company-dialog";
import CompanyTable from "./company-table";
import EditCompanyDialog from "./edit-company-dialog";
import DeleteCompanyDialog from "./delete-company-dialog";
import ViewCompanyDialog from "./view-company-dialog";

export default function CompaniesBlock() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
  );
  const [deletingCompany, setDeletingCompany] = useState<any>(null);
  const [viewingCompany, setViewingCompany] = useState<any>(null);

  const {
    data: companiesData,
    isLoading,
    isError,
    error,
  } = useGetCompanies(page, limit);

  const totalItems = companiesData?.total || 0;
  const currentPage = companiesData?.page || 1;
  const lastPage = companiesData?.lastPage || companiesData?.totalPages || 1;
  const companies = companiesData?.data || [];

  const filteredCompanies =
    companies.filter((company: any) => {
      const query = searchTerm.toLowerCase();

      return (
        !searchTerm ||
        company.name?.toLowerCase().includes(query) ||
        String(company.id).includes(query)
      );
    }) || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (value: string) => {
    const newLimitNum = Number(value);
    setLimit(newLimitNum);

    const maxPage = Math.ceil(totalItems / newLimitNum);
    if (page > maxPage) {
      setPage(Math.max(1, maxPage));
    } else {
      setPage(1);
    }
  };

  const openEditDialog = (company: any) => {
    setSelectedCompanyId(company.id);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (company: any) => {
    setDeletingCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (company: any) => {
    setViewingCompany(company);
    setIsViewDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden px-0">
        {isError && (
          <CrmErrorState
            className="min-h-[10rem]"
            title="Ошибка загрузки компаний"
            description={
              (error as Error)?.message ||
              "Произошла ошибка при загрузке данных"
            }
          />
        )}

        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                  <Building2 className="h-3.5 w-3.5" />
                  Партнерская база
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-[#223137]">
                  Компании
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm text-[#6f7774]">
                  Управление партнерами, контрагентами и компаниями,
                  участвующими в логистике SUNGRAIN.
                </CardDescription>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[620px]">
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Всего
                  </div>
                  <div className="mt-1 text-lg font-black text-[#223137]">
                    {totalItems}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">компаний</div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    На экране
                  </div>
                  <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                    {filteredCompanies.length}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    после фильтра
                  </div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Страница
                  </div>
                  <div className="mt-1 text-lg font-black text-[#d5740b]">
                    {currentPage}/{lastPage}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">реестра</div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Реестр
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {totalItems}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Активные
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {filteredCompanies.length}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Доступ
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      CRM
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <UserCheck className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Лимит
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {limit}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-white px-4 py-4 sm:px-5 lg:px-6">
            <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-center">
              <div className="min-w-0">
                <CardTitle className="text-xl font-black text-[#223137] xl:whitespace-nowrap">
                  Реестр компаний
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-[#6f7774]">
                  Поиск, просмотр и управление компаниями.
                </CardDescription>
              </div>
              <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_auto] xl:items-center">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    placeholder="Поиск по названию или ID..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="h-10 rounded-md border-[#dce4da] bg-white pl-10 text-[#223137] shadow-sm"
                  />
                </div>
                <AddCompanyDialog
                  isOpen={isAddDialogOpen}
                  onOpenChange={setIsAddDialogOpen}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-0">
            <CompanyTable
              companies={filteredCompanies}
              isLoading={isLoading}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onView={openViewDialog}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
            {lastPage > 1 && (
              <div className="flex w-full items-center justify-between gap-3 sm:hidden">
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  disabled={currentPage <= 1}
                  className="h-10 rounded-md border border-[#dce4da] bg-white px-4 text-sm font-bold text-[#53605a] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Назад
                </button>
                <div className="rounded-md border border-[#dfe7de] bg-white px-3 py-2 text-sm font-black text-[#223137]">
                  {currentPage} / {lastPage}
                </div>
                <button
                  onClick={() => {
                    if (currentPage < lastPage) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  disabled={currentPage >= lastPage}
                  className="h-10 rounded-md border border-[#dce4da] bg-white px-4 text-sm font-bold text-[#53605a] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            )}

            {lastPage > 1 && (
              <div className="hidden w-full justify-center sm:flex">
                <Pagination>
                  <PaginationContent className="flex-wrap gap-1">
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
                            : "rounded-md border-[#dce4da] bg-white text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                        }
                      />
                    </PaginationItem>

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
                            className={`min-w-[40px] rounded-md ${
                              currentPage === pageNum
                                ? "bg-[#f38810] text-white hover:bg-[#db790c] hover:text-white"
                                : "border-[#dce4da] bg-white text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                            }`}
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
                            className="min-w-[40px] rounded-md border-[#dce4da] bg-white text-[#53605a]"
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
                            : "rounded-md border-[#dce4da] bg-white text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            <div className="flex w-full flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center text-[#7b857f] sm:text-left">
                Показано{" "}
                <span className="font-black text-[#223137]">
                  {Math.min(limit, filteredCompanies.length)}
                </span>{" "}
                из <span className="font-black text-[#223137]">{totalItems}</span>{" "}
                записей
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold text-[#7b857f]">
                  На странице:
                </span>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="h-9 w-[82px] rounded-md border-[#dce4da] bg-white font-bold text-[#223137]">
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
          </CardFooter>
        </Card>
      </div>

      {selectedCompanyId && (
        <EditCompanyDialog
          companyId={selectedCompanyId}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onClose={() => setSelectedCompanyId(null)}
        />
      )}

      {deletingCompany && (
        <DeleteCompanyDialog
          company={deletingCompany}
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        />
      )}

      {viewingCompany && (
        <ViewCompanyDialog
          company={viewingCompany}
          isOpen={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          onEdit={() => {
            setIsViewDialogOpen(false);
            openEditDialog(viewingCompany);
          }}
        />
      )}
    </>
  );
}
