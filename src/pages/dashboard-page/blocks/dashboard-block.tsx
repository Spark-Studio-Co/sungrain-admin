//@ts-nocheck

"use client";

import {
  Package,
  FileText,
  ArrowRight,
  AlertCircle,
  TruckIcon,
  BarChart3,
  TrendingUp,
  Map,
  Calendar,
  DollarSign,
  Building,
  Train,
  Truck,
  Warehouse,
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
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Scatter,
  ScatterChart,
  ZAxis,
  ComposedChart,
  Treemap,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DashboardBlock = () => {
  const navigate = useNavigate();

  const {
    data: contractsData,
    isLoading,
    isError,
    error,
  } = useGetContracts({
    page: 1,
    limit: 5000,
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

      // Calculate wagon efficiency
      const totalWagons = contract.wagons?.length || 0;
      const avgVolumePerWagon =
        totalWagons > 0
          ? Math.round((shippedVolume / totalWagons) * 100) / 100
          : 0;

      // Extract date information for time-based analysis
      const contractDate = contract.date
        ? new Date(contract.date)
        : new Date(contract.created_at);
      const month = contractDate.getMonth();
      const year = contractDate.getFullYear();
      const quarter = Math.floor(month / 3) + 1;
      const monthName = contractDate.toLocaleString("ru-RU", { month: "long" });

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
        date: contractDate.toLocaleDateString("ru-RU"),
        company: contract.company?.name || "Не указано",
        applicationCount: contract.applications?.length || 0,
        wagonCount: totalWagons,
        hasDocuments: (contract.files?.length || 0) > 0,
        departureStation: contract.departure_station || "Не указано",
        destinationStation: contract.destination_station || "Не указано",
        avgVolumePerWagon: avgVolumePerWagon,
        month: month,
        monthName: monthName,
        year: year,
        quarter: quarter,
        yearMonth: `${year}-${month + 1}`,
        yearQuarter: `${year} Q${quarter}`,
        wagons: contract.wagons || [],
        applications: contract.applications || [],
        timeToComplete:
          contract.wagons?.length > 0
            ? Math.round(
                (new Date(
                  contract.wagons[
                    contract.wagons.length - 1
                  ].wagon.date_of_unloading
                ) -
                  contractDate) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
      };
    });
  }, [contractsData]);

  // Basic stats
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
  const uniqueCrops = [
    ...new Set(recentContracts.map((contract) => contract.crop)),
  ].filter((crop) => crop !== "Не указано").length;

  // Advanced stats
  const totalWagons = recentContracts.reduce(
    (sum, contract) => sum + contract.wagonCount,
    0
  );
  const avgVolumePerWagon =
    totalWagons > 0
      ? Math.round((totalShippedVolume / totalWagons) * 100) / 100
      : 0;

  // Time-based analysis
  const volumeByMonth = useMemo(() => {
    const monthData = recentContracts.reduce((acc, contract) => {
      const key = contract.yearMonth;
      if (!acc[key]) {
        acc[key] = {
          name: `${contract.monthName} ${contract.year}`,
          totalVolume: 0,
          shippedVolume: 0,
          contractCount: 0,
          yearMonth: contract.yearMonth,
          timestamp: new Date(contract.year, contract.month, 1).getTime(),
        };
      }
      acc[key].totalVolume += contract.volume;
      acc[key].shippedVolume += contract.shippedVolume;
      acc[key].contractCount += 1;
      return acc;
    }, {});

    return Object.values(monthData).sort((a, b) => a.timestamp - b.timestamp);
  }, [recentContracts]);

  // Geographical analysis
  const routeAnalysis = useMemo(() => {
    const routes = recentContracts.reduce((acc, contract) => {
      const route = `${contract.departureStation} → ${contract.destinationStation}`;
      if (!acc[route]) {
        acc[route] = {
          route,
          departureStation: contract.departureStation,
          destinationStation: contract.destinationStation,
          totalVolume: 0,
          shippedVolume: 0,
          contractCount: 0,
        };
      }
      acc[route].totalVolume += contract.volume;
      acc[route].shippedVolume += contract.shippedVolume;
      acc[route].contractCount += 1;
      return acc;
    }, {});

    return Object.values(routes).sort((a, b) => b.totalVolume - a.totalVolume);
  }, [recentContracts]);

  // Crop analysis
  const cropAnalysis = useMemo(() => {
    const crops = recentContracts.reduce((acc, contract) => {
      const crop = contract.crop;
      if (crop === "Не указано") return acc;

      if (!acc[crop]) {
        acc[crop] = {
          crop,
          totalVolume: 0,
          shippedVolume: 0,
          contractCount: 0,
          avgPrice: {
            USD: { total: 0, count: 0 },
            KZT: { total: 0, count: 0 },
          },
        };
      }
      acc[crop].totalVolume += contract.volume;
      acc[crop].shippedVolume += contract.shippedVolume;
      acc[crop].contractCount += 1;

      if (contract.avgPricePerTon > 0) {
        acc[crop].avgPrice[contract.currency].total += contract.avgPricePerTon;
        acc[crop].avgPrice[contract.currency].count += 1;
      }

      return acc;
    }, {});

    // Calculate average prices
    Object.values(crops).forEach((crop) => {
      crop.avgPriceUSD =
        crop.avgPrice.USD.count > 0
          ? Math.round(crop.avgPrice.USD.total / crop.avgPrice.USD.count)
          : 0;
      crop.avgPriceKZT =
        crop.avgPrice.KZT.count > 0
          ? Math.round(crop.avgPrice.KZT.total / crop.avgPrice.KZT.count)
          : 0;
    });

    return Object.values(crops).sort((a, b) => b.totalVolume - a.totalVolume);
  }, [recentContracts]);

  // Company performance
  const companyPerformance = useMemo(() => {
    const companies = recentContracts.reduce((acc, contract) => {
      const company = contract.company;
      if (company === "Не указано") return acc;

      if (!acc[company]) {
        acc[company] = {
          company,
          totalVolume: 0,
          shippedVolume: 0,
          contractCount: 0,
          totalValue: { USD: 0, KZT: 0 },
        };
      }
      acc[company].totalVolume += contract.volume;
      acc[company].shippedVolume += contract.shippedVolume;
      acc[company].contractCount += 1;
      acc[company].totalValue[contract.currency] += contract.estimatedCost;

      return acc;
    }, {});

    return Object.values(companies)
      .map((company) => ({
        ...company,
        fulfillmentRate:
          company.totalVolume > 0
            ? Math.round((company.shippedVolume / company.totalVolume) * 100)
            : 0,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume);
  }, [recentContracts]);

  // Transportation efficiency
  const transportationEfficiency = useMemo(() => {
    // Group by wagon owner
    const wagonOwners = recentContracts
      .flatMap((contract) =>
        contract.wagons.map((wagon) => ({
          owner: wagon.wagon.owner || "Не указано",
          capacity: Number(wagon.wagon.capacity) || 0,
          realWeight: Number(wagon.wagon.real_weight) || 0,
          contract: contract.number,
          crop: contract.crop,
        }))
      )
      .reduce((acc, wagon) => {
        if (!acc[wagon.owner]) {
          acc[wagon.owner] = {
            owner: wagon.owner,
            wagonCount: 0,
            totalCapacity: 0,
            totalRealWeight: 0,
            crops: new Set(),
          };
        }
        acc[wagon.owner].wagonCount += 1;
        acc[wagon.owner].totalCapacity += wagon.capacity;
        acc[wagon.owner].totalRealWeight += wagon.realWeight;
        acc[wagon.owner].crops.add(wagon.crop);
        return acc;
      }, {});

    return Object.values(wagonOwners)
      .map((owner) => ({
        ...owner,
        utilizationRate:
          owner.totalCapacity > 0
            ? Math.round(
                (owner.totalRealWeight / owner.totalCapacity) * 10000
              ) / 100
            : 0,
        avgCapacity:
          owner.wagonCount > 0
            ? Math.round((owner.totalCapacity / owner.wagonCount) * 100) / 100
            : 0,
        cropCount: owner.crops.size,
        crops: Array.from(owner.crops),
      }))
      .sort((a, b) => b.wagonCount - a.wagonCount);
  }, [recentContracts]);

  // Delivery time analysis
  const deliveryTimeAnalysis = useMemo(() => {
    const contractsWithDelivery = recentContracts.filter(
      (c) => c.timeToComplete > 0
    );

    const byRoute = contractsWithDelivery.reduce((acc, contract) => {
      const route = `${contract.departureStation} → ${contract.destinationStation}`;
      if (!acc[route]) {
        acc[route] = {
          route,
          contracts: [],
          totalDays: 0,
        };
      }
      acc[route].contracts.push(contract);
      acc[route].totalDays += contract.timeToComplete;
      return acc;
    }, {});

    return Object.values(byRoute)
      .map((route) => ({
        ...route,
        avgDeliveryDays:
          route.contracts.length > 0
            ? Math.round((route.totalDays / route.contracts.length) * 10) / 10
            : 0,
        contractCount: route.contracts.length,
      }))
      .sort((a, b) => a.avgDeliveryDays - b.avgDeliveryDays);
  }, [recentContracts]);

  // Price trend analysis
  const priceTrendAnalysis = useMemo(() => {
    const pricesByMonthUSD = {};
    const pricesByMonthKZT = {};

    recentContracts.forEach((contract) => {
      if (contract.avgPricePerTon <= 0) return;

      const key = contract.yearMonth;
      if (contract.currency === "USD") {
        if (!pricesByMonthUSD[key]) {
          pricesByMonthUSD[key] = {
            name: `${contract.monthName} ${contract.year}`,
            totalPrice: 0,
            count: 0,
            timestamp: new Date(contract.year, contract.month, 1).getTime(),
          };
        }
        pricesByMonthUSD[key].totalPrice += contract.avgPricePerTon;
        pricesByMonthUSD[key].count += 1;
      } else if (contract.currency === "KZT") {
        if (!pricesByMonthKZT[key]) {
          pricesByMonthKZT[key] = {
            name: `${contract.monthName} ${contract.year}`,
            totalPrice: 0,
            count: 0,
            timestamp: new Date(contract.year, contract.month, 1).getTime(),
          };
        }
        pricesByMonthKZT[key].totalPrice += contract.avgPricePerTon;
        pricesByMonthKZT[key].count += 1;
      }
    });

    const usdTrend = Object.values(pricesByMonthUSD)
      .map((month) => ({
        ...month,
        avgPrice:
          month.count > 0 ? Math.round(month.totalPrice / month.count) : 0,
        currency: "USD",
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    const kztTrend = Object.values(pricesByMonthKZT)
      .map((month) => ({
        ...month,
        avgPrice:
          month.count > 0 ? Math.round(month.totalPrice / month.count) : 0,
        currency: "KZT",
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return { usdTrend, kztTrend };
  }, [recentContracts]);

  // Seasonal analysis
  const seasonalAnalysis = useMemo(() => {
    const quarterData = recentContracts.reduce((acc, contract) => {
      const key = contract.yearQuarter;
      if (!acc[key]) {
        acc[key] = {
          name: key,
          totalVolume: 0,
          shippedVolume: 0,
          contractCount: 0,
          year: contract.year,
          quarter: contract.quarter,
        };
      }
      acc[key].totalVolume += contract.volume;
      acc[key].shippedVolume += contract.shippedVolume;
      acc[key].contractCount += 1;
      return acc;
    }, {});

    return Object.values(quarterData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter - b.quarter;
    });
  }, [recentContracts]);

  // Correlation analysis (volume vs price)
  const volumePriceCorrelation = useMemo(() => {
    return recentContracts
      .filter((c) => c.avgPricePerTon > 0 && c.volume > 0)
      .map((c) => ({
        name: c.number,
        volume: c.volume,
        price: c.avgPricePerTon,
        currency: c.currency,
      }));
  }, [recentContracts]);

  // COLORS
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ];
  const getColor = (index) => COLORS[index % COLORS.length];

  const CustomizedContent = (props) => {
    const {
      root,
      depth,
      x,
      y,
      width,
      height,
      index,
      payload,
      colors,
      rank,
      name,
      fullName,
      value,
    } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: depth < 2 ? getColor(index) : "none",
            stroke: "#fff",
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {depth === 1 && width > 50 && height > 25 ? (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={width > 100 ? 14 : 10}
          >
            {name}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Панель управления
          </h1>
          <p className="text-muted-foreground">
            Расширенная аналитика контрактов и отгрузок
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/contracts">
            Все контракты
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Key Performance Indicators */}
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
                <div className="text-xs text-muted-foreground mt-1 space-y-1">
                  {Object.entries(
                    recentContracts.reduce((acc, contract) => {
                      if (!acc[contract.currency]) {
                        acc[contract.currency] = 0;
                      }
                      acc[contract.currency] += Number(contract.estimatedCost);
                      return acc;
                    }, {})
                  ).map(([currency, value]) => (
                    <div key={currency}>
                      {Number(value).toLocaleString()} {currency}
                    </div>
                  ))}
                </div>
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
                <div className="space-y-2">
                  {/* Group contracts by currency and calculate average price for each currency */}
                  {Object.entries(
                    recentContracts.reduce((acc, contract) => {
                      if (
                        contract.shippedVolume > 0 &&
                        contract.avgPricePerTon > 0
                      ) {
                        if (!acc[contract.currency]) {
                          acc[contract.currency] = {
                            totalValue: 0,
                            totalVolume: 0,
                          };
                        }
                        acc[contract.currency].totalValue +=
                          contract.totalValue;
                        acc[contract.currency].totalVolume +=
                          contract.shippedVolume;
                      }
                      return acc;
                    }, {})
                  ).map(([currency, data]) => (
                    <div key={currency} className="flex flex-col">
                      <div className="text-lg font-bold">
                        {Math.round(
                          data.totalValue / data.totalVolume
                        ).toLocaleString()}{" "}
                        {currency}/т
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {data.totalValue.toLocaleString()} {currency} /{" "}
                        {data.totalVolume.toLocaleString()} т
                      </p>
                    </div>
                  ))}
                  {Object.keys(
                    recentContracts.reduce((acc, contract) => {
                      if (
                        contract.shippedVolume > 0 &&
                        contract.avgPricePerTon > 0
                      ) {
                        acc[contract.currency] = true;
                      }
                      return acc;
                    }, {})
                  ).length === 0 && (
                    <div className="text-lg font-bold">Нет данных</div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Эффективность транспорта
            </CardTitle>
            <Train className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalWagons} вагонов</div>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Средний объем на вагон:</span>
                    <span className="font-medium">
                      {avgVolumePerWagon.toLocaleString()} т
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Коэффициент использования:</span>
                    <span className="font-medium">
                      {transportationEfficiency.length > 0
                        ? Math.round(
                            transportationEfficiency.reduce(
                              (sum, owner) => sum + owner.utilizationRate,
                              0
                            ) / transportationEfficiency.length
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Время доставки
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {deliveryTimeAnalysis.length > 0
                    ? Math.round(
                        deliveryTimeAnalysis.reduce(
                          (sum, route) =>
                            sum + route.avgDeliveryDays * route.contractCount,
                          0
                        ) /
                          deliveryTimeAnalysis.reduce(
                            (sum, route) => sum + route.contractCount,
                            0
                          )
                      )
                    : 0}{" "}
                  дней
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Самый быстрый маршрут:</span>
                    <span className="font-medium">
                      {deliveryTimeAnalysis.length > 0
                        ? `${deliveryTimeAnalysis[0].avgDeliveryDays} дней`
                        : "Н/Д"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Самый долгий маршрут:</span>
                    <span className="font-medium">
                      {deliveryTimeAnalysis.length > 0
                        ? `${
                            deliveryTimeAnalysis[
                              deliveryTimeAnalysis.length - 1
                            ].avgDeliveryDays
                          } дней`
                        : "Н/Д"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сезонность</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {seasonalAnalysis.length > 0
                    ? seasonalAnalysis.reduce(
                        (max, quarter) =>
                          quarter.totalVolume > max.totalVolume ? quarter : max,
                        seasonalAnalysis[0]
                      ).name
                    : "Нет данных"}
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex justify-between text-xs">
                    <span>Пиковый квартал:</span>
                    <span className="font-medium">
                      {seasonalAnalysis.length > 0
                        ? `${seasonalAnalysis
                            .reduce(
                              (max, quarter) =>
                                quarter.totalVolume > max.totalVolume
                                  ? quarter
                                  : max,
                              seasonalAnalysis[0]
                            )
                            .totalVolume.toLocaleString()} т`
                        : "Н/Д"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Сезонная вариация:</span>
                    <span className="font-medium">
                      {seasonalAnalysis.length > 1
                        ? `${
                            Math.round(
                              (seasonalAnalysis.reduce(
                                (max, quarter) =>
                                  quarter.totalVolume > max
                                    ? quarter.totalVolume
                                    : max,
                                0
                              ) /
                                seasonalAnalysis.reduce(
                                  (min, quarter) =>
                                    quarter.totalVolume < min &&
                                    quarter.totalVolume > 0
                                      ? quarter.totalVolume
                                      : min,
                                  Number.POSITIVE_INFINITY
                                )) *
                                100
                            ) / 100
                          }x`
                        : "Н/Д"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-7 w-full">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="time">
            <Calendar className="h-4 w-4 mr-2" />
            Временной анализ
          </TabsTrigger>
          <TabsTrigger value="geo">
            <Map className="h-4 w-4 mr-2" />
            География
          </TabsTrigger>
          <TabsTrigger value="crops">
            <Warehouse className="h-4 w-4 mr-2" />
            Культуры
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building className="h-4 w-4 mr-2" />
            Компании
          </TabsTrigger>
          <TabsTrigger value="transport">
            <Truck className="h-4 w-4 mr-2" />
            Транспорт
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Финансы
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                      <TableHead>Выполнение</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
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
                    ) : recentContracts.length > 0 ? (
                      recentContracts.slice(0, 5).map((contract: any) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">
                            {contract.number}
                          </TableCell>
                          <TableCell>{contract.crop}</TableCell>
                          <TableCell>
                            {contract.volume.toLocaleString()}
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
                        <TableCell colSpan={5} className="text-center py-4">
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

            <Card>
              <CardHeader>
                <CardTitle>Распределение объемов по культурам</CardTitle>
                <CardDescription>
                  Соотношение объемов по типам культур
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : cropAnalysis.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={cropAnalysis}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalVolume"
                        nameKey="crop"
                        label={({ name, percent }) =>
                          `${
                            percent > 0.05
                              ? `${(percent * 100).toFixed(0)}%`
                              : ""
                          }`
                        }
                      >
                        {cropAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "Объем",
                        ]}
                        labelFormatter={(name) => `Культура: ${name}`}
                      />
                      <Legend
                        formatter={(value, entry) => {
                          const { payload } = entry;
                          return `${payload.crop}: ${Number(
                            payload.totalVolume
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
                <CardTitle>Динамика объемов по месяцам</CardTitle>
                <CardDescription>
                  Изменение объемов контрактов во времени
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : volumeByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={volumeByMonth}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "",
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="totalVolume"
                        name="Общий объем"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="shippedVolume"
                        name="Отгруженный объем"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
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
                <CardTitle>Топ маршрутов</CardTitle>
                <CardDescription>
                  Наиболее активные маршруты по объему
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : routeAnalysis.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={routeAnalysis.slice(0, 5)}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <YAxis dataKey="route" type="category" width={150} />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalVolume"
                        name="Общий объем"
                        fill="#8884d8"
                      />
                      <Bar
                        dataKey="shippedVolume"
                        name="Отгруженный объем"
                        fill="#82ca9d"
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
              <CardTitle>Динамика цен</CardTitle>
              <CardDescription>
                Изменение средних цен по месяцам
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : priceTrendAnalysis.usdTrend.length > 0 ||
                priceTrendAnalysis.kztTrend.length > 0 ? (
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="90%">
                    <ComposedChart
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        type="category"
                        allowDuplicatedCategory={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        yAxisId="usd"
                        orientation="left"
                        tickFormatter={(value) => `$${value}`}
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        yAxisId="kzt"
                        orientation="right"
                        tickFormatter={(value) => `${value.toLocaleString()} ₸`}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value, name, props) => {
                          const currency =
                            props.dataKey === "avgPrice" &&
                            props.payload.currency === "USD"
                              ? "$"
                              : "₸";
                          return [
                            `${currency}${Number(value).toLocaleString()}`,
                            "Средняя цена",
                          ];
                        }}
                      />
                      <Legend />
                      {priceTrendAnalysis.usdTrend.length > 0 && (
                        <Line
                          data={priceTrendAnalysis.usdTrend}
                          type="monotone"
                          dataKey="avgPrice"
                          name="USD"
                          stroke="#8884d8"
                          yAxisId="usd"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {priceTrendAnalysis.kztTrend.length > 0 && (
                        <Line
                          data={priceTrendAnalysis.kztTrend}
                          type="monotone"
                          dataKey="avgPrice"
                          name="KZT"
                          stroke="#82ca9d"
                          yAxisId="kzt"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  Нет данных для отображения
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Analysis Tab */}
        <TabsContent value="time" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Объемы по месяцам</CardTitle>
                <CardDescription>
                  Динамика объемов контрактов по месяцам
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : volumeByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={volumeByMonth}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalVolume"
                        name="Общий объем"
                        fill="#8884d8"
                      />
                      <Bar
                        dataKey="shippedVolume"
                        name="Отгруженный объем"
                        fill="#82ca9d"
                      />
                      <Bar
                        dataKey="contractCount"
                        name="Количество контрактов"
                        fill="#ffc658"
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
                <CardTitle>Сезонный анализ</CardTitle>
                <CardDescription>
                  Объемы контрактов по кварталам
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : seasonalAnalysis.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={seasonalAnalysis}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "",
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="totalVolume"
                        name="Общий объем"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="shippedVolume"
                        name="Отгруженный объем"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
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
                <CardTitle>Динамика цен</CardTitle>
                <CardDescription>
                  Изменение средних цен по месяцам
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : priceTrendAnalysis.usdTrend.length > 0 ||
                  priceTrendAnalysis.kztTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        type="category"
                        allowDuplicatedCategory={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        yAxisId="usd"
                        orientation="left"
                        tickFormatter={(value) => `$${value}`}
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        yAxisId="kzt"
                        orientation="right"
                        tickFormatter={(value) => `${value.toLocaleString()} ₸`}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value, name, props) => {
                          const currency =
                            props.dataKey === "avgPrice" &&
                            props.payload.currency === "USD"
                              ? "$"
                              : "₸";
                          return [
                            `${currency}${Number(value).toLocaleString()}`,
                            "Средняя цена",
                          ];
                        }}
                      />
                      <Legend />
                      {priceTrendAnalysis.usdTrend.length > 0 && (
                        <Line
                          data={priceTrendAnalysis.usdTrend}
                          type="monotone"
                          dataKey="avgPrice"
                          name="USD"
                          stroke="#8884d8"
                          yAxisId="usd"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {priceTrendAnalysis.kztTrend.length > 0 && (
                        <Line
                          data={priceTrendAnalysis.kztTrend}
                          type="monotone"
                          dataKey="avgPrice"
                          name="KZT"
                          stroke="#82ca9d"
                          yAxisId="kzt"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Geographical Analysis Tab */}
        <TabsContent value="geo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Станции отправления</CardTitle>
                <CardDescription>
                  Распределение объемов по станциям отправления
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : recentContracts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          recentContracts.reduce((acc, contract) => {
                            const station = contract.departureStation;
                            if (!acc[station]) {
                              acc[station] = {
                                name: station,
                                value: 0,
                              };
                            }
                            acc[station].value += contract.volume;
                            return acc;
                          }, {})
                        ).map(([_, data]) => data)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {Object.entries(
                          recentContracts.reduce((acc, contract) => {
                            const station = contract.departureStation;
                            if (!acc[station]) {
                              acc[station] = {
                                name: station,
                                value: 0,
                              };
                            }
                            acc[station].value += contract.volume;
                            return acc;
                          }, {})
                        ).map(([_, data], index) => (
                          <Cell key={`cell-${index}`} fill={getColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "Объем",
                        ]}
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

          <div className="w-full flex">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Станции назначения</CardTitle>
                <CardDescription>
                  Распределение объемов по станциям назначения
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : recentContracts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(
                          recentContracts.reduce((acc, contract) => {
                            const station = contract.destinationStation;
                            if (!acc[station]) {
                              acc[station] = {
                                name: station,
                                value: 0,
                              };
                            }
                            acc[station].value += contract.volume;
                            return acc;
                          }, {})
                        ).map(([_, data]) => data)}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {Object.entries(
                          recentContracts.reduce((acc, contract) => {
                            const station = contract.destinationStation;
                            if (!acc[station]) {
                              acc[station] = {
                                name: station,
                                value: 0,
                              };
                            }
                            acc[station].value += contract.volume;
                            return acc;
                          }, {})
                        ).map(([_, data], index) => (
                          <Cell key={`cell-${index}`} fill={getColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "Объем",
                        ]}
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
        </TabsContent>
        {/* Crops Analysis Tab */}
        <TabsContent value="crops" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Распределение по культурам</CardTitle>
                <CardDescription>
                  Объемы контрактов по типам культур
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : cropAnalysis.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cropAnalysis}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="crop"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalVolume"
                        name="Общий объем"
                        fill="#8884d8"
                      />
                      <Bar
                        dataKey="shippedVolume"
                        name="Отгруженный объем"
                        fill="#82ca9d"
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
                <CardTitle>Средние цены по культурам</CardTitle>
                <CardDescription>
                  Средняя цена за тонну по типам культур
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : cropAnalysis.length > 0 ? (
                  <div className="h-full">
                    <div className="flex justify-end mb-2">
                      <Select defaultValue="USD">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Выберите валюту" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="KZT">KZT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={cropAnalysis.filter(
                          (crop) => crop.avgPriceUSD > 0
                        )}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="crop"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value).toLocaleString()}`,
                            "Средняя цена",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="avgPriceUSD"
                          name="Средняя цена (USD)"
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Топ компаний по объему</CardTitle>
                <CardDescription>
                  Компании с наибольшим объемом контрактов
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : companyPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={companyPerformance.slice(0, 10)}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: 30,
                        left: 150,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <YAxis dataKey="company" type="category" width={150} />
                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString()} т`,
                          "",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalVolume"
                        name="Общий объем"
                        fill="#8884d8"
                      />
                      <Bar
                        dataKey="shippedVolume"
                        name="Отгруженный объем"
                        fill="#82ca9d"
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
                <CardTitle>Выполнение контрактов по компаниям</CardTitle>
                <CardDescription>
                  Процент выполнения контрактов по компаниям
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : companyPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={companyPerformance.slice(0, 10)}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: 30,
                        left: 150,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis dataKey="company" type="category" width={150} />
                      <Tooltip
                        formatter={(value) => [
                          `${value}%`,
                          "Процент выполнения",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="fulfillmentRate"
                        name="Процент выполнения"
                        fill="#8884d8"
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

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Количество контрактов по компаниям</CardTitle>
                <CardDescription>
                  Распределение количества контрактов по компаниям
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : companyPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={companyPerformance}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="contractCount"
                        nameKey="company"
                        label={({ name, percent }) =>
                          `${
                            percent > 0.05
                              ? `${(percent * 100).toFixed(0)}%`
                              : ""
                          }`
                        }
                      >
                        {companyPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value} контрактов`,
                          "Количество",
                        ]}
                      />
                      <Legend
                        formatter={(value, entry) => {
                          const { payload } = entry;
                          return `${payload.company}: ${payload.contractCount} контрактов`;
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

            <Card>
              <CardHeader>
                <CardTitle>Финансовые показатели компаний</CardTitle>
                <CardDescription>
                  Общая стоимость контрактов по компаниям
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : companyPerformance.length > 0 ? (
                  <div className="h-full">
                    <div className="flex justify-end mb-2">
                      <Select defaultValue="USD">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Выберите валюту" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="KZT">KZT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart
                        data={companyPerformance
                          .filter((company) => company.totalValue.USD > 0)
                          .sort((a, b) => b.totalValue.USD - a.totalValue.USD)
                          .slice(0, 10)}
                        layout="vertical"
                        margin={{
                          top: 20,
                          right: 30,
                          left: 180, // Increased left margin to prevent text overlap
                          bottom: 20,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          tickFormatter={(value) => value.toLocaleString()}
                        />
                        <YAxis
                          dataKey="company"
                          type="category"
                          width={170}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) =>
                            value.length > 20
                              ? `${value.substring(0, 18)}...`
                              : value
                          }
                        />
                        <Tooltip
                          formatter={(value) => [
                            `$${Number(value).toLocaleString()}`,
                            "Общая стоимость",
                          ]}
                        />
                        <Legend />
                        <Bar
                          dataKey="totalValue.USD"
                          name="Общая стоимость (USD)"
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transport Tab */}
        <TabsContent value="transport" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Количество вагонов по перевозчикам</CardTitle>
                <CardDescription>
                  Распределение количества вагонов по перевозчикам
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : transportationEfficiency.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={transportationEfficiency}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="wagonCount"
                        nameKey="owner"
                        label={({ name, percent }) =>
                          `${
                            percent > 0.05
                              ? `${(percent * 100).toFixed(0)}%`
                              : ""
                          }`
                        }
                      >
                        {transportationEfficiency.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [
                          `${value} вагонов`,
                          "Количество",
                        ]}
                      />
                      <Legend
                        formatter={(value, entry) => {
                          const { payload } = entry;
                          return `${payload.owner}: ${payload.wagonCount} вагонов`;
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
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="w-full flex">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Динамика цен</CardTitle>
                <CardDescription>
                  Изменение средних цен по месяцам
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96 w-full">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : priceTrendAnalysis.usdTrend.length > 0 ||
                  priceTrendAnalysis.kztTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        type="category"
                        allowDuplicatedCategory={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        yAxisId="usd"
                        orientation="left"
                        tickFormatter={(value) => `$${value}`}
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        yAxisId="kzt"
                        orientation="right"
                        tickFormatter={(value) => `${value.toLocaleString()} ₸`}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value, name, props) => {
                          const currency =
                            props.dataKey === "avgPrice" &&
                            props.payload.currency === "USD"
                              ? "$"
                              : "₸";
                          return [
                            `${currency}${Number(value).toLocaleString()}`,
                            "Средняя цена",
                          ];
                        }}
                      />
                      <Legend />
                      {priceTrendAnalysis.usdTrend.length > 0 && (
                        <Line
                          data={priceTrendAnalysis.usdTrend}
                          type="monotone"
                          dataKey="avgPrice"
                          name="USD"
                          stroke="#8884d8"
                          yAxisId="usd"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {priceTrendAnalysis.kztTrend.length > 0 && (
                        <Line
                          data={priceTrendAnalysis.kztTrend}
                          type="monotone"
                          dataKey="avgPrice"
                          name="KZT"
                          stroke="#82ca9d"
                          yAxisId="kzt"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transport Tab */}
      </Tabs>
    </div>
  );
};
