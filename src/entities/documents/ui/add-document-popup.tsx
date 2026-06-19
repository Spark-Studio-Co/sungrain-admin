import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { DialogFooter, DialogHeader } from "@/components/ui/dialog";

export const AddDocumentPopup = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 !bg-primary">
          <Upload className="h-4 w-4" />
          Загрузить документ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Загрузить новый документ</DialogTitle>
          <DialogDescription>
            Добавьте название и файл документа
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Название
            </Label>
            <Input
              id="name"
              className="col-span-3"
              placeholder="Введите название документа"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Файл
            </Label>
            <Input id="file" type="file" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Загрузить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
