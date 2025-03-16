"use client";

import type React from "react";

import { useState, useRef } from "react";
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
import { Label } from "@radix-ui/react-label";
import { Upload, X, FileText, File } from "lucide-react";
import { usePopupStore } from "@/shared/model/popup-store";
import { useAddWagon } from "../api/use-add-wagon";
import { cn } from "@/lib/utils";

export const AddWagonPopup = ({ contractId }: { contractId: string }) => {
  const { isOpen, close } = usePopupStore("addWagon");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [newWagon, setNewWagon] = useState({
    number: "",
    capacity: "",
    owner: "",
  });

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

  const addWagonMutation = useAddWagon();

  const handleSubmit = () => {
    if (!newWagon.number || !newWagon.capacity || !newWagon.owner) {
      console.error("Please fill all fields");
      return;
    }

    addWagonMutation.mutate(
      {
        number: newWagon.number,
        capacity: Number(newWagon.capacity),
        owner: newWagon.owner,
        status: '',
        contractId: contractId,
        files: files
      },
      {
        onSuccess: () => {
          // Reset form
          setNewWagon({
            number: "",
            capacity: "",
            owner: ""
          });
          setFiles([]);

          // Close the dialog
          close();
        },
        onError: (error) => {
          console.error("Error adding wagon:", error);
          // You could add error handling UI here
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить новый вагон</DialogTitle>
          <DialogDescription>Введите данные нового вагона</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="wagon-number" className="text-right">
              № вагона
            </Label>
            <Input
              id="wagon-number"
              value={newWagon.number}
              onChange={(e) =>
                setNewWagon({ ...newWagon, number: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="capacity" className="text-right">
              Г/П, кг
            </Label>
            <Input
              id="capacity"
              type="number"
              value={newWagon.capacity}
              onChange={(e) =>
                setNewWagon({ ...newWagon, capacity: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner" className="text-right">
              Собственник
            </Label>
            <Input
              id="owner"
              value={newWagon.owner}
              onChange={(e) =>
                setNewWagon({ ...newWagon, owner: e.target.value })
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
            onClick={handleSubmit}
            disabled={addWagonMutation.isPending}
          >
            {addWagonMutation.isPending ? "Добавление..." : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
