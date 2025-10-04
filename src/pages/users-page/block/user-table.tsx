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
import { Card, CardContent } from "@/components/ui/card";
import { Building, Edit, Trash2, User, Mail, Shield } from "lucide-react";

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
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Mobile: Card skeletons */}
        <div className="sm:hidden space-y-3">
          {Array(5)
            .fill(0)
            .map((_, index) => (
              <Card key={`mobile-skeleton-${index}`} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </Card>
            ))}
        </div>

        {/* Desktop: Table skeletons */}
        <div className="hidden sm:block overflow-x-auto">
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
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={`desktop-skeleton-${index}`}>
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
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Пользователи не найдены.
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: Cards layout */}
      <div className="sm:hidden space-y-3">
        {users.map((user: any) => (
          <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
            <CardContent className="p-0 space-y-3">
              {/* Header with ID and actions */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">ID: {user.id}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(user)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(user)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* User details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.full_name || "—"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>

                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    {user.companies && user.companies.length > 0 ? (
                      <div className="space-y-1">
                        {user.companies
                          .slice(0, 2)
                          .map((companyRelation: any, index: number) => (
                            <div key={index}>
                              {companyRelation.company.name}
                            </div>
                          ))}
                        {user.companies.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{user.companies.length - 2} еще
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Не указаны</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden sm:block overflow-x-auto">
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
            {users.map((user: any) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
