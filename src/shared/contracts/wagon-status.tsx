import {
  Building2,
  CheckCircle2,
  Circle,
  FileCheck2,
  Navigation,
  TrainFront,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { normalizeWagonStatus } from "./wagon-status-data";

export { WAGON_STATUS_OPTIONS } from "./wagon-status-data";

export const getWagonStatusMeta = (value: unknown) => {
  const status = normalizeWagonStatus(value);

  switch (status) {
    case "shipped":
      return {
        status,
        label: "Отгружен",
        className: "border-[#cfe8d7] bg-[#eaf8ef] text-[#26744e]",
        icon: CheckCircle2,
      };
    case "en_route_to_recipient":
      return {
        status,
        label: "Следует к получателю",
        className: "border-[#cde2dc] bg-[#edf7f4] text-[#256a5a]",
        icon: Navigation,
      };
    case "registered":
      return {
        status,
        label: "Оформлен",
        className: "border-[#d7e3eb] bg-[#f0f6fa] text-[#3f6679]",
        icon: FileCheck2,
      };
    case "en_route_to_loading":
      return {
        status,
        label: "В пути под погрузку",
        className: "border-[#f2d9bb] bg-[#fff4e5] text-[#b85f00]",
        icon: TrainFront,
      };
    case "at_elevator":
      return {
        status,
        label: "На элеваторе",
        className: "border-[#d8e2e8] bg-[#f1f5f7] text-[#4c6876]",
        icon: Building2,
      };
    case "in_transit":
      return {
        status,
        label: "В пути",
        className: "border-[#f2dfca] bg-[#fff7ed] text-[#b86a13]",
        icon: TrainFront,
      };
    default:
      return {
        status,
        label: typeof value === "string" && value.trim() ? value : "Не указан",
        className: "border-[#dfe6e1] bg-[#f6f8f6] text-[#64716b]",
        icon: Circle,
      };
  }
};

export const WagonStatusBadge = ({
  status,
  className,
}: {
  status: unknown;
  className?: string;
}) => {
  const meta = getWagonStatusMeta(status);
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap font-bold hover:bg-inherit",
        meta.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {meta.label}
    </Badge>
  );
};
