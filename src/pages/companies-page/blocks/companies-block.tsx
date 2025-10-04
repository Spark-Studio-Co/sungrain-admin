"use client";

import type React from "react";

import { useState } from "react";
import { Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

  // API hooks
  const {
    data: companiesData,
    isLoading,
    isError,
    error,
  } = useGetCompanies(page, limit);

  // Extract pagination data
  const totalItems = companiesData?.total || 0;
  const currentPage = companiesData?.page || 1;
  const lastPage = companiesData?.lastPage || 1;

  // Filter companies based on search term
  const filteredCompanies =
    companiesData?.data?.filter((company: any) => {
      return (
        !searchTerm ||
        company.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) || [];

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleLimitChange = (value: string) => {
    const newLimitNum = Number(value);
    setLimit(newLimitNum);

    // If current page would be out of bounds with new limit, go to last valid page
    const maxPage = Math.ceil(totalItems / newLimitNum);
    if (page > maxPage) {
      setPage(Math.max(1, maxPage));
    } else {
      setPage(1); // Reset to first page
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

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="hidden sm:inline">УПРАВЛЕНИЕ КОМПАНИЯМИ</span>
            <span className="sm:hidden">Компании</span>
          </h1>
        </div>

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>
              {(error as Error)?.message ||
                "Произошла ошибка при загрузке данных"}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex justify-center sm:justify-end">
              <AddCompanyDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
              />
            </div>
          </div>
        </div>

        <Card className="border-0 sm:border shadow-none sm:shadow-sm">
          <CardHeader className="pb-2 px-2 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Компании</CardTitle>
            <CardDescription className="hidden sm:block">
              Управление списком компаний и их пользователей
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <CompanyTable
              companies={filteredCompanies}
              isLoading={isLoading}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onView={openViewDialog}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4 px-2 sm:px-6">
            {/* Mobile Pagination Controls */}
            {lastPage > 1 && (
              <div className="sm:hidden flex items-center justify-between w-full">
                {/* Previous Button */}
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  disabled={currentPage <= 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>

                {/* Page info */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {currentPage} из {lastPage}
                  </span>
                </div>

                {/* Next Button */}
                <button
                  onClick={() => {
                    if (currentPage < lastPage) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  disabled={currentPage >= lastPage}
                  className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Вперёд
                </button>
              </div>
            )}

            {/* Desktop Pagination Controls */}
            {lastPage > 1 && (
              <div className="hidden sm:flex justify-center">
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
                            : ""
                        }
                      />
                    </PaginationItem>

                    {/* Page Numbers */}
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
                            className="min-w-[40px]"
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
                            className="min-w-[40px]"
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
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Pagination Info and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
              {/* Mobile: Compact layout */}
              <div className="sm:hidden flex flex-col items-center gap-3 text-xs text-muted-foreground w-full">
                <div className="text-center">
                  Всего: {totalItems} записей | Показано:{" "}
                  {Math.min(limit, filteredCompanies.length)}
                </div>
                <div className="flex items-center justify-center gap-2 w-full">
                  <span className="whitespace-nowrap">На стр.:</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={handleLimitChange}
                  >
                    <SelectTrigger className="h-8 w-[80px] min-w-[80px]">
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

              {/* Desktop: Full layout */}
              <div className="hidden sm:flex items-center space-x-4 text-sm text-muted-foreground">
                <div>
                  Показано {Math.min(limit, filteredCompanies.length)} из{" "}
                  {totalItems} записей
                </div>
              </div>

              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  На странице:
                </span>
                <Select
                  value={limit.toString()}
                  onValueChange={handleLimitChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
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
