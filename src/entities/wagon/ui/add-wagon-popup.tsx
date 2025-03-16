"use client";

import { useState } from "react";
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
import { Label } from "@radix-ui/react-label";
import { Plus } from "lucide-react";
import { useAddWagon } from "../api/use-add-wagon";
import { useWagonStore } from "../model/use-wagon-popup";

export const AddWagonPopup = () => {
  const { isAddDialogOpen, setIsAddDialogOpen } = useWagonStore();
  const [newWagon, setNewWagon] = useState({
    number: "",
    capacity: "",
    owner: "",
  });

  const mutation = useAddWagon();

  const handleAddWagon = () => {
    mutation.mutate(
      {
        number: newWagon.number,
        capacity: Number(newWagon.capacity),
        owner: newWagon.owner,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false); // Close modal on success
          setNewWagon({ number: "", capacity: "", owner: "" });
        },
      }
    );
  };

  return (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить вагон
        </Button>
      </DialogTrigger>
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
        </div>
        <DialogFooter>
          <Button onClick={handleAddWagon} disabled={mutation.isPending}>
            {mutation.isPending ? "Добавление..." : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
