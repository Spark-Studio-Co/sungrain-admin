import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Layout } from "@/shared/ui/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet,
  FileIcon as FilePdf,
  Search,
  Plus,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample contract data
const initialContracts = [
  {
    id: "001-2024",
    crop: "Пшеница",
    sender: "ООО Агрохолдинг",
    receiver: "ЗАО ЗерноТрейд",
    departureStation: "Краснодар-Сортировочный",
    destinationStation: "Новороссийск-Порт",
    totalVolume: 1200,
  },
  {
    id: "002-2024",
    crop: "Подсолнечник",
    sender: "АО СельхозПром",
    receiver: "ООО МаслоЭкспорт",
    departureStation: "Ростов-Товарный",
    destinationStation: "Таганрог-Порт",
    totalVolume: 850,
  },
  {
    id: "003-2024",
    crop: "Кукуруза",
    sender: "ООО ЮгАгро",
    receiver: "ЗАО ЗерноТрейд",
    departureStation: "Ставрополь-Грузовой",
    destinationStation: "Новороссийск-Порт",
    totalVolume: 950,
  },
  {
    id: "004-2024",
    crop: "Ячмень",
    sender: "КФХ Колос",
    receiver: "ООО БалтЭкспорт",
    departureStation: "Волгоград-Южный",
    destinationStation: "Санкт-Петербург-Порт",
    totalVolume: 750,
  },
  {
    id: "005-2024",
    crop: "Рапс",
    sender: "АО АгроИнвест",
    receiver: "ООО МаслоЭкспорт",
    departureStation: "Саратов-Товарный",
    destinationStation: "К��лининград-Порт",
    totalVolume: 600,
  },
];

// Crop options
const cropOptions = [
  "Пшеница",
  "Подсолнечник",
  "Кукуруза",
  "Ячмень",
  "Рапс",
  "Соя",
  "Горох",
];

export const ContractsBlock = () => {
  const [contracts, setContracts] = useState(initialContracts);
  const [filteredContracts, setFilteredContracts] = useState(initialContracts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newContract, setNewContract] = useState({
    id: "",
    crop: "",
    sender: "",
    receiver: "",
    departureStation: "",
    destinationStation: "",
    totalVolume: 0,
  });

  // Filter contracts based on search term
  useEffect(() => {
    const results = contracts.filter((contract) =>
      Object.values(contract).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredContracts(results);
  }, [searchTerm, contracts]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Add new contract
  const handleAddContract = () => {
    // Generate a new ID based on the current number of contracts
    const newId = `00${contracts.length + 1}-2024`;
    const contractWithId = {
      ...newContract,
      id: newId,
      totalVolume: Number(newContract.totalVolume),
    };

    setContracts([...contracts, contractWithId]);
    setNewContract({
      id: "",
      crop: "",
      sender: "",
      receiver: "",
      departureStation: "",
      destinationStation: "",
      totalVolume: 0,
    });
    setIsAddDialogOpen(false);
  };

  // Export to Excel (mock function)
  const exportToExcel = () => {
    alert("Экспорт в Excel...");
    // In a real application, you would implement actual export functionality
  };

  // Export to PDF (mock function)
  const exportToPDF = () => {
    alert("Экспорт в PDF...");
    // In a real application, you would implement actual export functionality
  };

  return (
    <div>
      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                СТРАНИЦА КОНТРАКТЫ
              </CardTitle>
              <CardDescription className="mt-1">
                Управление контрактами и грузоперевозками
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button>Добавить контракт</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Экспорт
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={exportToExcel}
                    className="cursor-pointer"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <span>Экспорт в Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={exportToPDF}
                    className="cursor-pointer"
                  >
                    <FilePdf className="mr-2 h-4 w-4" />
                    <span>Экспорт в PDF</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск контрактов..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 w-full md:max-w-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="rounded-md border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px] text-center font-medium">
                    Номер
                  </TableHead>
                  <TableHead className="w-[150px] text-center font-medium">
                    Культура
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Грузоотправитель
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Грузополучатель
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Станция отправления
                  </TableHead>
                  <TableHead className="w-[200px] text-center font-medium">
                    Станция назначения
                  </TableHead>
                  <TableHead className="w-[150px] text-center font-medium">
                    Общий объем (тонн)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.length > 0 ? (
                  filteredContracts.map((contract) => (
                    <TableRow
                      key={contract.id}
                      className="hover:bg-muted/50 h-[100px] transition-colors"
                    >
                      <TableCell className="text-center  font-medium">
                        {contract.id}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.crop}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.sender}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.receiver}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.departureStation}
                      </TableCell>
                      <TableCell className="text-center">
                        {contract.destinationStation}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {contract.totalVolume}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Контракты не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            Всего контрактов: {filteredContracts.length}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
