"use client";

import {
  Package,
  FileText,
  ArrowRight,
  AlertCircle,
  Truck,
  Clock,
  Building2,
  CheckCircle2,
  FileBarChart,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { useGetContracts } from "@/entities/contracts/api/get/use-get-contracts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { useMemo } from "react";

// Sample activity data
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
      crop: contract.crop || "Не указано",
      sender: contract.sender || "Не указано",
      receiver: contract.receiver || "Не указано",
      volume: contract.totalVolume || 0,
      date: contract.created_at
        ? new Date(contract.created_at).toLocaleDateString("ru-RU")
        : "Не указано",
      status: contract.status || "active",
      progress: contract.progress || Math.floor(Math.random() * 100),
    }));
  }, [contractsData]);

  // Calculate summary statistics
  const totalContracts = contractsData?.total || recentContracts.length;
  const activeContracts = recentContracts.filter(
    (c: any) => c.status === "active"
  ).length;
  const completedContracts = recentContracts.filter(
    (c: any) => c.status === "completed"
  ).length;

  const totalVolume = recentContracts.reduce(
    (sum: number, contract: any) => sum + Number(contract.volume),
    0
  );

  const shippedVolume = recentContracts.reduce(
    (sum: number, contract: any) =>
      sum + (Number(contract.volume) * contract.progress) / 100,
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-xs text-muted-foreground">
                  Активных: {activeContracts}, Завершенных: {completedContracts}
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Отгружено: {Math.round(shippedVolume).toLocaleString()} т
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="contracts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contracts">Контракты</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
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
                          {contract.id}
                        </TableCell>
                        <TableCell>{contract.crop}</TableCell>
                        <TableCell>
                          {contract.volume.toLocaleString()}
                        </TableCell>
                        <TableCell>{contract.date}</TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={contract.progress}
                              className="h-2 w-[60px]"
                            />
                            <span className="text-xs text-muted-foreground">
                              {contract.progress}%
                            </span>
                          </div>
                        </TableCell>
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

          {/* Shipment Status Distribution */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Статус вагонов
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Отгружено</span>
                    </div>
                    <span className="font-medium">42</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">В пути</span>
                    </div>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">На элеваторе</span>
                    </div>
                    <span className="font-medium">24</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Документы</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileBarChart className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Паспорта качества</span>
                    </div>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">ЭПД</span>
                    </div>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm">Требуют внимания</span>
                    </div>
                    <span className="font-medium">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Последние действия</CardTitle>
              <CardDescription>
                История действий пользователей в системе
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Действие</TableHead>
                    <TableHead>Контракт</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Время</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{activity.action}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() =>
                            navigate(`/admin/contracts/${activity.contract}`)
                          }
                        >
                          {activity.contract}
                        </Button>
                      </TableCell>
                      <TableCell>{activity.user}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{activity.timestamp}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
