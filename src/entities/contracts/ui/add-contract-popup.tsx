"use client";

import type React from "react";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Upload, X, FileText, File, Info } from "lucide-react";
import { useAddContract } from "../api/post/use-create-contract";
import { useState } from "react";
import { useContractDialogStore } from "../model/use-contract-dialog";
import { cn } from "@/lib/utils";
import { useFetchCultures } from "@/entities/cultures/api/use-get-cultures";
import { useGetSenders } from "@/entities/sender/api/get/use-get-senders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetReceivers } from "@/entities/receiver/api/get/use-get-receiver";
import { useFetchStations } from "@/entities/stations/use-get-stations";
import { useGetCompanies } from "@/entities/companies/api/use-get-company";

export const AddContractDialog = () => {
  // Use Zustand store for dialog state
  const { isAddDialogOpen, setDialogOpen } = useContractDialogStore();
  const { data: cultures, isLoading: culturesLoading } = useFetchCultures();
  const { data: sendersData, isLoading: sendersLoading } = useGetSenders(
    1,
    100
  );
  const { data: receiversData, isLoading: receiversLoading } = useGetReceivers(
    1,
    100
  );
  const { data: stationsData, isLoading: stationsLoading } = useFetchStations(
    1,
    100
  );
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100); // Get all companies for dropdown

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newContract, setNewContract] = useState({
    number: "",
    unk: "",
    name: "",
    crop: "",
    sender: "",
    receiver: "",
    departure_station: "",
    destination_station: "",
    companyId: undefined,
    total_volume: "",
    currency: "USD", // Default currency
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const mutation = useAddContract();

  // Reset form when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      setNewContract({
        number: "",
        unk: "",
        name: "",
        crop: "",
        sender: "",
        receiver: "",
        departure_station: "",
        destination_station: "",
        companyId: undefined,
        total_volume: "",
        currency: "USD",
      });
      setFiles([]);
    }
  }, [isAddDialogOpen]);

  const handleAddContract = () => {
    // Create FormData to send files along with contract data
    const formData = new FormData();

    // Append each field separately
    formData.append("number", newContract.number);
    formData.append("unk", newContract.unk);
    formData.append("name", newContract.name);
    formData.append("crop", newContract.crop);
    formData.append("sender", newContract.sender);
    formData.append("receiver", newContract.receiver);
    formData.append("departure_station", newContract.departure_station);
    formData.append("destination_station", newContract.destination_station);
    formData.append("companyId", Number(newContract.companyId) as any);
    formData.append("total_volume", Number(newContract.total_volume) as any);
    formData.append("currency", newContract.currency);

    // Append files
    files.forEach((file) => {
      formData.append("files", file); // Use 'files' as the field name for all files
    });

    // Send the FormData to the API
    mutation.mutate(formData, {
      onSuccess: () => {
        setDialogOpen(false);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FileText className="h-5 w-5 text-green-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Добавить новый контракт</DialogTitle>
          <DialogDescription>
            Заполните информацию о новом контракте
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Основная информация</TabsTrigger>
            <TabsTrigger value="route">Маршрут</TabsTrigger>
            <TabsTrigger value="documents">Документы</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="number" className="font-medium">
                    Номер контракта
                  </Label>
                  <Input
                    id="number"
                    value={newContract.number}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        number: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unk" className="font-medium">
                    УНК
                  </Label>
                  <Input
                    id="unk"
                    value={newContract.unk}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        unk: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium">
                    Название
                  </Label>
                  <Input
                    id="name"
                    value={newContract.name}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="font-medium">
                    Компания
                  </Label>
                  {isCompaniesLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={newContract.companyId}
                      onValueChange={(value) =>
                        setNewContract({
                          ...newContract,
                          companyId: value as any,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите компанию" />
                      </SelectTrigger>
                      <SelectContent>
                        {companiesData?.data?.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="crop" className="font-medium">
                    Культура
                  </Label>
                  <Select
                    value={newContract.crop}
                    onValueChange={(value) =>
                      setNewContract({ ...newContract, crop: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите культуру" />
                    </SelectTrigger>
                    <SelectContent>
                      {cultures?.data?.map((crop: any) => (
                        <SelectItem
                          key={crop.id || crop}
                          value={crop.name || crop}
                        >
                          {crop.name || crop}
                        </SelectItem>
                      )) || (
                        <SelectItem value="" disabled>
                          Загрузка...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_volume" className="font-medium">
                      Общий объем (тонн)
                    </Label>
                    <Input
                      className="w-full"
                      id="total_volume"
                      type="number"
                      value={newContract.total_volume || ""}
                      onChange={(e) =>
                        setNewContract({
                          ...newContract,
                          total_volume: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="font-medium">
                      Валюта
                    </Label>
                    <Select
                      value={newContract.currency}
                      onValueChange={(value) =>
                        setNewContract({
                          ...newContract,
                          currency: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите валюту" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="RUB">RUB</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="KZT">KZT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="route" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sender" className="font-medium">
                    Грузоотправитель
                  </Label>
                  <Select
                    value={newContract.sender}
                    onValueChange={(value) =>
                      setNewContract({
                        ...newContract,
                        sender: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите грузоотправителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {sendersData?.data ? (
                        sendersData.data.map((sender) => (
                          <SelectItem key={sender.id} value={sender.name}>
                            {sender.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Загрузка...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departure_station" className="font-medium">
                    Станция отправления
                  </Label>
                  <Select
                    value={newContract.departure_station}
                    onValueChange={(value) =>
                      setNewContract({
                        ...newContract,
                        departure_station: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите станцию отправления" />
                    </SelectTrigger>
                    <SelectContent>
                      {stationsData?.data ? (
                        stationsData.data.map((station) => (
                          <SelectItem key={station.id} value={station.name}>
                            {station.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Загрузка...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receiver" className="font-medium">
                    Грузополучатель
                  </Label>
                  <Select
                    value={newContract.receiver}
                    onValueChange={(value) =>
                      setNewContract({
                        ...newContract,
                        receiver: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите грузополучателя" />
                    </SelectTrigger>
                    <SelectContent>
                      {receiversData?.data ? (
                        receiversData.data.map((receiver) => (
                          <SelectItem key={receiver.id} value={receiver.name}>
                            {receiver.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Загрузка...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination_station" className="font-medium">
                    Станция назначения
                  </Label>
                  <Select
                    value={newContract.destination_station}
                    onValueChange={(value) =>
                      setNewContract({
                        ...newContract,
                        destination_station: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Выберите станцию назначения" />
                    </SelectTrigger>
                    <SelectContent>
                      {stationsData?.data ? (
                        stationsData.data.map((station) => (
                          <SelectItem key={station.id} value={station.name}>
                            {station.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Загрузка...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="space-y-4">
              <div
                className={cn(
                  "border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  Загрузите документы
                </h3>
                <p className="text-sm text-muted-foreground">
                  Перетащите файлы сюда или{" "}
                  <span className="text-primary font-medium">
                    выберите файлы
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Поддерживаемые форматы: PDF, DOC, DOCX, XLS, XLSX
                </p>
              </div>

              {/* File List */}
              {files.length > 0 ? (
                <div className="mt-4 space-y-2 border rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">
                      Загруженные файлы ({files.length})
                    </span>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto pr-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-muted/50 p-3 rounded-md mb-2 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {getFileIcon(file.name)}
                          <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[300px]">
                              {file.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm p-4 border rounded-md bg-muted/10">
                  Нет загруженных файлов
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 pt-4 border-t">
          <Button
            type="submit"
            onClick={handleAddContract}
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Добавление...
              </>
            ) : (
              "Добавить контракт"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
