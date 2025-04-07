"use client";

import type React from "react";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileIcon as FilePdf,
  Search,
  Plus,
  Download,
  ChevronDown,
  AlertCircle,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";
import { useContractDialogStore } from "@/entities/contracts/model/use-contract-dialog";
import { AddContractDialog } from "@/entities/contracts/ui/add-contract-popup";
import { useNavigate } from "react-router-dom";
import { useExportTable } from "@/entities/table/hooks/query/use-export-table.query";
import { useGetUserContracts } from "@/entities/contracts/hooks/query/use-get-user-contracts.query";
import { useDeleteContract } from "@/entities/contracts/hooks/mutations/use-delete-contract.mutations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const ContractsBlock = () => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const { downloadPDF } = useExportTable();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any>(null);

  const {
    data: contracts = { data: [], total: 0, page: 1, totalPages: 1 },
    isLoading,
    isError,
    error,
  } = useGetContracts({
    page: currentPage,
    limit: itemsPerPage,
  });

  const {
    data: userContracts = { data: [], total: 0, page: 1, totalPages: 1 },
    isLoading: isUserLoading,
    isError: isUserError,
    error: userError,
  } = useGetUserContracts({
    page: currentPage,
    limit: itemsPerPage,
  });

  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();

  const filteredContracts = useMemo(() => {
    if (!contracts || !contracts.data) return [];

    if (searchTerm) {
      return contracts.data.filter((contract: any) =>
        Object.values(contract).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Otherwise return all data for the current page
    return contracts.data;
  }, [contracts, searchTerm]);

  const contractsToDisplay = isAdmin ? contracts.data : userContracts.data;
  const isDataLoading = isAdmin ? isLoading : isUserLoading;
  const isDataError = isAdmin ? isError : isUserError;
  const dataError = isAdmin ? error : userError;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDeleteClick = (e: React.MouseEvent, contract: any) => {
    e.stopPropagation(); // Prevent row click navigation
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contractToDelete) {
      deleteContract(contractToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
        },
      });
    }
  };

  const getPageNumbers = () => {
    const totalPages = contracts.totalPages || 1;
    const currentPageNum = currentPage;

    // If 5 or fewer pages, show all
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Otherwise, show current page, 2 before and 2 after if possible
    const pages = [];

    // Always include first page
    pages.push(1);

    // Add ellipsis if needed
    if (currentPageNum > 3) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add pages around current page
    const startPage = Math.max(2, currentPageNum - 1);
    const endPage = Math.min(totalPages - 1, currentPageNum + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (currentPageNum < totalPages - 2) {
      pages.push(-2); // -2 represents ellipsis
    }

    // Always include last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const handleRowClick = (contract: any) => {
    navigate(
      isAdmin ? `/admin/contracts/${contract.id}` : `/contracts/${contract.id}`
    );
  };

  return (
    <div>
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                СТРАНИЦА КОНТРАКТЫ
              </CardTitle>
              <CardDescription className="mt-1">
                Управление контрактами и грузоперевозками
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isAdmin && (
                <Button
                  onClick={() =>
                    useContractDialogStore.getState().setDialogOpen(true)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Добавить контракт
                </Button>
              )}
              <div className="relative">
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      document
                        ?.getElementById("export-menu")
                        ?.classList.toggle("hidden")
                    }
                  >
                    <Download className="h-4 w-4" />
                    Экспорт
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}

                <div
                  id="export-menu"
                  className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden z-10"
                >
                  <div className="py-1">
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={downloadPDF}
                    >
                      <FilePdf className="mr-2 h-4 w-4" />
                      Скачать в PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск контрактов..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full md:max-w-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {isDataError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>
                Не удалось загрузить данные.{" "}
                {dataError?.message || "Пожалуйста, попробуйте позже."}
              </AlertDescription>
            </Alert>
          )}
          <div className="rounded-md border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px] text-center font-medium">
                    Номер
                  </TableHead>
                  <TableHead className="w-[150px] text-center font-medium">
                    Название
                  </TableHead>
                  <TableHead className="w-[150px] text-center font-medium">
                    Культура
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Грузоотправитель
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Грузополучатель
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Станция отправления
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Станция назначения
                  </TableHead>
                  <TableHead className="w-[150px] text-center font-medium">
                    Общий объем (тонн)
                  </TableHead>
                  <TableHead className="w-[100px] text-center font-medium">
                    Валюта
                  </TableHead>
                  <TableHead className="w-[100px] text-center font-medium">
                    Компания
                  </TableHead>
                  {isAdmin && (
                    <TableHead className="w-[80px] text-center font-medium">
                      Действия
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`skeleton-${index}`} className="h-[100px]">
                        {Array(isAdmin ? 11 : 10)
                          .fill(0)
                          .map((_, cellIndex) => (
                            <TableCell
                              key={`cell-${index}-${cellIndex}`}
                              className="text-center"
                            >
                              <Skeleton className="h-6 w-full" />
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                ) : searchTerm ? (
                  filteredContracts.length > 0 ? (
                    filteredContracts.map((contract: any) => (
                      <TableRow
                        key={contract.id}
                        className="hover:bg-muted/50 h-[100px] transition-colors cursor-pointer"
                        onClick={() => handleRowClick(contract)}
                      >
                        <TableCell className="text-center font-medium">
                          {contract.number}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.crop}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.sender}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.receiver}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.departure_station}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.destination_station}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {contract.total_volume}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.currency}
                        </TableCell>
                        <TableCell className="text-center">
                          {contract.company?.name || "-"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="sr-only">Открыть меню</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) =>
                                    handleDeleteClick(e, contract)
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Удалить
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 11 : 10}
                        className="h-24 text-center"
                      >
                        Контракты не найдены.
                      </TableCell>
                    </TableRow>
                  )
                ) : contractsToDisplay.length > 0 ? (
                  contractsToDisplay.map((contract: any) => (
                    <TableRow
                      key={contract.id}
                      className="hover:bg-muted/50 h-[100px] transition-colors cursor-pointer"
                      onClick={() => handleRowClick(contract)}
                    >
                      <TableCell className="text-center font-medium">
                        {contract.number}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.crop}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.sender}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.receiver}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.departure_station}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.destination_station}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {contract.total_volume}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.currency}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.company ? (
                          <Badge variant="outline">
                            {contract.company.name}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="sr-only">Открыть меню</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => handleDeleteClick(e, contract)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 11 : 10}
                      className="h-24 text-center"
                    >
                      Контракты не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
              Всего контрактов:
              {isDataLoading
                ? "..."
                : (isAdmin ? contracts.total : userContracts.total) || 0}
            </div>
            {!isDataLoading &&
              (isAdmin ? contracts.totalPages : userContracts.totalPages) >
                1 && (
                <Pagination>
                  <PaginationContent>
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
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>

                    {getPageNumbers().map((pageNum, index) => (
                      <PaginationItem key={index}>
                        {pageNum < 0 ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={pageNum === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(pageNum);
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (
                            currentPage <
                              (isAdmin
                                ? contracts.totalPages
                                : userContracts.totalPages) ||
                            1
                          ) {
                            handlePageChange(currentPage + 1);
                          }
                        }}
                        className={
                          currentPage ===
                          ((isAdmin
                            ? contracts.totalPages
                            : userContracts.totalPages) || 1)
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удаление контракта</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить контракт{" "}
              {contractToDelete?.name ? `"${contractToDelete.name}"` : ""}? Это
              действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddContractDialog />
    </div>
  );
};
