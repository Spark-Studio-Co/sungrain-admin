"use client";

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
import {
  Loader2,
  Upload,
  X,
  Plus,
  CalendarIcon,
  CalendarPlus2Icon as CalendarIcon2,
} from "lucide-react";
import { useAddContract } from "../api/post/use-create-contract";
import { useState } from "react";
import { useContractDialogStore } from "../model/use-contract-dialog";
import { cn } from "@/lib/utils";
import { useFetchCultures } from "@/entities/cultures/hooks/query/use-get-cultures.query";
import { useGetSenders } from "@/entities/sender/hooks/query/use-get-senders.query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetReceivers } from "@/entities/receiver/hooks/query/use-get-receiver.query";
import { useFetchStations } from "@/entities/stations/hooks/query/use-get-stations.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export const AddContractDialog = () => {
  const { isAddDialogOpen, setDialogOpen } = useContractDialogStore();
  const { data: cultures } = useFetchCultures();
  const { data: sendersData } = useGetSenders(1, 100);
  const { data: receiversData } = useGetReceivers(1, 100);
  const { data: stationsData } = useFetchStations(1, 100);
  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);

  const [newContract, setNewContract] = useState({
    number: "",
    unk: "",
    name: "",
    crop: "",
    sender: "",
    receiver: "",
    estimated_cost: 0,
    departure_station: "",
    destination_station: "",
    companyId: undefined,
    total_volume: "",
    currency: "USD",
    date: new Date().toISOString(),
  });

  const [files, setFiles] = useState<File[]>([]);

  const [documents, setDocuments] = useState<
    Array<{
      name: string;
      number: string;
      date: string;
      file?: File;
      fileName?: string;
    }>
  >([]);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null]);

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
        estimated_cost: 0,
        departure_station: "",
        destination_station: "",
        companyId: undefined,
        total_volume: "",
        currency: "USD",
        date: new Date().toISOString(),
      });
      setFiles([]);
      setDocuments([]);
      fileInputRefs.current = [null, null];
    }
  }, [isAddDialogOpen]);

  const handleAddContract = () => {
    // Create FormData to send files along with contract data
    const formData = new FormData();

    // Append each field separately (excluding ID)
    formData.append("number", newContract.number);
    formData.append("unk", newContract.unk);
    formData.append("name", newContract.name);
    formData.append("crop", newContract.crop);
    formData.append("sender", newContract.sender);
    formData.append("receiver", newContract.receiver);
    formData.append("departure_station", newContract.departure_station);
    formData.append("destination_station", newContract.destination_station);
    formData.append("companyId", Number(newContract.companyId) as any);

    // Use parseFloat for total_volume to support decimal values
    formData.append(
      "total_volume",
      Number.parseFloat(newContract.total_volume) as any
    );

    formData.append(
      "estimated_cost",
      Number(newContract.estimated_cost) as any
    );
    formData.append("currency", newContract.currency);
    formData.append("date", newContract.date);

    // Add documents info
    const documentsInfo = documents
      .filter((doc) => doc.file)
      .map((doc) => ({
        name: doc.name,
        number: doc.number,
        date: doc.date,
      }));

    if (documentsInfo.length > 0) {
      formData.append("files_info", JSON.stringify(documentsInfo));
    }

    // Append document files
    documents.forEach((doc) => {
      if (doc.file) {
        formData.append("files", doc.file);
      }
    });

    // Append additional files
    files.forEach((file) => {
      // Check if this file is already included in documents
      const isDocumentFile = documents.some((doc) => doc.file === file);
      if (!isDocumentFile) {
        formData.append("files", file);
      }
    });

    // Send the FormData to the API
    mutation.mutate(formData, {
      onSuccess: () => {
        setDialogOpen(false);
      },
    });
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
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
                    Номер контракта <span className="text-destructive">*</span>
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
                    Название <span className="text-destructive">*</span>
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
                <div className="space-y-2">
                  <Label htmlFor="date" className="font-medium">
                    Дата контракта <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="date"
                      type="date"
                      value={
                        newContract.date
                          ? new Date(newContract.date)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={(e) => {
                        // Convert the date input value to a full ISO string
                        const selectedDate = new Date(e.target.value);
                        setNewContract({
                          ...newContract,
                          date: selectedDate.toISOString(),
                        });
                      }}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={() => {
                        // Set date to today with full ISO format
                        const today = new Date().toISOString();
                        setNewContract({
                          ...newContract,
                          date: today,
                        });
                      }}
                      title="Установить сегодняшнюю дату"
                    >
                      <CalendarIcon2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_cost" className="font-medium">
                    Ориентировачная стоимость
                  </Label>
                  <Input
                    id="estimated_cost"
                    type="text"
                    value={newContract.estimated_cost}
                    onChange={(e) =>
                      setNewContract({
                        ...newContract,
                        estimated_cost: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="font-medium">
                    Компания <span className="text-destructive">*</span>
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
                    Культура <span className="text-destructive">*</span>
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
                      Общий объем (тонн){" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      className="w-full"
                      id="total_volume"
                      type="string"
                      step="0.01"
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
                      Валюта <span className="text-destructive">*</span>
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
                    Грузоотправитель <span className="text-destructive">*</span>
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
                    Станция отправления{" "}
                    <span className="text-destructive">*</span>
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
                    Грузополучатель <span className="text-destructive">*</span>
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
                    Станция назначения{" "}
                    <span className="text-destructive">*</span>
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
            <div className="space-y-6">
              <div className="bg-amber-50 p-6 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-amber-700 uppercase text-sm">
                    ДОКУМЕНТЫ КОНТРАКТА
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDocuments([
                        ...documents,
                        { name: "", number: "", date: "" },
                      ])
                    }
                    className="text-amber-600 border-amber-300 hover:bg-amber-100"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Добавить документ
                  </Button>
                </div>

                <div className="bg-white p-4 rounded-md border border-amber-100">
                  <div className="grid grid-cols-5 gap-4 mb-4 text-sm font-medium text-muted-foreground">
                    <div>№</div>
                    <div>Наименование</div>
                    <div>Номер</div>
                    <div>Дата документа</div>
                    <div>Загрузить файл</div>
                  </div>

                  {documents.map((doc, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-5 gap-4 items-center py-3 border-b border-gray-100"
                    >
                      <div className="font-medium">{index + 1}</div>
                      <div>
                        <Input
                          value={doc.name}
                          onChange={(e) => {
                            const newDocs = [...documents];
                            newDocs[index].name = e.target.value;
                            setDocuments(newDocs);
                          }}
                          placeholder="Название документа"
                          className="border-dashed"
                        />
                      </div>
                      <div>
                        <Input
                          value={doc.number}
                          onChange={(e) => {
                            const newDocs = [...documents];
                            newDocs[index].number = e.target.value;
                            setDocuments(newDocs);
                          }}
                          placeholder="№ документ"
                          className="border-dashed"
                        />
                      </div>
                      <div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal border-dashed",
                                !doc.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {doc.date ? (
                                format(new Date(doc.date), "dd.MM.yyyy")
                              ) : (
                                <span>Выберите дату</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={
                                doc.date ? new Date(doc.date) : undefined
                              }
                              onSelect={(date) => {
                                if (date) {
                                  const newDocs = [...documents];
                                  newDocs[index].date = format(
                                    date,
                                    "yyyy-MM-dd"
                                  );
                                  setDocuments(newDocs);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          id={`file-${index}`}
                          className="hidden"
                          ref={(el: any) => (fileInputRefs.current[index] = el)}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const newDocs = [...documents];
                              newDocs[index].file = file;
                              newDocs[index].fileName = file.name;
                              setDocuments(newDocs);

                              // Also add to the files array for backward compatibility
                              setFiles((prev) => [...prev, file]);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-green-600 hover:bg-green-50"
                          onClick={() => fileInputRefs.current[index]?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {doc.fileName ? "Заменить" : "Загрузить"}
                        </Button>
                        {doc.fileName && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => {
                              const newDocs = [...documents];
                              newDocs[index].file = undefined;
                              newDocs[index].fileName = undefined;
                              setDocuments(newDocs);

                              // Also remove from files array
                              if (doc.file) {
                                setFiles((prev) =>
                                  prev.filter((f) => f !== doc.file)
                                );
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
