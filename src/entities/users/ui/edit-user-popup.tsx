"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useEditUserDialogStore } from "../model/use-edit-user-dialog";

const roles = ["ADMIN", "USER"];

export const EditUserPopup = () => {
  const { isEditDialogOpen, setDialogOpen } = useEditUserDialogStore();
  const isEditing = !!editingUser?.id;

  const [userData, setUserData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "Пользователь",
  });

  // Update form when editing user changes
  useEffect(() => {
    if (editingUser) {
      setUserData({
        username: editingUser.username || "",
        name: editingUser.name || "",
        email: editingUser.email || "",
        password: "", // Don't populate password when editing
        role: editingUser.role || "Пользователь",
      });
    } else {
      // Reset form for new user
      setUserData({
        username: "",
        name: "",
        email: "",
        password: "",
        role: "Пользователь",
      });
    }
  }, [editingUser, isEditDialogOpen]);

  const handleSave = () => {
    onSave(isEditing ? { ...userData, id: editingUser.id } : userData);
  };

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Редактировать пользователя"
              : "Добавить нового пользователя"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Измените информацию о пользователе"
              : "Заполните информацию о новом пользователе"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Логин
            </Label>
            <Input
              id="username"
              value={userData.username}
              onChange={(e) =>
                setUserData({ ...userData, username: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              ФИО
            </Label>
            <Input
              id="name"
              value={userData.name}
              onChange={(e) =>
                setUserData({ ...userData, name: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={userData.email}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Пароль
            </Label>
            <Input
              id="password"
              type="password"
              value={userData.password}
              onChange={(e) =>
                setUserData({ ...userData, password: e.target.value })
              }
              placeholder={isEditing ? "Оставьте пустым, чтобы не менять" : ""}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Роль
            </Label>
            <Select
              value={userData.role}
              onValueChange={(value) =>
                setUserData({ ...userData, role: value })
              }
            >
              <SelectTrigger className="col-span-3 w-full">
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
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Сохранение..." : "Добавление..."}
              </>
            ) : isEditing ? (
              "Сохранить"
            ) : (
              "Добавить"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
