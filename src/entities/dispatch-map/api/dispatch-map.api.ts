import { apiClient } from "@/shared/api/apiClient";

export type DispatchMapPoint = {
  name: string;
  latitude: number;
  longitude: number;
};

export type DispatchMapWagon = {
  id: number;
  number: string;
  owner: string;
  status: string;
  statusLabel: string;
  idleDays: number;
  isStalled: boolean;
  isStale: boolean;
  staleHours: number;
  observedAt: string;
  lastOperationAt: string | null;
  operation: string | null;
  distanceToDestinationKm: number | null;
  estimatedArrivalAt: string | null;
  etaSource: "reported" | "calculated" | null;
  currentStation: DispatchMapPoint;
  destinationStation: DispatchMapPoint | null;
  departureStation: DispatchMapPoint | null;
  contract: {
    id: string;
    number: string;
    name: string;
    receiver: string;
  } | null;
  application: { id: number; name: string | null } | null;
};

export type DispatchMapStation = DispatchMapPoint & {
  key: string;
  wagons: DispatchMapWagon[];
  statusCounts: Record<string, number>;
  staleCount: number;
  stalledCount: number;
};

export type DispatchMapDashboard = {
  updatedAt: string;
  stats: {
    activeWagons: number;
    mappedWagons: number;
    stations: number;
    stalledWagons: number;
    staleWagons: number;
    arrivingSoon: number;
    unresolvedWagons: number;
  };
  stations: DispatchMapStation[];
  unresolvedStations: Array<{
    name: string;
    wagons: number;
    kind: "current" | "destination";
  }>;
  settings: {
    staleAfterHours: number;
    stalledAfterDays: number;
  };
};

export const getDispatchMapDashboard = async () => {
  const response = await apiClient.get<DispatchMapDashboard>("/dispatch-map");
  return response.data;
};
