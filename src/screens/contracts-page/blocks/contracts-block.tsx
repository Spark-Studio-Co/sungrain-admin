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
import { DatePickerInput } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Edit,
  FileIcon as FilePdf,
  Search,
  Plus,
  Download,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Trash2,
  MoreHorizontal,
  Upload,
  X,
  File,
  Check,
  ChevronsUpDown,
  ChevronUp,
  Filter,
  MapPin,
  Package,
  Route,
  Building2,
  Leaf,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageSizeControl } from "@/components/ui/admin-page-size-control";
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
import { FormError } from "@/components/ui/form-error";
import { useToast } from "@/components/ui/toast";
import { usePersistentState } from "@/shared/hooks/use-persistent-state";
import {
  formatContractDate,
  formatContractMoney,
  getContractCompanyName,
  getContractOperationSummary,
  getContractOpsMeta,
  getContractStatusConfig,
  getContractVolume,
  type ContractOperationStatus,
} from "@/shared/contracts/contract-ops";

type ContractsFilters = {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  cultures: string[];
  senders: string[];
  receivers: string[];
  volumeRange: [number, number];
};

type ContractValidationErrors = Partial<
  Record<
    | "number"
    | "name"
    | "crop"
    | "date"
    | "sender"
    | "receiver"
    | "departure_station"
    | "destination_station"
    | "total_volume"
    | "currency",
    string
  >
>;

const CONTRACTS_FILTERS_STORAGE_KEY = "sungrain:contracts:filters:v1";
const CONTRACTS_SEARCH_STORAGE_KEY = "sungrain:contracts:search:v1";
const CONTRACTS_STATUS_STORAGE_KEY = "sungrain:contracts:status:v1";

const DEFAULT_CONTRACTS_FILTERS: ContractsFilters = {
  dateRange: { from: null, to: null },
  cultures: [],
  senders: [],
  receivers: [],
  volumeRange: [0, 10000],
};

const serializeContractsFilters = (value: ContractsFilters) =>
  JSON.stringify({
    ...value,
    dateRange: {
      from: value.dateRange.from?.toISOString() ?? null,
      to: value.dateRange.to?.toISOString() ?? null,
    },
  });

const parseStoredDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const deserializeContractsFilters = (value: string): ContractsFilters => {
  const parsed = JSON.parse(value) as Partial<ContractsFilters> & {
    dateRange?: { from?: unknown; to?: unknown };
  };

  return {
    dateRange: {
      from: parseStoredDate(parsed.dateRange?.from),
      to: parseStoredDate(parsed.dateRange?.to),
    },
    cultures: Array.isArray(parsed.cultures) ? parsed.cultures : [],
    senders: Array.isArray(parsed.senders) ? parsed.senders : [],
    receivers: Array.isArray(parsed.receivers) ? parsed.receivers : [],
    volumeRange:
      Array.isArray(parsed.volumeRange) && parsed.volumeRange.length === 2
        ? [
            Number(parsed.volumeRange[0]) || 0,
            Number(parsed.volumeRange[1]) || 10000,
          ]
        : [0, 10000],
  };
};

const deserializeContractsSearch = (value: string) => {
  const parsed = JSON.parse(value);
  return typeof parsed === "string" ? parsed : "";
};

const deserializeContractsStatus = (
  value: string
): ContractOperationStatus | "all" => {
  const parsed = JSON.parse(value);
  return ["all", "active", "risk", "completed", "draft"].includes(parsed)
    ? parsed
    : "all";
};

const getContractValidationErrors = (contract: any): ContractValidationErrors => {
  const errors: ContractValidationErrors = {};
  const volume = Number(contract?.total_volume);

  if (!String(contract?.number || "").trim()) {
    errors.number = "Укажите номер контракта.";
  }
  if (!String(contract?.name || "").trim()) {
    errors.name = "Добавьте понятное название сделки.";
  }
  if (!String(contract?.crop || "").trim()) {
    errors.crop = "Выберите или укажите культуру.";
  }
  if (!contract?.date) {
    errors.date = "Выберите дату контракта.";
  }
  if (!String(contract?.sender || "").trim()) {
    errors.sender = "Выберите грузоотправителя.";
  }
  if (!String(contract?.receiver || "").trim()) {
    errors.receiver = "Выберите грузополучателя.";
  }
  if (!String(contract?.departure_station || "").trim()) {
    errors.departure_station = "Выберите станцию отправления.";
  }
  if (!String(contract?.destination_station || "").trim()) {
    errors.destination_station = "Выберите станцию назначения.";
  }
  if (!Number.isFinite(volume) || volume <= 0) {
    errors.total_volume = "Объем должен быть больше 0 тонн.";
  }
  if (!String(contract?.currency || "").trim()) {
    errors.currency = "Укажите валюту.";
  }

  return errors;
};

const hasValidationErrors = (errors: ContractValidationErrors) =>
  Object.values(errors).some(Boolean);

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
  const toast = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRestoreToastShown = useRef(false);
  const {
    value: searchTerm,
    setValue: setSearchTerm,
    restoredFromStorage: restoredSearchFromStorage,
  } = usePersistentState(CONTRACTS_SEARCH_STORAGE_KEY, "", {
    deserialize: deserializeContractsSearch,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
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
  const [editErrors, setEditErrors] = useState<ContractValidationErrors>({});

  // Dropdown states
  const [openSender, setOpenSender] = useState(false);
  const [openReceiver, setOpenReceiver] = useState(false);
  const [openDepartureStation, setOpenDepartureStation] = useState(false);
  const [openDestinationStation, setOpenDestinationStation] = useState(false);

  // Add these new state variables after the existing state declarations (around line 109)
  const [showFilters, setShowFilters] = useState(false);
  const {
    value: opsStatusFilter,
    setValue: setOpsStatusFilter,
    restoredFromStorage: restoredStatusFromStorage,
  } = usePersistentState<ContractOperationStatus | "all">(
    CONTRACTS_STATUS_STORAGE_KEY,
    "all",
    {
      deserialize: deserializeContractsStatus,
    }
  );
  const {
    value: filters,
    setValue: setFilters,
    restoredFromStorage: restoredFiltersFromStorage,
  } = usePersistentState<ContractsFilters>(
    CONTRACTS_FILTERS_STORAGE_KEY,
    DEFAULT_CONTRACTS_FILTERS,
    {
      serialize: serializeContractsFilters,
      deserialize: deserializeContractsFilters,
    }
  );

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
  const totalItems = isAdmin ? contracts.total : userContracts.total;
  const isEditSaving = isUpdating || isUploadingFiles || isDeletingFiles;
  const editSectionClass =
    "rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_14px_34px_rgba(22,42,35,0.06)]";
  const editSectionTitleClass =
    "flex items-center gap-2 text-sm font-black uppercase text-[#223137]";
  const editLabelClass = "text-sm font-bold text-[#31423b]";
  const editInputClass =
    "h-11 rounded-md border-[#dce4da] bg-[#fbfcfa] text-[#223137] shadow-sm focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";
  const editComboClass =
    "h-11 w-full justify-between rounded-md border-[#dce4da] bg-[#fbfcfa] px-3 font-semibold text-[#223137] shadow-sm hover:bg-white";

  const availableCultures = useMemo(() => {
    if (!contractsToDisplay || !Array.isArray(contractsToDisplay)) return [];

    const cultures = new Set<string>();
    contractsToDisplay.forEach((contract: any) => {
      if (contract.crop) {
        cultures.add(contract.crop);
      }
    });

    return Array.from(cultures);
  }, [contractsToDisplay]);

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
    const filteredByStatus =
      opsStatusFilter === "all"
        ? filteredByType
        : filteredByType.filter(
            (contract: any) => getContractOpsMeta(contract).status === opsStatusFilter
          );

    // Then apply search
    if (searchTerm) {
      return filteredByStatus.filter((contract: any) =>
        Object.values(contract).some(
          (value) =>
            value &&
            typeof value === "string" &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return filteredByStatus;
  }, [contractsToDisplay, searchTerm, applyFilters, opsStatusFilter]);

  const contractsForStatusCounts = useMemo(() => {
    if (!contractsToDisplay || !Array.isArray(contractsToDisplay)) return [];

    const filteredByType = applyFilters(contractsToDisplay);

    if (!searchTerm) {
      return filteredByType;
    }

    return filteredByType.filter((contract: any) =>
      Object.values(contract).some(
        (value) =>
          value &&
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [contractsToDisplay, searchTerm, applyFilters]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const clearEditError = (field: keyof ContractValidationErrors) => {
    setEditErrors((prev) => {
      if (!prev[field]) return prev;

      return {
        ...prev,
        [field]: undefined,
      };
    });
  };

  const updateEditableContract = (patch: Record<string, unknown>) => {
    Object.keys(patch).forEach((field) =>
      clearEditError(field as keyof ContractValidationErrors)
    );
    setContractToEdit((prev: any) => ({ ...prev, ...patch }));
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
  const clearFilters = useCallback(
    ({
      includeSearch = false,
      notify = true,
    }: {
      includeSearch?: boolean;
      notify?: boolean;
    } = {}) => {
      setFilters(DEFAULT_CONTRACTS_FILTERS);
      setOpsStatusFilter("all");
      if (includeSearch) {
        setSearchTerm("");
      }
      setCurrentPage(1);

      if (notify) {
        toast.info(
          "Фильтры сброшены",
          includeSearch
            ? "Поиск и быстрые фильтры вернулись к исходному состоянию."
            : "Реестр снова показывает все доступные контракты."
        );
      }
    },
    [setFilters, setOpsStatusFilter, setSearchTerm, toast]
  );

  // Add this function to get the active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.cultures.length) count++;
    if (filters.senders.length) count++;
    if (filters.receivers.length) count++;
    if (filters.volumeRange[0] > 0 || filters.volumeRange[1] < 10000) count++;
    if (opsStatusFilter !== "all") count++;
    return count;
  };

  const handleExportPDF = async () => {
    try {
      await downloadPDF();
      toast.success("Экспорт запущен", "PDF-файл будет сохранен на устройство.");
    } catch (error) {
      toast.error(
        "Не удалось экспортировать PDF",
        error instanceof Error
          ? error.message
          : "Попробуйте повторить экспорт чуть позже."
      );
    }
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
          toast.success(
            "Контракт удален",
            contractToDelete.number || contractToDelete.name
              ? `${contractToDelete.number || contractToDelete.name} убран из реестра.`
              : "Запись убрана из реестра."
          );
        },
        onError: (error) => {
          toast.error(
            "Не удалось удалить контракт",
            error instanceof Error
              ? error.message
              : "Проверьте соединение и попробуйте еще раз."
          );
        },
      });
    }
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
    setEditErrors({});
    setSelectedFiles([]);
    setFilesToRemove([]);
    setEditDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      toast.info(
        "Файлы добавлены",
        `${newFiles.length} файл(ов) будут прикреплены после сохранения.`
      );
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

    const validationErrors = getContractValidationErrors(contractToEdit);
    setEditErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      toast.error(
        "Проверьте поля контракта",
        "Мы подсветили места, которые нужно заполнить перед сохранением."
      );
      return;
    }

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
            setEditErrors({});
            setSelectedFiles([]);
            setFilesToRemove([]);
            toast.success(
              "Контракт сохранен",
              `${contractToEdit.number || "Контракт"} обновлен вместе с файлами.`
            );
          } catch (error) {
            console.error("Error handling files:", error);
            toast.error(
              "Контракт сохранен, но файлы не обновились",
              "Попробуйте загрузить вложения еще раз."
            );
          } finally {
            setIsUploadingFiles(false);
            setIsDeletingFiles(false);
          }
        },
        onError: (error) => {
          console.error("Error updating contract:", error);
          toast.error(
            "Не удалось сохранить контракт",
            error instanceof Error
              ? error.message
              : "Проверьте данные и попробуйте еще раз."
          );
        },
      }
    );
  };

  const activeFilterCount = getActiveFilterCount();
  const hasSearchOrFilters = Boolean(searchTerm.trim()) || activeFilterCount > 0;

  useEffect(() => {
    if (
      filterRestoreToastShown.current ||
      (!restoredFiltersFromStorage &&
        !restoredSearchFromStorage &&
        !restoredStatusFromStorage) ||
      !hasSearchOrFilters
    ) {
      return;
    }

    filterRestoreToastShown.current = true;
    toast.info(
      "Фильтры восстановлены",
      "Мы вернули последний поиск и быстрые статусы для реестра контрактов."
    );
  }, [
    activeFilterCount,
    hasSearchOrFilters,
    restoredFiltersFromStorage,
    restoredSearchFromStorage,
    restoredStatusFromStorage,
    toast,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape" && !isTyping && hasSearchOrFilters) {
        event.preventDefault();
        clearFilters({ includeSearch: true });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearFilters, hasSearchOrFilters]);

  const visibleContracts =
    searchTerm || activeFilterCount > 0 ? filteredContracts : contractsToDisplay;
  const safeVisibleContracts = Array.isArray(visibleContracts)
    ? visibleContracts
    : [];
  const opsMetrics = safeVisibleContracts.reduce(
    (acc, contract: any) => {
      const meta = getContractOpsMeta(contract);
      acc[meta.status] += 1;
      acc.shippedVolume += meta.shippedVolume;
      acc.balance += meta.balance;
      acc.progress += meta.progress;
      acc.documents += meta.documentsCount;
      return acc;
    },
    {
      active: 0,
      risk: 0,
      completed: 0,
      draft: 0,
      shippedVolume: 0,
      balance: 0,
      progress: 0,
      documents: 0,
    } as Record<ContractOperationStatus, number> & {
      shippedVolume: number;
      balance: number;
      progress: number;
      documents: number;
    }
  );
  const statusCounts = contractsForStatusCounts.reduce(
    (acc, contract: any) => {
      const status = getContractOpsMeta(contract).status;
      acc[status] += 1;
      return acc;
    },
    { active: 0, risk: 0, completed: 0, draft: 0 } as Record<
      ContractOperationStatus,
      number
    >
  );
  const isVolumeFiltered =
    filters.volumeRange[0] > 0 || filters.volumeRange[1] < 10000;
  const statusFilters: Array<{
    value: ContractOperationStatus | "all";
    label: string;
    count: number;
  }> = [
    { value: "all", label: "Все", count: contractsForStatusCounts.length },
    { value: "active", label: "В работе", count: statusCounts.active },
    { value: "risk", label: "Риск", count: statusCounts.risk },
    { value: "completed", label: "Завершены", count: statusCounts.completed },
    { value: "draft", label: "Черновики", count: statusCounts.draft },
  ];

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
          "inline-flex h-7 max-w-full items-center gap-1 rounded-md border px-2.5 text-[11px] font-bold transition-all",
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
    <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden px-0">
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
                      onClick={handleExportPDF}
                    >
                      <FilePdf className="mr-2 h-4 w-4" />
                      Скачать в PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            {[
              {
                label: "В реестре",
                value: isDataLoading ? "..." : safeVisibleContracts.length,
                tone: "border-[#dfe7de] bg-[#f8faf7] text-[#41514b]",
              },
              {
                label: "В работе",
                value: isDataLoading ? "..." : opsMetrics.active,
                tone: "border-[#dfe7de] bg-[#eef5ef] text-[#2f6b4f]",
              },
              {
                label: "Риск",
                value: isDataLoading ? "..." : opsMetrics.risk,
                tone: "border-[#f2c7c1] bg-[#fff4f1] text-[#b9472d]",
              },
              {
                label: "Отгружено",
                value: isDataLoading
                  ? "..."
                  : `${opsMetrics.shippedVolume.toLocaleString()} т`,
                tone: "border-[#f2dfca] bg-[#fff8ef] text-[#d5740b]",
              },
            ].map((item) => (
              <span
                key={item.label}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-md border px-3 font-bold",
                  item.tone
                )}
              >
                <span className="text-[#7b857f]">{item.label}</span>
                <span className="text-[#223137]">{item.value}</span>
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
              <Input
                ref={searchInputRef}
                placeholder="Поиск по номеру, маршруту, компании, культуре..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Поиск контрактов"
                className="h-11 w-full rounded-md border-[#dce4da] bg-white pl-10 pr-12 text-[#223137] shadow-sm"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-[#e4ebe2] bg-[#f8faf7] px-1.5 py-0.5 text-[11px] font-black text-[#8a928f] lg:inline-flex">
                /
              </span>
            </div>
            {hasSearchOrFilters && (
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-2 whitespace-nowrap rounded-md border-[#dce4da] bg-white font-semibold text-[#41514b] shadow-sm w-full xl:w-auto"
                onClick={() => clearFilters({ includeSearch: true })}
              >
                <RotateCcw className="h-4 w-4" />
                Быстрый reset
              </Button>
            )}
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

          <div className="mt-3 overflow-x-auto rounded-md border border-[#dfe7de] bg-white p-1 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
            <div className="flex min-w-max gap-1">
              {statusFilters.map((item) => {
                const config =
                  item.value === "all"
                    ? null
                    : getContractStatusConfig(item.value);
                const isActive = opsStatusFilter === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setOpsStatusFilter(item.value);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-md px-3 text-xs font-black transition sm:px-4 sm:text-sm",
                      isActive
                        ? "bg-[#f38810] text-white shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
                        : "text-[#6f7774] hover:bg-[#f8faf7] hover:text-[#223137]"
                    )}
                  >
                    {item.value !== "all" && (
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          config?.progressClassName
                        )}
                      />
                    )}
                    {item.label}
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs",
                        isActive
                          ? "bg-white/18 text-white"
                          : "bg-[#f2f5f0] text-[#7b857f]"
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 overflow-hidden rounded-md border border-[#dfe7de] bg-white shadow-[0_12px_28px_rgba(34,49,55,0.05)]">
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
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearFilters()}
                  className="h-9 w-full rounded-md border-[#dce4da] bg-white font-bold text-[#41514b] shadow-sm sm:w-auto"
                >
                  <X className="mr-2 h-4 w-4" />
                  Сбросить все
                </Button>
              </div>

              <div className="grid gap-3 p-3 lg:grid-cols-4">
                <div className="rounded-md border border-[#e1e9e0] bg-[#fbfcfa] p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#223137]">
                      <Leaf className="h-4 w-4 text-[#2f6b4f]" />
                      Культура
                    </div>
                    <span className="text-xs font-bold text-[#7b857f]">
                      {filters.cultures.length || availableCultures.length}
                    </span>
                  </div>
                  <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto pr-1">
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
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#223137]">
                      <Building2 className="h-4 w-4 text-[#2f6b4f]" />
                      Грузоотправитель
                    </div>
                    <span className="text-xs font-bold text-[#7b857f]">
                      {filters.senders.length || sendersData.data.length}
                    </span>
                  </div>
                  <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto pr-1">
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
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#223137]">
                      <Route className="h-4 w-4 text-[#f38810]" />
                      Грузополучатель
                    </div>
                    <span className="text-xs font-bold text-[#7b857f]">
                      {filters.receivers.length || receiversData.data.length}
                    </span>
                  </div>
                  <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto pr-1">
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
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-[#223137]">
                      <Package className="h-4 w-4 text-[#f38810]" />
                      Объем
                    </div>
                    {isVolumeFiltered && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilters((prev) => ({
                            ...prev,
                            volumeRange: [0, 10000],
                          }));
                          setCurrentPage(1);
                        }}
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
                      onValueChange={(value) => {
                        setFilters((prev) => ({
                          ...prev,
                          volumeRange: value as [number, number],
                        }));
                        setCurrentPage(1);
                      }}
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
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>
                Не удалось загрузить данные.{" "}
                {dataError?.message || "Пожалуйста, попробуйте позже."}
              </AlertDescription>
            </Alert>
          )}
          {/* Desktop: Table View */}
          <div className="hidden overflow-hidden rounded-md border border-[#e1e9e0] bg-white shadow-[0_12px_28px_rgba(34,49,55,0.05)] sm:block">
            <div className="max-h-[calc(100vh-310px)] min-h-[360px] overflow-auto">
              <Table className="min-w-[1120px]">
                <TableHeader className="sticky top-0 z-10 bg-[#f7f8f5]">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[330px] pl-4">Контракт</TableHead>
                    <TableHead className="w-[260px]">Маршрут</TableHead>
                    <TableHead className="w-[240px]">Объем</TableHead>
                    <TableHead className="w-[210px]">Финансы</TableHead>
                    <TableHead className="w-[220px]">Компания</TableHead>
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
                          {Array(isAdmin ? 6 : 5)
                            .fill(0)
                            .map((_, cellIndex) => (
                              <TableCell key={`cell-${index}-${cellIndex}`}>
                                <Skeleton className="h-8 w-full rounded-md" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))
                  ) : safeVisibleContracts.length > 0 ? (
                    safeVisibleContracts.map((contract: any) => {
                      const meta = getContractOpsMeta(contract);
                      const summary = getContractOperationSummary(contract);

                      return (
                        <TableRow
                          key={contract.id}
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer align-middle hover:bg-[#f8faf7] focus-visible:bg-[#fff8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f38810]/30"
                          onClick={() => handleRowClick(contract)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleRowClick(contract);
                            }
                          }}
                        >
                          <TableCell className="pl-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                                <File className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="truncate font-black text-[#223137]">
                                    {contract.number || `#${contract.id}`}
                                  </span>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-[#8a928f]" />
                                </div>
                                <div className="mt-1 max-w-[250px] truncate text-xs text-[#6f7774]">
                                  {contract.name || "Без названия"}
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "h-6 px-2 text-[11px] font-black",
                                      meta.statusConfig.badgeClassName
                                    )}
                                  >
                                    {meta.statusConfig.label}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="h-6 border-[#dce8dc] bg-[#f5faf5] px-2 text-[11px] text-[#2f6b4f]"
                                  >
                                    {contract.crop || "Культура"}
                                  </Badge>
                                  <span className="inline-flex h-6 items-center rounded-md bg-[#f7f8f5] px-2 text-[11px] font-bold text-[#7b857f]">
                                    {formatContractDate(contract.date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2 text-sm font-black text-[#223137]">
                                <Route className="h-4 w-4 shrink-0 text-[#f38810]" />
                                <span className="truncate">{meta.route.departure}</span>
                              </div>
                              <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-[#41514b]">
                                <MapPin className="h-4 w-4 shrink-0 text-[#2f6b4f]" />
                                <span className="truncate">{meta.route.destination}</span>
                              </div>
                              <div className="mt-1.5 text-xs font-semibold text-[#7b857f]">
                                {meta.route.eta}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2 pr-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-black text-[#223137]">
                                  {summary[0].value}
                                </span>
                                <span className="text-xs font-black text-[#2f6b4f]">
                                  {meta.progress}%
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-[#edf1eb]">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    meta.statusConfig.progressClassName
                                  )}
                                  style={{ width: `${meta.progress}%` }}
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#7b857f]">
                                <span>остаток {meta.remainingVolume.toLocaleString()} т</span>
                                <span className="h-1 w-1 rounded-full bg-[#c6d3c6]" />
                                <span>{meta.applicationsCount} заявок</span>
                                <span className="h-1 w-1 rounded-full bg-[#c6d3c6]" />
                                <span>{meta.wagonsCount} вагонов</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-black text-[#223137]">
                                  {formatContractMoney(
                                    meta.balance,
                                    contract.currency || "USD"
                                  )}
                                </span>
                                <span className="font-black text-[#2f6b4f]">
                                  {meta.paymentProgress}%
                                </span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-[#edf1eb]">
                                <div
                                  className="h-full rounded-full bg-[#2f6b4f]"
                                  style={{ width: `${meta.paymentProgress}%` }}
                                />
                              </div>
                              <div className="text-xs font-semibold text-[#7b857f]">
                                {meta.invoiceCount} счетов · {meta.paymentsCount} платежей
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-2">
                                <Building2 className="h-4 w-4 shrink-0 text-[#7b857f]" />
                                <span className="truncate text-sm font-semibold text-[#223137]">
                                {getContractCompanyName(contract)}
                                </span>
                              </div>
                              <div className="mt-1.5 flex min-w-0 items-center gap-2 text-xs font-semibold text-[#7b857f]">
                                <FilePdf className="h-3.5 w-3.5 shrink-0 text-[#f38810]" />
                                <span>{meta.documentsCount} док.</span>
                                <span className="h-1 w-1 rounded-full bg-[#c6d3c6]" />
                                <span className="truncate">{meta.nextAction}</span>
                              </div>
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
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 6 : 5}
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
          <div className="space-y-3 sm:hidden">
            {isDataLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <Card key={`skeleton-${index}`} className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-16 w-full rounded-md" />
                    </div>
                  </Card>
                ))
            ) : safeVisibleContracts.length > 0 ? (
              safeVisibleContracts.map((contract: any) => {
                const meta = getContractOpsMeta(contract);

                return (
                  <Card
                    key={contract.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer overflow-hidden border-[#dfe7de] bg-white p-0 shadow-[0_12px_28px_rgba(34,49,55,0.06)] transition hover:shadow-[0_16px_34px_rgba(34,49,55,0.09)]"
                    onClick={() => handleRowClick(contract)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleRowClick(contract);
                      }
                    }}
                  >
                    <div className="border-b border-[#edf1eb] bg-[#fbfcfa] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-black text-[#223137]">
                            {contract.number || `#${contract.id}`}
                            <ArrowUpRight className="h-3.5 w-3.5 text-[#8a928f]" />
                          </div>
                          <div className="mt-1 truncate text-sm text-[#6f7774]">
                            {contract.name || "Без названия"}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 px-2.5 py-1 font-black",
                            meta.statusConfig.badgeClassName
                          )}
                        >
                          {meta.statusConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                        <div className="flex min-w-0 items-center gap-2 text-sm font-black text-[#223137]">
                          <Route className="h-4 w-4 shrink-0 text-[#f38810]" />
                          <span className="truncate">{meta.route.departure}</span>
                        </div>
                        <div className="my-1 ml-6 h-4 border-l border-dashed border-[#cfd9cf]" />
                        <div className="flex min-w-0 items-center gap-2 text-sm font-black text-[#223137]">
                          <MapPin className="h-4 w-4 shrink-0 text-[#2f6b4f]" />
                          <span className="truncate">{meta.route.destination}</span>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-black uppercase text-[#7b857f]">
                            Прогресс
                          </span>
                          <span className="font-black text-[#223137]">
                            {meta.progress}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#edf1eb]">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              meta.statusConfig.progressClassName
                            )}
                            style={{ width: `${meta.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-2">
                          <div className="text-[10px] font-black uppercase text-[#7b857f]">
                            Заявки
                          </div>
                          <div className="mt-1 text-lg font-black text-[#223137]">
                            {meta.applicationsCount}
                          </div>
                        </div>
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-2">
                          <div className="text-[10px] font-black uppercase text-[#7b857f]">
                            Вагоны
                          </div>
                          <div className="mt-1 text-lg font-black text-[#223137]">
                            {meta.wagonsCount}
                          </div>
                        </div>
                        <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] p-2">
                          <div className="text-[10px] font-black uppercase text-[#9a621d]">
                            Остаток
                          </div>
                          <div className="mt-1 text-lg font-black text-[#d5740b]">
                            {formatContractMoney(
                              meta.balance,
                              contract.currency || "USD"
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-[#edf1eb] pt-3">
                        <span className="text-xs font-bold text-[#7b857f]">
                          {meta.documentsCount} документов · {meta.invoiceCount} счетов
                        </span>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 rounded-md p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
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
                                onClick={(e) => handleDeleteClick(e, contract)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="border-[#dfe7de] p-8">
                <div className="text-center text-sm font-semibold text-[#7b857f]">
                  {searchTerm || getActiveFilterCount() > 0
                    ? "Контракты не найдены"
                    : isAdmin
                      ? "Контракты не найдены."
                      : "У вас нет доступных контрактов."}
                </div>
              </Card>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 border-t border-[#edf1eb] pt-4">
            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#7b857f] sm:justify-start">
                <span>Отфильтровано: {filteredContracts.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearFilters({ includeSearch: true })}
                  className="h-7 px-2 text-xs"
                >
                  <X className="mr-1 h-3 w-3" /> Сбросить фильтры
                </Button>
              </div>
            )}
            <AdminPageSizeControl
              value={itemsPerPage}
              onChange={(nextLimit) => {
                setItemsPerPage(nextLimit);
                setCurrentPage(1);
              }}
              totalItems={totalItems || 0}
              visibleItems={safeVisibleContracts.length}
              itemLabel="контрактов"
              isLoading={isDataLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md border-[#f2c7c1] p-0">
          <DialogHeader className="border-b border-[#f2c7c1] bg-[#fff8f7] p-5 pr-16">
            <div className="mb-3 grid size-10 place-items-center rounded-md bg-[#fff0ee] text-[#c24135]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-black text-[#223137]">
              Удалить контракт?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[#6f7774]">
              {contractToDelete?.number || contractToDelete?.name ? (
                <>
                  Контракт{" "}
                  <span className="font-black text-[#223137]">
                    {contractToDelete?.number || contractToDelete?.name}
                  </span>{" "}
                  будет удален из реестра.
                </>
              ) : (
                "Выбранный контракт будет удален из реестра."
              )}{" "}
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-white p-4">
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
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditErrors({});
            setSelectedFiles([]);
            setFilesToRemove([]);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-[1040px] overflow-hidden border-[#dfe7de] bg-[#f6f8f5] p-0 shadow-[0_28px_90px_rgba(22,42,35,0.24)] sm:max-w-[1040px]">
          <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-5 pr-14 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-[#dfe7de] bg-[#eef5ef] px-3 py-1 text-xs font-black uppercase text-[#2f6b4f]">
                  <FilePdf className="h-3.5 w-3.5" />
                  Карточка контракта
                </div>
                <DialogTitle className="text-2xl font-black leading-tight text-[#223137]">
                  Редактировать контракт
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-[#6f7774]">
                  Обновите параметры договора, маршрут, объемы и вложения.
                </DialogDescription>
              </div>
              {contractToEdit && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[440px]">
                  <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                    <p className="text-[11px] font-black uppercase text-[#7b857f]">
                      Номер
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-[#223137]">
                      {contractToEdit.number || "-"}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                    <p className="text-[11px] font-black uppercase text-[#7b857f]">
                      Дата
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-[#223137]">
                      {formatContractDate(contractToEdit.date)}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                    <p className="text-[11px] font-black uppercase text-[#7b857f]">
                      Объем
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-[#223137]">
                      {getContractVolume(contractToEdit).toLocaleString(
                        "ru-RU"
                      )}{" "}
                      т
                    </p>
                  </div>
                  <div className="rounded-md border border-[#f6d7b3] bg-[#fff8ef] px-3 py-2">
                    <p className="text-[11px] font-black uppercase text-[#a96516]">
                      Валюта
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-[#f38810]">
                      {contractToEdit.currency || "USD"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogHeader>
          {contractToEdit && (
            <div className="max-h-[calc(92vh-190px)] overflow-y-auto px-5 py-5 sm:px-6">
              {hasValidationErrors(editErrors) && (
                <Alert
                  variant="destructive"
                  className="mb-4 border-[#f2c7c1] bg-[#fff8f7]"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Нужно заполнить обязательные поля</AlertTitle>
                  <AlertDescription>
                    Проверьте подсвеченные поля. После исправления контракт
                    можно сохранить.
                  </AlertDescription>
                </Alert>
              )}
              <div className={editSectionClass}>
                <div className={editSectionTitleClass}>
                  <File className="h-4 w-4 text-[#f38810]" />
                  Основные данные
                </div>
                <Separator className="my-4 bg-[#e7eee6]" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="edit-number" className={editLabelClass}>
                    Номер <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-number"
                    className={editInputClass}
                    aria-invalid={Boolean(editErrors.number)}
                    value={contractToEdit.number || ""}
                    onChange={(e) =>
                      updateEditableContract({ number: e.target.value })
                    }
                  />
                  <FormError message={editErrors.number} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-unk" className={editLabelClass}>
                    УНК
                  </label>
                  <Input
                    id="edit-unk"
                    className={editInputClass}
                    value={contractToEdit.unk || ""}
                    onChange={(e) =>
                      updateEditableContract({ unk: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-name" className={editLabelClass}>
                    Название <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-name"
                    className={editInputClass}
                    aria-invalid={Boolean(editErrors.name)}
                    value={contractToEdit.name || ""}
                    onChange={(e) =>
                      updateEditableContract({ name: e.target.value })
                    }
                  />
                  <FormError message={editErrors.name} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-crop" className={editLabelClass}>
                    Культура <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-crop"
                    className={editInputClass}
                    aria-invalid={Boolean(editErrors.crop)}
                    value={contractToEdit.crop || ""}
                    onChange={(e) =>
                      updateEditableContract({ crop: e.target.value })
                    }
                  />
                  <FormError message={editErrors.crop} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-date" className={editLabelClass}>
                    Дата контракта <span className="text-destructive">*</span>
                  </label>
                  <DatePickerInput
                    id="edit-date"
                    value={contractToEdit.date}
                    className={editInputClass}
                    onChange={(date) =>
                      updateEditableContract({ date })
                    }
                  />
                  <FormError message={editErrors.date} />
                </div>
                </div>
              </div>

              <div className={editSectionClass}>
                <div className={editSectionTitleClass}>
                  <Route className="h-4 w-4 text-[#2f6b4f]" />
                  Маршрут и участники
                </div>
                <Separator className="my-4 bg-[#e7eee6]" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="edit-sender" className={editLabelClass}>
                    Грузоотправитель <span className="text-destructive">*</span>
                  </label>
                  <Popover open={openSender} onOpenChange={setOpenSender}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openSender}
                        aria-invalid={Boolean(editErrors.sender)}
                        className={editComboClass}
                      >
                        <span className="truncate">
                          {contractToEdit.sender || "Выберите грузоотправителя"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-md border-[#dfe7de] p-0 shadow-[0_18px_45px_rgba(22,42,35,0.16)]">
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
                                  updateEditableContract({ sender: value });
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
                  <FormError message={editErrors.sender} />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-receiver"
                    className={editLabelClass}
                  >
                    Грузополучатель <span className="text-destructive">*</span>
                  </label>
                  <Popover open={openReceiver} onOpenChange={setOpenReceiver}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openReceiver}
                        aria-invalid={Boolean(editErrors.receiver)}
                        className={editComboClass}
                      >
                        <span className="truncate">
                          {contractToEdit.receiver ||
                            "Выберите грузополучателя"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-md border-[#dfe7de] p-0 shadow-[0_18px_45px_rgba(22,42,35,0.16)]">
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
                                  updateEditableContract({ receiver: value });
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
                  <FormError message={editErrors.receiver} />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-departure"
                    className={editLabelClass}
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
                        aria-invalid={Boolean(editErrors.departure_station)}
                        className={editComboClass}
                      >
                        <span className="truncate">
                          {contractToEdit.departure_station ||
                            "Выберите станцию отправления"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-md border-[#dfe7de] p-0 shadow-[0_18px_45px_rgba(22,42,35,0.16)]">
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
                                  updateEditableContract({
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
                  <FormError message={editErrors.departure_station} />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-destination"
                    className={editLabelClass}
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
                        aria-invalid={Boolean(editErrors.destination_station)}
                        className={editComboClass}
                      >
                        <span className="truncate">
                          {contractToEdit.destination_station ||
                            "Выберите станцию назначения"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] rounded-md border-[#dfe7de] p-0 shadow-[0_18px_45px_rgba(22,42,35,0.16)]">
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
                                  updateEditableContract({
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
                  <FormError message={editErrors.destination_station} />
                </div>
                </div>
              </div>

              <div className={editSectionClass}>
                <div className={editSectionTitleClass}>
                  <Package className="h-4 w-4 text-[#f38810]" />
                  Объем и стоимость
                </div>
                <Separator className="my-4 bg-[#e7eee6]" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="edit-volume" className={editLabelClass}>
                    Общий объем (тонн){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-volume"
                    type="number"
                    className={editInputClass}
                    aria-invalid={Boolean(editErrors.total_volume)}
                    value={contractToEdit.total_volume || ""}
                    onChange={(e) =>
                      updateEditableContract({
                        total_volume: Number(e.target.value),
                      })
                    }
                  />
                  <FormError message={editErrors.total_volume} />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-estimated-cost"
                    className={editLabelClass}
                  >
                    Ориентировочная стоимость
                  </label>
                  <Input
                    id="edit-estimated-cost"
                    type="text"
                    className={editInputClass}
                    value={contractToEdit.estimated_cost || ""}
                    onChange={(e) =>
                      updateEditableContract({
                        estimated_cost: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="edit-currency"
                    className={editLabelClass}
                  >
                    Валюта <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="edit-currency"
                    className={editInputClass}
                    aria-invalid={Boolean(editErrors.currency)}
                    value={contractToEdit.currency || ""}
                    onChange={(e) =>
                      updateEditableContract({ currency: e.target.value })
                    }
                  />
                  <FormError message={editErrors.currency} />
                </div>
              </div>
              </div>

              <div className={editSectionClass}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className={editSectionTitleClass}>
                    <File className="h-4 w-4 text-[#2f6b4f]" />
                    Файлы контракта
                  </div>
                  <Badge className="w-fit rounded-md border border-[#dfe7de] bg-[#eef5ef] text-[#2f6b4f] hover:bg-[#eef5ef]">
                    {(contractToEdit.files?.length || 0) +
                      selectedFiles.length -
                      filesToRemove.length}{" "}
                    вложений
                  </Badge>
                </div>
                <Separator className="my-4 bg-[#e7eee6]" />
                <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                  {/* Existing files */}
                  {contractToEdit.files && contractToEdit.files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-black text-[#223137]">
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
                              className="flex items-center justify-between gap-3 rounded-md border border-[#dfe7de] bg-white px-3 py-2 shadow-sm"
                            >
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-[#2f6b4f]" />
                                <span className="min-w-0 truncate text-sm font-semibold text-[#223137]">
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
                                <X className="h-4 w-4 text-[#8a928f]" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* New files */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-black text-[#223137]">
                        Новые файлы:
                      </h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between gap-3 rounded-md border border-[#f6d7b3] bg-[#fff8ef] px-3 py-2 shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <File className="h-4 w-4 text-[#f38810]" />
                              <span className="min-w-0 truncate text-sm font-semibold text-[#223137]">
                                {file.name}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveFile(index)}
                              title="Удалить файл"
                            >
                              <X className="h-4 w-4 text-[#8a928f]" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center rounded-md border border-dashed border-[#f6c587] bg-white p-6">
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
                      className="h-11 rounded-md border-[#f6c587] bg-[#fff8ef] px-5 font-black text-[#d26d07] shadow-sm hover:bg-[#ffefd9] hover:text-[#b85d05]"
                    >
                      <Upload className="h-4 w-4" />
                      Загрузить файлы
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-[#dfe7de] bg-white px-5 py-4 sm:px-6">
            <Button
              variant="outline"
              className="h-11 rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
              onClick={() => setEditDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              className="h-11 rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_12px_26px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
              onClick={handleUpdateContract}
              disabled={isEditSaving}
            >
              {isEditSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить изменения"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddContractDialog />
    </div>
  );
};
