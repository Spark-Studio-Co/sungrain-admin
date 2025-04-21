"use client";

import type React from "react";
import { useState } from "react";
import {
  FileText,
  Plus,
  Package,
  DollarSign,
  Calendar,
  Search,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  TrainFront,
  SlidersHorizontal,
  Download,
  RefreshCw,
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
import { useGetApplications } from "@/entities/applications/hooks/query/use-get-applications.query";
import { useDeleteApplication } from "@/entities/applications/hooks/mutations/use-delete-application.mutation";
import { ApplicationDialog } from "@/pages/application-page/blocks/application-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApplicationBlockProps {
  contractId: string;
  onSelectApplication: (applicationId: string) => void;
}

export const ApplicationBlock = ({
  contractId,
  onSelectApplication,
}: ApplicationBlockProps) => {
  const [isAdmin] = useState<boolean | null>(() => {
    const storedAdminStatus = localStorage.getItem("isAdmin");
    return storedAdminStatus ? JSON.parse(storedAdminStatus) : null;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
    } finally {
      setIsRefreshing(false);
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
            formatDate(app.created_at).toLowerCase().includes(searchLower)) ||
          (app.culture &&
            (app.culture.toLowerCase().includes(searchLower) ||
              getCultureName(app.culture).toLowerCase().includes(searchLower)))
        );
      })
    : [];

  // Get culture name from code
  const getCultureName = (cultureCode: string) => {
    const cultures: Record<string, string> = {
      wheat: "Пшеница",
      barley: "Ячмень",
      corn: "Кукуруза",
      sunflower: "Подсолнечник",
      flax: "Лен",
      rapeseed: "Рапс",
    };
    return cultures[cultureCode] || cultureCode;
  };

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
    await deleteApplicationMutation.mutateAsync(selectedApplication.id);
    // The rest is handled in the onSuccess callback
  };

  // Handle row click to view application details
  const handleRowClick = (applicationId: string) => {
    onSelectApplication(applicationId);
  };

  // Export applications to CSV
  const exportToCSV = () => {
    if (!applications || applications.length === 0) {
      return;
    }

    try {
      // Create CSV header
      const headers = [
        "ID",
        "Дата создания",
        "Объем (т)",
        "Культура",
        "Цена за тонну",
        "Валюта",
        "Общая сумма",
        "Документы",
        "Вагоны",
      ];

      // Create CSV rows
      const rows = applications.map((app: any) => [
        app.id,
        app.created_at ? formatDate(app.created_at) : "",
        app.volume || 0,
        getCultureName(app.culture) || "",
        app.price_per_ton || 0,
        app.currency || app.contract?.currency || "KZT",
        app.total_amount || 0,
        app.files?.length || 0,
        app.wagons?.length || 0,
      ]);

      // Combine header and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row: any) => row.join(",")),
      ].join("\n");

      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `applications-${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {}
  };

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4">
          <div className="grid grid-cols-9 gap-4 mb-4">
            {Array(9)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
          </div>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="grid grid-cols-9 gap-4 mb-4">
                {Array(9)
                  .fill(0)
                  .map((_, j) => (
                    <Skeleton key={j} className="h-10" />
                  ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );

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
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Обновить данные</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Действия</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Экспорт в CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isAdmin && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="gap-2 bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  Добавить заявку
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeleton()
          ) : (
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

              {isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ошибка загрузки данных:{" "}
                    {(error as Error)?.message || "Неизвестная ошибка"}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-2 ml-2"
                    >
                      Попробовать снова
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Объем (т)</TableHead>
                        <TableHead>Культура</TableHead>
                        <TableHead>Цена за тонну</TableHead>
                        <TableHead>Валюта</TableHead>
                        <TableHead>Общая сумма</TableHead>
                        <TableHead>Документы</TableHead>
                        <TableHead>Вагоны</TableHead>
                        {isAdmin && (
                          <TableHead className="text-right">Действия</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.length > 0 ? (
                        filteredApplications.map((application: any) => (
                          <TableRow
                            key={application.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() =>
                              handleRowClick(application.id.toString())
                            }
                          >
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
                                {getCultureName(application.culture) ||
                                  "Не указана"}
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
                                <TrainFront className="h-4 w-4 text-amber-500" />
                                <span>{application.wagons?.length || 0}</span>
                              </div>
                            </TableCell>
                            {isAdmin && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={(e) =>
                                            handleEditApplication(
                                              application,
                                              e
                                            )
                                          }
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Редактировать</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={(e) =>
                                            handleDeleteClick(application, e)
                                          }
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Удалить</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={isAdmin ? 10 : 9}
                            className="h-24 text-center"
                          >
                            {searchTerm ? (
                              <>
                                <div className="flex flex-col items-center gap-2">
                                  <Search className="h-8 w-8 text-muted-foreground" />
                                  <p>
                                    Заявки не найдены по запросу "{searchTerm}"
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="mt-2"
                                  >
                                    Сбросить поиск
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p>Заявки не найдены</p>
                                {isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddDialogOpen(true)}
                                    className="mt-2"
                                  >
                                    <Plus className="h-4 w-4 mr-1" /> Добавить
                                    заявку
                                  </Button>
                                )}
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
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
