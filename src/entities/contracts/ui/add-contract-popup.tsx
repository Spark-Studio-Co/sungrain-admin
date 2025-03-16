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
import { Loader2, Upload, X, FileText, File } from "lucide-react";
import { useAddContract } from "../api/post/use-create-contract";
import { useState } from "react";
import { useContractDialogStore } from "../model/use-contract-dialog";
import { cn } from "@/lib/utils";

export const AddContractDialog = () => {
  // Use Zustand store for dialog state
  const { isAddDialogOpen, setDialogOpen } = useContractDialogStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newContract, setNewContract] = useState({
    crop: "",
    sender: "",
    company: "",
    receiver: "",
    departureStation: "",
    destinationStation: "",
    totalVolume: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const cropOptions = [
    "Пшеница",
    "Кукуруза",
    "Ячмень",
    "Подсолнечник",
    "Рапс",
    "Соя",
    "Горох",
  ];

  const mutation = useAddContract();

  // Reset form when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      setNewContract({
        crop: "",
        sender: "",
        company: "",
        receiver: "",
        departureStation: "",
        destinationStation: "",
        totalVolume: "",
      });
      setFiles([]);
    }
  }, [isAddDialogOpen]);

  const handleAddContract = () => {
    // Create FormData to send files along with contract data
    const formData = new FormData();

    // Append contract data
    formData.append(
      "contractData",
      JSON.stringify({
        ...newContract,
        totalVolume: Number(newContract.totalVolume),
      })
    );

    // Append files
    files.forEach((file, index) => {
      formData.append(`file-${index}`, file);
    });

    // In a real implementation, you would modify your mutation to handle FormData
    mutation.mutate(
      {
        ...newContract,
        totalVolume: Number(newContract.totalVolume),
        // You would pass formData here in a real implementation
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
        },
      }
    );
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
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Добавить новый контракт</DialogTitle>
          <DialogDescription>
            Заполните информацию о новом контракте
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="crop" className="text-right">
              Культура
            </Label>
            <Select
              value={newContract.crop}
              onValueChange={(value) =>
                setNewContract({ ...newContract, crop: value })
              }
            >
              <SelectTrigger className="col-span-3 w-full">
                <SelectValue placeholder="Выберите культуру" />
              </SelectTrigger>
              <SelectContent>
                {cropOptions.map((crop) => (
                  <SelectItem key={crop} value={crop}>
                    {crop}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Компания
            </Label>
            <Input
              id="company"
              value={newContract.company}
              onChange={(e) =>
                setNewContract({
                  ...newContract,
                  company: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sender" className="text-right">
              Грузоотправитель
            </Label>
            <Input
              id="sender"
              value={newContract.sender}
              onChange={(e) =>
                setNewContract({
                  ...newContract,
                  sender: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="receiver" className="text-right">
              Грузополучатель
            </Label>
            <Input
              id="receiver"
              value={newContract.receiver}
              onChange={(e) =>
                setNewContract({
                  ...newContract,
                  receiver: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="departureStation" className="text-right">
              Станция отправления
            </Label>
            <Input
              id="departureStation"
              value={newContract.departureStation}
              onChange={(e) =>
                setNewContract({
                  ...newContract,
                  departureStation: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="destinationStation" className="text-right">
              Станция назначения
            </Label>
            <Input
              id="destinationStation"
              value={newContract.destinationStation}
              onChange={(e) =>
                setNewContract({
                  ...newContract,
                  destinationStation: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="totalVolume" className="text-right">
              Общий объем (тонн)
            </Label>
            <Input
              id="totalVolume"
              type="number"
              value={newContract.totalVolume || ""}
              onChange={(e) =>
                setNewContract({
                  ...newContract,
                  totalVolume: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>

          {/* File Upload Component */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Документы</Label>
            <div className="col-span-3">
              <div
                className={cn(
                  "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
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
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Перетащите файлы сюда или{" "}
                  <span className="text-primary font-medium">
                    выберите файлы
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Поддерживаемые форматы: PDF, DOC, DOCX, XLS, XLSX
                </p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                    >
                      <div className="flex items-center space-x-2 overflow-hidden">
                        {getFileIcon(file.name)}
                        <span className="text-sm truncate max-w-[250px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
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
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleAddContract}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Добавление...
              </>
            ) : (
              "Добавить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
