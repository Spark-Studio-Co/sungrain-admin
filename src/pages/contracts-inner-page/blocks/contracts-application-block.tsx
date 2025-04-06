"use client";

import type React from "react";

import { useState } from "react";
import {
  FileText,
  Plus,
  ChevronRight,
  Package,
  Truck,
  DollarSign,
  Calendar,
  Search,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGetApplications } from "@/entities/applications/api/use-get-applications";
import { useDeleteApplication } from "@/entities/applications/api/use-delete-application";
import { ApplicationDialog } from "@/pages/application-page/blocks/application-dialog";

interface ApplicationBlockProps {
  contractId: string;
  onSelectApplication: (applicationId: string) => void;
}

export const ApplicationBlock = ({
  contractId,
  onSelectApplication,
}: ApplicationBlockProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const {
    data: applications,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetApplications(contractId);

  const deleteApplicationMutation = useDeleteApplication();

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Filter applications based on search term
  const filteredApplications = Array.isArray(applications)
    ? applications.filter((app: any) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          app.id?.toString().includes(searchLower) ||
          app.price_per_ton?.toString().includes(searchLower) ||
          app.volume?.toString().includes(searchLower) ||
          app.total_amount?.toString().includes(searchLower) ||
          app.currency?.toLowerCase().includes(searchLower) ||
          (app.created_at &&
            formatDate(app.created_at).toLowerCase().includes(searchLower))
        );
      })
    : [];

  // Handle dialog close and refresh data
  const handleDialogClose = (shouldRefresh: boolean) => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedApplication(null);
    if (shouldRefresh) {
      refetch();
    }
  };

  // Open edit dialog
  const handleEditApplication = (application: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from triggering
    setSelectedApplication(application);
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (application: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click from triggering
    setSelectedApplication(application);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;

    try {
      await deleteApplicationMutation.mutateAsync(selectedApplication.id);

      setIsDeleteDialogOpen(false);
      setSelectedApplication(null);
      refetch();
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  // Handle row click to view application details
  const handleRowClick = (applicationId: string) => {
    onSelectApplication(applicationId);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-full">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle>Заявки по договору</CardTitle>
                <CardDescription>
                  Управление заявками и отгрузками
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2 bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              Добавить заявку
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по заявкам..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead>Объем (т)</TableHead>
                    <TableHead>Культура</TableHead>
                    <TableHead>Цена за тонну</TableHead>
                    <TableHead>Валюта</TableHead>
                    <TableHead>Общая сумма</TableHead>
                    <TableHead>Документы</TableHead>
                    <TableHead>Вагоны</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2">Загрузка заявок...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="h-24 text-center text-red-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-6 w-6" />
                          <span>
                            Ошибка загрузки данных:{" "}
                            {(error as Error)?.message || "Неизвестная ошибка"}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="mt-2"
                          >
                            Попробовать снова
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredApplications.length > 0 ? (
                    filteredApplications.map((application: any) => (
                      <TableRow
                        key={application.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          handleRowClick(application.id.toString())
                        }
                      >
                        <TableCell className="font-medium">
                          {application.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {application.created_at
                              ? formatDate(application.created_at)
                              : "Не указана"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {application.volume
                              ? application.volume.toLocaleString()
                              : 0}{" "}
                            т
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            {application.culture === "wheat"
                              ? "Пшеница"
                              : application.culture === "barley"
                              ? "Ячмень"
                              : application.culture === "corn"
                              ? "Кукуруза"
                              : application.culture === "sunflower"
                              ? "Подсолнечник"
                              : application.culture === "flax"
                              ? "Лен"
                              : application.culture === "rapeseed"
                              ? "Рапс"
                              : application.culture || "Не указана"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            {application.price_per_ton
                              ? application.price_per_ton.toLocaleString()
                              : 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700"
                          >
                            {application.currency ||
                              application.contract?.currency ||
                              "KZT"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 font-medium"
                          >
                            {application.total_amount
                              ? application.total_amount.toLocaleString()
                              : 0}{" "}
                            {application.currency ||
                              application.contract?.currency ||
                              "₸"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span>{application.files?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4 text-amber-500" />
                            <span>{application.wagons?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) =>
                                handleEditApplication(application, e)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleDeleteClick(application, e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectApplication(application.id.toString());
                              }}
                            >
                              Подробнее <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        Заявки не найдены
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Application Dialog */}
      <ApplicationDialog
        isOpen={isAddDialogOpen}
        onClose={handleDialogClose}
        contractId={contractId}
      />

      {/* Edit Application Dialog */}
      {selectedApplication && (
        <ApplicationDialog
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
          contractId={contractId}
          application={selectedApplication}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить заявку #{selectedApplication?.id}?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteApplication}
              disabled={deleteApplicationMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteApplicationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Удаление...
                </>
              ) : (
                "Удалить"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
