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
import { Download, Plus, Search } from "lucide-react";
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
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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

  // Update the newInvoice state to include all the fields
  const [newInvoice, setNewInvoice] = useState({
    // Invoice Info
    invoice_number: "",
    invoice_date: "",

    // Receiver (TOO "SUN GRAIN")
    receiver_company_name: "ТОО «SUN GRAIN»", // Default value
    receiver_legal_country: "Республика Казахстан",
    receiver_legal_region: "Алматинская область",
    receiver_legal_district: "Карасайский район",
    receiver_legal_city: "город Каскелен",
    receiver_legal_street: "ул. Наурызбай",
    receiver_legal_office: "88, офис 7",
    receiver_bin: "231240014096",
    receiver_account_usd: "KZ0696507F0009576396",
    receiver_bank_branch: 'Филиал АО "ForteBank" в г. Павлодар',
    receiver_bic: "IRTYKZKA",
    receiver_correspondent_bank: "Bank of New York, USA",
    receiver_swift: "IRVTUS3N",
    receiver_account_number: "890-0548-533",

    // Sender
    sender_company_name: "",
    sender_country: "",
    sender_region: "",
    sender_district: "",
    sender_street: "",

    // Contract
    contract_number: "",
    contract_date: "",
    contract_appendix_number: "",
    contract_appendix_date: "",

    // Product & Payment
    product_name: "",
    price_per_ton_usd: "",
    total_quantity_mt: "",
    payment_amount_usd: "",
    total_amount_usd: "",

    // Signature
    director_name: "",

    // Keep the original fields for backward compatibility
    contract: "",
    amount: "",
    currency: "USD",
    status: "pending",
    dueDate: "",
    description: "",
  });

  // Add this state after the other state declarations
  const [isViewInvoiceDialogOpen, setIsViewInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Add these new state variables after the existing state declarations
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [allPayments, setAllPayments] = useState(payments);
  const [newPayment, setNewPayment] = useState({
    invoice_id: "",
    payment_date: "",
    payment_amount: "",
    payment_currency: "USD",
    payment_method: "bank_transfer",
    payment_reference: "",
    payment_description: "",
    bank_name: "",
    bank_account: "",
    payment_status: "completed",
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
        const formattedDate =
          newInvoice.invoice_date || format(new Date(), "dd.MM.yyyy");

        // Create the new invoice object with basic display fields
        const invoice = {
          id: newId,
          contract: newInvoice.contract_number || newInvoice.contract,
          date: formattedDate,
          amount: Number(newInvoice.total_amount_usd || newInvoice.amount || 0),
          currency: newInvoice.currency,
          status: newInvoice.status,
          // Store all the detailed data for viewing later
          details: { ...newInvoice },
        };

        // Add the new invoice to the list
        setAllInvoices([...allInvoices, invoice]);

        // Reset the form
        setNewInvoice({
          // Invoice Info
          invoice_number: "",
          invoice_date: "",

          // Receiver (TOO "SUN GRAIN")
          receiver_company_name: "ТОО «SUN GRAIN»", // Default value
          receiver_legal_country: "Республика Казахстан",
          receiver_legal_region: "Алматинская область",
          receiver_legal_district: "Карасайский район",
          receiver_legal_city: "город Каскелен",
          receiver_legal_street: "ул. Наурызбай",
          receiver_legal_office: "88, офис 7",
          receiver_bin: "231240014096",
          receiver_account_usd: "KZ0696507F0009576396",
          receiver_bank_branch: 'Филиал АО "ForteBank" в г. Павлодар',
          receiver_bic: "IRTYKZKA",
          receiver_correspondent_bank: "Bank of New York, USA",
          receiver_swift: "IRVTUS3N",
          receiver_account_number: "890-0548-533",

          // Sender
          sender_company_name: "",
          sender_country: "",
          sender_region: "",
          sender_district: "",
          sender_street: "",

          // Contract
          contract_number: "",
          contract_date: "",
          contract_appendix_number: "",
          contract_appendix_date: "",

          // Product & Payment
          product_name: "",
          price_per_ton_usd: "",
          total_quantity_mt: "",
          payment_amount_usd: "",
          total_amount_usd: "",

          // Signature
          director_name: "",

          // Original fields
          contract: "",
          amount: "",
          currency: "USD",
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

  // Add this function before the return statement
  const openViewInvoiceDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsViewInvoiceDialogOpen(true);
  };

  // Add this helper function to convert numbers to words (for Russian)
  function numberToWords(num: number): string {
    // This is a simplified version - in a real app, you'd want a more complete implementation
    const units = [
      "",
      "один",
      "два",
      "три",
      "четыре",
      "пять",
      "шесть",
      "семь",
      "восемь",
      "девять",
    ];
    const teens = [
      "десять",
      "одиннадцать",
      "двенадцать",
      "тринадцать",
      "четырнадцать",
      "пятнадцать",
      "шестнадцать",
      "семнадцать",
      "восемнадцать",
      "девятнадцать",
    ];
    const tens = [
      "",
      "",
      "двадцать",
      "тридцать",
      "сорок",
      "пятьдесят",
      "шестьдесят",
      "семьдесят",
      "восемьдесят",
      "девяносто",
    ];
    const hundreds = [
      "",
      "сто",
      "двести",
      "триста",
      "четыреста",
      "пятьсот",
      "шестьсот",
      "семьсот",
      "восемьсот",
      "девятьсот",
    ];

    if (num === 0) return "ноль";

    let result = "";

    // Handle thousands
    if (num >= 1000) {
      const thousandsDigit = Math.floor(num / 1000);
      if (thousandsDigit === 1) {
        result += "одна тысяча ";
      } else if (thousandsDigit === 2) {
        result += "две тысячи ";
      } else if (thousandsDigit >= 3 && thousandsDigit <= 4) {
        result += units[thousandsDigit] + " тысячи ";
      } else {
        result += units[thousandsDigit] + " тысяч ";
      }
      num %= 1000;
    }

    // Handle hundreds
    if (num >= 100) {
      result += hundreds[Math.floor(num / 100)] + " ";
      num %= 100;
    }

    // Handle tens and units
    if (num >= 10 && num < 20) {
      result += teens[num - 10] + " ";
    } else {
      if (num >= 20) {
        result += tens[Math.floor(num / 10)] + " ";
        num %= 10;
      }
      if (num > 0) {
        result += units[num] + " ";
      }
    }

    return result.trim().charAt(0).toUpperCase() + result.trim().slice(1);
  }

  // Add this function before the return statement
  const handleAddPayment = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      try {
        // Generate a new payment ID
        const newId = `PAY-${String(allPayments.length + 1).padStart(3, "0")}`;

        // Format the date
        const formattedDate =
          newPayment.payment_date || format(new Date(), "dd.MM.yyyy");

        // Create the new payment object
        const payment = {
          id: newId,
          invoice: newPayment.invoice_id,
          date: formattedDate,
          amount: Number(newPayment.payment_amount || 0),
          method: newPayment.payment_method,
          reference: newPayment.payment_reference,
          // Store all the detailed data for viewing later
          details: { ...newPayment },
        };

        // Add the new payment to the list
        setAllPayments([...allPayments, payment]);

        // Reset the form
        setNewPayment({
          invoice_id: "",
          payment_date: "",
          payment_amount: "",
          payment_currency: "USD",
          payment_method: "bank_transfer",
          payment_reference: "",
          payment_description: "",
          bank_name: "",
          bank_account: "",
          payment_status: "completed",
        });

        // Close the dialog
        setIsPaymentDialogOpen(false);
      } catch (error) {
        console.error("Error adding payment:", error);
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
                  <SelectContent className="w-full">
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
                  <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Создать новый счет</DialogTitle>
                      <DialogDescription>
                        Заполните информацию для создания нового счета
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      {/* Invoice Info Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          🧾 Информация о счете
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="invoice_number">Номер счета</Label>
                            <Input
                              id="invoice_number"
                              value={newInvoice.invoice_number}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  invoice_number: e.target.value,
                                })
                              }
                              placeholder="Введите номер счета"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invoice_date">Дата счета</Label>
                            <Input
                              id="invoice_date"
                              type="date"
                              value={newInvoice.invoice_date}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  invoice_date: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Receiver Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">📥 Получатель</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="receiver_company_name">
                              Название компании
                            </Label>
                            <Input
                              id="receiver_company_name"
                              value={newInvoice.receiver_company_name}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_company_name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_legal_country">
                              Страна
                            </Label>
                            <Input
                              id="receiver_legal_country"
                              value={newInvoice.receiver_legal_country}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_legal_country: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_legal_region">
                              Область
                            </Label>
                            <Input
                              id="receiver_legal_region"
                              value={newInvoice.receiver_legal_region}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_legal_region: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_legal_district">
                              Район
                            </Label>
                            <Input
                              id="receiver_legal_district"
                              value={newInvoice.receiver_legal_district}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_legal_district: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_legal_city">Город</Label>
                            <Input
                              id="receiver_legal_city"
                              value={newInvoice.receiver_legal_city}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_legal_city: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_legal_street">Улица</Label>
                            <Input
                              id="receiver_legal_street"
                              value={newInvoice.receiver_legal_street}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_legal_street: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_legal_office">Офис</Label>
                            <Input
                              id="receiver_legal_office"
                              value={newInvoice.receiver_legal_office}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_legal_office: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_bin">БИН</Label>
                            <Input
                              id="receiver_bin"
                              value={newInvoice.receiver_bin}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_bin: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_account_usd">
                              Счет USD
                            </Label>
                            <Input
                              id="receiver_account_usd"
                              value={newInvoice.receiver_account_usd}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_account_usd: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_bank_branch">
                              Филиал банка
                            </Label>
                            <Input
                              id="receiver_bank_branch"
                              value={newInvoice.receiver_bank_branch}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_bank_branch: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_bic">БИК</Label>
                            <Input
                              id="receiver_bic"
                              value={newInvoice.receiver_bic}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_bic: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_correspondent_bank">
                              Банк-корреспондент
                            </Label>
                            <Input
                              id="receiver_correspondent_bank"
                              value={newInvoice.receiver_correspondent_bank}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_correspondent_bank: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_swift">SWIFT</Label>
                            <Input
                              id="receiver_swift"
                              value={newInvoice.receiver_swift}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_swift: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="receiver_account_number">
                              Номер счета
                            </Label>
                            <Input
                              id="receiver_account_number"
                              value={newInvoice.receiver_account_number}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  receiver_account_number: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sender Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          📤 Отправитель
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="sender_company_name">
                              Название компании
                            </Label>
                            <Input
                              id="sender_company_name"
                              value={newInvoice.sender_company_name}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  sender_company_name: e.target.value,
                                })
                              }
                              placeholder="ООО «Название компании»"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sender_country">Страна</Label>
                            <Input
                              id="sender_country"
                              value={newInvoice.sender_country}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  sender_country: e.target.value,
                                })
                              }
                              placeholder="Республика Таджикистан"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sender_region">Область</Label>
                            <Input
                              id="sender_region"
                              value={newInvoice.sender_region}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  sender_region: e.target.value,
                                })
                              }
                              placeholder="Согдийская область"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sender_district">Район</Label>
                            <Input
                              id="sender_district"
                              value={newInvoice.sender_district}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  sender_district: e.target.value,
                                })
                              }
                              placeholder="Б.Гафуровский р-н"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="sender_street">Улица</Label>
                            <Input
                              id="sender_street"
                              value={newInvoice.sender_street}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  sender_street: e.target.value,
                                })
                              }
                              placeholder="ул. Ленина"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contract Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">📄 Контракт</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contract_number">
                              Номер контракта
                            </Label>
                            <Input
                              id="contract_number"
                              value={newInvoice.contract_number}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  contract_number: e.target.value,
                                })
                              }
                              placeholder="SG-MH-1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contract_date">
                              Дата контракта
                            </Label>
                            <Input
                              id="contract_date"
                              type="date"
                              value={newInvoice.contract_date}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  contract_date: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contract_appendix_number">
                              Номер приложения
                            </Label>
                            <Input
                              id="contract_appendix_number"
                              value={newInvoice.contract_appendix_number}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  contract_appendix_number: e.target.value,
                                })
                              }
                              placeholder="3"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contract_appendix_date">
                              Дата приложения
                            </Label>
                            <Input
                              id="contract_appendix_date"
                              type="date"
                              value={newInvoice.contract_appendix_date}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  contract_appendix_date: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Product & Payment Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          🌾 Продукт и оплата
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="product_name">
                              Название продукта
                            </Label>
                            <Input
                              id="product_name"
                              value={newInvoice.product_name}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  product_name: e.target.value,
                                })
                              }
                              placeholder="Пшеница мягкая"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="price_per_ton_usd">
                              Цена за тонну (USD)
                            </Label>
                            <Input
                              id="price_per_ton_usd"
                              type="number"
                              value={newInvoice.price_per_ton_usd}
                              onChange={(e) => {
                                const price = e.target.value;
                                const quantity = newInvoice.total_quantity_mt;
                                const payment =
                                  price && quantity
                                    ? Number(price) * Number(quantity)
                                    : "";

                                setNewInvoice({
                                  ...newInvoice,
                                  price_per_ton_usd: price,
                                  payment_amount_usd: String(payment),
                                  total_amount_usd: String(payment),
                                });
                              }}
                              placeholder="120"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="total_quantity_mt">
                              Количество (МТ)
                            </Label>
                            <Input
                              id="total_quantity_mt"
                              type="number"
                              value={newInvoice.total_quantity_mt}
                              onChange={(e) => {
                                const quantity = e.target.value;
                                const price = newInvoice.price_per_ton_usd;
                                const payment =
                                  price && quantity
                                    ? Number(price) * Number(quantity)
                                    : "";

                                setNewInvoice({
                                  ...newInvoice,
                                  total_quantity_mt: quantity,
                                  payment_amount_usd: String(payment),
                                  total_amount_usd: String(payment),
                                });
                              }}
                              placeholder="136"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="payment_amount_usd">
                              Сумма оплаты (USD)
                            </Label>
                            <Input
                              id="payment_amount_usd"
                              type="number"
                              value={newInvoice.payment_amount_usd}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  payment_amount_usd: e.target.value,
                                  total_amount_usd: e.target.value,
                                })
                              }
                              placeholder="16320"
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="total_amount_usd">
                              Итоговая сумма (USD)
                            </Label>
                            <Input
                              id="total_amount_usd"
                              type="number"
                              value={newInvoice.total_amount_usd}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  total_amount_usd: e.target.value,
                                })
                              }
                              placeholder="16320"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Signature Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">🧑‍💼 Подпись</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="director_name">ФИО директора</Label>
                            <Input
                              id="director_name"
                              value={newInvoice.director_name}
                              onChange={(e) =>
                                setNewInvoice({
                                  ...newInvoice,
                                  director_name: e.target.value,
                                })
                              }
                              placeholder="Иванов И.И."
                            />
                          </div>
                        </div>
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
                              onClick={() => openViewInvoiceDialog(invoice)}
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Просмотр</span>
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
              <Dialog
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Добавить платеж
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Добавить новый платеж</DialogTitle>
                    <DialogDescription>
                      Заполните информацию о платеже
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    {/* Payment Info Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        💰 Информация о платеже
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2 w-full">
                          <Label htmlFor="invoice_id" className="w-full">
                            Счет
                          </Label>
                          <Select
                            value={newPayment.invoice_id}
                            onValueChange={(value) =>
                              setNewPayment({
                                ...newPayment,
                                invoice_id: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Выберите счет" />
                            </SelectTrigger>
                            <SelectContent>
                              {invoices.map((invoice) => (
                                <SelectItem key={invoice.id} value={invoice.id}>
                                  {invoice.id} (
                                  {invoice.amount.toLocaleString()}{" "}
                                  {invoice.currency})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment_date">Дата платежа</Label>
                          <Input
                            id="payment_date"
                            type="date"
                            value={newPayment.payment_date}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                payment_date: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment_amount">Сумма платежа</Label>
                          <Input
                            id="payment_amount"
                            type="number"
                            value={newPayment.payment_amount}
                            onChange={(e) =>
                              setNewPayment({
                                ...newPayment,
                                payment_amount: e.target.value,
                              })
                            }
                            placeholder="1000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="payment_currency">Валюта</Label>
                          <Select
                            value={newPayment.payment_currency}
                            onValueChange={(value) =>
                              setNewPayment({
                                ...newPayment,
                                payment_currency: value,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Выберите валюту" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="RUB">RUB</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="KZT">KZT</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddPayment} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Создание...
                        </>
                      ) : (
                        "Добавить платеж"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Оплата</CardTitle>
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
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayments.length > 0 ? (
                      allPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.id}
                          </TableCell>
                          <TableCell>{payment.invoice}</TableCell>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>
                            {payment.amount.toLocaleString()}{" "}
                            {payment.details?.payment_currency || "RUB"}
                          </TableCell>
                          <TableCell>
                            {payment.method === "bank_transfer"
                              ? "Банковский перевод"
                              : payment.method === "cash"
                              ? "Наличные"
                              : payment.method === "credit_card"
                              ? "Кредитная карта"
                              : payment.method}
                          </TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Скачать</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Платежи не найдены.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* View Invoice Dialog */}
      {selectedInvoice && (
        <Dialog
          open={isViewInvoiceDialogOpen}
          onOpenChange={setIsViewInvoiceDialogOpen}
        >
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Детали счета</DialogTitle>
              <DialogDescription>
                Информация о счете №{selectedInvoice.id}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-right text-lg font-bold mb-6">
                {selectedInvoice.date}
              </div>

              <div className="border rounded-md p-4 space-y-4">
                <div>
                  <h3 className="font-bold text-lg">Получатель:</h3>
                  <p className="text-lg font-bold mt-2">
                    {selectedInvoice.details?.receiver_company_name ||
                      "ТОО «SUN GRAIN»"}
                  </p>

                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="font-bold">Юридический адрес:</span>{" "}
                      {selectedInvoice.details?.receiver_legal_country ||
                        "Республика Казахстан"}
                      ,
                      {selectedInvoice.details?.receiver_legal_region ||
                        "Алматинская область"}
                      ,
                      {selectedInvoice.details?.receiver_legal_district ||
                        "Карасайский район"}
                      ,
                      {selectedInvoice.details?.receiver_legal_city ||
                        "город Каскелен"}
                      ,
                      {selectedInvoice.details?.receiver_legal_street ||
                        "ул. Наурызбай"}
                      ,
                      {selectedInvoice.details?.receiver_legal_office ||
                        "88, офис 7"}
                    </p>
                    <p>
                      <span className="font-bold">БИН:</span>{" "}
                      {selectedInvoice.details?.receiver_bin || "231240014096"}
                    </p>
                    <p>
                      <span className="font-bold">Текущий счет USD:</span>{" "}
                      {selectedInvoice.details?.receiver_account_usd ||
                        "KZ0696507F0009576396"}
                    </p>
                    <p>
                      {selectedInvoice.details?.receiver_bank_branch ||
                        'Филиал АО "ForteBank" в г. Павлодар'}
                    </p>
                    <p>
                      <span className="font-bold">БИК:</span>{" "}
                      {selectedInvoice.details?.receiver_bic || "IRTYKZKA"}
                    </p>
                    <p>
                      <span className="font-bold">CORRESPONDENT BANK:</span>{" "}
                      {selectedInvoice.details?.receiver_correspondent_bank ||
                        "Bank of New York, USA"}
                    </p>
                    <p>
                      <span className="font-bold">SWIFT:</span>{" "}
                      {selectedInvoice.details?.receiver_swift || "IRVTUS3N"}
                    </p>
                    <p>
                      <span className="font-bold">ACC:</span>{" "}
                      {selectedInvoice.details?.receiver_account_number ||
                        "890-0548-533"}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p>
                    <span className="font-bold">Отправитель:</span> ООО «
                    {selectedInvoice.details?.sender_company_name ||
                      "Манучехр Хучаев"}
                    »,
                    {selectedInvoice.details?.sender_country ||
                      "Республика Таджикистан"}
                    {selectedInvoice.details?.sender_region ||
                      "Согдийская область"}
                    {selectedInvoice.details?.sender_district ||
                      "Б.Гафуровский р-н"}
                    ,{selectedInvoice.details?.sender_street || "ул. Ленина"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="font-bold">Контракт №</div>
                  <div>
                    №{selectedInvoice.details?.contract_number || "SG-MH-1"} от{" "}
                    {selectedInvoice.details?.contract_date
                      ? format(
                          new Date(selectedInvoice.details.contract_date),
                          "d MMMM yyyy",
                          { locale: ru }
                        )
                      : "1 февраля 2025"}{" "}
                    года
                    {selectedInvoice.details?.contract_appendix_number &&
                      `, приложение №${selectedInvoice.details.contract_appendix_number}`}
                    {selectedInvoice.details?.contract_appendix_date &&
                      ` от ${format(
                        new Date(
                          selectedInvoice.details.contract_appendix_date
                        ),
                        "d MMMM yyyy",
                        {
                          locale: ru,
                        }
                      )} года`}
                  </div>

                  <div className="font-bold">
                    {selectedInvoice.details?.product_name || "Пшеница мягкая"}
                  </div>
                  <div>
                    {selectedInvoice.details?.price_per_ton_usd || "120"} USD за
                    тонну
                  </div>

                  <div className="font-bold">
                    Оплата за{" "}
                    {selectedInvoice.details?.total_quantity_mt || "136"} МТ
                  </div>
                  <div>
                    {selectedInvoice.details?.payment_amount_usd || "16 320"}{" "}
                    USD
                  </div>

                  <div className="font-bold">Всего:</div>
                  <div>
                    {selectedInvoice.details?.total_amount_usd || "16 320"}
                    {selectedInvoice.details?.total_amount_usd
                      ? ` (${numberToWords(
                          Number(selectedInvoice.details.total_amount_usd)
                        )})`
                      : " (Шестнадцать тысяч триста двадцать)"}{" "}
                    долларов США, 00 центов
                  </div>
                </div>

                {selectedInvoice.details?.director_name && (
                  <div className="border-t pt-4 text-right">
                    <p className="font-bold">
                      Директор: {selectedInvoice.details.director_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsViewInvoiceDialogOpen(false)}
              >
                Закрыть
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Скачать счет
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
