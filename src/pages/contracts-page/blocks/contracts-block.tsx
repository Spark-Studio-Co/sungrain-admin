"use client";

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
import { useGetContracts } from "@/entities/contracts/api/get/use-get-contracts";
import { useContractDialogStore } from "@/entities/contracts/model/use-contract-dialog";
import { AddContractDialog } from "@/entities/contracts/ui/add-contract-popup";
import { useNavigate } from "react-router-dom";
import { useExportTable } from "@/entities/table/api/get/use-export-table";

// Crop options

export const ContractsBlock = () => {
  const { downloadPDF } = useExportTable();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  const {
    data: contracts = { data: [], total: 0, page: 1, totalPages: 1 },
    isLoading,
    isError,
    error,
  } = useGetContracts({
    page: currentPage,
    limit: itemsPerPage,
  });

  // Use useMemo instead of useState + useEffect for filtering
  const filteredContracts = useMemo(() => {
    if (!contracts || !contracts.data) return [];

    // If we're searching, filter the current page data
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

  // Handle search input change
  const handleSearchChange = (e: any) => {
    setSearchTerm(e.target.value);
    // Reset to first page when searching
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
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
              <Button
                onClick={() =>
                  useContractDialogStore.getState().setDialogOpen(true)
                }
              >
                <Plus /> Добавить контракт
              </Button>
              <div className="relative">
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
          {isError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>
                Не удалось загрузить данные.{" "}
                {error?.message || "Пожалуйста, попробуйте позже."}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`skeleton-${index}`} className="h-[100px]">
                        {Array(7)
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
                ) : filteredContracts.length > 0 ? (
                  filteredContracts.map((contract: any) => (
                    <TableRow
                      key={contract.id}
                      onClick={() =>
                        navigate(`/admin/contracts/${contract.id}`)
                      }
                      className="hover:bg-muted/50 h-[100px] transition-colors"
                    >
                      <TableCell className="text-center font-medium">
                        {contract.id}
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
                        {contract.departureStation}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.destinationStation}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {contract.totalVolume}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Контракты не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
              Всего контрактов: {isLoading ? "..." : contracts.total || 0}
            </div>

            {/* Pagination */}
            {!isLoading && contracts.totalPages > 1 && (
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
                        if (currentPage < (contracts.totalPages || 1)) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === (contracts.totalPages || 1)
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
      <AddContractDialog />
    </div>
  );
};
