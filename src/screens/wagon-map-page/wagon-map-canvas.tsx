"use client";

import { useEffect, useRef } from "react";
import {
  AttributionControl,
  type GeoJSONSource,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { DispatchMapStation } from "@/entities/dispatch-map/api/dispatch-map.api";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const statusColor = (status: string) => {
  if (status === "at_elevator") return "#d3a537";
  if (status === "registered") return "#517b8f";
  if (status === "en_route_to_recipient") return "#f38810";
  return "#2f6b4f";
};

const routeGeoJson = (stations: DispatchMapStation[]) => ({
  type: "FeatureCollection" as const,
  features: stations.flatMap((station) =>
    station.wagons.flatMap((wagon) => {
      if (!wagon.destinationStation) return [];
      return [
        {
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [station.longitude, station.latitude],
              [
                wagon.destinationStation.longitude,
                wagon.destinationStation.latitude,
              ],
            ],
          },
          properties: {
            color: statusColor(wagon.status),
            wagon: wagon.number,
          },
        },
      ];
    }),
  ),
});

const setSourceData = (
  map: MapLibreMap,
  sourceId: string,
  data: ReturnType<typeof routeGeoJson>,
) => {
  const source = map.getSource(sourceId) as GeoJSONSource | undefined;
  source?.setData(data);
};

const fitMapToStations = (
  map: MapLibreMap,
  stations: DispatchMapStation[],
  detailsOpen: boolean,
  animate = true,
) => {
  if (!stations.length) return;

  const bounds = new LngLatBounds();
  stations.forEach((station) => {
    bounds.extend([station.longitude, station.latitude]);
  });

  const isMobile = map.getContainer().clientWidth < 768;
  map.fitBounds(bounds, {
    padding: isMobile
      ? {
          top: 96,
          right: 28,
          bottom: detailsOpen ? 330 : 72,
          left: 28,
        }
      : {
          top: 94,
          right: detailsOpen ? 410 : 72,
          bottom: 72,
          left: 72,
        },
    maxZoom: stations.length === 1 ? 7.4 : 6.8,
    duration: animate ? 700 : 0,
  });
};

const markerColor = (station: DispatchMapStation) => {
  if (station.stalledCount > 0) return "#c24135";
  if (station.staleCount > 0) return "#d3a537";
  return "#1f6a4b";
};

const renderStationMarkers = (
  map: MapLibreMap,
  markerList: Marker[],
  stations: DispatchMapStation[],
  selectedStationKey: string | null,
  onSelectStation: (key: string) => void,
) => {
  markerList.forEach((marker) => marker.remove());
  markerList.length = 0;

  stations.forEach((station) => {
    const root = document.createElement("div");
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.alignItems = "center";
    root.style.height = "38px";
    root.style.position = "relative";
    root.style.width = "38px";

    const button = document.createElement("button");
    button.type = "button";
    button.title = `${station.name}: ${station.wagons.length} ваг.`;
    button.setAttribute(
      "aria-label",
      `${station.name}, ${station.wagons.length} вагонов`,
    );
    button.textContent = String(station.wagons.length);
    Object.assign(button.style, {
      alignItems: "center",
      background: markerColor(station),
      border: "3px solid white",
      borderRadius: "50%",
      boxShadow:
        station.key === selectedStationKey
          ? "0 0 0 4px #f38810, 0 12px 28px rgba(16, 38, 32, 0.34)"
          : "0 10px 24px rgba(16, 38, 32, 0.28)",
      color: "white",
      cursor: "pointer",
      display: "flex",
      fontFamily: "inherit",
      fontSize: "13px",
      fontWeight: "800",
      height: "38px",
      justifyContent: "center",
      lineHeight: "1",
      transition: "transform 160ms ease, box-shadow 160ms ease",
      width: "38px",
    });
    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.08)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
    });
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onSelectStation(station.key);
    });

    const label = document.createElement("span");
    label.textContent = station.name;
    Object.assign(label.style, {
      bottom: "-30px",
      background: "rgba(255, 255, 255, 0.92)",
      border: "1px solid rgba(220, 229, 218, 0.95)",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(16, 38, 32, 0.12)",
      color: "#223137",
      fontFamily: "inherit",
      fontSize: "11px",
      fontWeight: "700",
      lineHeight: "1",
      maxWidth: "140px",
      overflow: "hidden",
      padding: "5px 7px",
      pointerEvents: "none",
      position: "absolute",
      opacity: station.key === selectedStationKey ? "1" : "0",
      textOverflow: "ellipsis",
      transition: "opacity 140ms ease",
      whiteSpace: "nowrap",
    });

    button.addEventListener("mouseenter", () => {
      label.style.opacity = "1";
    });
    button.addEventListener("mouseleave", () => {
      label.style.opacity = station.key === selectedStationKey ? "1" : "0";
    });

    root.append(button, label);
    markerList.push(
      new Marker({ element: root, anchor: "center" })
        .setLngLat([station.longitude, station.latitude])
        .addTo(map),
    );
  });
};

export function WagonMapCanvas({
  stations,
  selectedStationKey,
  onSelectStation,
  detailsOpen,
  fitRequest,
}: {
  stations: DispatchMapStation[];
  selectedStationKey: string | null;
  onSelectStation: (key: string) => void;
  detailsOpen: boolean;
  fitRequest: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const stationsRef = useRef(stations);
  const selectRef = useRef(onSelectStation);
  const selectedStationKeyRef = useRef(selectedStationKey);
  const detailsOpenRef = useRef(detailsOpen);
  const hasFittedRef = useRef(false);

  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  useEffect(() => {
    selectRef.current = onSelectStation;
  }, [onSelectStation]);

  useEffect(() => {
    selectedStationKeyRef.current = selectedStationKey;
  }, [selectedStationKey]);

  useEffect(() => {
    detailsOpenRef.current = detailsOpen;
  }, [detailsOpen]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [69.5, 45.5],
      zoom: 3.7,
      minZoom: 2.5,
      maxZoom: 13,
      attributionControl: false,
    });
    mapRef.current = map;

    // DOM markers do not depend on the style lifecycle, so render them immediately.
    // This also keeps the dispatcher usable if a remote style finishes slowly.
    renderStationMarkers(
      map,
      markersRef.current,
      stationsRef.current,
      selectedStationKeyRef.current,
      (key) => selectRef.current(key),
    );

    map.addControl(
      new NavigationControl({ showCompass: false }),
      "bottom-left",
    );
    map.addControl(
      new AttributionControl({ compact: true }),
      "bottom-left",
    );

    map.on("load", () => {
      map.addSource("wagon-routes", {
        type: "geojson",
        data: routeGeoJson(stationsRef.current),
      });
      map.addLayer({
        id: "wagon-route-halo",
        type: "line",
        source: "wagon-routes",
        paint: {
          "line-color": "#ffffff",
          "line-width": 5,
          "line-opacity": 0.72,
        },
      });
      map.addLayer({
        id: "wagon-routes",
        type: "line",
        source: "wagon-routes",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2.2,
          "line-opacity": 0.78,
          "line-dasharray": [2, 2],
        },
      });
      window.requestAnimationFrame(() => {
        map.resize();
        fitMapToStations(
          map,
          stationsRef.current,
          detailsOpenRef.current,
          false,
        );
        hasFittedRef.current = stationsRef.current.length > 0;
      });
    });

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    setSourceData(map, "wagon-routes", routeGeoJson(stations));
    renderStationMarkers(
      map,
      markersRef.current,
      stations,
      selectedStationKey,
      (key) => selectRef.current(key),
    );

    if (stations.length && !hasFittedRef.current) {
      fitMapToStations(map, stations, detailsOpenRef.current);
      hasFittedRef.current = true;
    }
  }, [selectedStationKey, stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasFittedRef.current) return;

    const timeout = window.setTimeout(() => {
      map.resize();
      fitMapToStations(map, stationsRef.current, detailsOpen, true);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [detailsOpen]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || fitRequest === 0) return;
    map.resize();
    fitMapToStations(map, stationsRef.current, detailsOpenRef.current, true);
  }, [fitRequest]);

  return (
    <div className="absolute inset-0 bg-[#eaf0e9]">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
