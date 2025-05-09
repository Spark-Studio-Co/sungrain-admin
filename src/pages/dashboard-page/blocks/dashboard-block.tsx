//@ts-nocheck

"use client";

import {
  Package,
  FileText,
  ArrowRight,
  AlertCircle,
  TruckIcon,
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
import {
  Coins as DollarSign,
  Percent,
  Building,
  ShieldCheck,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

    return contractsData.data.map((contract: any) => {
      // Calculate shipped volume from applications
      const shippedVolume =
        contract.applications?.reduce(
          (sum: number, app: any) => sum + (Number(app.volume) || 0),
          0
        ) || 0;

      // Calculate fulfillment percentage
      const fulfillmentPercentage = contract.total_volume
        ? Math.round((shippedVolume / contract.total_volume) * 100)
        : 0;

      // Calculate average price per ton from applications
      const totalValue =
        contract.applications?.reduce(
          (sum: number, app: any) =>
            sum + (Number(app.price_per_ton) * Number(app.volume) || 0),
          0
        ) || 0;

      const avgPricePerTon =
        shippedVolume > 0
          ? Math.round(totalValue / shippedVolume)
          : contract.estimated_cost && contract.total_volume
          ? Math.round(contract.estimated_cost / contract.total_volume)
          : 0;

      return {
        id: contract.id,
        number: contract.number || "Без номера",
        crop: contract.crop || "Не указано",
        sender: contract.sender || "Не указано",
        receiver: contract.receiver || "Не указано",
        volume: contract.total_volume || 0,
        shippedVolume: shippedVolume,
        fulfillmentPercentage: fulfillmentPercentage,
        estimatedCost: contract.estimated_cost || 0,
        totalValue: totalValue,
        avgPricePerTon: avgPricePerTon,
        currency: contract.currency || "USD",
        date: contract.date
          ? new Date(contract.date).toLocaleDateString("ru-RU")
          : new Date(contract.created_at).toLocaleDateString("ru-RU"),
        company: contract.company?.name || "Не указано",
        applicationCount: contract.applications?.length || 0,
        wagonCount: contract.wagons?.length || 0,
        hasDocuments: (contract.files?.length || 0) > 0,
      };
    });
  }, [contractsData]);

  const totalContracts = contractsData?.total || recentContracts.length;

  const totalVolume = recentContracts.reduce(
    (sum: number, contract: any) => sum + Number(contract.volume),
    0
  );

  const totalShippedVolume = recentContracts.reduce(
    (sum, contract) => sum + Number(contract.shippedVolume),
    0
  );

  const averageFulfillment =
    recentContracts.length > 0
      ? Math.round(
          recentContracts.reduce(
            (sum, contract) => sum + contract.fulfillmentPercentage,
            0
          ) / recentContracts.length
        )
      : 0;

  const totalEstimatedValue = recentContracts.reduce(
    (sum, contract) => sum + Number(contract.estimatedCost),
    0
  );

  const totalActualValue = recentContracts.reduce(
    (sum, contract) => sum + Number(contract.totalValue),
    0
  );

  const uniqueCrops = [
    ...new Set(recentContracts.map((contract) => contract.crop)),
  ].filter((crop) => crop !== "Не указано").length;

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
                <p className="text-xs text-muted-foreground mt-1">
                  {uniqueCrops}{" "}
                  {uniqueCrops === 1
                    ? "культура"
                    : uniqueCrops >= 2 && uniqueCrops <= 4
                    ? "культуры"
                    : "культур"}
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
                <p className="text-xs text-muted-foreground mt-1">
                  {totalEstimatedValue.toLocaleString()}{" "}
                  {recentContracts[0]?.currency || "USD"} общая стоимость
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Отгруженный объем
            </CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {totalShippedVolume.toLocaleString()} т
                </div>
                <div className="flex items-center mt-2">
                  <Progress value={averageFulfillment} className="h-2" />
                  <span className="text-xs ml-2">{averageFulfillment}%</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средняя цена</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {recentContracts.length > 0 && totalShippedVolume > 0
                    ? Math.round(
                        totalActualValue / totalShippedVolume
                      ).toLocaleString()
                    : "—"}{" "}
                  {recentContracts[0]?.currency || "USD"}/т
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalActualValue > 0
                    ? `${totalActualValue.toLocaleString()} ${
                        recentContracts[0]?.currency || "USD"
                      } фактически`
                    : "Нет данных о стоимости"}
                </p>
              </>
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
                    <TableHead>Отгружено (т)</TableHead>
                    <TableHead>Выполнение</TableHead>
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
                        <TableCell>
                          {contract.shippedVolume.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={contract.fulfillmentPercentage}
                              className="h-2 w-16"
                            />
                            <span className="text-xs">
                              {contract.fulfillmentPercentage}%
                            </span>
                          </div>
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
      {/* Additional Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Выполнение контрактов
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-3">
                {recentContracts.slice(0, 3).map((contract) => (
                  <div key={contract.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate max-w-[180px]">
                        {contract.number}
                      </span>
                      <span>{contract.fulfillmentPercentage}%</span>
                    </div>
                    <Progress
                      value={contract.fulfillmentPercentage}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Компании</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-3">
                {[...new Set(recentContracts.map((c) => c.company))]
                  .filter((company) => company !== "Не указано")
                  .slice(0, 3)
                  .map((company, index) => {
                    const companyVolume = recentContracts
                      .filter((c) => c.company === company)
                      .reduce((sum, c) => sum + c.volume, 0);

                    const percentage = Math.round(
                      (companyVolume / totalVolume) * 100
                    );

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="truncate max-w-[180px]">
                            {company}
                          </span>
                          <span>{companyVolume.toLocaleString()} т</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Культуры</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-3">
                {Object.entries(
                  recentContracts.reduce(
                    (acc: Record<string, number>, contract) => {
                      if (contract.crop !== "Не указано") {
                        acc[contract.crop] =
                          (acc[contract.crop] || 0) + contract.volume;
                      }
                      return acc;
                    },
                    {}
                  )
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([crop, volume], index) => {
                    const percentage = Math.round((volume / totalVolume) * 100);

                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="truncate max-w-[180px]">{crop}</span>
                          <span>{Number(volume).toLocaleString()} т</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
              </div>
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
              Общий и отгруженный объем по контрактам
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
                  <YAxis
                    name="Объем (т)"
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      if (
                        name === "Общий объем" ||
                        name === "Отгруженный объем"
                      ) {
                        return [`${Number(value).toLocaleString()} т`, name];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Контракт: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ position: "relative", marginTop: "20px" }}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#3b82f6"
                    name="Общий объем"
                    label={{
                      position: "top",
                      formatter: (value) => `${Number(value).toLocaleString()}`,
                      style: { fontSize: "12px" },
                      fill: "#3b82f6",
                    }}
                  />
                  <Bar
                    dataKey="shippedVolume"
                    fill="#10b981"
                    name="Отгруженный объем"
                    label={{
                      position: "top",
                      formatter: (value) =>
                        value > 0 ? `${Number(value).toLocaleString()}` : "",
                      style: { fontSize: "12px" },
                      fill: "#10b981",
                    }}
                  />
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
            <CardTitle>Распределение отгруженного объема</CardTitle>
            <CardDescription>
              Процентное соотношение отгруженных объемов
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
                    data={recentContracts.filter((c) => c.shippedVolume > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="shippedVolume"
                    nameKey="number"
                    label={({ name, percent }) =>
                      `${
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                      }`
                    }
                  >
                    {recentContracts
                      .filter((c) => c.shippedVolume > 0)
                      .map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${160 + index * 40}, 70%, 50%)`}
                        />
                      ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} т`,
                      "Отгруженный объем",
                    ]}
                    labelFormatter={(name, entry) => {
                      const item = entry[0]?.payload;
                      return `${item?.number} (${item?.company})`;
                    }}
                  />
                  <Legend
                    formatter={(value, entry) => {
                      const { payload } = entry;
                      return `${payload.number}: ${Number(
                        payload.shippedVolume
                      ).toLocaleString()} т`;
                    }}
                  />
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
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Процент выполнения контрактов</CardTitle>
            <CardDescription>
              Соотношение отгруженного объема к общему объему
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
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Выполнение"]}
                    labelFormatter={(label) => `Контракт: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ position: "relative", marginTop: "20px" }}
                  />
                  <Bar
                    dataKey="fulfillmentPercentage"
                    fill="#8b5cf6"
                    name="Выполнение"
                    label={{
                      position: "top",
                      formatter: (value) => (value > 0 ? `${value}%` : ""),
                      style: { fontSize: "12px" },
                    }}
                  />
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
            <CardTitle>Средняя цена за тонну</CardTitle>
            <CardDescription>
              Средняя цена за тонну по контрактам
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : recentContracts.filter((c) => c.avgPricePerTon > 0).length >
              0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recentContracts.filter((c) => c.avgPricePerTon > 0)}
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
                  <YAxis tickFormatter={(value) => value.toLocaleString()} />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toLocaleString()} ${
                        recentContracts[0]?.currency || "USD"
                      }`,
                      "Цена за тонну",
                    ]}
                    labelFormatter={(label) => `Контракт: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{ position: "relative", marginTop: "20px" }}
                  />
                  <Bar
                    dataKey="avgPricePerTon"
                    fill="#f59e0b"
                    name="Цена за тонну"
                    label={{
                      position: "top",
                      formatter: (value) => `${Number(value).toLocaleString()}`,
                      style: { fontSize: "12px" },
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Сравнение объемов</CardTitle>
          <CardDescription>
            Сравнение общего и отгруженного объема по контрактам
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
                <YAxis tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip
                  formatter={(value, name) => {
                    if (
                      name === "Общий объем" ||
                      name === "Отгруженный объем"
                    ) {
                      return [`${Number(value).toLocaleString()} т`, name];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Контракт: ${label}`}
                />
                <Legend
                  wrapperStyle={{ position: "relative", marginTop: "20px" }}
                />
                <Bar dataKey="volume" fill="#3b82f6" name="Общий объем" />
                <Bar
                  dataKey="shippedVolume"
                  fill="#10b981"
                  name="Отгруженный объем"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              Нет данных для отображения
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
