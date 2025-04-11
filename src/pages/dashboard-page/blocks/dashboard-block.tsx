"use client";

import { Package, FileText, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export const DashboardBlock = () => {
  const navigate = useNavigate();

  const {
    data: contractsData,
    isLoading,
    isError,
    error,
  } = useGetContracts({
    page: 1,
    limit: 5,
  });

  const recentContracts = useMemo(() => {
    if (!contractsData || !contractsData.data) return [];

    return contractsData.data.map((contract: any) => ({
      id: contract.id || `${Math.floor(Math.random() * 1000)}-2024`,
      number: contract.number,
      crop: contract.crop || "Не указано",
      sender: contract.sender || "Не указано",
      receiver: contract.receiver || "Не указано",
      volume: contract.total_volume || 0,
      date: contract.created_at
        ? new Date(contract.created_at).toLocaleDateString("ru-RU")
        : "Не указано",
      status: contract.status || "active",
      progress: contract.progress || Math.floor(Math.random() * 100),
    }));
  }, [contractsData]);

  const totalContracts = contractsData?.total || recentContracts.length;

  const totalVolume = recentContracts.reduce(
    (sum: number, contract: any) => sum + Number(contract.volume),
    0
  );

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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
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
              </>
            )}
          </CardContent>
        </Card>
        <Card>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Объем по контрактам</CardTitle>
            <CardDescription>
              Распределение объема по последним контрактам
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : recentContracts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recentContracts}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="number"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis name="Объем (т)" />
                  <Tooltip
                    formatter={(value) => [
                      `${value.toLocaleString()} т`,
                      "Объем",
                    ]}
                    labelFormatter={(label) => `Контракт: ${label}`}
                  />
                  <Bar dataKey="volume" fill="#3b82f6" name="Объем (т)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Распределение объема</CardTitle>
            <CardDescription>
              Процентное соотношение объемов контрактов
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : recentContracts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={recentContracts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="volume"
                    nameKey="number"
                    label={({ number, volume, percent }) =>
                      `${number}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {recentContracts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${index * 45}, 70%, 60%)`}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${value.toLocaleString()} т`,
                      "Объем",
                    ]}
                    labelFormatter={(name) => `Контракт: ${name}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="contracts" className="space-y-4">
        <div className="flex space-x-4 border-b">
          <div
            className="cursor-pointer px-4 py-2 border-b-2 border-primary"
            data-state="active"
          >
            Контракты
          </div>
        </div>
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
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          {Array(7)
                            .fill(0)
                            .map((_, cellIndex) => (
                              <TableCell key={`cell-${index}-${cellIndex}`}>
                                <Skeleton className="h-6 w-full" />
                              </TableCell>
                            ))}
                        </TableRow>
                      ))
                  ) : recentContracts.length > 0 ? (
                    recentContracts.map((contract: any) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">
                          {contract.number}
                        </TableCell>
                        <TableCell>{contract.crop}</TableCell>
                        <TableCell>
                          {contract.volume.toLocaleString()}
                        </TableCell>
                        <TableCell>{contract.date}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/admin/contracts/${contract.id}`)
                            }
                          >
                            Подробнее
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        Контракты не найдены
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto" asChild>
                <Link to="/admin/contracts">
                  Посмотреть все
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="volume-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Детальный анализ объемов</CardTitle>
              <CardDescription>
                Подробная информация о распределении объемов по контрактам
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : recentContracts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={recentContracts}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="number" type="category" width={100} />
                    <Tooltip
                      formatter={(value) => [
                        `${value.toLocaleString()} т`,
                        "Объем",
                      ]}
                      labelFormatter={(label) => `Контракт: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="volume" fill="#10b981" name="Объем (т)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  Нет данных для отображения
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
