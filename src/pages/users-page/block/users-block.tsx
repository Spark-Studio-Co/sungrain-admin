import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

const roles = ["Администратор", "Пользователь"];

const initialUsers = [
  {
    id: "001",
    username: "ivanov_a",
    name: "Александр Иванов",
    email: "a.ivanov@example.com",
    role: "Администратор",
    status: "Активен",
    registrationDate: "15.01.2024",
  },
  {
    id: "002",
    username: "petrova_e",
    name: "Елена Петрова",
    email: "e.petrova@example.com",
    role: "Менеджер",
    status: "Активен",
    registrationDate: "20.01.2024",
  },
  {
    id: "003",
    username: "sidorov_i",
    name: "Игорь Сидоров",
    email: "i.sidorov@example.com",
    role: "Пользователь",
    status: "Активен",
    registrationDate: "25.01.2024",
  },
  {
    id: "004",
    username: "kuznetsova_m",
    name: "Мария Кузнецова",
    email: "m.kuznetsova@example.com",
    role: "Наблюдатель",
    status: "Неактивен",
    registrationDate: "30.01.2024",
  },
  {
    id: "005",
    username: "sokolov_d",
    name: "Дмитрий Соколов",
    email: "d.sokolov@example.com",
    role: "Пользователь",
    status: "Активен",
    registrationDate: "05.02.2024",
  },
];

export const UsersBlock = () => {
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Handle role change
  const handleRoleChange = (userId: number, newRole: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
        </h1>
        <Button>Добавить пользователя</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[120px]">Логин</TableHead>
              <TableHead className="w-[180px]">ФИО</TableHead>
              <TableHead className="w-[200px]">Email</TableHead>
              <TableHead className="w-[150px]">Роль</TableHead>
              <TableHead className="w-[120px]">Дата регистрации</TableHead>
              <TableHead className="w-[120px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-full">
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
                </TableCell>

                <TableCell>{user.registrationDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
