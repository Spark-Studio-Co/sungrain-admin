"use client";

import type React from "react";

import { useState, useMemo, useRef } from "react";
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
  Calendar,
  Edit,
  FileIcon as FilePdf,
  Search,
  Plus,
  Download,
  ChevronDown,
  AlertCircle,
  Trash2,
  MoreHorizontal,
  Upload,
  X,
  File,
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
import { useUpdateContract } from "@/entities/contracts/hooks/mutations/use-update-contract.mutation";

export const ContractsBlock = () => {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const { downloadPDF } = useExportTable();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [contractToEdit, setContractToEdit] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const { mutate: updateContract, isPending: isUpdating } = useUpdateContract();

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

  const handleEditClick = (e: React.MouseEvent, contract: any) => {
    e.stopPropagation(); // Prevent row click navigation
    setContractToEdit({
      ...contract,
      date: contract.date || new Date().toISOString().split("T")[0],
    });
    setSelectedFiles([]);
    setFilesToRemove([]);
    setEditDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setFilesToRemove((prev) => [...prev, fileId]);
  };

  const handleUpdateContract = async () => {
    if (!contractToEdit) return;

    // Create FormData for file upload
    const formData = new FormData();

    // Add contract data (excluding ID)
    Object.keys(contractToEdit).forEach((key) => {
      if (
        key !== "id" &&
        key !== "files" &&
        key !== "company" &&
        contractToEdit[key] !== undefined &&
        contractToEdit[key] !== null
      ) {
        formData.append(key, contractToEdit[key]);
      }
    });

    // Add company ID if present
    if (contractToEdit.company && contractToEdit.company.id) {
      formData.append("companyId", contractToEdit.company.id);
    }

    // Add new files
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    // Add file metadata
    const filesInfo = selectedFiles.map((file) => ({
      filename: file.name,
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
    }));

    if (filesInfo.length > 0) {
      formData.append("files_info", JSON.stringify(filesInfo));
    }

    // Add files to remove
    if (filesToRemove.length > 0) {
      formData.append("filesToRemove", JSON.stringify(filesToRemove));
    }

    updateContract(
      {
        id: contractToEdit.id,
        data: formData,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedFiles([]);
          setFilesToRemove([]);
        },
      }
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
              {isAdmin && !isLoading && (
                <Button
                  onClick={() =>
                    useContractDialogStore.getState().setDialogOpen(true)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Добавить контракт
                </Button>
              )}
              <div className="relative">
                {isAdmin && !isLoading && (
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
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px] text-center font-medium">
                      Номер
                    </TableHead>
                    <TableHead className="w-[150px] text-center font-medium">
                      Дата контракта
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
                        <TableRow
                          key={`skeleton-${index}`}
                          className="h-[100px]"
                        >
                          {Array(isAdmin ? 12 : 11)
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
                            {contract.date
                              ? new Date(contract.date).toLocaleDateString()
                              : "-"}
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
                                    <span className="sr-only">
                                      Открыть меню
                                    </span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(e, contract);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Редактировать
                                  </DropdownMenuItem>
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
                          colSpan={isAdmin ? 12 : 11}
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
                          {contract.date
                            ? new Date(contract.date).toLocaleDateString()
                            : "-"}
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditClick(e, contract);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Редактировать
                                </DropdownMenuItem>
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
                        colSpan={isAdmin ? 12 : 11}
                        className="h-24 text-center"
                      >
                        Контракты не найдены.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Редактировать контракт</DialogTitle>
            <DialogDescription>
              Внесите изменения в данные контракта
            </DialogDescription>
          </DialogHeader>
          {contractToEdit && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-number" className="text-sm font-medium">
                    Номер <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-number"
                    value={contractToEdit.number || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-unk" className="text-sm font-medium">
                    УНК
                  </label>
                  <Input
                    id="edit-unk"
                    value={contractToEdit.unk || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        unk: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-sm font-medium">
                    Название <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-name"
                    value={contractToEdit.name || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-crop" className="text-sm font-medium">
                    Культура <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-crop"
                    value={contractToEdit.crop || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        crop: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-date" className="text-sm font-medium">
                    Дата контракта <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="edit-date"
                      type="date"
                      value={contractToEdit.date?.split("T")[0] || ""}
                      onChange={(e) =>
                        setContractToEdit({
                          ...contractToEdit,
                          date: e.target.value,
                        })
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => {
                        // Set date to today
                        const today = new Date().toISOString().split("T")[0];
                        setContractToEdit({
                          ...contractToEdit,
                          date: today,
                        });
                      }}
                      title="Установить сегодняшнюю дату"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Date calculator buttons removed as requested */}
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-sender" className="text-sm font-medium">
                    Грузоотправитель <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-sender"
                    value={contractToEdit.sender || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        sender: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-receiver"
                    className="text-sm font-medium"
                  >
                    Грузополучатель <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-receiver"
                    value={contractToEdit.receiver || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        receiver: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-departure"
                    className="text-sm font-medium"
                  >
                    Станция отправления{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-departure"
                    value={contractToEdit.departure_station || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        departure_station: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-destination"
                    className="text-sm font-medium"
                  >
                    Станция назначения{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-destination"
                    value={contractToEdit.destination_station || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        destination_station: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-volume" className="text-sm font-medium">
                    Общий объем (тонн){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-volume"
                    type="number"
                    value={contractToEdit.total_volume || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        total_volume: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-estimated-cost"
                    className="text-sm font-medium"
                  >
                    Ориентировочная стоимость
                  </label>
                  <Input
                    id="edit-estimated-cost"
                    type="number"
                    value={contractToEdit.estimated_cost || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        estimated_cost: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-currency"
                    className="text-sm font-medium"
                  >
                    Валюта <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-currency"
                    value={contractToEdit.currency || ""}
                    onChange={(e) =>
                      setContractToEdit({
                        ...contractToEdit,
                        currency: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Файлы</label>
                <div className="border rounded-md p-4">
                  {/* Existing files */}
                  {contractToEdit.files && contractToEdit.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">
                        Прикрепленные файлы:
                      </h4>
                      <div className="space-y-2">
                        {contractToEdit.files
                          .filter(
                            (file: any) => !filesToRemove.includes(file.id)
                          )
                          .map((file: any) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {file.originalname}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleRemoveExistingFile(file.id)
                                }
                                title="Удалить файл"
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* New files */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Новые файлы:</h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                              title="Удалить файл"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Загрузить файлы
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateContract} disabled={isUpdating}>
              {isUpdating ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddContractDialog />
    </div>
  );
};
