"use client";

import type React from "react";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useGetUsers } from "@/entities/users/api/get/use-get-users";
import { useUpdateUsers } from "@/entities/users/api/patch/use-update-user";
import { AddUserPopup } from "@/entities/users/ui/add-user-popup";
import { useCreateUserDialogStore } from "@/entities/users/model/use-create-user-dialog";

const roles = ["ADMIN", "USER"];

// Define the User interface
interface User {
  id?: string;
  username?: string;
  name?: string;
  full_name?: string;
  email?: string;
  role?: string;
  password?: string;
  registrationDate?: string;
}

export const UsersBlock = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { setDialogOpen } = useCreateUserDialogStore();

  const updateUserMutation = useUpdateUsers();

  const {
    data: usersData = { data: [], total: 0, page: 1, totalPages: 1 },
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUsers({
    page: currentPage,
    limit: itemsPerPage,
  });

  // Extract users from the response
  const users = usersData.data || [];

  // Handle role change
  const handleRoleChange = (userId: string, newRole: string) => {
    const userToUpdate = users.find((user: User) => user.id === userId);
    if (userToUpdate) {
      updateUserMutation.mutate({
        ...userToUpdate,
        role: newRole,
      });
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  // Handle add new user
  const handleAddUser = () => {
    setDialogOpen(true);
  };

  // Handle delete user
  const handleDeleteUser = (userId: string) => {
    // In a real application, you would make an API call to delete the user
    console.log(`Deleting user ${userId}`);
    // After API call succeeds:
    refetch();
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Reset to first page when searching
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const totalPages = usersData.totalPages || 1;
    const currentPageNum = currentPage;

    // If 5 or fewer pages, show all
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Otherwise, show current page, 2 before and 2 after if possible
    const pages = [];

    // Always include first page
    pages.push(1);

    // Add ellipsis if needed
    if (currentPageNum > 3) {
      pages.push(-1); // -1 represents ellipsis
    }

    // Add pages around current page
    const startPage = Math.max(2, currentPageNum - 1);
    const endPage = Math.min(totalPages - 1, currentPageNum + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (currentPageNum < totalPages - 2) {
      pages.push(-2); // -2 represents ellipsis
    }

    // Always include last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? users.filter((user: User) =>
        Object.values(user).some(
          (value) =>
            value &&
            value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск пользователей..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
          </div>
          <Button onClick={handleAddUser} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Добавить пользователя
          </Button>
        </div>
      </div>
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>
            Не удалось загрузить данные.{" "}
            {error?.message || "Пожалуйста, попробуйте позже."}
          </AlertDescription>
        </Alert>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead className="w-[180px]">ФИО</TableHead>
              <TableHead className="w-[200px]">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {Array(5)
                      .fill(0)
                      .map((_, cellIndex) => (
                        <TableCell key={`cell-${index}-${cellIndex}`}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                  </TableRow>
                ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name || user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Пользователи не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground mb-4 sm:mb-0">
          Всего пользователей: {isLoading ? "..." : usersData.total || 0}
        </div>

        {/* Pagination */}
        {!isLoading && usersData.totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((pageNum, index) => (
                <PaginationItem key={index}>
                  {pageNum < 0 ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={pageNum === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < (usersData.totalPages || 1)) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  className={
                    currentPage === (usersData.totalPages || 1)
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
      <AddUserPopup />
    </div>
  );
};
