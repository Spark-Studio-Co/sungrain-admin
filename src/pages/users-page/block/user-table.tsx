"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building, Edit, Trash2 } from "lucide-react";

interface UserTableProps {
  users: any[];
  isLoading: boolean;
  onEdit: (user: any) => void;
  onDelete: (user: any) => void;
}

export default function UserTable({
  users,
  isLoading,
  onEdit,
  onDelete,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead className="w-[200px]">Email</TableHead>
            <TableHead className="w-[200px]">ФИО</TableHead>
            <TableHead className="w-[150px]">Роль</TableHead>
            <TableHead className="w-[150px]">Компания</TableHead>
            <TableHead className="w-[120px] text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array(5)
              .fill(0)
              .map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-6 w-10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-6 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
          ) : users.length > 0 ? (
            users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.full_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {user.companies && user.companies.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {user.companies
                        .slice(0, 2)
                        .map((companyRelation: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {companyRelation.company.name}
                            </span>
                          </div>
                        ))}
                      {user.companies.length > 2 && (
                        <span className="text-xs text-muted-foreground ml-6">
                          +{user.companies.length - 2} еще
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Не указаны
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => onDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Пользователи не найдены.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
