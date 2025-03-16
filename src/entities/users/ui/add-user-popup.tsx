"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAddUser } from "../api/post/use-add-user";
import { useCreateUserDialogStore } from "../model/use-create-user-dialog";

export const AddUserPopup = () => {
  const { isCreateDialogOpen, setDialogOpen } = useCreateUserDialogStore();

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
    company: "",
  });

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!newUser.full_name.trim()) {
      newErrors.name = "ФИО обязательно";
    }

    if (!newUser.email.trim()) {
      newErrors.email = "Email обязателен";
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      newErrors.email = "Некорректный email";
    }

    if (!newUser.password) {
      newErrors.password = "Пароль обязателен";
    }

    if (!newUser.role) {
      newErrors.role = "Роль обязательна";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const roles = ["ADMIN", "USER"];

  const mutation = useAddUser();

  const handleAddUser = () => {
    if (!validateForm()) {
      return;
    }

    mutation.mutate(newUser, {
      onSuccess: () => {
        setDialogOpen(false); // Close modal on success using the store
        setNewUser({
          full_name: "",
          email: "",
          password: "",
          role: "",
          company: "",
        });
        setErrors({});
      },
    });
  };

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Only reset when closing to preserve entered data if user accidentally closes
      setDialogOpen(open);
    } else {
      // When opening, reset the form
      setNewUser({
        full_name: "",
        email: "",
        password: "",
        role: "",
        company: "",
      });
      setErrors({});
      setDialogOpen(open);
    }
  };

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить нового пользователя</DialogTitle>
          <DialogDescription>
            Заполните информацию о новом пользователе
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              ФИО
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="name"
                value={newUser.full_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, full_name: e.target.value })
                }
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="email"
                type="email"
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Пароль
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="password"
                type="password"
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company" className="text-right">
              Компания
            </Label>
            <Input
              id="company"
              value={newUser.company}
              onChange={(e) =>
                setNewUser({ ...newUser, company: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Роль
            </Label>
            <div className="col-span-3 space-y-1">
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger
                  className={`w-full ${errors.role ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role}</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleAddUser}
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
