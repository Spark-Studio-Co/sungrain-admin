"use client";

import { useState } from "react";
import { Layout } from "@/shared/ui/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, Search, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Sample shipping document data
const shippingDocuments = [
  { id: 1, name: "ТЛГ + инструкция", status: "completed" },
  { id: 2, name: "ИКР", status: "pending" },
  { id: 3, name: "Счет-фактура", status: "completed" },
  { id: 4, name: "Паспорта качества", status: "pending" },
  { id: 5, name: "Коды транзитные", status: "pending" },
  { id: 6, name: "СТ-1", status: "pending" },
  { id: 7, name: "РГП", status: "pending" },
  { id: 8, name: "Фито", status: "pending" },
  { id: 9, name: "ДС", status: "pending" },
];

// Sample contracts data
const contracts = [
  {
    id: "001-2024",
    name: "Контракт №001-2024",
    shipper: "ООО Агрохолдинг",
    receiver: "ООО ЗерноТрейд",
  },
  {
    id: "002-2024",
    name: "Контракт №002-2024",
    shipper: "АО СельхозПром",
    receiver: "ООО МаслоЭкспорт",
  },
  {
    id: "003-2024",
    name: "Контракт №003-2024",
    shipper: "ООО ЮгАгро",
    receiver: "ООО ЗерноТрейд",
  },
  {
    id: "004-2024",
    name: "Контракт №004-2024",
    shipper: "КФХ Колос",
    receiver: "ООО БалтЭкспорт",
  },
];

// Sample invoice data
const invoices = [
  {
    id: "INV-001",
    contract: "001-2024",
    date: "15.03.2024",
    amount: 1250000,
    currency: "RUB",
    status: "paid",
  },
  {
    id: "INV-002",
    contract: "002-2024",
    date: "10.03.2024",
    amount: 875000,
    currency: "RUB",
    status: "pending",
  },
  {
    id: "INV-003",
    contract: "001-2024",
    date: "05.03.2024",
    amount: 950000,
    currency: "RUB",
    status: "paid",
  },
  {
    id: "INV-004",
    contract: "003-2024",
    date: "01.03.2024",
    amount: 1100000,
    currency: "RUB",
    status: "overdue",
  },
  {
    id: "INV-005",
    contract: "004-2024",
    date: "25.02.2024",
    amount: 780000,
    currency: "RUB",
    status: "paid",
  },
];

// Sample payment data
const payments = [
  {
    id: "PAY-001",
    invoice: "INV-001",
    date: "17.03.2024",
    amount: 1250000,
    method: "bank_transfer",
    reference: "REF123456",
  },
  {
    id: "PAY-002",
    invoice: "INV-003",
    date: "07.03.2024",
    amount: 950000,
    method: "bank_transfer",
    reference: "REF789012",
  },
  {
    id: "PAY-003",
    invoice: "INV-005",
    date: "27.02.2024",
    amount: 780000,
    method: "bank_transfer",
    reference: "REF345678",
  },
];

export default function FinancesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();
  const [allInvoices, setAllInvoices] = useState(invoices);

  // New invoice state
  const [newInvoice, setNewInvoice] = useState({
    contract: "",
    amount: "",
    currency: "RUB",
    status: "pending",
    dueDate: "",
    description: "",
  });

  // Filter invoices based on search term and status
  const filteredInvoices = allInvoices.filter((invoice) => {
    const matchesSearch = Object.values(invoice).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle adding a new invoice
  const handleAddInvoice = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        // Generate a new invoice ID
        const newId = `INV-${String(allInvoices.length + 1).padStart(3, "0")}`;

        // Format the date
        const formattedDate = date
          ? format(date, "dd.MM.yyyy")
          : format(new Date(), "dd.MM.yyyy");

        // Create the new invoice object
        const invoice = {
          id: newId,
          contract: newInvoice.contract,
          date: formattedDate,
          amount: Number(newInvoice.amount),
          currency: newInvoice.currency,
          status: newInvoice.status,
        };

        // Add the new invoice to the list
        setAllInvoices([...allInvoices, invoice]);

        // Reset the form
        setNewInvoice({
          contract: "",
          amount: "",
          currency: "RUB",
          status: "pending",
          dueDate: "",
          description: "",
        });
        setDate(undefined);

        // Close the dialog
        setIsInvoiceDialogOpen(false);
      } catch (error) {
        console.error("Error adding invoice:", error);
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">ФИНАНСЫ</h1>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Счета</TabsTrigger>
            <TabsTrigger value="payments">Платежи</TabsTrigger>
          </TabsList>
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск счетов..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Фильтр по статусу" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="paid">Оплачен</SelectItem>
                    <SelectItem value="pending">Ожидает оплаты</SelectItem>
                    <SelectItem value="overdue">Просрочен</SelectItem>
                  </SelectContent>
                </Select>

                {/* Invoice Dialog */}
                <Dialog
                  open={isInvoiceDialogOpen}
                  onOpenChange={setIsInvoiceDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Создать счет
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Создать новый счет</DialogTitle>
                      <DialogDescription>
                        Заполните информацию для создания нового счета
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contract" className="text-right">
                          Контракт
                        </Label>
                        <Select
                          value={newInvoice.contract}
                          onValueChange={(value) =>
                            setNewInvoice({ ...newInvoice, contract: value })
                          }
                        >
                          <SelectTrigger className="col-span-3 w-full">
                            <SelectValue placeholder="Выберите контракт" />
                          </SelectTrigger>
                          <SelectContent>
                            {contracts.map((contract) => (
                              <SelectItem key={contract.id} value={contract.id}>
                                {contract.name} ({contract.shipper} -{" "}
                                {contract.receiver})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                          Дата счета
                        </Label>
                        <div className="col-span-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date
                                  ? format(date, "PPP", { locale: ru })
                                  : "Выберите дату"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Сумма
                        </Label>
                        <div className="col-span-3 flex gap-2">
                          <Input
                            id="amount"
                            type="number"
                            value={newInvoice.amount}
                            onChange={(e) =>
                              setNewInvoice({
                                ...newInvoice,
                                amount: e.target.value,
                              })
                            }
                            className="flex-1"
                            placeholder="Введите сумму"
                          />
                          <Select
                            value={newInvoice.currency}
                            onValueChange={(value) =>
                              setNewInvoice({ ...newInvoice, currency: value })
                            }
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Валюта" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RUB">RUB</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                          Статус
                        </Label>
                        <Select
                          value={newInvoice.status}
                          onValueChange={(value) =>
                            setNewInvoice({ ...newInvoice, status: value })
                          }
                        >
                          <SelectTrigger className="col-span-3 w-full">
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              Ожидает оплаты
                            </SelectItem>
                            <SelectItem value="paid">Оплачен</SelectItem>
                            <SelectItem value="overdue">Просрочен</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dueDate" className="text-right">
                          Срок оплаты
                        </Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newInvoice.dueDate}
                          onChange={(e) =>
                            setNewInvoice({
                              ...newInvoice,
                              dueDate: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Описание
                        </Label>
                        <Input
                          id="description"
                          value={newInvoice.description}
                          onChange={(e) =>
                            setNewInvoice({
                              ...newInvoice,
                              description: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Дополнительная информация"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddInvoice}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Создание...
                          </>
                        ) : (
                          "Создать счет"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Счета</CardTitle>
                <CardDescription>
                  Управление счетами и платежами
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№ счета</TableHead>
                      <TableHead>Контракт</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.id}
                          </TableCell>
                          <TableCell>{invoice.contract}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>
                            {invoice.amount.toLocaleString()} {invoice.currency}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "success"
                                  : invoice.status === "overdue"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {invoice.status === "paid"
                                ? "Оплачен"
                                : invoice.status === "pending"
                                ? "Ожидает оплаты"
                                : "Просрочен"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Скачать</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Счета не найдены.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Поиск платежей..." className="pl-10" />
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Добавить платеж
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Платежи</CardTitle>
                <CardDescription>История платежей по счетам</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№ платежа</TableHead>
                      <TableHead>№ счета</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Способ оплаты</TableHead>
                      <TableHead>Референс</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.id}
                        </TableCell>
                        <TableCell>{payment.invoice}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          {payment.amount.toLocaleString()} RUB
                        </TableCell>
                        <TableCell>
                          {payment.method === "bank_transfer"
                            ? "Банковский перевод"
                            : payment.method}
                        </TableCell>
                        <TableCell>{payment.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
