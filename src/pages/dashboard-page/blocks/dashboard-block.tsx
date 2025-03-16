"use client";

import {
  TrendingUp,
  Package,
  Truck,
  FileText,
  ArrowRight,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useGetContracts } from "@/entities/contracts/api/get/use-get-contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { useMemo } from "react";

// Status badge mapping
const statusBadge = {
  active: { label: "Активен", variant: "default" },
  completed: { label: "Завершен", variant: "success" },
  pending: { label: "Ожидает", variant: "warning" },
};

// Sample data for activities (keeping this as static for now)
const recentActivities = [
  {
    id: 1,
    action: "Добавлен новый вагон",
    contract: "001-2024",
    user: "Иванов А.П.",
    timestamp: "Сегодня, 14:32",
  },
  {
    id: 2,
    action: "Загружен документ 'Паспорт качества №123'",
    contract: "001-2024",
    user: "Петрова Е.С.",
    timestamp: "Сегодня, 12:15",
  },
  {
    id: 3,
    action: "Изменен статус вагона на 'Отгружен'",
    contract: "002-2024",
    user: "Сидоров И.В.",
    timestamp: "Сегодня, 10:45",
  },
  {
    id: 4,
    action: "Создан новый контракт",
    contract: "005-2024",
    user: "Иванов А.П.",
    timestamp: "Вчера, 16:20",
  },
  {
    id: 5,
    action: "Завершена отгрузка по контракту",
    contract: "003-2024",
    user: "Петрова Е.С.",
    timestamp: "Вчера, 14:05",
  },
];

export const DashboardBlock = () => {
  // Fetch the 5 most recent contracts
  const {
    data: contractsData,
    isLoading,
    isError,
    error,
  } = useGetContracts({
    page: 1,
    limit: 5, // Fetch only 5 contracts
  });

  // Extract contracts from the response
  const recentContracts = useMemo(() => {
    if (!contractsData || !contractsData.data) return [];

    console.log("contract data:", contractsData);

    // Map API data to the format we need
    return contractsData.data.map((contract: any) => ({
      id: contract.id || `${Math.floor(Math.random() * 1000)}-2024`,
      crop: contract.crop || "Не указано",
      sender: contract.sender || "Не указано",
      receiver: contract.receiver || "Не указано",
      volume: contract.totalVolume || 0,
      date: contract.created_at
        ? new Date(contract.created_at).toLocaleDateString("ru-RU")
        : "Не указано",
      // Assuming these fields might not be in your API response, so providing defaults
      status: contract.status || "active",
      progress: contract.progress || Math.floor(Math.random() * 100),
    }));
  }, [contractsData]);

  // Calculate summary statistics
  const totalContracts = recentContracts.length;
  const activeContracts = recentContracts.filter(
    (c) => c.status === "active"
  ).length;
  const completedContracts = recentContracts.filter(
    (c) => c.status === "completed"
  ).length;

  const totalVolume = recentContracts.reduce(
    (sum, contract) => sum + contract.volume,
    0
  );
  const shippedVolume = recentContracts.reduce(
    (sum, contract) => sum + (contract.volume * contract.progress) / 100,
    0
  );
  const remainingVolume = totalVolume - shippedVolume;

  const shippingProgress =
    totalVolume > 0 ? (shippedVolume / totalVolume) * 100 : 0;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Панель управления
          </h1>
          <p className="text-muted-foreground">Обзор контрактов и отгрузок</p>
        </div>
        <Button asChild>
          <Link to="/admin/contracts">
            Все контракты
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="w-full flex gap-4">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Всего контрактов
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalContracts}</div>
                <p className="text-xs text-muted-foreground">
                  Активных: {activeContracts}, Завершенных: {completedContracts}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий объем</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {totalVolume.toLocaleString()} т
                </div>
                <p className="text-xs text-muted-foreground">
                  Отгружено: {Math.round(shippedVolume).toLocaleString()} т
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Контракты</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Последние контракты</CardTitle>
              <CardDescription>
                Обзор недавно созданных и активных контрактов
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <div>
                    <h4 className="font-medium">Ошибка загрузки данных</h4>
                    <p className="text-sm">
                      {error?.message || "Пожалуйста, попробуйте позже"}
                    </p>
                  </div>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>№ Контракта</TableHead>
                    <TableHead>Культура</TableHead>
                    <TableHead>Объем (т)</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array(6)
                            .fill(0)
                            .map((_, cellIndex) => (
                              <TableCell key={`cell-${index}-${cellIndex}`}>
                                <Skeleton className="h-6 w-full" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))
                  ) : recentContracts.length > 0 ? (
                    // Actual data
                    recentContracts.map((contract: any) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          {contract.id}
                        </TableCell>
                        <TableCell>{contract.crop}</TableCell>
                        <TableCell>
                          {contract.volume.toLocaleString()}
                        </TableCell>
                        <TableCell>{contract.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (statusBadge[contract.status]?.variant as
                                | "default"
                                | "success"
                                | "warning") || "default"
                            }
                          >
                            {statusBadge[contract.status]?.label || "Активен"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // No data
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Контракты не найдены
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
