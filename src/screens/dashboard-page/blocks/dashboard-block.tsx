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
  Leaf,
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
  getContractOpsMeta,
  getContractStationNames,
} from "@/shared/contracts/contract-ops";
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
const COLORS = [
  "#f38810",
  "#2f6b4f",
  "#517b8f",
  "#d3a537",
  "#7a8f60",
  "#9f5b46",
  "#1f4a3d",
  "#b76f1b",
  "#6f7f8f",
  "#4d7c5d",
];

const getColor = (index) => COLORS[index % COLORS.length];

const chartTooltipWrapperStyle = {
  zIndex: 6,
  pointerEvents: "none",
};

const chartTooltipContentStyle = {
  backgroundColor: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  boxShadow: "0 12px 30px rgba(34, 49, 55, 0.12)",
  fontSize: "13px",
};

const donutTooltipProps = {
  allowEscapeViewBox: { x: true, y: true },
  contentStyle: chartTooltipContentStyle,
  position: { x: 8, y: 8 },
  wrapperStyle: chartTooltipWrapperStyle,
};

const toDashboardNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const formatCompactCurrencyValue = (value, maximumFractionDigits = 1) =>
  new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits > 0 && value < 10 ? 1 : 0,
  }).format(value);

const getApplicationContractValue = (application) => {
  const explicitTotal = toDashboardNumber(
    application?.total_amount || application?.totalAmount
  );

  if (explicitTotal > 0) return explicitTotal;

  return (
    toDashboardNumber(application?.price_per_ton || application?.pricePerTon) *
    toDashboardNumber(application?.volume)
  );
};

const formatCompactCurrency = (value) => {
  const normalizedValue = Math.max(0, toDashboardNumber(value));

  if (normalizedValue >= 1_000_000_000) {
    return `${formatCompactCurrencyValue(
      normalizedValue / 1_000_000_000,
      normalizedValue >= 10_000_000_000 ? 0 : 1
    )} млрд`;
  }

  if (normalizedValue >= 1_000_000) {
    return `${formatCompactCurrencyValue(
      normalizedValue / 1_000_000,
      normalizedValue >= 10_000_000 ? 0 : 1
    )} млн`;
  }

  if (normalizedValue >= 1_000) {
    return `${Math.round(normalizedValue / 1_000).toLocaleString("ru-RU")} тыс`;
  }

  return Math.round(normalizedValue).toLocaleString("ru-RU");
};

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
      const opsMeta = getContractOpsMeta(contract);
      const shippedVolume = opsMeta.shippedVolume;

      // Calculate fulfillment percentage
      const fulfillmentPercentage = opsMeta.progress;

      // Calculate average price per ton from applications
      const computedContractValue =
        contract.applications?.reduce(
          (sum: number, app: any) => sum + getApplicationContractValue(app),
          0
        ) || 0;
      const fallbackEstimatedCost = toDashboardNumber(contract.estimated_cost);
      const totalValue =
        computedContractValue > 0 ? computedContractValue : fallbackEstimatedCost;

      const avgPricePerTon =
        shippedVolume > 0
          ? Math.round(totalValue / shippedVolume)
          : contract.estimated_cost && contract.total_volume
          ? Math.round(contract.estimated_cost / contract.total_volume)
          : 0;

      // Calculate wagon efficiency
      const totalWagons = opsMeta.wagonsCount;
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
        estimatedCost: computedContractValue > 0 ? computedContractValue : fallbackEstimatedCost,
        totalValue: totalValue,
        avgPricePerTon: avgPricePerTon,
        currency: contract.currency || "USD",
        date: contractDate.toLocaleDateString("ru-RU"),
        company: contract.company?.name || "Не указано",
        applicationCount: contract.applications?.length || 0,
        wagonCount: totalWagons,
        hasDocuments: (contract.files?.length || 0) > 0,
        departureStation:
          getContractStationNames(contract, "departure").join(" · ") ||
          "Не указано",
        destinationStation:
          getContractStationNames(contract, "destination").join(" · ") ||
          "Не указано",
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
          displayName: new Date(contract.year, contract.month, 1)
            .toLocaleString("ru-RU", { month: "short" })
            .replace(".", ""),
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

  const volumeTrendSummary = useMemo(() => {
    const total = volumeByMonth.reduce(
      (sum, month) => sum + Number(month.totalVolume),
      0
    );
    const shipped = volumeByMonth.reduce(
      (sum, month) => sum + Number(month.shippedVolume),
      0
    );
    const peakMonth =
      volumeByMonth.length > 0
        ? volumeByMonth.reduce((max, month) =>
            month.totalVolume > max.totalVolume ? month : max
          )
        : null;

    return {
      total,
      shipped,
      fulfillment: total > 0 ? Math.round((shipped / total) * 100) : 0,
      peakLabel: peakMonth?.displayName ?? "—",
    };
  }, [volumeByMonth]);

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

  const topRouteRows = useMemo(() => {
    const routes = routeAnalysis.slice(0, 5);
    const maxVolume =
      routes.reduce((max, route) => Math.max(max, route.totalVolume), 0) || 1;

    return routes.map((route, index) => ({
      ...route,
      rank: index + 1,
      totalShare: Math.max(8, Math.round((route.totalVolume / maxVolume) * 100)),
      shippedShare:
        route.shippedVolume > 0
          ? Math.max(6, Math.round((route.shippedVolume / maxVolume) * 100))
          : 0,
      fulfillmentRate:
        route.totalVolume > 0
          ? Math.round((route.shippedVolume / route.totalVolume) * 100)
          : 0,
    }));
  }, [routeAnalysis]);

  const departureStationRows = useMemo(() => {
    const stations = recentContracts.reduce((acc, contract) => {
      const station = contract.departureStation;
      if (!acc[station]) {
        acc[station] = {
          station,
          totalVolume: 0,
          shippedVolume: 0,
          contractCount: 0,
        };
      }
      acc[station].totalVolume += contract.volume;
      acc[station].shippedVolume += contract.shippedVolume;
      acc[station].contractCount += 1;
      return acc;
    }, {});

    const rows = Object.values(stations).sort(
      (a, b) => b.totalVolume - a.totalVolume
    );
    const total = rows.reduce((sum, station) => sum + station.totalVolume, 0);
    const maxVolume =
      rows.reduce((max, station) => Math.max(max, station.totalVolume), 0) || 1;

    return rows.map((station, index) => ({
      ...station,
      name: station.station,
      value: station.totalVolume,
      color: getColor(index),
      rank: index + 1,
      share: total > 0 ? Math.round((station.totalVolume / total) * 100) : 0,
      barShare: Math.max(8, Math.round((station.totalVolume / maxVolume) * 100)),
    }));
  }, [recentContracts]);

  const destinationStationRows = useMemo(() => {
    const stations = recentContracts.reduce((acc, contract) => {
      const station = contract.destinationStation;
      if (!acc[station]) {
        acc[station] = {
          station,
          totalVolume: 0,
          shippedVolume: 0,
          contractCount: 0,
        };
      }
      acc[station].totalVolume += contract.volume;
      acc[station].shippedVolume += contract.shippedVolume;
      acc[station].contractCount += 1;
      return acc;
    }, {});

    const rows = Object.values(stations).sort(
      (a, b) => b.totalVolume - a.totalVolume
    );
    const total = rows.reduce((sum, station) => sum + station.totalVolume, 0);
    const maxVolume =
      rows.reduce((max, station) => Math.max(max, station.totalVolume), 0) || 1;

    return rows.map((station, index) => ({
      ...station,
      name: station.station,
      value: station.totalVolume,
      color: getColor(index),
      rank: index + 1,
      share: total > 0 ? Math.round((station.totalVolume / total) * 100) : 0,
      barShare: Math.max(8, Math.round((station.totalVolume / maxVolume) * 100)),
    }));
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

  const cropDistributionRows = useMemo(() => {
    const total = cropAnalysis.reduce(
      (sum, crop) => sum + Number(crop.totalVolume),
      0
    );
    const maxVolume =
      cropAnalysis.reduce(
        (max, crop) => Math.max(max, Number(crop.totalVolume)),
        0
      ) || 1;

    return cropAnalysis.slice(0, 6).map((crop, index) => ({
      ...crop,
      color: getColor(index),
      share: total > 0 ? Math.round((crop.totalVolume / total) * 100) : 0,
      barShare: Math.max(
        8,
        Math.round((Number(crop.totalVolume) / maxVolume) * 100)
      ),
      fulfillmentRate:
        crop.totalVolume > 0
          ? Math.round((crop.shippedVolume / crop.totalVolume) * 100)
          : 0,
    }));
  }, [cropAnalysis]);

  const cropDistributionTotal = cropDistributionRows.reduce(
    (sum, crop) => sum + Number(crop.totalVolume),
    0
  );

  const cropPriceCards = useMemo(() => {
    return [
      {
        currency: "USD",
        symbol: "$",
        color: "#f38810",
        rows: cropAnalysis
          .filter((crop) => crop.avgPriceUSD > 0)
          .sort((a, b) => b.avgPriceUSD - a.avgPriceUSD)
          .map((crop) => ({
            crop: crop.crop,
            price: crop.avgPriceUSD,
            volume: crop.totalVolume,
          })),
      },
      {
        currency: "KZT",
        symbol: "₸",
        color: "#2f6b4f",
        rows: cropAnalysis
          .filter((crop) => crop.avgPriceKZT > 0)
          .sort((a, b) => b.avgPriceKZT - a.avgPriceKZT)
          .map((crop) => ({
            crop: crop.crop,
            price: crop.avgPriceKZT,
            volume: crop.totalVolume,
          })),
      },
    ].map((card) => {
      const maxPrice =
        card.rows.reduce((max, crop) => Math.max(max, crop.price), 0) || 1;

      return {
        ...card,
        rows: card.rows.map((crop, index) => ({
          ...crop,
          rank: index + 1,
          barShare: Math.max(8, Math.round((crop.price / maxPrice) * 100)),
        })),
      };
    });
  }, [cropAnalysis]);

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
      acc[company].totalValue[contract.currency] += contract.totalValue;

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

  const companyRows = useMemo(() => {
    const maxVolume =
      companyPerformance.reduce(
        (max, company) => Math.max(max, Number(company.totalVolume)),
        0
      ) || 1;

    return companyPerformance.map((company, index) => ({
      ...company,
      color: getColor(index),
      rank: index + 1,
      totalShare: Math.max(
        8,
        Math.round((Number(company.totalVolume) / maxVolume) * 100)
      ),
      shippedShare:
        Number(company.shippedVolume) > 0
          ? Math.max(
              6,
              Math.round((Number(company.shippedVolume) / maxVolume) * 100)
            )
          : 0,
    }));
  }, [companyPerformance]);

  const companyFulfillmentRows = useMemo(
    () =>
      [...companyRows]
        .sort((a, b) => b.fulfillmentRate - a.fulfillmentRate)
        .map((company, index) => ({
          ...company,
          color: getColor(index),
          rank: index + 1,
        })),
    [companyRows]
  );

  const companyContractRows = useMemo(() => {
    const totalContracts = companyRows.reduce(
      (sum, company) => sum + Number(company.contractCount),
      0
    );
    const maxContracts =
      companyRows.reduce(
        (max, company) => Math.max(max, Number(company.contractCount)),
        0
      ) || 1;

    return [...companyRows]
      .sort((a, b) => b.contractCount - a.contractCount)
      .map((company, index) => ({
        ...company,
        color: getColor(index),
        rank: index + 1,
        value: company.contractCount,
        share:
          totalContracts > 0
            ? Math.round((company.contractCount / totalContracts) * 100)
            : 0,
        barShare: Math.max(
          8,
          Math.round((company.contractCount / maxContracts) * 100)
        ),
      }));
  }, [companyRows]);

  const companyFinanceCards = useMemo(() => {
    return [
      {
        currency: "USD",
        symbol: "$",
        color: "#f38810",
        softColor: "#fff3e5",
        rows: companyPerformance
          .filter((company) => company.totalValue.USD > 0)
          .sort((a, b) => b.totalValue.USD - a.totalValue.USD)
          .map((company) => ({
            company: company.company,
            value: company.totalValue.USD,
            volume: company.totalVolume,
          })),
      },
      {
        currency: "KZT",
        symbol: "₸",
        color: "#2f6b4f",
        softColor: "#eaf2ec",
        rows: companyPerformance
          .filter((company) => company.totalValue.KZT > 0)
          .sort((a, b) => b.totalValue.KZT - a.totalValue.KZT)
          .map((company) => ({
            company: company.company,
            value: company.totalValue.KZT,
            volume: company.totalVolume,
          })),
      },
    ].map((card) => {
      const maxValue =
        card.rows.reduce((max, company) => Math.max(max, company.value), 0) ||
        1;

      return {
        ...card,
        total: card.rows.reduce((sum, company) => sum + company.value, 0),
        rows: card.rows.map((company, index) => ({
          ...company,
          rank: index + 1,
          barShare: Math.max(8, Math.round((company.value / maxValue) * 100)),
        })),
      };
    });
  }, [companyPerformance]);

  const companySummary = useMemo(() => {
    const totalVolume = companyRows.reduce(
      (sum, company) => sum + Number(company.totalVolume),
      0
    );
    const totalContracts = companyRows.reduce(
      (sum, company) => sum + Number(company.contractCount),
      0
    );
    const avgFulfillment =
      companyRows.length > 0
        ? Math.round(
            companyRows.reduce(
              (sum, company) => sum + Number(company.fulfillmentRate),
              0
            ) / companyRows.length
          )
        : 0;

    return {
      totalVolume,
      totalContracts,
      avgFulfillment,
      topVolumeCompany: companyRows[0],
      topFulfillmentCompany: companyFulfillmentRows[0],
    };
  }, [companyRows, companyFulfillmentRows]);

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

  const transportRows = useMemo(() => {
    const totalWagons = transportationEfficiency.reduce(
      (sum, carrier) => sum + Number(carrier.wagonCount),
      0
    );
    const maxWagons =
      transportationEfficiency.reduce(
        (max, carrier) => Math.max(max, Number(carrier.wagonCount)),
        0
      ) || 1;
    const maxCapacity =
      transportationEfficiency.reduce(
        (max, carrier) => Math.max(max, Number(carrier.totalCapacity)),
        0
      ) || 1;

    return transportationEfficiency.map((carrier, index) => ({
      ...carrier,
      rank: index + 1,
      color: getColor(index),
      value: carrier.wagonCount,
      share:
        totalWagons > 0
          ? Math.round((Number(carrier.wagonCount) / totalWagons) * 100)
          : 0,
      wagonShare: Math.max(
        8,
        Math.round((Number(carrier.wagonCount) / maxWagons) * 100)
      ),
      capacityShare: Math.max(
        8,
        Math.round((Number(carrier.totalCapacity) / maxCapacity) * 100)
      ),
    }));
  }, [transportationEfficiency]);

  const transportSummary = useMemo(() => {
    const totalWagons = transportRows.reduce(
      (sum, carrier) => sum + Number(carrier.wagonCount),
      0
    );
    const totalCapacity = transportRows.reduce(
      (sum, carrier) => sum + Number(carrier.totalCapacity),
      0
    );
    const totalRealWeight = transportRows.reduce(
      (sum, carrier) => sum + Number(carrier.totalRealWeight),
      0
    );
    const utilizationRate =
      totalCapacity > 0
        ? Math.round((totalRealWeight / totalCapacity) * 100)
        : 0;
    const cropCount = new Set(transportRows.flatMap((carrier) => carrier.crops))
      .size;

    return {
      totalWagons,
      totalCapacity,
      totalRealWeight,
      utilizationRate,
      cropCount,
      topCarrier: transportRows[0],
    };
  }, [transportRows]);

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
            displayName: new Date(contract.year, contract.month, 1)
              .toLocaleString("ru-RU", { month: "short" })
              .replace(".", ""),
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
            displayName: new Date(contract.year, contract.month, 1)
              .toLocaleString("ru-RU", { month: "short" })
              .replace(".", ""),
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

  const priceTrendCards = useMemo(() => {
    const makeCard = (currency, data, color, softColor, prefix = "") => {
      const first = data[0]?.avgPrice ?? 0;
      const latest = data[data.length - 1]?.avgPrice ?? 0;
      const delta = first > 0 ? Math.round(((latest - first) / first) * 100) : 0;

      return {
        currency,
        data,
        color,
        softColor,
        prefix,
        latest,
        delta,
        hasData: data.length > 0,
      };
    };

    return [
      makeCard("USD", priceTrendAnalysis.usdTrend, "#f38810", "#fff4e5", "$"),
      makeCard("KZT", priceTrendAnalysis.kztTrend, "#2f6b4f", "#eef5ef", "₸"),
    ];
  }, [priceTrendAnalysis]);

  const kpiValueByCurrency = useMemo(() => {
    return Object.entries(
      recentContracts.reduce((acc, contract) => {
        if (!acc[contract.currency]) {
          acc[contract.currency] = 0;
        }
        acc[contract.currency] += Number(contract.totalValue);
        return acc;
      }, {})
    );
  }, [recentContracts]);

  const kpiAveragePriceByCurrency = useMemo(() => {
    return Object.entries(
      recentContracts.reduce((acc, contract) => {
        if (contract.shippedVolume > 0 && contract.avgPricePerTon > 0) {
          if (!acc[contract.currency]) {
            acc[contract.currency] = {
              totalValue: 0,
              totalVolume: 0,
            };
          }
          acc[contract.currency].totalValue += contract.totalValue;
          acc[contract.currency].totalVolume += contract.shippedVolume;
        }
        return acc;
      }, {})
    );
  }, [recentContracts]);

  const transportationUtilization =
    transportationEfficiency.length > 0
      ? Math.round(
          transportationEfficiency.reduce(
            (sum, owner) => sum + owner.utilizationRate,
            0
          ) / transportationEfficiency.length
        )
      : 0;

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

  const mobileTabTriggerClass =
    "flex flex-col items-center justify-center gap-1 h-16 px-2 rounded-lg transition-colors duration-200 font-medium text-xs";
  const desktopTabTriggerClass =
    "flex flex-row items-center justify-center gap-2 h-12 rounded-xl transition-colors duration-200 font-medium text-sm";

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
    <div className="sungrain-dashboard relative min-h-screen w-full min-w-0 max-w-none space-y-5 overflow-x-hidden px-3 py-5 sm:px-5 sm:py-6 lg:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7f8f5_42%,#ffffff_100%)] -z-20"></div>
      <div className="sungrain-dashboard-heading flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center rounded-md border border-[#d7e2d8] bg-[#eef5ef] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-normal text-[#2f6b4f]">
            Операционный обзор
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-semibold tracking-tight text-[#223137]">
            Панель управления
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Контракты, отгрузки и финансовая динамика в одном рабочем обзоре
          </p>
        </div>
        <Button
          asChild
          className="w-full rounded-md bg-[#f38810] px-5 text-white shadow-[0_10px_22px_rgba(243,136,16,0.22)] hover:bg-[#dc790c] sm:w-auto"
        >
          <Link
            to="/admin/contracts"
            className="flex items-center justify-center"
          >
            <span className="sm:hidden">Контракты</span>
            <span className="hidden sm:inline">Все контракты</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="sungrain-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Всего контрактов</CardTitle>
            <span className="sungrain-kpi-icon">
              <FileText className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-2">
                <div className="sungrain-kpi-value">{totalContracts}</div>
                <p className="sungrain-kpi-muted">
                  {uniqueCrops}{" "}
                  {uniqueCrops === 1
                    ? "культура"
                    : uniqueCrops >= 2 && uniqueCrops <= 4
                    ? "культуры"
                    : "культур"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="sungrain-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Общий объем</CardTitle>
            <span className="sungrain-kpi-icon">
              <Package className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-2">
                <div className="sungrain-kpi-value">
                  {totalVolume.toLocaleString()} т
                </div>
                <div className="grid gap-1">
                  {kpiValueByCurrency.map(([currency, value]) => (
                    <div
                      key={currency}
                      className="sungrain-kpi-line"
                    >
                      <span>{currency}</span>
                      <strong>{Number(value).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="sungrain-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Отгруженный объем</CardTitle>
            <span className="sungrain-kpi-icon">
              <TruckIcon className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-3">
                <div className="sungrain-kpi-value">
                  {totalShippedVolume.toLocaleString()} т
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#6f7f76]">
                    <span>Выполнение</span>
                    <strong className="text-[#223137]">
                      {averageFulfillment}%
                    </strong>
                  </div>
                  <Progress value={averageFulfillment} className="h-1.5" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="sungrain-kpi-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Средняя цена</CardTitle>
            <span className="sungrain-kpi-icon">
              <DollarSign className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {kpiAveragePriceByCurrency.map(([currency, data]) => (
                  <div key={currency} className="sungrain-price-row">
                    <div>
                      <div className="text-[0.72rem] font-semibold uppercase text-[#7b857f]">
                        {currency}
                      </div>
                      <div className="text-lg font-bold leading-6 text-[#223137]">
                        {Math.round(
                          data.totalValue / data.totalVolume
                        ).toLocaleString()}{" "}
                        /т
                      </div>
                    </div>
                    <span>{data.totalVolume.toLocaleString()} т</span>
                  </div>
                ))}
                {kpiAveragePriceByCurrency.length === 0 && (
                  <div className="sungrain-kpi-value text-lg">Нет данных</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Advanced KPIs */}
        <Card className="sungrain-kpi-card sungrain-kpi-card-wide">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Эффективность транспорта</CardTitle>
            <span className="sungrain-kpi-icon">
              <Train className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-3">
                <div className="sungrain-kpi-value">
                  {totalWagons} вагонов
                </div>
                <div className="grid gap-1.5">
                  <div className="sungrain-kpi-line">
                    <span>Средний объем на вагон:</span>
                    <strong>
                      {avgVolumePerWagon.toLocaleString()} т
                    </strong>
                  </div>
                  <div className="sungrain-kpi-line">
                    <span>Коэффициент использования:</span>
                    <strong>{transportationUtilization}%</strong>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="sungrain-dashboard-tabs space-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl -z-10"></div>

          {/* Mobile: Compact grid layout with 2 columns */}
          <div className="sm:hidden">
            <TabsList className="sungrain-tabs-list grid grid-cols-2 gap-2 w-full h-auto p-2 bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-xl shadow-lg">
              <TabsTrigger
                value="overview"
                className={mobileTabTriggerClass}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Обзор</span>
              </TabsTrigger>
              <TabsTrigger
                value="time"
                className={mobileTabTriggerClass}
              >
                <Calendar className="h-5 w-5" />
                <span>Время</span>
              </TabsTrigger>
              <TabsTrigger
                value="geo"
                className={mobileTabTriggerClass}
              >
                <Map className="h-5 w-5" />
                <span>География</span>
              </TabsTrigger>
              <TabsTrigger
                value="crops"
                className={mobileTabTriggerClass}
              >
                <Warehouse className="h-5 w-5" />
                <span>Культуры</span>
              </TabsTrigger>
              <TabsTrigger
                value="companies"
                className={mobileTabTriggerClass}
              >
                <Building className="h-5 w-5" />
                <span>Компании</span>
              </TabsTrigger>
              <TabsTrigger
                value="transport"
                className={mobileTabTriggerClass}
              >
                <Truck className="h-5 w-5" />
                <span>Транспорт</span>
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                className={mobileTabTriggerClass}
              >
                <DollarSign className="h-5 w-5" />
                <span>Финансы</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Desktop: Grid layout */}
          <TabsList className="sungrain-tabs-list hidden sm:grid grid-cols-4 md:grid-cols-5 lg:grid-cols-7 w-full h-16 p-2 bg-white/80 backdrop-blur-sm border-2 border-slate-200/60 rounded-2xl shadow-lg">
            <TabsTrigger
              value="overview"
              className={desktopTabTriggerClass}
            >
              <BarChart3 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Обзор</span>
            </TabsTrigger>
            <TabsTrigger
              value="time"
              className={desktopTabTriggerClass}
            >
              <Calendar className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Время</span>
            </TabsTrigger>
            <TabsTrigger
              value="geo"
              className={desktopTabTriggerClass}
            >
              <Map className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>География</span>
            </TabsTrigger>
            <TabsTrigger
              value="crops"
              className={desktopTabTriggerClass}
            >
              <Warehouse className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Культуры</span>
            </TabsTrigger>
            <TabsTrigger
              value="companies"
              className={desktopTabTriggerClass}
            >
              <Building className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Компании</span>
            </TabsTrigger>
            <TabsTrigger
              value="transport"
              className={desktopTabTriggerClass}
            >
              <Truck className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Транспорт</span>
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className={desktopTabTriggerClass}
            >
              <DollarSign className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              <span>Финансы</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 relative">
          <div className="absolute inset-0 rounded-3xl -z-10"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-4">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#f38810]" />
                  Последние контракты
                </CardTitle>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">
                          № Контракта
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm hidden sm:table-cell">
                          Культура
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm">
                          Объем (т)
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">
                          Выполнение
                        </TableHead>
                        <TableHead className="text-xs sm:text-sm text-right hidden lg:table-cell">
                          Действия
                        </TableHead>
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
                            <TableCell className="font-medium text-xs sm:text-sm">
                              <div className="flex flex-col">
                                <span>{contract.number}</span>
                                <span className="sm:hidden text-xs text-muted-foreground">
                                  {contract.crop}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                              {contract.crop}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              <div className="flex flex-col">
                                <span>{contract.volume.toLocaleString()}</span>
                                <div className="sm:hidden flex items-center gap-1 mt-1">
                                  <Progress
                                    value={contract.fulfillmentPercentage}
                                    className="h-1 w-12"
                                  />
                                  <span className="text-xs">
                                    {contract.fulfillmentPercentage}%
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
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
                            <TableCell className="text-right hidden lg:table-cell">
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
                </div>
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

            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-4">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-[#2f6b4f]" />
                  <span className="hidden sm:inline">
                    Распределение объемов по культурам
                  </span>
                  <span className="sm:hidden">Объемы по культурам</span>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Соотношение объемов по типам культур
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 p-4 pt-0 sm:p-6 sm:pt-0">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : cropDistributionRows.length > 0 ? (
                  <div className="grid h-full gap-4 sm:grid-cols-[minmax(150px,0.85fr)_minmax(0,1.15fr)] sm:items-center">
                    <div className="relative mx-auto h-36 w-36 sm:h-52 sm:w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={cropDistributionRows}
                            cx="50%"
                            cy="50%"
                            innerRadius={window.innerWidth < 640 ? 46 : 62}
                            outerRadius={window.innerWidth < 640 ? 68 : 88}
                            paddingAngle={2}
                            cornerRadius={5}
                            dataKey="totalVolume"
                            nameKey="crop"
                            stroke="#ffffff"
                            strokeWidth={2}
                          >
                            {cropDistributionRows.map((entry) => (
                              <Cell key={entry.crop} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-semibold leading-5 text-[#223137]">
                            {cropDistributionTotal.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-medium uppercase leading-4 text-[#7b857f]">
                            тонн
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-h-0 space-y-2 overflow-hidden">
                      {cropDistributionRows.map((crop) => (
                        <div key={crop.crop} className="space-y-1">
                          <div className="grid grid-cols-[minmax(0,1fr)_3rem_4.75rem] items-center gap-2 text-xs">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="size-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: crop.color }}
                              />
                              <span className="truncate font-semibold text-[#223137]">
                                {crop.crop}
                              </span>
                            </div>
                            <span className="text-right font-semibold text-[#2f6b4f]">
                              {crop.share}%
                            </span>
                            <span className="text-right text-[#6f7f76]">
                              {Number(crop.totalVolume).toLocaleString()} т
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-[#eef2ed]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(crop.share, 4)}%`,
                                backgroundColor: crop.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-4">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#f38810]" />
                  Динамика объемов по месяцам
                </CardTitle>
                <CardDescription>
                  Изменение объемов контрактов во времени
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72 p-4 pt-0 sm:h-80 sm:p-6 sm:pt-0">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : volumeByMonth.length > 0 ? (
                  <div className="flex h-full flex-col gap-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Общий",
                          value: `${volumeTrendSummary.total.toLocaleString()} т`,
                          color: "#f38810",
                        },
                        {
                          label: "Отгружен",
                          value: `${volumeTrendSummary.shipped.toLocaleString()} т`,
                          color: "#2f6b4f",
                        },
                        {
                          label: "Выполнение",
                          value: `${volumeTrendSummary.fulfillment}%`,
                          color: "#517b8f",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-md border border-[#edf1ec] bg-[#fbfcfa] px-3 py-2"
                        >
                          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase text-[#7b857f]">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                          </div>
                          <div className="truncate text-sm font-semibold text-[#223137]">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={volumeByMonth}
                          margin={{
                            top: 8,
                            right: 8,
                            left: window.innerWidth < 640 ? -18 : -8,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="totalVolumeGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#f38810"
                                stopOpacity={0.34}
                              />
                              <stop
                                offset="95%"
                                stopColor="#f38810"
                                stopOpacity={0.04}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            stroke="#e7ece7"
                            strokeDasharray="4 6"
                          />
                          <XAxis
                            dataKey="displayName"
                            axisLine={false}
                            tickLine={false}
                            height={28}
                            tick={{
                              fontSize: window.innerWidth < 640 ? 10 : 12,
                              fill: "#6f7f76",
                              fontWeight: 600,
                            }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) =>
                              value > 1000
                                ? `${(value / 1000).toFixed(0)}k`
                                : value.toString()
                            }
                            tick={{
                              fontSize: window.innerWidth < 640 ? 10 : 12,
                              fill: "#7b857f",
                            }}
                            width={window.innerWidth < 640 ? 32 : 42}
                          />
                          <Tooltip
                            wrapperStyle={chartTooltipWrapperStyle}
                            cursor={{
                              stroke: "#dbe5da",
                              strokeWidth: 1,
                              strokeDasharray: "4 4",
                            }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow:
                                "0 12px 30px rgba(34, 49, 55, 0.12)",
                              fontSize:
                                window.innerWidth < 640 ? "12px" : "13px",
                            }}
                            formatter={(value, name) => [
                              `${Number(value).toLocaleString()} т`,
                              name === "totalVolume" || name === "Общий объем"
                                ? "Общий объем"
                                : name === "shippedVolume" ||
                                  name === "Отгруженный объем"
                                ? "Отгруженный объем"
                                : "Отгруженный объем",
                            ]}
                            labelFormatter={(label) => `Месяц: ${label}`}
                          />
                          <Area
                            type="monotone"
                            dataKey="totalVolume"
                            name="Общий объем"
                            stroke="#f38810"
                            strokeWidth={3}
                            fill="url(#totalVolumeGradient)"
                            dot={{
                              fill: "#ffffff",
                              stroke: "#f38810",
                              strokeWidth: 2,
                              r: 4,
                            }}
                            activeDot={{
                              r: 6,
                              fill: "#f38810",
                              stroke: "#ffffff",
                              strokeWidth: 2,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="shippedVolume"
                            name="Отгруженный объем"
                            stroke="#2f6b4f"
                            strokeWidth={3}
                            dot={{
                              fill: "#ffffff",
                              stroke: "#2f6b4f",
                              strokeWidth: 2,
                              r: 4,
                            }}
                            activeDot={{
                              r: 6,
                              fill: "#2f6b4f",
                              stroke: "#ffffff",
                              strokeWidth: 2,
                            }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-4">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <Map className="h-5 w-5 text-[#517b8f]" />
                  Топ маршрутов
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Наиболее активные маршруты по объему
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64 overflow-hidden p-4 pt-0 sm:h-80 sm:p-6 sm:pt-0">
                {isLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : topRouteRows.length > 0 ? (
                  <div className="flex h-full flex-col">
                    <div className="mb-2.5 flex items-center justify-between gap-3 text-[11px] font-medium text-[#7b857f]">
                      <span>Рейтинг по объему</span>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-[#f38810]" />
                          общий
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-[#2f6b4f]" />
                          отгружен
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      {topRouteRows.map((route) => (
                        <div
                          key={route.route}
                          className="border-b border-[#edf1ec] pb-2 last:border-b-0 last:pb-0"
                        >
                          <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_5.75rem] items-start gap-3">
                            <div className="flex min-w-0 items-start gap-2">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[11px] font-semibold text-[#2f6b4f]">
                                {String(route.rank).padStart(2, "0")}
                              </span>
                              <div className="min-w-0">
                                <div
                                  className="truncate text-[13px] font-semibold leading-4 text-[#223137] sm:text-sm sm:leading-5"
                                  title={route.route}
                                >
                                  {route.route}
                                </div>
                                <div className="text-[10px] leading-4 text-[#7b857f] sm:text-[11px]">
                                  Выполнение {route.fulfillmentRate}%
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-[13px] font-semibold leading-4 text-[#223137] sm:text-sm sm:leading-5">
                                {route.totalVolume.toLocaleString()} т
                              </div>
                              <div className="text-[10px] leading-4 text-[#6f7f76] sm:text-[11px]">
                                {route.shippedVolume.toLocaleString()} т
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="h-2 overflow-hidden rounded-full bg-[#f38810]/15">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#f38810] to-[#d6730c]"
                                style={{ width: `${route.totalShare}%` }}
                              />
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-[#2f6b4f]/14">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#2f6b4f] to-[#4d7c5d]"
                                style={{ width: `${route.shippedShare}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="sungrain-analytics-card">
            <CardHeader className="pb-4">
              <CardTitle className="sungrain-card-title flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#f38810]" />
                <span className="hidden sm:inline">Динамика цен</span>
                <span className="sm:hidden">Цены</span>
              </CardTitle>
              <CardDescription className="text-slate-600">
                <span className="hidden sm:inline">
                  Изменение средних цен по месяцам
                </span>
                <span className="sm:hidden">Средние цены по месяцам</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {isLoading ? (
                <div className="flex h-64 w-full items-center justify-center sm:h-80">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : priceTrendAnalysis.usdTrend.length > 0 ||
                priceTrendAnalysis.kztTrend.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {priceTrendCards.map((card) => (
                    <div
                      key={card.currency}
                      className="rounded-lg border border-[#edf1ec] bg-[#fbfcfa] p-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase text-[#7b857f]">
                            <span
                              className="size-2 rounded-full"
                              style={{ backgroundColor: card.color }}
                            />
                            {card.currency}
                          </div>
                          <div className="text-xl font-semibold leading-6 text-[#223137]">
                            {card.hasData
                              ? `${card.prefix}${card.latest.toLocaleString()}`
                              : "Нет данных"}
                          </div>
                        </div>
                        {card.hasData && (
                          <div
                            className="rounded-md px-2 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: card.softColor,
                              color: card.color,
                            }}
                          >
                            {card.delta >= 0 ? "+" : ""}
                            {card.delta}%
                          </div>
                        )}
                      </div>

                      <div className="h-36">
                        {card.hasData ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={card.data}
                              margin={{ top: 10, right: 8, left: 6, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient
                                  id={`priceGradient${card.currency}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={card.color}
                                    stopOpacity={0.28}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={card.color}
                                    stopOpacity={0.04}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                vertical={false}
                                stroke="#e7ece7"
                                strokeDasharray="4 6"
                              />
                              <XAxis
                                dataKey="displayName"
                                axisLine={false}
                                tickLine={false}
                                height={24}
                                tick={{
                                  fontSize: 11,
                                  fill: "#6f7f76",
                                  fontWeight: 600,
                                }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tickCount={4}
                                domain={["auto", "auto"]}
                                tickFormatter={(value) =>
                                  value > 1000
                                    ? `${Math.round(Number(value) / 1000)}k`
                                    : Number(value).toLocaleString()
                                }
                                tick={{ fontSize: 11, fill: "#7b857f" }}
                                width={48}
                              />
                              <Tooltip
                                wrapperStyle={chartTooltipWrapperStyle}
                                cursor={{
                                  stroke: "#dbe5da",
                                  strokeWidth: 1,
                                  strokeDasharray: "4 4",
                                }}
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #e2e8f0",
                                  borderRadius: "8px",
                                  boxShadow:
                                    "0 12px 30px rgba(34, 49, 55, 0.12)",
                                  fontSize: "13px",
                                }}
                                formatter={(value) => [
                                  `${card.prefix}${Number(value).toLocaleString()}`,
                                  `Средняя цена ${card.currency}`,
                                ]}
                                labelFormatter={(label) => `Месяц: ${label}`}
                              />
                              <Area
                                type="monotone"
                                dataKey="avgPrice"
                                stroke={card.color}
                                strokeWidth={3}
                                fill={`url(#priceGradient${card.currency})`}
                                dot={{
                                  fill: "#ffffff",
                                  stroke: card.color,
                                  strokeWidth: 2,
                                  r: 4,
                                }}
                                activeDot={{
                                  r: 6,
                                  fill: card.color,
                                  stroke: "#ffffff",
                                  strokeWidth: 2,
                                }}
                              />
                            </ComposedChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Нет данных
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                  Нет данных для отображения
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Analysis Tab */}
        <TabsContent value="time" className="space-y-6 relative">
          <div className="grid gap-4">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#f38810]" />
                  Объемы по месяцам
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Динамика контрактов и отгрузок по периодам
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                {isLoading ? (
                  <div className="h-[22rem] w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : volumeByMonth.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="sungrain-chart-chip">
                        <span>Общий объем</span>
                        <strong>{volumeTrendSummary.total.toLocaleString()} т</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Отгружено</span>
                        <strong>
                          {volumeTrendSummary.shipped.toLocaleString()} т
                        </strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Пик</span>
                        <strong>{volumeTrendSummary.peakLabel}</strong>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#6f7f76]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-[#f38810]" />
                        Общий объем
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-[#2f6b4f]" />
                        Отгруженный объем
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-0.5 w-4 rounded-full bg-[#223137]" />
                        Контракты
                      </span>
                    </div>

                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={volumeByMonth}
                          barGap={6}
                          barCategoryGap="28%"
                          margin={{
                            top: 12,
                            right: 12,
                            left: window.innerWidth < 640 ? -18 : -8,
                            bottom: 4,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="timeTotalVolumeGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#f38810"
                                stopOpacity={0.94}
                              />
                              <stop
                                offset="95%"
                                stopColor="#f38810"
                                stopOpacity={0.58}
                              />
                            </linearGradient>
                            <linearGradient
                              id="timeShippedVolumeGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2f6b4f"
                                stopOpacity={0.92}
                              />
                              <stop
                                offset="95%"
                                stopColor="#4d7c5d"
                                stopOpacity={0.58}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            vertical={false}
                            stroke="#e7ece7"
                            strokeDasharray="4 6"
                          />
                          <XAxis
                            dataKey="displayName"
                            axisLine={false}
                            tickLine={false}
                            height={28}
                            tick={{
                              fontSize: window.innerWidth < 640 ? 10 : 12,
                              fill: "#6f7f76",
                              fontWeight: 600,
                            }}
                          />
                          <YAxis
                            yAxisId="volume"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) =>
                              value > 1000
                                ? `${(value / 1000).toFixed(0)}k`
                                : value.toString()
                            }
                            tick={{
                              fontSize: window.innerWidth < 640 ? 10 : 12,
                              fill: "#7b857f",
                            }}
                            width={window.innerWidth < 640 ? 32 : 42}
                          />
                          <YAxis
                            yAxisId="count"
                            orientation="right"
                            hide
                            domain={[0, "dataMax + 1"]}
                          />
                          <Tooltip
                            wrapperStyle={chartTooltipWrapperStyle}
                            cursor={{
                              fill: "rgba(77, 124, 93, 0.055)",
                            }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              boxShadow:
                                "0 12px 30px rgba(34, 49, 55, 0.12)",
                              fontSize: "13px",
                            }}
                            formatter={(value, name) => {
                              if (name === "contractCount") {
                                return [`${value} шт.`, "Контракты"];
                              }
                              return [
                                `${Number(value).toLocaleString()} т`,
                                name === "totalVolume"
                                  ? "Общий объем"
                                  : "Отгруженный объем",
                              ];
                            }}
                            labelFormatter={(label) => `Период: ${label}`}
                          />
                          <Bar
                            dataKey="totalVolume"
                            name="Общий объем"
                            fill="url(#timeTotalVolumeGradient)"
                            yAxisId="volume"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={38}
                          />
                          <Bar
                            dataKey="shippedVolume"
                            name="Отгруженный объем"
                            fill="url(#timeShippedVolumeGradient)"
                            yAxisId="volume"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={38}
                          />
                          <Line
                            type="monotone"
                            dataKey="contractCount"
                            name="Контракты"
                            stroke="#223137"
                            strokeWidth={2.5}
                            yAxisId="count"
                            dot={{
                              fill: "#ffffff",
                              stroke: "#223137",
                              strokeWidth: 2,
                              r: 3.5,
                            }}
                            activeDot={{
                              r: 5,
                              fill: "#223137",
                              stroke: "#ffffff",
                              strokeWidth: 2,
                            }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          <div className="grid gap-4">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#f38810]" />
                  Динамика цен
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Изменение средних цен по месяцам
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                {isLoading ? (
                  <div className="h-[22rem] w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : priceTrendAnalysis.usdTrend.length > 0 ||
                  priceTrendAnalysis.kztTrend.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {priceTrendCards.map((card) => (
                      <div
                        key={card.currency}
                        className="rounded-md border border-[#edf1ec] bg-[#fbfcfa] p-4"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase text-[#7b857f]">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: card.color }}
                              />
                              {card.currency}
                            </div>
                            <div className="text-2xl font-semibold leading-7 text-[#223137]">
                              {card.hasData
                                ? `${card.prefix}${card.latest.toLocaleString()}`
                                : "Нет данных"}
                            </div>
                          </div>
                          {card.hasData && (
                            <div
                              className="rounded-md px-2 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: card.softColor,
                                color: card.color,
                              }}
                            >
                              {card.delta >= 0 ? "+" : ""}
                              {card.delta}%
                            </div>
                          )}
                        </div>

                        <div className="h-52">
                          {card.hasData ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={card.data}
                                margin={{
                                  top: 8,
                                  right: 10,
                                  left: window.innerWidth < 640 ? -14 : 0,
                                  bottom: 0,
                                }}
                              >
                                <defs>
                                  <linearGradient
                                    id={`timePriceGradient${card.currency}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor={card.color}
                                      stopOpacity={0.28}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor={card.color}
                                      stopOpacity={0.04}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  vertical={false}
                                  stroke="#e7ece7"
                                  strokeDasharray="4 6"
                                />
                                <XAxis
                                  dataKey="displayName"
                                  axisLine={false}
                                  tickLine={false}
                                  height={28}
                                  tick={{
                                    fontSize: 11,
                                    fill: "#6f7f76",
                                    fontWeight: 600,
                                  }}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  tickCount={4}
                                  domain={["auto", "auto"]}
                                  tickFormatter={(value) =>
                                    value > 1000
                                      ? `${Math.round(Number(value) / 1000)}k`
                                      : Number(value).toLocaleString()
                                  }
                                  tick={{ fontSize: 11, fill: "#7b857f" }}
                                  width={48}
                                />
                                <Tooltip
                                  wrapperStyle={chartTooltipWrapperStyle}
                                  cursor={{
                                    stroke: "#dbe5da",
                                    strokeWidth: 1,
                                    strokeDasharray: "4 4",
                                  }}
                                  contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    boxShadow:
                                      "0 12px 30px rgba(34, 49, 55, 0.12)",
                                    fontSize: "13px",
                                  }}
                                  formatter={(value) => [
                                    `${card.prefix}${Number(value).toLocaleString()}`,
                                    `Средняя цена ${card.currency}`,
                                  ]}
                                  labelFormatter={(label) => `Месяц: ${label}`}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="avgPrice"
                                  stroke={card.color}
                                  strokeWidth={3}
                                  fill={`url(#timePriceGradient${card.currency})`}
                                  dot={{
                                    fill: "#ffffff",
                                    stroke: card.color,
                                    strokeWidth: 2,
                                    r: 4,
                                  }}
                                  activeDot={{
                                    r: 6,
                                    fill: card.color,
                                    stroke: "#ffffff",
                                    strokeWidth: 2,
                                  }}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                              Нет данных
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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

        {/* Geographical Analysis Tab */}
        <TabsContent value="geo" className="space-y-6 relative">
          <div className="grid gap-4 xl:grid-cols-2">
            {[
              {
                title: "Станции отправления",
                description: "Где формируется основной объем отгрузок",
                rows: departureStationRows,
                icon: "Отправление",
              },
              {
                title: "Станции назначения",
                description: "Куда распределяется контрактный объем",
                rows: destinationStationRows,
                icon: "Назначение",
              },
            ].map((stationCard) => {
              const total = stationCard.rows.reduce(
                (sum, station) => sum + station.totalVolume,
                0
              );
              const topStation = stationCard.rows[0];

              return (
                <Card key={stationCard.title} className="sungrain-analytics-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="sungrain-card-title flex items-center gap-2">
                      <Map className="h-5 w-5 text-[#2f6b4f]" />
                      {stationCard.title}
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      {stationCard.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                    {isLoading ? (
                      <div className="h-72 w-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : stationCard.rows.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div className="sungrain-chart-chip">
                            <span>Объем</span>
                            <strong>{total.toLocaleString()} т</strong>
                          </div>
                          <div className="sungrain-chart-chip">
                            <span>Станций</span>
                            <strong>{stationCard.rows.length}</strong>
                          </div>
                          <div className="sungrain-chart-chip">
                            <span>Лидер</span>
                            <strong>{topStation?.station ?? "Н/Д"}</strong>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-center">
                          <div className="relative mx-auto h-52 w-52">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={stationCard.rows}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={window.innerWidth < 640 ? 58 : 64}
                                  outerRadius={window.innerWidth < 640 ? 84 : 92}
                                  paddingAngle={2}
                                  cornerRadius={5}
                                  dataKey="value"
                                  nameKey="name"
                                  stroke="#ffffff"
                                  strokeWidth={2}
                                >
                                  {stationCard.rows.map((station) => (
                                    <Cell
                                      key={station.station}
                                      fill={station.color}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  {...donutTooltipProps}
                                  contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                    boxShadow:
                                      "0 12px 30px rgba(34, 49, 55, 0.12)",
                                    fontSize: "13px",
                                  }}
                                  formatter={(value) => [
                                    `${Number(value).toLocaleString()} т`,
                                    "Объем",
                                  ]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-xl font-semibold leading-6 text-[#223137]">
                                  {topStation?.share ?? 0}%
                                </div>
                                <div className="text-[10px] font-semibold uppercase leading-4 text-[#7b857f]">
                                  топ
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {stationCard.rows.map((station) => (
                              <div key={station.station} className="space-y-1.5">
                                <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.75rem] items-center gap-2">
                                  <span className="flex size-7 items-center justify-center rounded-md bg-[#eef5ef] text-xs font-semibold text-[#2f6b4f]">
                                    {String(station.rank).padStart(2, "0")}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold leading-5 text-[#223137]">
                                      {station.station}
                                    </div>
                                    <div className="text-[11px] leading-4 text-[#7b857f]">
                                      {station.contractCount} контрактов
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-semibold leading-5 text-[#223137]">
                                      {station.share}%
                                    </div>
                                    <div className="text-[11px] leading-4 text-[#6f7f76]">
                                      {station.totalVolume.toLocaleString()} т
                                    </div>
                                  </div>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#eef2ed]">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${station.barShare}%`,
                                      backgroundColor: station.color,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-72 w-full flex items-center justify-center text-muted-foreground">
                        Нет данных для отображения
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        {/* Crops Analysis Tab */}
        <TabsContent value="crops" className="space-y-6 relative">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-[#2f6b4f]" />
                  Распределение по культурам
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Объемы контрактов по типам культур
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                {isLoading ? (
                  <div className="h-72 w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : cropDistributionRows.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="sungrain-chart-chip">
                        <span>Объем</span>
                        <strong>
                          {cropDistributionTotal.toLocaleString()} т
                        </strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Культур</span>
                        <strong>{cropDistributionRows.length}</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Лидер</span>
                        <strong>{cropDistributionRows[0]?.crop ?? "Н/Д"}</strong>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-center">
                      <div className="relative mx-auto h-52 w-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={cropDistributionRows}
                              cx="50%"
                              cy="50%"
                              innerRadius={window.innerWidth < 640 ? 58 : 64}
                              outerRadius={window.innerWidth < 640 ? 84 : 92}
                              paddingAngle={2}
                              cornerRadius={5}
                              dataKey="totalVolume"
                              nameKey="crop"
                              stroke="#ffffff"
                              strokeWidth={2}
                            >
                              {cropDistributionRows.map((crop) => (
                                <Cell key={crop.crop} fill={crop.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              {...donutTooltipProps}
                              contentStyle={{
                                backgroundColor: "white",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                boxShadow:
                                  "0 12px 30px rgba(34, 49, 55, 0.12)",
                                fontSize: "13px",
                              }}
                              formatter={(value) => [
                                `${Number(value).toLocaleString()} т`,
                                "Объем",
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-xl font-semibold leading-6 text-[#223137]">
                              {cropDistributionRows[0]?.share ?? 0}%
                            </div>
                            <div className="text-[10px] font-semibold uppercase leading-4 text-[#7b857f]">
                              топ
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {cropDistributionRows.map((crop, index) => (
                          <div key={crop.crop} className="space-y-1.5">
                            <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.75rem] items-center gap-2">
                              <span className="flex size-7 items-center justify-center rounded-md bg-[#eef5ef] text-xs font-semibold text-[#2f6b4f]">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold leading-5 text-[#223137]">
                                  {crop.crop}
                                </div>
                                <div className="text-[11px] leading-4 text-[#7b857f]">
                                  Выполнение {crop.fulfillmentRate}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold leading-5 text-[#223137]">
                                  {crop.share}%
                                </div>
                                <div className="text-[11px] leading-4 text-[#6f7f76]">
                                  {crop.totalVolume.toLocaleString()} т
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="h-2 overflow-hidden rounded-full bg-[#f38810]/15">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${crop.barShare}%`,
                                    backgroundColor: crop.color,
                                  }}
                                />
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-[#2f6b4f]/12">
                                <div
                                  className="h-full rounded-full bg-[#2f6b4f]"
                                  style={{
                                    width: `${Math.max(
                                      6,
                                      crop.fulfillmentRate
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-72 w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#f38810]" />
                  Средние цены по культурам
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Средняя цена за тонну по типам культур
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                {isLoading ? (
                  <div className="h-72 w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : cropAnalysis.length > 0 ? (
                  <div className="space-y-3">
                    {cropPriceCards.map((card) => {
                      const leader = card.rows[0];

                      return (
                        <div
                          key={card.currency}
                          className="rounded-md border border-[#edf1ec] bg-[#fbfcfa] p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase text-[#7b857f]">
                                <span
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: card.color }}
                                />
                                {card.currency}
                              </div>
                              <div className="text-2xl font-semibold leading-7 text-[#223137]">
                                {leader
                                  ? `${card.symbol}${leader.price.toLocaleString()}`
                                  : "Нет данных"}
                              </div>
                            </div>
                            {leader && (
                              <div className="rounded-md bg-[#eef5ef] px-2 py-1 text-xs font-semibold text-[#2f6b4f]">
                                {leader.crop}
                              </div>
                            )}
                          </div>

                          {card.rows.length > 0 ? (
                            <div className="space-y-2.5">
                              {card.rows.map((crop) => (
                                <div key={crop.crop} className="space-y-1">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="truncate text-sm font-semibold leading-5 text-[#223137]">
                                        {crop.crop}
                                      </div>
                                      <div className="text-[11px] leading-4 text-[#7b857f]">
                                        {crop.volume.toLocaleString()} т
                                      </div>
                                    </div>
                                    <div className="text-right text-sm font-semibold leading-5 text-[#223137]">
                                      {card.symbol}
                                      {crop.price.toLocaleString()} /т
                                    </div>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-[#eef2ed]">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${crop.barShare}%`,
                                        backgroundColor: card.color,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-[#dbe5da] text-sm text-[#7b857f]">
                              Нет данных по валюте
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-72 w-full flex items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 via-transparent to-emerald-50/20 rounded-3xl -z-10"></div>
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-3">
                  <Building className="h-6 w-6 text-[#f38810]" />
                  Топ компаний по объему
                </CardTitle>
                <CardDescription>
                  Компании с самым большим объемом контрактов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {isLoading ? (
                  <Skeleton className="h-[420px] w-full rounded-lg" />
                ) : companyRows.length > 0 ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sungrain-chart-chip">
                        <span>Объем</span>
                        <strong>{companySummary.totalVolume.toLocaleString()} т</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Компаний</span>
                        <strong>{companyRows.length}</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Лидер</span>
                        <strong className="truncate">
                          {companySummary.topVolumeCompany?.company ?? "Н/Д"}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {companyRows.map((company) => (
                        <div
                          key={company.company}
                          className="rounded-lg border border-[#dfe7de] bg-[#fbfcfa] p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-bold text-[#2f6b4f]">
                              {String(company.rank).padStart(2, "0")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="truncate text-base font-bold text-[#223137]">
                                    {company.company}
                                  </div>
                                  <div className="mt-1 text-xs text-[#7b857f]">
                                    {company.contractCount} контрактов · выполнение{" "}
                                    {company.fulfillmentRate}%
                                  </div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-xl font-black text-[#223137]">
                                    {company.totalVolume.toLocaleString()} т
                                  </div>
                                  <div className="text-xs text-[#7b857f]">
                                    {company.shippedVolume.toLocaleString()} т отгружено
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="h-2.5 overflow-hidden rounded-full bg-[#fdebd7]">
                                  <div
                                    className="h-full rounded-full bg-[#f38810]"
                                    style={{ width: `${company.totalShare}%` }}
                                  />
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-[#e8f0ea]">
                                  <div
                                    className="h-full rounded-full bg-[#2f6b4f]"
                                    style={{ width: `${company.shippedShare}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-[#2f6b4f]" />
                  Выполнение контрактов
                </CardTitle>
                <CardDescription>
                  Рейтинг компаний по проценту отгрузки
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {isLoading ? (
                  <Skeleton className="h-[420px] w-full rounded-lg" />
                ) : companyFulfillmentRows.length > 0 ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                      <div className="sungrain-chart-chip">
                        <span>Среднее</span>
                        <strong>{companySummary.avgFulfillment}%</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Лучший</span>
                        <strong>
                          {companySummary.topFulfillmentCompany?.fulfillmentRate ?? 0}%
                        </strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Контрактов</span>
                        <strong>{companySummary.totalContracts}</strong>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {companyFulfillmentRows.map((company) => (
                        <div
                          key={company.company}
                          className="rounded-lg border border-[#dfe7de] bg-white p-4"
                        >
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#eef5ef] px-2 py-1 text-xs font-bold text-[#2f6b4f]">
                                  {String(company.rank).padStart(2, "0")}
                                </span>
                                <span className="truncate text-sm font-bold text-[#223137]">
                                  {company.company}
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-[#7b857f]">
                                {company.shippedVolume.toLocaleString()} т из{" "}
                                {company.totalVolume.toLocaleString()} т
                              </div>
                            </div>
                            <div className="shrink-0 text-2xl font-black text-[#223137]">
                              {company.fulfillmentRate}%
                            </div>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-[#e8f0ea]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#2f6b4f] to-[#5f936c]"
                              style={{
                                width: `${Math.min(company.fulfillmentRate, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[#517b8f]" />
                  Количество контрактов
                </CardTitle>
                <CardDescription>
                  Доля каждой компании в общем портфеле
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[360px] w-full rounded-lg" />
                ) : companyContractRows.length > 0 ? (
                  <div className="grid items-center gap-5 lg:grid-cols-[250px_1fr]">
                    <div className="relative h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={companyContractRows}
                            cx="50%"
                            cy="50%"
                            innerRadius={72}
                            outerRadius={108}
                            paddingAngle={4}
                            cornerRadius={10}
                            dataKey="value"
                            nameKey="company"
                            stroke="#fff"
                            strokeWidth={3}
                          >
                            {companyContractRows.map((company) => (
                              <Cell
                                key={company.company}
                                fill={company.color}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            {...donutTooltipProps}
                            formatter={(value, ...tooltipArgs) => {
                              const props = tooltipArgs[1];
                              return [
                                `${value} контрактов`,
                                props.payload.company,
                              ];
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-black text-[#223137]">
                            {companySummary.totalContracts}
                          </div>
                          <div className="text-xs font-semibold uppercase text-[#7b857f]">
                            контрактов
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {companyContractRows.map((company) => (
                        <div key={company.company} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: company.color }}
                              />
                              <span className="truncate text-sm font-semibold text-[#223137]">
                                {company.company}
                              </span>
                            </div>
                            <div className="shrink-0 text-sm font-bold text-[#223137]">
                              {company.contractCount} · {company.share}%
                            </div>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-[#eef2ed]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${company.barShare}%`,
                                backgroundColor: company.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-[#f38810]" />
                  Финансовые показатели
                </CardTitle>
                <CardDescription>
                  Стоимость контрактов по компаниям и валютам
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[360px] w-full rounded-lg" />
                ) : companyFinanceCards.some((card) => card.rows.length > 0) ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {companyFinanceCards.map((card) => (
                      <div
                        key={card.currency}
                        className="rounded-lg border border-[#dfe7de] bg-[#fbfcfa] p-4"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#7b857f]">
                              {card.currency}
                            </div>
                            <div className="mt-1 max-w-full break-words text-2xl font-black leading-tight text-[#223137] sm:text-3xl">
                              {formatCompactCurrency(card.total)}
                            </div>
                          </div>
                          <div
                            className="shrink-0 rounded-md px-3 py-1 text-sm font-bold"
                            style={{
                              backgroundColor: card.softColor,
                              color: card.color,
                            }}
                          >
                            {card.symbol}
                          </div>
                        </div>

                        {card.rows.length > 0 ? (
                          <div className="space-y-3">
                            {card.rows.map((company) => (
                              <div key={company.company} className="space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-bold text-[#223137]">
                                      {company.company}
                                    </div>
                                    <div className="text-xs text-[#7b857f]">
                                      {company.volume.toLocaleString()} т
                                    </div>
                                  </div>
                                  <div className="max-w-[46%] shrink-0 break-words text-right text-sm font-black leading-tight text-[#223137]">
                                    {card.symbol}
                                    {formatCompactCurrency(company.value)}
                                  </div>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2ed]">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${company.barShare}%`,
                                      backgroundColor: card.color,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-[#dbe5da] text-sm text-[#7b857f]">
                            Нет данных по валюте
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transport Tab */}
        <TabsContent value="transport" className="space-y-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 via-transparent to-emerald-50/20 rounded-3xl -z-10"></div>
          <div className="grid items-start gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-3">
                  <TruckIcon className="h-6 w-6 text-[#f38810]" />
                  Вагоны по перевозчикам
                </CardTitle>
                <CardDescription>
                  Распределение парка и доля каждого перевозчика
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {isLoading ? (
                  <Skeleton className="h-[430px] w-full rounded-lg" />
                ) : transportRows.length > 0 ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sungrain-chart-chip">
                        <span>Вагонов</span>
                        <strong>{transportSummary.totalWagons}</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Перевозчиков</span>
                        <strong>{transportRows.length}</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Лидер</span>
                        <strong className="truncate">
                          {transportSummary.topCarrier?.owner ?? "Н/Д"}
                        </strong>
                      </div>
                    </div>

                    <div className="grid items-center gap-5 lg:grid-cols-[280px_1fr]">
                      <div className="relative h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={transportRows}
                              cx="50%"
                              cy="50%"
                              innerRadius={82}
                              outerRadius={122}
                              paddingAngle={4}
                              cornerRadius={12}
                              dataKey="value"
                              nameKey="owner"
                              stroke="#fff"
                              strokeWidth={3}
                            >
                              {transportRows.map((carrier) => (
                                <Cell
                                  key={carrier.owner}
                                  fill={carrier.color}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              {...donutTooltipProps}
                              formatter={(value, ...tooltipArgs) => {
                                const props = tooltipArgs[1];
                                return [
                                  `${value} вагонов`,
                                  props.payload.owner,
                                ];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-5xl font-black text-[#223137]">
                              {transportSummary.totalWagons}
                            </div>
                            <div className="text-xs font-semibold uppercase text-[#7b857f]">
                              вагонов
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {transportRows.map((carrier) => (
                          <div key={carrier.owner} className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: carrier.color }}
                                />
                                <span className="truncate text-sm font-semibold text-[#223137]">
                                  {carrier.owner}
                                </span>
                              </div>
                              <div className="shrink-0 text-sm font-bold text-[#223137]">
                                {carrier.wagonCount} · {carrier.share}%
                              </div>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-[#eef2ed]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${carrier.wagonShare}%`,
                                  backgroundColor: carrier.color,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="sungrain-analytics-card">
              <CardHeader className="pb-3">
                <CardTitle className="sungrain-card-title flex items-center gap-3">
                  <Train className="h-6 w-6 text-[#2f6b4f]" />
                  Рейтинг перевозчиков
                </CardTitle>
                <CardDescription>
                  Загрузка, емкость и культуры по каждому парку
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {isLoading ? (
                  <Skeleton className="h-[430px] w-full rounded-lg" />
                ) : transportRows.length > 0 ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="sungrain-chart-chip">
                        <span>Загрузка</span>
                        <strong>{transportSummary.utilizationRate}%</strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Емкость</span>
                        <strong>
                          {Math.round(transportSummary.totalCapacity).toLocaleString()} т
                        </strong>
                      </div>
                      <div className="sungrain-chart-chip">
                        <span>Культур</span>
                        <strong>{transportSummary.cropCount}</strong>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {transportRows.map((carrier) => (
                        <div
                          key={carrier.owner}
                          className="rounded-lg border border-[#dfe7de] bg-[#fbfcfa] p-4"
                        >
                          <div className="mb-4 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-[#eef5ef] px-2 py-1 text-xs font-bold text-[#2f6b4f]">
                                  {String(carrier.rank).padStart(2, "0")}
                                </span>
                                <span className="truncate text-base font-bold text-[#223137]">
                                  {carrier.owner}
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {carrier.crops.slice(0, 3).map((crop) => (
                                  <span
                                    key={crop}
                                    className="rounded bg-white px-2 py-1 text-[11px] font-semibold text-[#6f7b74] ring-1 ring-[#dfe7de]"
                                  >
                                    {crop}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-2xl font-black text-[#223137]">
                                {carrier.wagonCount}
                              </div>
                              <div className="text-xs text-[#7b857f]">вагонов</div>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-[#7b857f]">
                                <span>Загрузка парка</span>
                                <span className="font-bold text-[#223137]">
                                  {carrier.utilizationRate}%
                                </span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-[#e8f0ea]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#2f6b4f] to-[#5f936c]"
                                  style={{
                                    width: `${Math.min(
                                      Math.round(carrier.utilizationRate),
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-xs text-[#7b857f]">
                                <span>Емкость</span>
                                <span className="font-bold text-[#223137]">
                                  {Math.round(carrier.totalCapacity).toLocaleString()} т
                                </span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-[#fdebd7]">
                                <div
                                  className="h-full rounded-full bg-[#f38810]"
                                  style={{
                                    width: `${carrier.capacityShare}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="rounded-md border border-[#dfe7de] bg-white p-3">
                              <div className="text-[11px] font-semibold uppercase text-[#7b857f]">
                                Средний вагон
                              </div>
                              <div className="mt-1 text-xl font-black text-[#223137]">
                                {carrier.avgCapacity.toLocaleString()} т
                              </div>
                              <div className="mt-2 text-xs text-[#7b857f]">
                                {carrier.cropCount} культур
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-72 w-full items-center justify-center text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/20 via-transparent to-emerald-50/20 rounded-3xl -z-10"></div>
          <Card className="sungrain-analytics-card">
            <CardHeader className="pb-3">
              <CardTitle className="sungrain-card-title flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-[#f38810]" />
                Динамика цен
              </CardTitle>
              <CardDescription>
                Средняя цена за тонну по валютам и месяцам
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLoading ? (
                <Skeleton className="h-[430px] w-full rounded-lg" />
              ) : priceTrendCards.some((card) => card.hasData) ? (
                <>
                  <div className="grid gap-3 md:grid-cols-4">
                    {priceTrendCards.map((card) => (
                      <div key={card.currency} className="sungrain-chart-chip">
                        <span>{card.currency}</span>
                        <strong>
                          {card.hasData
                            ? `${card.prefix}${card.latest.toLocaleString()}`
                            : "Н/Д"}
                        </strong>
                      </div>
                    ))}
                    <div className="sungrain-chart-chip">
                      <span>Периодов USD</span>
                      <strong>{priceTrendAnalysis.usdTrend.length}</strong>
                    </div>
                    <div className="sungrain-chart-chip">
                      <span>Периодов KZT</span>
                      <strong>{priceTrendAnalysis.kztTrend.length}</strong>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {priceTrendCards.map((card) => (
                      <div
                        key={card.currency}
                        className="rounded-lg border border-[#dfe7de] bg-[#fbfcfa] p-5"
                      >
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#7b857f]">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: card.color }}
                              />
                              {card.currency}
                            </div>
                            <div className="text-4xl font-black leading-none text-[#223137]">
                              {card.hasData
                                ? `${card.prefix}${card.latest.toLocaleString()}`
                                : "Нет данных"}
                            </div>
                            <div className="mt-2 text-sm text-[#7b857f]">
                              последняя средняя цена за тонну
                            </div>
                          </div>
                          {card.hasData && (
                            <div
                              className="rounded-md px-3 py-2 text-sm font-black"
                              style={{
                                backgroundColor: card.softColor,
                                color: card.color,
                              }}
                            >
                              {card.delta >= 0 ? "+" : ""}
                              {card.delta}%
                            </div>
                          )}
                        </div>

                        <div className="h-[300px]">
                          {card.hasData ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={card.data}
                                margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient
                                    id={`financialPriceGradient${card.currency}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="5%"
                                      stopColor={card.color}
                                      stopOpacity={0.26}
                                    />
                                    <stop
                                      offset="95%"
                                      stopColor={card.color}
                                      stopOpacity={0.03}
                                    />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid
                                  vertical={false}
                                  stroke="#e6ece6"
                                  strokeDasharray="4 6"
                                />
                                <XAxis
                                  dataKey="displayName"
                                  axisLine={false}
                                  tickLine={false}
                                  height={34}
                                  tick={{
                                    fontSize: 12,
                                    fill: "#6f7f76",
                                    fontWeight: 600,
                                  }}
                                />
                                <YAxis
                                  axisLine={false}
                                  tickLine={false}
                                  width={58}
                                  tick={{
                                    fontSize: 12,
                                    fill: "#6f7f76",
                                    fontWeight: 600,
                                  }}
                                  tickFormatter={(value) =>
                                    card.currency === "USD"
                                      ? `$${value}`
                                      : `${Math.round(value / 1000)}k ₸`
                                  }
                                  domain={["dataMin", "dataMax"]}
                                />
                                <Tooltip
                                  wrapperStyle={chartTooltipWrapperStyle}
                                  cursor={{
                                    stroke: card.color,
                                    strokeOpacity: 0.16,
                                    strokeWidth: 8,
                                  }}
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #dfe7de",
                                    borderRadius: "8px",
                                    boxShadow:
                                      "0 18px 42px rgba(34, 49, 55, 0.12)",
                                  }}
                                  formatter={(value) => [
                                    `${card.prefix}${Number(value).toLocaleString()}`,
                                    "Средняя цена",
                                  ]}
                                  labelFormatter={(label) => `Период: ${label}`}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="avgPrice"
                                  fill={`url(#financialPriceGradient${card.currency})`}
                                  stroke={card.color}
                                  strokeWidth={3}
                                  dot={{
                                    r: 4,
                                    strokeWidth: 3,
                                    stroke: "#ffffff",
                                    fill: card.color,
                                  }}
                                  activeDot={{
                                    r: 6,
                                    strokeWidth: 3,
                                    stroke: "#ffffff",
                                    fill: card.color,
                                  }}
                                  isAnimationActive={false}
                                />
                              </ComposedChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[#dbe5da] text-sm text-[#7b857f]">
                              Нет данных по валюте
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-72 w-full items-center justify-center text-muted-foreground">
                  Нет данных для отображения
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transport Tab */}
      </Tabs>
    </div>
  );
};
