"use client";

import type React from "react";

import { useState, useMemo, useRef, useEffect } from "react";
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
  Check,
  ChevronsUpDown,
  ChevronUp,
  Filter,
  CalendarIcon,
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
import { useFetchStations } from "@/entities/stations/hooks/query/use-get-stations.query";
import { useGetReceivers } from "@/entities/receiver/hooks/query/use-get-receiver.query";
import { useGetSenders } from "@/entities/sender/hooks/query/use-get-senders.query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { apiClient } from "@/shared/api/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";

// File operations functions
const uploadContractFiles = async (
  contractId: string,
  files: File[],
  filesInfo: any[]
) => {
  const formData = new FormData();

  // Append each file to the form data
  files.forEach((file) => {
    formData.append("files", file);
  });

  // Add files_info as JSON string
  formData.append("files_info", JSON.stringify(filesInfo));

  try {
    const response = await apiClient.post(
      `/contract/upload-files/${contractId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

const deleteContractFiles = async (contractId: string, filesInfo: any[]) => {
  try {
    const response = await apiClient.patch(
      `/contract/delete-files/${contractId}`,
      {
        files_info: filesInfo,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting files:", error);
    throw error;
  }
};

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
  const queryClient = useQueryClient();
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);

  // Dropdown states
  const [openSender, setOpenSender] = useState(false);
  const [openReceiver, setOpenReceiver] = useState(false);
  const [openDepartureStation, setOpenDepartureStation] = useState(false);
  const [openDestinationStation, setOpenDestinationStation] = useState(false);

  // Add these new state variables after the existing state declarations (around line 109)
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: {
      from: null as Date | null,
      to: null as Date | null,
    },
    cultures: [] as string[],
    senders: [] as string[],
    receivers: [] as string[],
    volumeRange: [0, 10000] as [number, number],
  });
  const [availableCultures, setAvailableCultures] = useState<string[]>([]);

  // Fetch dropdown data
  const { data: stationsData = { data: [], total: 0 } } = useFetchStations(
    1,
    100
  );
  const { data: receiversData = { data: [], total: 0 } } = useGetReceivers(
    1,
    100
  );
  const { data: sendersData = { data: [], total: 0 } } = useGetSenders(1, 100);

  // Only fetch all contracts if user is admin
  const {
    data: contracts = { data: [], total: 0, page: 1, totalPages: 1 },
    isLoading: isAllContractsLoading,
    isError: isAllContractsError,
    error: allContractsError,
  } = useGetContracts({
    page: currentPage,
    limit: itemsPerPage,
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Always fetch user contracts
  const {
    data: userContracts = { data: [], total: 0, page: 1, totalPages: 1 },
    isLoading: isUserContractsLoading,
    isError: isUserContractsError,
    error: userContractsError,
  } = useGetUserContracts({
    page: currentPage,
    limit: itemsPerPage,
  });

  const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();
  const { mutate: updateContract, isPending: isUpdating } = useUpdateContract();

  // Use the appropriate data source based on user role
  const contractsToDisplay = isAdmin ? contracts.data : userContracts.data;
  const isDataLoading = isAdmin
    ? isAllContractsLoading
    : isUserContractsLoading;
  const isDataError = isAdmin ? isAllContractsError : isUserContractsError;
  const dataError = isAdmin ? allContractsError : userContractsError;
  const totalPages = isAdmin ? contracts.totalPages : userContracts.totalPages;
  const totalItems = isAdmin ? contracts.total : userContracts.total;

  // Add this useMemo to get unique cultures from contracts
  // Add after the filteredContracts useMemo (around line 186)
  // With this version that doesn't update state directly:
  const availableCulturesData = useMemo(() => {
    if (!contractsToDisplay || !Array.isArray(contractsToDisplay)) return [];

    // Extract unique cultures
    const cultures = new Set<string>();
    contractsToDisplay.forEach((contract: any) => {
      if (contract.crop) {
        cultures.add(contract.crop);
      }
    });

    return Array.from(cultures);
  }, [contractsToDisplay]);

  // Then update the state in a useEffect that depends on the memoized value:
  useEffect(() => {
    setAvailableCultures(availableCulturesData);
  }, [availableCulturesData]);

  // Add this new applyFilters function before the handleSearchChange function (around line 190)
  const applyFilters = (contracts: any[]) => {
    if (!contracts || !Array.isArray(contracts)) return [];

    return contracts.filter((contract: any) => {
      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const contractDate = contract.date ? new Date(contract.date) : null;
        if (contractDate) {
          if (filters.dateRange.from && contractDate < filters.dateRange.from) {
            return false;
          }
          if (filters.dateRange.to) {
            // Set time to end of day for the "to" date
            const toDateEnd = new Date(filters.dateRange.to);
            toDateEnd.setHours(23, 59, 59, 999);
            if (contractDate > toDateEnd) {
              return false;
            }
          }
        }
      }

      // Culture filter
      if (
        filters.cultures.length > 0 &&
        !filters.cultures.includes(contract.crop)
      ) {
        return false;
      }

      // Sender filter
      if (
        filters.senders.length > 0 &&
        !filters.senders.includes(contract.sender)
      ) {
        return false;
      }

      // Receiver filter
      if (
        filters.receivers.length > 0 &&
        !filters.receivers.includes(contract.receiver)
      ) {
        return false;
      }

      // Volume range filter
      const volume = Number.parseFloat(contract.total_volume) || 0;
      if (volume < filters.volumeRange[0] || volume > filters.volumeRange[1]) {
        return false;
      }

      return true;
    });
  };

  // Modify the filteredContracts useMemo to include filters (around line 165)
  const filteredContracts = useMemo(() => {
    if (!contractsToDisplay || !Array.isArray(contractsToDisplay)) return [];

    // First, apply filters
    const filteredByType = applyFilters(contractsToDisplay);

    // Then apply search
    if (searchTerm) {
      return filteredByType.filter((contract: any) =>
        Object.values(contract).some(
          (value) =>
            value &&
            typeof value === "string" &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filteredByType;
  }, [contractsToDisplay, searchTerm, filters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Add this function to handle toggling a filter item (after handleSearchChange)
  const toggleFilterItem = (
    type: "cultures" | "senders" | "receivers",
    value: string
  ) => {
    setFilters((prev) => {
      const currentItems = [...prev[type]];
      const index = currentItems.indexOf(value);

      if (index > -1) {
        currentItems.splice(index, 1);
      } else {
        currentItems.push(value);
      }

      return {
        ...prev,
        [type]: currentItems,
      };
    });
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Add this function to clear all filters
  const clearFilters = () => {
    setFilters({
      dateRange: { from: null, to: null },
      cultures: [],
      senders: [],
      receivers: [],
      volumeRange: [0, 10000],
    });
  };

  // Add this function to get the active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.cultures.length) count++;
    if (filters.senders.length) count++;
    if (filters.receivers.length) count++;
    if (filters.volumeRange[0] > 0 || filters.volumeRange[1] < 10000) count++;
    return count;
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
    const totalPagesCount = totalPages || 1;
    const currentPageNum = currentPage;

    // If 5 or fewer pages, show all
    if (totalPagesCount <= 5) {
      return Array.from({ length: totalPagesCount }, (_, i) => i + 1);
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
    const endPage = Math.min(totalPagesCount - 1, currentPageNum + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (currentPageNum < totalPagesCount - 2) {
      pages.push(-2); // -2 represents ellipsis
    }

    // Always include last page
    if (totalPagesCount > 1) {
      pages.push(totalPagesCount);
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

    // Create FormData for contract update
    const formData = new FormData();

    // Add contract data (excluding ID and other unwanted properties)
    Object.keys(contractToEdit).forEach((key) => {
      if (
        key !== "id" &&
        key !== "files" &&
        key !== "company" &&
        key !== "wagons" && // Exclude wagons property
        key !== "applications" && // Exclude applications property
        key !== "filesToRemove" && // Exclude filesToRemove property
        contractToEdit[key] !== undefined &&
        contractToEdit[key] !== null
      ) {
        formData.append(key, contractToEdit[key]);
      }
    });

    // Add company ID if present - ensure it's an integer
    if (contractToEdit.company && contractToEdit.company.id) {
      // Convert to integer using parseInt
      const companyId = Number.parseInt(contractToEdit.company.id, 10);
      formData.append("companyId", companyId.toString());
    }

    // Update the contract first
    updateContract(
      {
        id: contractToEdit.id,
        data: formData,
      },
      {
        onSuccess: async () => {
          try {
            // Handle file uploads if there are any new files
            if (selectedFiles.length > 0) {
              setIsUploadingFiles(true);
              const filesInfo = selectedFiles.map((file) => ({
                name: file.name,
                originalname: file.name,
                mimetype: file.type,
                size: file.size,
                status: "active",
                currency: "USD",
                price: 0,
                volume: 0,
              }));

              await uploadContractFiles(
                contractToEdit.id,
                selectedFiles,
                filesInfo
              );
            }

            // Handle file deletions if there are any files to remove
            if (filesToRemove.length > 0) {
              setIsDeletingFiles(true);
              const filesToDelete = contractToEdit.files
                .filter((file: any) => filesToRemove.includes(file.id))
                .map((file: any) => ({
                  id: file.id,
                  name: file.name || file.originalname,
                  status: file.status || "active",
                  currency: file.currency || "USD",
                  price: file.price || 0,
                  volume: file.volume || 0,
                }));

              await deleteContractFiles(contractToEdit.id, filesToDelete);
            }

            // Refresh the contracts data
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
            queryClient.invalidateQueries({ queryKey: ["userContracts"] });

            // Close the dialog and reset state
            setEditDialogOpen(false);
            setSelectedFiles([]);
            setFilesToRemove([]);
          } catch (error) {
            console.error("Error handling files:", error);
          } finally {
            setIsUploadingFiles(false);
            setIsDeletingFiles(false);
          }
        },
        onError: (error) => {
          console.error("Error updating contract:", error);
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
                {isAdmin
                  ? "Управление контрактами и грузоперевозками"
                  : "Ваши контракты и грузоперевозки"}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isAdmin && !isDataLoading && (
                <Button
                  onClick={() =>
                    useContractDialogStore.getState().setDialogOpen(true)
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Добавить контракт
                </Button>
              )}
              <div className="relative">
                {isAdmin && !isDataLoading && (
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
          {/* Add this to modify the CardHeader div after the search input section (around line 254) */}
          {/* Replace the search input section with this enhanced version including filters */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск контрактов..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 w-full"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 whitespace-nowrap"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Фильтры
              {getActiveFilterCount() > 0 && (
                <span className="ml-1 rounded-full bg-primary w-5 h-5 flex items-center justify-center text-xs text-primary-foreground">
                  {getActiveFilterCount()}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 border rounded-md bg-background shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Фильтры контрактов</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4 mr-1" /> Сбросить все
                </Button>
              </div>

              <Accordion type="multiple" defaultValue={["cultures", "volume"]}>
                {/* Culture Filter */}
                <AccordionItem value="cultures">
                  <AccordionTrigger>Культура</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2">
                      {availableCultures.length > 0 ? (
                        availableCultures.map((culture, idx) => (
                          <Badge
                            key={idx}
                            variant={
                              filters.cultures.includes(culture)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() =>
                              toggleFilterItem("cultures", culture)
                            }
                          >
                            {culture}
                            {filters.cultures.includes(culture) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Нет доступных культур
                        </span>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Sender Filter */}
                <AccordionItem value="senders">
                  <AccordionTrigger>Грузоотправитель</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {sendersData.data.length > 0 ? (
                        sendersData.data.map((sender: any) => (
                          <Badge
                            key={sender.id}
                            variant={
                              filters.senders.includes(sender.name)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() =>
                              toggleFilterItem("senders", sender.name)
                            }
                          >
                            {sender.name}
                            {filters.senders.includes(sender.name) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Нет данных о грузоотправителях
                        </span>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Receiver Filter */}
                <AccordionItem value="receivers">
                  <AccordionTrigger>Грузополучатель</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {receiversData.data.length > 0 ? (
                        receiversData.data.map((receiver: any) => (
                          <Badge
                            key={receiver.id}
                            variant={
                              filters.receivers.includes(receiver.name)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() =>
                              toggleFilterItem("receivers", receiver.name)
                            }
                          >
                            {receiver.name}
                            {filters.receivers.includes(receiver.name) && (
                              <X className="h-3 w-3 ml-1" />
                            )}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Нет данных о грузополучателях
                        </span>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Volume Range Filter */}
                <AccordionItem value="volume">
                  <AccordionTrigger>Объем (тонн)</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 px-1">
                      <Slider
                        defaultValue={[0, 10000]}
                        value={filters.volumeRange}
                        min={0}
                        max={10000}
                        step={100}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            volumeRange: value as [number, number],
                          }))
                        }
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          От:{" "}
                          <span className="font-medium">
                            {filters.volumeRange[0]}
                          </span>{" "}
                          т
                        </span>
                        <span className="text-sm">
                          До:{" "}
                          <span className="font-medium">
                            {filters.volumeRange[1]}
                          </span>{" "}
                          т
                        </span>
                      </div>
                      {(filters.volumeRange[0] > 0 ||
                        filters.volumeRange[1] < 10000) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 h-8"
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              volumeRange: [0, 10000],
                            }))
                          }
                        >
                          <X className="h-3 w-3 mr-1" /> Сбросить диапазон
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {getActiveFilterCount() > 0 && (
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="text-sm">
                    Активные фильтры:{" "}
                    <span className="font-medium">
                      {getActiveFilterCount()}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" /> Сбросить все фильтры
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {isDataError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибк��</AlertTitle>
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
                  ) : searchTerm || getActiveFilterCount() > 0 ? (
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
                        {isAdmin
                          ? "Контракты не найдены."
                          : "У вас нет доступных контрактов."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Add this to the "mt-4 flex flex-col sm:flex-row" div after the table (around line 517) */}
          {/* Replace the existing div with info about total contracts with this: */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground mb-4 sm:mb-0 flex flex-wrap items-center gap-2">
              <span>
                Всего контрактов: {isDataLoading ? "..." : totalItems || 0}
                {!isAdmin && " (только ваши контракты)"}
              </span>

              {/* Show active filters summary */}
              {getActiveFilterCount() > 0 && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span>Отфильтровано: {filteredContracts.length}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" /> Сбросить фильтры
                  </Button>
                </>
              )}
            </div>

            {!isDataLoading && totalPages > 1 && (
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
                        if (currentPage < totalPages || 1) {
                          handlePageChange(currentPage + 1);
                        }
                      }}
                      className={
                        currentPage === (totalPages || 1)
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
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Редактировать контракт</DialogTitle>
            <DialogDescription>
              Внесите изменения в данные контракта
            </DialogDescription>
          </DialogHeader>
          {contractToEdit && (
            <div className="grid gap-4 py-4 overflow-y-auto pr-2 max-h-[calc(90vh-180px)]">
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
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-sender" className="text-sm font-medium">
                    Грузоотправитель <span className="text-destructive">*</span>
                  </label>
                  <Popover open={openSender} onOpenChange={setOpenSender}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSender}
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {contractToEdit.sender || "Выберите грузоотправителя"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Поиск грузоотправителя..." />
                        <CommandList>
                          <CommandEmpty>
                            Грузоотправитель не найден.
                          </CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {sendersData.data.map((sender: any) => (
                              <CommandItem
                                key={sender.id}
                                value={sender.name}
                                onSelect={(value) => {
                                  setContractToEdit({
                                    ...contractToEdit,
                                    sender: value,
                                  });
                                  setOpenSender(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    contractToEdit.sender === sender.name
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="truncate">{sender.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-receiver"
                    className="text-sm font-medium"
                  >
                    Грузополучатель <span className="text-destructive">*</span>
                  </label>
                  <Popover open={openReceiver} onOpenChange={setOpenReceiver}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openReceiver}
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {contractToEdit.receiver ||
                            "Выберите грузополучателя"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Поиск грузополучателя..." />
                        <CommandList>
                          <CommandEmpty>
                            Грузополучатель не найден.
                          </CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {receiversData.data.map((receiver: any) => (
                              <CommandItem
                                key={receiver.id}
                                value={receiver.name}
                                onSelect={(value) => {
                                  setContractToEdit({
                                    ...contractToEdit,
                                    receiver: value,
                                  });
                                  setOpenReceiver(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    contractToEdit.receiver === receiver.name
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="truncate">
                                  {receiver.name}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-departure"
                    className="text-sm font-medium"
                  >
                    Станция отправления{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Popover
                    open={openDepartureStation}
                    onOpenChange={setOpenDepartureStation}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openDepartureStation}
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {contractToEdit.departure_station ||
                            "Выберите станцию отправления"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Поиск станции..." />
                        <CommandList>
                          <CommandEmpty>Станция не найдена.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {stationsData.data.map((station: any) => (
                              <CommandItem
                                key={station.id}
                                value={station.name}
                                onSelect={(value) => {
                                  setContractToEdit({
                                    ...contractToEdit,
                                    departure_station: value,
                                  });
                                  setOpenDepartureStation(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    contractToEdit.departure_station ===
                                      station.name
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="truncate">{station.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-destination"
                    className="text-sm font-medium"
                  >
                    Станция назначения{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Popover
                    open={openDestinationStation}
                    onOpenChange={setOpenDestinationStation}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openDestinationStation}
                        className="w-full justify-between"
                      >
                        <span className="truncate">
                          {contractToEdit.destination_station ||
                            "Выберите станцию назначения"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Поиск станции..." />
                        <CommandList>
                          <CommandEmpty>Станция не найдена.</CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-y-auto">
                            {stationsData.data.map((station: any) => (
                              <CommandItem
                                key={station.id}
                                value={station.name}
                                onSelect={(value) => {
                                  setContractToEdit({
                                    ...contractToEdit,
                                    destination_station: value,
                                  });
                                  setOpenDestinationStation(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    contractToEdit.destination_station ===
                                      station.name
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="truncate">{station.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                    type="text"
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
                                  {file.name ||
                                    file.originalname ||
                                    "Unnamed file"}
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
            <Button
              onClick={handleUpdateContract}
              disabled={isUpdating || isUploadingFiles || isDeletingFiles}
            >
              {isUpdating || isUploadingFiles || isDeletingFiles
                ? "Сохранение..."
                : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddContractDialog />
    </div>
  );
};
