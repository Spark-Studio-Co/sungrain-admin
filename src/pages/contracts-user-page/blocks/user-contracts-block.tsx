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
import { Search, AlertCircle, ChevronRight } from "lucide-react";
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
import { useGetUserContracts } from "@/entities/contracts/hooks/query/use-get-user-contracts.query";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const UserContractsBlock = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  const {
    data: userContracts = { data: [], total: 0, page: 1, totalPages: 1 },
    isLoading,
    isError,
    error,
  } = useGetUserContracts({
    page: currentPage,
    limit: itemsPerPage,
  });

  const filteredContracts = useMemo(() => {
    if (!userContracts || !userContracts.data) return [];

    if (searchTerm) {
      return userContracts.data.filter((contract: any) =>
        Object.values(contract).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Otherwise return all data for the current page
    return userContracts.data;
  }, [userContracts, searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const totalPages = userContracts.totalPages || 1;
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
    navigate(`/contracts/${contract.id}`);
  };

  const contractsToDisplay = searchTerm
    ? filteredContracts
    : userContracts.data;

  return (
    <>
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                МОИ КОНТРАКТЫ
              </CardTitle>
              <CardDescription className="mt-1">
                Просмотр ваших контрактов и грузоперевозок
              </CardDescription>
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
                  <TableHead className="w-[80px] text-center font-medium">
                    Детали
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={`skeleton-${index}`} className="h-[100px]">
                        {Array(11)
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
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      Контракты не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
              Всего контрактов: {isLoading ? "..." : userContracts.total || 0}
            </div>
            {!isLoading && userContracts.totalPages > 1 && (
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
                        if (currentPage < userContracts.totalPages || 1) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === (userContracts.totalPages || 1)
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
    </>
  );
};
