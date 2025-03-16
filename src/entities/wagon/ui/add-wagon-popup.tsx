"use client";

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

import { usePopupStore } from "@/shared/model/popup-store";


export const AddWagonPopup = () => {
  const { isOpen, close } = usePopupStore('addWagon')

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
              // onChange={(e) =>
              //   setNewWagon({ ...newWagon, number: e.target.value })
              // }
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
              // value={newWagon.capacity}
              // onChange={(e) =>
              //   setNewWagon({ ...newWagon, capacity: e.target.value })
              // }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="owner" className="text-right">
              Собственник
            </Label>
            <Input
              id="owner"
              // value={newWagon.owner}
              // onChange={(e) =>
              //   setNewWagon({ ...newWagon, owner: e.target.value })
              // }
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button>
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
