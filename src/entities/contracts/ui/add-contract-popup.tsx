"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AddContractPopup = () => {
  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить контракт
        </Button>
      </DialogTrigger>
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
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleAddContract}>
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
