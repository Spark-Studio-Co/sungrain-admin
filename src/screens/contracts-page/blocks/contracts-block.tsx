"use client";

import type React from "react";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Package,
  Route,
  Building2,
  Leaf,
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

const getContractCompanyName = (contract: any) => {
  if (!contract?.company) return "-";
  if (typeof contract.company === "string") return contract.company;
  return contract.company.name || "-";
};

const getContractVolume = (contract: any) =>
  Number.parseFloat(contract?.total_volume || "0") || 0;

const formatContractDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString("ru-RU") : "-";

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
  const applyFilters = useCallback((contracts: any[]) => {
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
  }, [filters]);

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
  }, [contractsToDisplay, searchTerm, applyFilters]);

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

  const activeFilterCount = getActiveFilterCount();
  const visibleContracts =
    searchTerm || activeFilterCount > 0 ? filteredContracts : contractsToDisplay;
  const safeVisibleContracts = Array.isArray(visibleContracts)
    ? visibleContracts
    : [];
  const visibleVolume = safeVisibleContracts.reduce(
    (sum: number, contract: any) => sum + getContractVolume(contract),
    0
  );
  const visibleCultures = new Set(
    safeVisibleContracts
      .map((contract: any) => contract.crop)
      .filter(Boolean)
  ).size;
  const visibleCompanies = new Set(
    safeVisibleContracts
      .map((contract: any) => getContractCompanyName(contract))
      .filter((company: string) => company !== "-")
  ).size;
  const isVolumeFiltered =
    filters.volumeRange[0] > 0 || filters.volumeRange[1] < 10000;

  const renderFilterChip = (
    type: "cultures" | "senders" | "receivers",
    value: string
  ) => {
    const isSelected = filters[type].includes(value);

    return (
      <button
        key={value}
        type="button"
        onClick={() => toggleFilterItem(type, value)}
        className={cn(
          "inline-flex h-8 max-w-full items-center gap-1 rounded-md border px-3 text-xs font-bold transition-all",
          isSelected
            ? "border-[#f38810] bg-[#fff3e5] text-[#d5740b] shadow-[0_8px_18px_rgba(243,136,16,0.12)]"
            : "border-[#dfe7de] bg-white text-[#41514b] hover:border-[#c9d8ca] hover:bg-[#f7faf6]"
        )}
      >
        <span className="truncate">{value}</span>
        {isSelected && <X className="h-3.5 w-3.5 shrink-0" />}
      </button>
    );
  };

  return (
    <div className="space-y-4 px-0">
      <Card className="sungrain-analytics-card gap-0 overflow-hidden !py-0">
        <CardHeader className="border-b border-[#e5ece4] px-4 py-4 sm:px-5 lg:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-bold uppercase text-[#2f6b4f]">
                <File className="h-3.5 w-3.5" />
                Реестр сделок
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-[#223137]">
                Контракты
              </CardTitle>
              <CardDescription className="mt-2 max-w-2xl text-sm text-[#6f7774]">
                {isAdmin
                  ? "Управление контрактами, маршрутами, объемами и документами."
                  : "Ваши контракты, маршруты и грузоперевозки."}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row xl:pt-8">
              {isAdmin && !isDataLoading && (
                <Button
                  onClick={() =>
                    useContractDialogStore.getState().setDialogOpen(true)
                  }
                  className="h-10 w-full rounded-md bg-[#f38810] px-4 font-bold text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Добавить контракт</span>
                  <span className="sm:hidden">Добавить</span>
                </Button>
              )}
              <div className="relative">
                {isAdmin && !isDataLoading && (
                  <Button
                    variant="outline"
                    className="h-10 gap-2 rounded-md border-[#dce4da] bg-white font-semibold text-[#223137] shadow-sm w-full sm:w-auto"
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

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase text-[#7b857f]">
                    Всего
                  </div>
                  <div className="mt-2 text-3xl font-black text-[#223137]">
                    {isDataLoading ? "..." : totalItems || 0}
                  </div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                  <File className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase text-[#7b857f]">
                    Показано
                  </div>
                  <div className="mt-2 text-3xl font-black text-[#223137]">
                    {isDataLoading ? "..." : safeVisibleContracts.length}
                  </div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                  <Filter className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase text-[#7b857f]">
                    Объем
                  </div>
                  <div className="mt-2 text-3xl font-black text-[#223137]">
                    {isDataLoading
                      ? "..."
                      : `${visibleVolume.toLocaleString()} т`}
                  </div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase text-[#7b857f]">
                    Срез
                  </div>
                  <div className="mt-2 text-3xl font-black text-[#223137]">
                    {isDataLoading ? "..." : `${visibleCultures}/${visibleCompanies}`}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    культур / компаний
                  </div>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                  <Leaf className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
              <Input
                placeholder="Поиск по номеру, маршруту, компании, культуре..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="h-11 w-full rounded-md border-[#dce4da] bg-white pl-10 text-[#223137] shadow-sm"
              />
            </div>
            <Button
              variant="outline"
              className="h-11 gap-2 whitespace-nowrap rounded-md border-[#dce4da] bg-white font-semibold text-[#223137] shadow-sm w-full xl:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Фильтры</span>
              <span className="sm:hidden">Фильтр</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f38810] text-xs text-white">
                  {activeFilterCount}
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
            <div className="mt-4 overflow-hidden rounded-md border border-[#dfe7de] bg-white shadow-[0_16px_36px_rgba(34,49,55,0.06)]">
              <div className="flex flex-col gap-3 border-b border-[#e6ece5] bg-[#f8faf7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                    <Filter className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black uppercase text-[#223137]">
                        Фильтры контрактов
                      </h3>
                      {activeFilterCount > 0 && (
                        <span className="rounded-md bg-[#1f5a43] px-2 py-0.5 text-[11px] font-black text-white">
                          {activeFilterCount} активн.
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#7b857f]">
                      Быстро сузьте реестр по участникам, культуре и объему
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 w-full rounded-md border-[#dce4da] bg-white font-bold text-[#41514b] shadow-sm sm:w-auto"
                >
                  <X className="mr-2 h-4 w-4" />
                  Сбросить все
                </Button>
              </div>

              <div className="grid gap-3 p-4 xl:grid-cols-[1.1fr_1fr_1fr_1.15fr]">
                <div className="rounded-md border border-[#e1e9e0] bg-[#fbfcfa] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-black text-[#223137]">
                      <Leaf className="h-4 w-4 text-[#2f6b4f]" />
                      Культура
                    </div>
                    <span className="text-xs font-bold text-[#7b857f]">
                      {filters.cultures.length || availableCultures.length}
                    </span>
                  </div>
                  <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                    {availableCultures.length > 0 ? (
                      availableCultures.map((culture) =>
                        renderFilterChip("cultures", culture)
                      )
                    ) : (
                      <span className="text-sm text-[#7b857f]">
                        Нет доступных культур
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-[#e1e9e0] bg-[#fbfcfa] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-black text-[#223137]">
                      <Building2 className="h-4 w-4 text-[#2f6b4f]" />
                      Грузоотправитель
                    </div>
                    <span className="text-xs font-bold text-[#7b857f]">
                      {filters.senders.length || sendersData.data.length}
                    </span>
                  </div>
                  <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                    {sendersData.data.length > 0 ? (
                      sendersData.data.map((sender: any) =>
                        renderFilterChip("senders", sender.name)
                      )
                    ) : (
                      <span className="text-sm text-[#7b857f]">
                        Нет данных
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-[#e1e9e0] bg-[#fbfcfa] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-black text-[#223137]">
                      <Route className="h-4 w-4 text-[#f38810]" />
                      Грузополучатель
                    </div>
                    <span className="text-xs font-bold text-[#7b857f]">
                      {filters.receivers.length || receiversData.data.length}
                    </span>
                  </div>
                  <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto pr-1">
                    {receiversData.data.length > 0 ? (
                      receiversData.data.map((receiver: any) =>
                        renderFilterChip("receivers", receiver.name)
                      )
                    ) : (
                      <span className="text-sm text-[#7b857f]">
                        Нет данных
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-[#e1e9e0] bg-[linear-gradient(180deg,#fffdf9_0%,#fbfcfa_100%)] p-3">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-black text-[#223137]">
                      <Package className="h-4 w-4 text-[#f38810]" />
                      Объем
                    </div>
                    {isVolumeFiltered && (
                      <button
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            volumeRange: [0, 10000],
                          }))
                        }
                        className="text-xs font-bold text-[#d5740b] hover:text-[#b95f06]"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>
                  <div className="rounded-md border border-[#f2dfca] bg-white px-3 py-3">
                    <div className="mb-3 flex items-center justify-between gap-2 text-xs font-black text-[#223137]">
                      <span>{filters.volumeRange[0].toLocaleString()} т</span>
                      <span className="text-[#9aa29f]">до</span>
                      <span>{filters.volumeRange[1].toLocaleString()} т</span>
                    </div>
                    <Slider
                      className="[&_[data-slot=slider-range]]:bg-[#f38810] [&_[data-slot=slider-thumb]]:border-[#f38810] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-[#f7eadc]"
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="px-4 pb-4 pt-4 sm:px-5 lg:px-6">
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
          {/* Desktop: Table View */}
          <div className="hidden overflow-hidden rounded-md bg-white shadow-[0_16px_36px_rgba(34,49,55,0.06)] sm:block">
            <div className="max-h-[calc(100vh-350px)] min-h-[360px] overflow-auto">
              <Table className="min-w-[1500px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f7f8f5]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[290px] pl-4">Контракт</TableHead>
                    <TableHead className="w-[120px]">Дата</TableHead>
                    <TableHead className="w-[150px]">Культура</TableHead>
                    <TableHead className="w-[210px]">Отправитель</TableHead>
                    <TableHead className="w-[210px]">Получатель</TableHead>
                    <TableHead className="w-[230px]">Маршрут</TableHead>
                    <TableHead className="w-[130px] text-right">Объем</TableHead>
                    <TableHead className="w-[100px] text-center">Валюта</TableHead>
                    <TableHead className="w-[190px]">Компания</TableHead>
                    {isAdmin && (
                      <TableHead className="w-[80px] pr-4 text-right">
                        Действия
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isDataLoading ? (
                    Array(6)
                      .fill(0)
                      .map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array(isAdmin ? 10 : 9)
                            .fill(0)
                            .map((_, cellIndex) => (
                              <TableCell key={`cell-${index}-${cellIndex}`}>
                                <Skeleton className="h-8 w-full rounded-md" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))
                  ) : safeVisibleContracts.length > 0 ? (
                    safeVisibleContracts.map((contract: any) => (
                      <TableRow
                        key={contract.id}
                        className="cursor-pointer hover:bg-[#f8faf7]"
                        onClick={() => handleRowClick(contract)}
                      >
                        <TableCell className="pl-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                              <File className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-[#223137]">
                                {contract.number}
                              </div>
                              <div className="mt-1 max-w-[220px] truncate text-xs text-[#6f7774]">
                                {contract.name || "Без названия"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-2 rounded-md bg-[#f7f8f5] px-2.5 py-1.5 text-xs font-semibold text-[#53605a]">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatContractDate(contract.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-[#dce8dc] bg-[#f5faf5] px-2.5 py-1 text-[#2f6b4f]"
                          >
                            {contract.crop || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[190px] truncate font-medium text-[#223137]">
                            {contract.sender || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[190px] truncate font-medium text-[#223137]">
                            {contract.receiver || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2 text-sm">
                            <Route className="h-4 w-4 shrink-0 text-[#f38810]" />
                            <span className="truncate text-[#223137]">
                              {contract.departure_station || "-"}
                            </span>
                            <span className="text-[#9aa29f]">→</span>
                            <span className="truncate text-[#223137]">
                              {contract.destination_station || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-black text-[#223137]">
                            {getContractVolume(contract).toLocaleString()} т
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex rounded-md bg-[#fff3e5] px-2.5 py-1 text-xs font-black text-[#f38810]">
                            {contract.currency || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0 text-[#7b857f]" />
                            <span className="max-w-[155px] truncate text-sm font-semibold text-[#223137]">
                              {getContractCompanyName(contract)}
                            </span>
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="pr-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-9 w-9 rounded-md p-0 hover:bg-[#eef5ef]"
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
                        colSpan={isAdmin ? 10 : 9}
                        className="h-40 text-center text-muted-foreground"
                      >
                        {searchTerm || activeFilterCount > 0
                          ? "Контракты не найдены."
                          : isAdmin
                          ? "Контракты не найдены."
                          : "У вас нет доступных контрактов."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile: Card View */}
          <div className="sm:hidden space-y-3">
            {isDataLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <Card key={`skeleton-${index}`} className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </Card>
                ))
            ) : searchTerm || getActiveFilterCount() > 0 ? (
              filteredContracts.length > 0 ? (
                filteredContracts.map((contract: any) => (
                  <Card
                    key={contract.id}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleRowClick(contract)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm">
                          № {contract.number}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {contract.date
                            ? new Date(contract.date).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="font-medium">{contract.name}</div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Культура:
                          </span>
                          <span>{contract.crop || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Объем:</span>
                          <span className="font-medium">
                            {contract.total_volume} т
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Отправитель:
                          </span>
                          <span className="text-right text-xs">
                            {contract.sender || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Получатель:
                          </span>
                          <span className="text-right text-xs">
                            {contract.receiver || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Маршрут:
                          </span>
                          <span className="text-right text-xs">
                            {contract.departure_station || "-"} →{" "}
                            {contract.destination_station || "-"}
                          </span>
                        </div>
                        {contract.company?.name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Компания:
                            </span>
                            <span className="text-xs">
                              {contract.company.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <div className="flex justify-end pt-2 border-t">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  handleEditClick(e, contract);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={(e) => handleDeleteClick(e, contract)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8">
                  <div className="text-center text-muted-foreground">
                    {searchTerm || getActiveFilterCount() > 0
                      ? "Контракты не найдены"
                      : isAdmin
                      ? "Контракты не найдены."
                      : "У вас нет доступных контрактов."}
                  </div>
                </Card>
              )
            ) : contractsToDisplay.length > 0 ? (
              contractsToDisplay.map((contract: any) => (
                <Card
                  key={contract.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRowClick(contract)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-sm">
                        № {contract.number}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {contract.date
                          ? new Date(contract.date).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="font-medium">{contract.name}</div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Культура:</span>
                        <span>{contract.crop || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Объем:</span>
                        <span className="font-medium">
                          {contract.total_volume} т
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Отправитель:
                        </span>
                        <span className="text-right text-xs">
                          {contract.sender || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Получатель:
                        </span>
                        <span className="text-right text-xs">
                          {contract.receiver || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Маршрут:</span>
                        <span className="text-right text-xs">
                          {contract.departure_station || "-"} →{" "}
                          {contract.destination_station || "-"}
                        </span>
                      </div>
                      {contract.company?.name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Компания:
                          </span>
                          <span className="text-xs">
                            {contract.company.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isAdmin && (
                      <div className="flex justify-end pt-2 border-t">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                handleEditClick(e, contract);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => handleDeleteClick(e, contract)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  {isAdmin
                    ? "Контракты не найдены."
                    : "У вас нет доступных контрактов."}
                </div>
              </Card>
            )}
          </div>
          {/* Add this to the "mt-4 flex flex-col sm:flex-row" div after the table (around line 517) */}
          {/* Replace the existing div with info about total contracts with this: */}
          {/* Mobile Pagination Controls */}
          {!isDataLoading && totalPages > 1 && (
            <div className="mt-4 sm:hidden flex items-center justify-between">
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
                  {currentPage} из {totalPages || 1}
                </span>
              </div>

              {/* Next Button */}
              <button
                onClick={() => {
                  if (currentPage < (totalPages || 1)) {
                    handlePageChange(currentPage + 1);
                  }
                }}
                disabled={currentPage >= (totalPages || 1)}
                className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Вперёд
              </button>
            </div>
          )}

          {/* Desktop Pagination and Info */}
          <div className="mt-4 hidden sm:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
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

          {/* Mobile Info */}
          <div className="mt-4 sm:hidden text-center">
            <div className="text-xs text-muted-foreground">
              Всего: {isDataLoading ? "..." : totalItems || 0} контрактов
              {!isAdmin && " (ваши)"}
              {getActiveFilterCount() > 0 && (
                <>
                  {" | "}
                  Отфильтровано: {filteredContracts.length}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs ml-2"
                  >
                    <X className="h-3 w-3 mr-1" /> Сбросить
                  </Button>
                </>
              )}
            </div>
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
