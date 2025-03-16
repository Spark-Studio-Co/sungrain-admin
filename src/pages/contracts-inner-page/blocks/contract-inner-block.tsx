import { useState } from "react";
import { Download, FileText, Truck, Building2 } from "lucide-react";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/shared/ui/layout";

// Initial wagon data
const initialWagons = [
  {
    id: 1,
    number: "2980596",
    capacity: 63800,
    owner: "Логсофт",
    status: "shipped",
  },
  {
    id: 2,
    number: "29927696",
    capacity: 64250,
    owner: "Логсофт",
    status: "in_transit",
  },
  {
    id: 3,
    number: "29027984",
    capacity: 63600,
    owner: "Логсофт",
    status: "at_elevator",
  },
];

// Initial documents data
const initialDocuments = [
  {
    id: 1,
    name: "Паспорт качества №123",
    type: "quality_passport",
    uploadedAt: "2024-03-15",
  },
  {
    id: 2,
    name: "ЭПД №456",
    type: "waybill",
    uploadedAt: "2024-03-15",
  },
  {
    id: 3,
    name: "Акт взвешивания №789",
    type: "weight_act",
    uploadedAt: "2024-03-15",
  },
];

const statusMap = {
  shipped: {
    label: "Отгружен",
    color: "success",
    icon: <FileText className="h-4 w-4" />,
  },
  in_transit: {
    label: "В пути",
    color: "warning",
    icon: <Truck className="h-4 w-4" />,
  },
  at_elevator: {
    label: "На элеваторе",
    color: "default",
    icon: <Building2 className="h-4 w-4" />,
  },
};

export const ContractInnerBlock = () => {
  const [wagons, setWagons] = useState(initialWagons);
  const [documents, setDocuments] = useState(initialDocuments);
  const [newWagon, setNewWagon] = useState({
    number: "",
    capacity: "",
    owner: "",
    status: "at_elevator",
  });

  // Shipment metrics
  const totalPurchased = 1000; // tons
  const totalShipped = wagons
    .filter((w) => w.status === "shipped")
    .reduce((acc, wagon) => acc + wagon.capacity / 1000, 0);
  const remainingPurchase = totalPurchased - totalShipped;
  const shippingProgress = (totalShipped / totalPurchased) * 100;

  // Add new wagon
  const handleAddWagon = () => {
    const wagon = {
      id: wagons.length + 1,
      ...newWagon,
      capacity: Number.parseInt(newWagon.capacity),
    };
    setWagons([...wagons, wagon]);
    setNewWagon({
      number: "",
      capacity: "",
      owner: "",
      status: "at_elevator",
    });
  };

  // Update wagon status
  const handleStatusUpdate = (wagonId: number, newStatus: string) => {
    setWagons(
      wagons.map((wagon) =>
        wagon.id === wagonId ? { ...wagon, status: newStatus } : wagon
      )
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Contract Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Договор закупа</CardTitle>
          <CardDescription>
            Детали контракта и управление документами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Скачать договор
          </Button>
        </CardContent>
      </Card>

      {/* Shipping Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Отгрузочные документы</CardTitle>
          <CardDescription>Управление документами отгрузки</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Дата загрузки</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.uploadedAt}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Скачать
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wagon Registry Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="w-full">
            <CardTitle className="!w-full !flex items-center justify-between">
              Реестр вагонов <Button>Добавить вагон</Button>
            </CardTitle>
            <CardDescription>
              Управление вагонами и их статусами
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>№ вагона</TableHead>
                  <TableHead>Г/П, кг</TableHead>
                  <TableHead>Собственник</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wagons.map((wagon) => (
                  <TableRow
                    key={wagon.id}
                    className={wagon.status === "shipped" ? "bg-green-50" : ""}
                  >
                    <TableCell>{wagon.id}</TableCell>
                    <TableCell>{wagon.number}</TableCell>
                    <TableCell>{wagon.capacity.toLocaleString()}</TableCell>
                    <TableCell>{wagon.owner}</TableCell>
                    <TableCell>
                      <Select
                        value={wagon.status}
                        onValueChange={(value) =>
                          handleStatusUpdate(wagon.id, value)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              {statusMap[wagon.status].icon}
                              <Badge
                                variant={
                                  statusMap[wagon.status].color as
                                    | "default"
                                    | "success"
                                    | "warning"
                                }
                              >
                                {statusMap[wagon.status].label}
                              </Badge>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusMap).map(
                            ([value, { label, icon }]) => (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  {icon}
                                  {label}
                                </div>
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Редактировать
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
