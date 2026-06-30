"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
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
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  FileDown,
  FileCheck2,
  FileText,
  Filter,
  History,
  Landmark,
  Link2,
  Plus,
  Receipt,
  Search,
  Send,
  TimerReset,
  UserRound,
  WalletCards,
  Wheat,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { getApplications } from "@/entities/applications/api/get/get-applications.api";
import { useGetContracts } from "@/entities/contracts/hooks/query/use-get-contracts.query";
import { getInvoices } from "@/entities/invoices/api/get/get-invoices.api";
import { useCreateInvoice } from "@/entities/invoices/hooks/mutations/use-create-invoice.mutation";
import { useUpdateInvoice } from "@/entities/invoices/hooks/mutations/use-update-invoice.mutation";
import {
  buildFinanceCurrencySummaries,
  getFinanceInvoiceBalance,
  getFinanceInvoicePaidAmount,
  mapBackendInvoiceToFinanceInvoice,
  toEntityArray,
  type FinanceDocument,
  type FinanceCurrencySummary,
  type FinanceHistoryItem,
  type FinanceInvoice,
  type InvoiceStatus,
} from "./finance-normalizers";

type PaymentStatus = "completed" | "processing" | "reconciled" | "failed";

type FinancePayment = {
  id: string;
  invoice: string;
  contract: string;
  date: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  status: PaymentStatus;
  documents: FinanceDocument[];
  history: FinanceHistoryItem[];
  details?: Record<string, string>;
};

const createDefaultInvoiceForm = () => ({
  application_id: "",
  invoice_number: "",
  invoice_date: "",
  receiver_company_name: "ТОО «SUN GRAIN»",
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
  sender_company_name: "",
  sender_country: "",
  sender_region: "",
  sender_district: "",
  sender_street: "",
  contract_number: "",
  contract_date: "",
  contract_appendix_number: "",
  contract_appendix_date: "",
  product_name: "",
  price_per_ton_usd: "",
  total_quantity_mt: "",
  payment_amount_usd: "",
  total_amount_usd: "",
  director_name: "",
  contract: "",
  amount: "",
  currency: "USD",
  status: "pending",
  dueDate: "",
  description: "",
});

const createDefaultPaymentForm = () => ({
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

const currencyMark = (currency: string) => {
  const normalized = (currency || "USD").trim().toUpperCase();

  return normalized === "KZT" || normalized === "₸" ? "₸" : normalized;
};

const formatMoney = (value: number, currency: string) =>
  formatCurrency(value, currencyMark(currency));

const createDocument = (
  id: string,
  title: string,
  kind: string,
  fileName: string,
  updatedAt: string,
  size = "128 KB"
): FinanceDocument => ({
  id,
  title,
  kind,
  fileName,
  updatedAt,
  size,
});

const invoices: FinanceInvoice[] = [
  {
    id: "INV-001",
    contract: "001-2024",
    contractId: "SG-2026-001",
    contractTitle: "Экспорт пшеницы в порт Актау",
    counterparty: "Sungrain Terminal",
    date: "15.03.2024",
    dueDate: "20.03.2024",
    amount: 1250000,
    paidAmount: 1250000,
    currency: "KZT",
    status: "paid",
    paymentTerms: "100% оплата по факту выставления счета",
    documents: [
      createDocument(
        "DOC-INV-001",
        "Счет на оплату",
        "PDF",
        "INV-001-schet.pdf",
        "15.03.2024"
      ),
      createDocument(
        "DOC-ACT-001",
        "Акт сверки",
        "XLSX",
        "INV-001-akt-sverki.xlsx",
        "18.03.2024",
        "84 KB"
      ),
    ],
    history: [
      {
        date: "15.03.2024",
        title: "Счет создан",
        description: "Счет привязан к контракту SG-2026-001.",
        tone: "slate",
      },
      {
        date: "17.03.2024",
        title: "Платеж подтвержден",
        description: "Поступление закрывает счет полностью.",
        tone: "green",
      },
    ],
  },
  {
    id: "INV-002",
    contract: "002-2024",
    contractId: "SG-2026-002",
    contractTitle: "Поставка ячменя в Алматы",
    counterparty: "Almaty Feed Group",
    date: "10.03.2024",
    dueDate: "25.03.2024",
    amount: 875000,
    paidAmount: 0,
    currency: "KZT",
    status: "pending",
    paymentTerms: "Оплата в течение 15 календарных дней",
    documents: [
      createDocument(
        "DOC-INV-002",
        "Счет на оплату",
        "PDF",
        "INV-002-schet.pdf",
        "10.03.2024"
      ),
    ],
    history: [
      {
        date: "10.03.2024",
        title: "Счет выставлен",
        description: "Ожидается подтверждение оплаты от клиента.",
        tone: "orange",
      },
    ],
  },
  {
    id: "INV-003",
    contract: "001-2024",
    contractId: "SG-2026-003",
    contractTitle: "Лен на экспорт",
    counterparty: "Black Sea Grain",
    date: "05.03.2024",
    amount: 950000,
    dueDate: "18.03.2024",
    paidAmount: 520000,
    currency: "KZT",
    status: "partial",
    paymentTerms: "Допускается частичная оплата двумя траншами",
    documents: [
      createDocument(
        "DOC-INV-003",
        "Счет на оплату",
        "PDF",
        "INV-003-schet.pdf",
        "05.03.2024"
      ),
      createDocument(
        "DOC-PAY-003",
        "Платежное поручение",
        "PDF",
        "PAY-002-poruchenie.pdf",
        "07.03.2024",
        "96 KB"
      ),
    ],
    history: [
      {
        date: "05.03.2024",
        title: "Счет создан",
        description: "Счет готов к оплате и отправлен контрагенту.",
      },
      {
        date: "07.03.2024",
        title: "Частичная оплата",
        description: "Поступил первый транш на 520 000 ₸.",
        tone: "green",
      },
    ],
  },
  {
    id: "INV-004",
    contract: "003-2024",
    contractId: "SG-2026-004",
    contractTitle: "Рапс для переработки",
    counterparty: "Caspian Food Logistics",
    date: "01.03.2024",
    dueDate: "12.03.2024",
    amount: 1100000,
    paidAmount: 250000,
    currency: "KZT",
    status: "overdue",
    overdueDays: 8,
    paymentTerms: "Просрочка после 10 календарных дней",
    documents: [
      createDocument(
        "DOC-INV-004",
        "Счет на оплату",
        "PDF",
        "INV-004-schet.pdf",
        "01.03.2024"
      ),
      createDocument(
        "DOC-CLAIM-004",
        "Уведомление о просрочке",
        "PDF",
        "INV-004-prosrochka.pdf",
        "13.03.2024",
        "72 KB"
      ),
    ],
    history: [
      {
        date: "01.03.2024",
        title: "Счет создан",
        description: "Плановая дата оплаты: 12.03.2024.",
      },
      {
        date: "13.03.2024",
        title: "Просрочка оплаты",
        description: "Сформировано уведомление для контрагента.",
        tone: "red",
      },
    ],
  },
  {
    id: "INV-005",
    contract: "004-2024",
    contractId: "SG-2026-005",
    contractTitle: "Подсолнечник, внутренняя поставка",
    counterparty: "Almaty Feed Group",
    date: "25.02.2024",
    dueDate: "01.03.2024",
    amount: 780000,
    paidAmount: 780000,
    currency: "KZT",
    status: "paid",
    paymentTerms: "Закрыто одним платежом",
    documents: [
      createDocument(
        "DOC-INV-005",
        "Счет на оплату",
        "PDF",
        "INV-005-schet.pdf",
        "25.02.2024"
      ),
    ],
    history: [
      {
        date: "25.02.2024",
        title: "Счет выставлен",
        description: "Документ создан на основании контракта SG-2026-005.",
      },
      {
        date: "27.02.2024",
        title: "Оплата закрыта",
        description: "Получен банковский перевод REF345678.",
        tone: "green",
      },
    ],
  },
];

const payments: FinancePayment[] = [
  {
    id: "PAY-001",
    invoice: "INV-001",
    contract: "SG-2026-001",
    date: "17.03.2024",
    amount: 1250000,
    currency: "KZT",
    method: "bank_transfer",
    reference: "REF123456",
    status: "reconciled",
    documents: [
      createDocument(
        "DOC-PAY-001",
        "Платежное поручение",
        "PDF",
        "PAY-001-poruchenie.pdf",
        "17.03.2024"
      ),
    ],
    history: [
      {
        date: "17.03.2024",
        title: "Поступление импортировано",
        description: "Банк прислал референс REF123456.",
      },
      {
        date: "17.03.2024",
        title: "Сверено со счетом",
        description: "Платеж закрыл счет INV-001.",
        tone: "green",
      },
    ],
  },
  {
    id: "PAY-002",
    invoice: "INV-003",
    contract: "SG-2026-003",
    date: "07.03.2024",
    amount: 520000,
    currency: "KZT",
    method: "bank_transfer",
    reference: "REF789012",
    status: "completed",
    documents: [
      createDocument(
        "DOC-PAY-002",
        "Платежное поручение",
        "PDF",
        "PAY-002-poruchenie.pdf",
        "07.03.2024",
        "96 KB"
      ),
    ],
    history: [
      {
        date: "07.03.2024",
        title: "Частичная оплата",
        description: "Платеж распределен на 55% суммы счета.",
        tone: "orange",
      },
    ],
  },
  {
    id: "PAY-003",
    invoice: "INV-005",
    contract: "SG-2026-005",
    date: "27.02.2024",
    amount: 780000,
    currency: "KZT",
    method: "bank_transfer",
    reference: "REF345678",
    status: "reconciled",
    documents: [
      createDocument(
        "DOC-PAY-003",
        "Платежное поручение",
        "PDF",
        "PAY-003-poruchenie.pdf",
        "27.02.2024"
      ),
    ],
    history: [
      {
        date: "27.02.2024",
        title: "Платеж проведен",
        description: "Счет INV-005 переведен в статус «Оплачен».",
        tone: "green",
      },
    ],
  },
  {
    id: "PAY-004",
    invoice: "INV-004",
    contract: "SG-2026-004",
    date: "09.03.2024",
    amount: 250000,
    currency: "KZT",
    method: "bank_transfer",
    reference: "REF555204",
    status: "processing",
    documents: [
      createDocument(
        "DOC-PAY-004",
        "Выписка банка",
        "PDF",
        "PAY-004-bank-statement.pdf",
        "09.03.2024",
        "110 KB"
      ),
    ],
    history: [
      {
        date: "09.03.2024",
        title: "Платеж найден",
        description: "Требуется ручная сверка остатка по счету.",
        tone: "orange",
      },
    ],
  },
];

type DatePickerFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function parseDateValue(value: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDisplayDate(value: string) {
  if (!value) {
    return "";
  }

  const parsedDate = parseDateValue(value);
  return parsedDate ? format(parsedDate, "dd.MM.yyyy") : value;
}

function DatePickerField({
  id,
  value,
  onChange,
  placeholder = "Выберите дату",
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateValue(value);

  const clearDate = () => {
    onChange("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={`justify-between px-3 text-left font-semibold ${
            selectedDate ? "text-[#223137]" : "text-[#9aa49f]"
          } ${className ?? ""}`}
        >
          <span>
            {selectedDate ? format(selectedDate, "dd.MM.yyyy") : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 text-[#6f7774]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-auto border-[#dfe7de] bg-white p-2 shadow-[0_18px_44px_rgba(34,49,55,0.16)]"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) {
              clearDate();
              return;
            }

            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          locale={ru}
          initialFocus
          className="rounded-md bg-white"
          classNames={{
            caption_label: "text-sm font-black capitalize text-[#223137]",
            nav_button:
              "size-8 rounded-md border-[#dfe7de] bg-[#fbfcfa] text-[#53605a] opacity-100 hover:bg-[#eef5ef] hover:text-[#2f6b4f]",
            head_cell:
              "w-9 rounded-md text-[0.72rem] font-black uppercase text-[#7b857f]",
            day: "size-9 rounded-md p-0 text-sm font-semibold text-[#223137] hover:bg-[#fff3e5] hover:text-[#d5740b]",
            day_selected:
              "bg-[#f38810] text-white hover:bg-[#f38810] hover:text-white focus:bg-[#f38810] focus:text-white",
            day_today: "bg-[#eef5ef] text-[#2f6b4f]",
            day_outside: "text-[#b6beb9] opacity-70",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default function FinancesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const shouldSeedFinanceMocks =
    process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
  const [financeError, setFinanceError] = useState("");
  const [allInvoices, setAllInvoices] = useState<FinanceInvoice[]>(
    shouldSeedFinanceMocks ? invoices : []
  );
  const [newInvoice, setNewInvoice] = useState(createDefaultInvoiceForm);

  // Add this state after the other state declarations
  const [isViewInvoiceDialogOpen, setIsViewInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FinanceInvoice | null>(
    null
  );

  // Add these new state variables after the existing state declarations
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isViewPaymentDialogOpen, setIsViewPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FinancePayment | null>(
    null
  );
  const [allPayments, setAllPayments] = useState<FinancePayment[]>(
    shouldSeedFinanceMocks ? payments : []
  );
  const [newPayment, setNewPayment] = useState(createDefaultPaymentForm);
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const {
    data: contractsResponse,
    isLoading: isContractsLoading,
    refetch: refetchContracts,
  } = useGetContracts({ page: 1, limit: 100, enabled: true });

  const contractRows = useMemo(
    () => toEntityArray<Record<string, any>>(contractsResponse),
    [contractsResponse]
  );

  const applicationQueries = useQueries({
    queries: contractRows.map((contract) => ({
      queryKey: ["applications", String(contract.id)],
      queryFn: () => getApplications(String(contract.id)),
      enabled: Boolean(contract.id),
    })),
  });

  const applicationContexts = useMemo(
    () =>
      contractRows.flatMap((contract, index) =>
        toEntityArray<Record<string, any>>(applicationQueries[index]?.data).map(
          (application) => ({ application, contract })
        )
      ),
    [applicationQueries, contractRows]
  );

  const invoiceQueries = useQueries({
    queries: applicationContexts.map(({ application }) => ({
      queryKey: ["invoices", String(application.id)],
      queryFn: () => getInvoices(String(application.id)),
      enabled: Boolean(application.id),
    })),
  });

  const backendInvoices = useMemo(
    () =>
      applicationContexts.flatMap((context, index) =>
        toEntityArray<Record<string, any>>(invoiceQueries[index]?.data).map(
          (invoice) =>
            mapBackendInvoiceToFinanceInvoice({
              invoice,
              application: context.application,
              contract: context.contract,
            })
        )
      ),
    [applicationContexts, invoiceQueries]
  );

  const applicationOptions = useMemo(
    () =>
      applicationContexts.map(({ application, contract }) => {
        const amount = Number(application.total_amount || 0);
        const volume = Number(
          application.volume || application.total_volume || contract.total_volume || 0
        );
        const currency = String(
          application.currency || contract.currency || newInvoice.currency
        );
        const contractNumber = String(
          contract.number || contract.contract_number || contract.id || ""
        );
        const contractTitle = String(
          contract.name || application.name || contractNumber || "Контракт"
        );

        return {
          applicationId: String(application.id),
          label: `${contractNumber || "Контракт"} · ${
            application.name || `Заявка ${application.id}`
          }`,
          contractNumber,
          contractTitle,
          productName: String(contract.crop || application.crop || contractTitle),
          counterparty: String(
            contract.receiver ||
              contract.receiver_name ||
              application.receiver ||
              application.counterparty ||
              ""
          ),
          amount: amount ? String(amount) : "",
          volume: volume ? String(volume) : "",
          currency,
        };
      }),
    [applicationContexts, newInvoice.currency]
  );

  const isFinanceLoading =
    isContractsLoading ||
    applicationQueries.some((query) => query.isLoading) ||
    invoiceQueries.some((query) => query.isLoading);
  const backendInvoiceKey = backendInvoices
    .map(
      (invoice) =>
        `${invoice.backendId}:${invoice.applicationId}:${invoice.amount}:${invoice.status}`
    )
    .join("|");

  useEffect(() => {
    if (isFinanceLoading) return;

    setAllInvoices(backendInvoices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendInvoiceKey, isFinanceLoading]);

  const refetchFinanceData = async () => {
    await Promise.all([
      refetchContracts(),
      ...applicationQueries.map((query) => query.refetch()),
      ...invoiceQueries.map((query) => query.refetch()),
    ]);
  };

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

  const handleAddInvoice = async () => {
    setFinanceError("");

    const amount = Number(
      newInvoice.total_amount_usd ||
        newInvoice.payment_amount_usd ||
        newInvoice.amount ||
        0
    );

    if (!newInvoice.application_id) {
      setFinanceError("Выберите заявку, к которой нужно привязать счет.");
      return;
    }

    if (!amount) {
      setFinanceError("Укажите итоговую сумму счета.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createInvoiceMutation.mutateAsync({
        applicationId: newInvoice.application_id,
        name:
          newInvoice.invoice_number ||
          `Счет ${format(new Date(), "dd.MM.yyyy")}`,
        number: newInvoice.invoice_number || undefined,
        date: newInvoice.invoice_date || format(new Date(), "yyyy-MM-dd"),
        amount,
        status: newInvoice.status,
        description:
          newInvoice.description ||
          `${newInvoice.product_name || "Счет"} · ${
            newInvoice.contract_number || "контракт не указан"
          }`,
      });

      await refetchFinanceData();
      setNewInvoice(createDefaultInvoiceForm());
      setIsInvoiceDialogOpen(false);
    } catch (error) {
      console.error("Error adding invoice:", error);
      setFinanceError("Не получилось создать счет. Проверьте данные и backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add this function before the return statement
  const openViewInvoiceDialog = (invoice: FinanceInvoice) => {
    setSelectedInvoice(invoice);
    setIsViewInvoiceDialogOpen(true);
  };

  const openViewPaymentDialog = (payment: FinancePayment) => {
    setSelectedPayment(payment);
    setIsViewPaymentDialogOpen(true);
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

  const handleAddPayment = async () => {
    setFinanceError("");

    const linkedInvoice = allInvoices.find(
      (invoice) => invoice.id === newPayment.invoice_id
    );
    const paymentAmount = Number(newPayment.payment_amount || 0);

    if (!linkedInvoice) {
      setFinanceError("Выберите счет для привязки платежа.");
      return;
    }

    if (!paymentAmount) {
      setFinanceError("Укажите сумму платежа.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newId = `PAY-${String(allPayments.length + 1).padStart(3, "0")}`;
      const formattedDate =
        formatDisplayDate(newPayment.payment_date) ||
        format(new Date(), "dd.MM.yyyy");
      const nextPaidAmount = Math.min(
        linkedInvoice.amount,
        linkedInvoice.paidAmount + paymentAmount
      );
      const nextStatus = getNextInvoiceStatus(linkedInvoice, nextPaidAmount);

      if (linkedInvoice.backendId && linkedInvoice.applicationId) {
        await updateInvoiceMutation.mutateAsync({
          id: linkedInvoice.backendId,
          applicationId: linkedInvoice.applicationId,
          data: {
            status: nextStatus,
          },
        });
      }

      const payment: FinancePayment = {
        id: newId,
        invoice: newPayment.invoice_id,
        contract: linkedInvoice.contractId || linkedInvoice.contract,
        date: formattedDate,
        amount: paymentAmount,
        currency: newPayment.payment_currency,
        method: newPayment.payment_method,
        reference: newPayment.payment_reference,
        status: newPayment.payment_status as PaymentStatus,
        documents: [
          createDocument(
            `DOC-${newId}`,
            "Платежное поручение",
            "PDF",
            `${newId}-payment-order.pdf`,
            formattedDate
          ),
        ],
        history: [
          {
            date: formattedDate,
            title: "Платеж добавлен",
            description: "Поступление связано со счетом и ожидает сверки.",
            tone: "orange",
          },
        ],
        details: { ...newPayment },
      };

      setAllPayments((current) => [...current, payment]);
      setAllInvoices((current) =>
        current.map((invoice) => {
          if (invoice.id !== newPayment.invoice_id) {
            return invoice;
          }

          return {
            ...invoice,
            paidAmount: nextPaidAmount,
            status: nextStatus,
            history: [
              ...invoice.history,
              {
                date: formattedDate,
                title: "Добавлен платеж",
                description: `${formatMoney(
                  paymentAmount,
                  payment.currency
                )} распределено по счету.`,
                tone: "green",
              },
            ],
          };
        })
      );

      await refetchFinanceData();
      setNewPayment(createDefaultPaymentForm());
      setIsPaymentDialogOpen(false);
    } catch (error) {
      console.error("Error adding payment:", error);
      setFinanceError("Не получилось сохранить платеж. Проверьте backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInvoicePaidAmount = getFinanceInvoicePaidAmount;
  const getInvoiceBalance = getFinanceInvoiceBalance;

  const getInvoiceProgress = (invoice: FinanceInvoice) => {
    if (!invoice.amount) {
      return 0;
    }

    return Math.min(
      Math.round((getInvoicePaidAmount(invoice) / invoice.amount) * 100),
      100
    );
  };

  const getInvoicePayments = (invoiceId: string) =>
    allPayments.filter((payment) => payment.invoice === invoiceId);

  const getNextInvoiceStatus = (
    invoice: FinanceInvoice,
    nextPaidAmount: number
  ): InvoiceStatus => {
    if (nextPaidAmount >= invoice.amount) {
      return "paid";
    }

    if (invoice.status === "overdue") {
      return "overdue";
    }

    return nextPaidAmount > 0 ? "partial" : "pending";
  };

  const financeSummaryRows = useMemo<FinanceCurrencySummary[]>(() => {
    const summaries = buildFinanceCurrencySummaries(allInvoices);

    if (summaries.length) {
      return summaries;
    }

    return [
      {
        currency: "USD",
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        balance: 0,
        invoiceCount: 0,
        paidCount: 0,
        pendingCount: 0,
        partialCount: 0,
        overdueCount: 0,
        openCount: 0,
      },
    ];
  }, [allInvoices]);
  const formatFinanceSummary = (
    selector: (summary: FinanceCurrencySummary) => number
  ) =>
    financeSummaryRows
      .map((summary) => formatMoney(selector(summary), summary.currency))
      .join(" / ");
  const invoiceStats = {
    total: formatFinanceSummary((summary) => summary.total),
    paid: formatFinanceSummary((summary) => summary.paid),
    pending: formatFinanceSummary((summary) => summary.pending),
    overdue: formatFinanceSummary((summary) => summary.overdue),
    balance: formatFinanceSummary((summary) => summary.balance),
  };
  const paidCount = financeSummaryRows.reduce(
    (sum, summary) => sum + summary.paidCount,
    0
  );
  const pendingCount = financeSummaryRows.reduce(
    (sum, summary) => sum + summary.pendingCount,
    0
  );
  const partialCount = financeSummaryRows.reduce(
    (sum, summary) => sum + summary.partialCount,
    0
  );
  const overdueCount = financeSummaryRows.reduce(
    (sum, summary) => sum + summary.overdueCount,
    0
  );
  const openInvoiceCount = financeSummaryRows.reduce(
    (sum, summary) => sum + summary.openCount,
    0
  );
  const paymentCurrencyTotals = useMemo(() => {
    const totals = new Map<string, number>();

    allPayments.forEach((payment) => {
      const currency = (payment.currency || financeSummaryRows[0]?.currency || "USD")
        .trim()
        .toUpperCase();
      const normalizedCurrency = currency === "₸" ? "KZT" : currency;
      totals.set(
        normalizedCurrency,
        (totals.get(normalizedCurrency) || 0) + payment.amount
      );
    });

    if (!totals.size) {
      totals.set(financeSummaryRows[0]?.currency || "USD", 0);
    }

    return Array.from(totals.entries()).map(([currency, total]) => ({
      currency,
      total,
    }));
  }, [allPayments, financeSummaryRows]);
  const paymentTotalText = paymentCurrencyTotals
    .map((summary) => formatMoney(summary.total, summary.currency))
    .join(" / ");

  const getStatusLabel = (status: string) => {
    if (status === "paid") return "Оплачен";
    if (status === "partial") return "Частично";
    if (status === "pending") return "Ожидает";
    if (status === "overdue") return "Просрочен";
    return status;
  };

  const getStatusClassName = (status: string) => {
    if (status === "paid") {
      return "border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]";
    }
    if (status === "partial") {
      return "border-[#f2dfca] bg-[#fff8ed] text-[#c16f11]";
    }
    if (status === "overdue") {
      return "border-[#f4d6ce] bg-[#fff1ed] text-[#b9472d]";
    }
    return "border-[#f2dfca] bg-[#fff3e5] text-[#d5740b]";
  };

  const getPaymentStatusLabel = (status: string) => {
    if (status === "reconciled") return "Сверен";
    if (status === "completed") return "Проведен";
    if (status === "processing") return "В обработке";
    if (status === "failed") return "Ошибка";
    return status;
  };

  const getPaymentStatusClassName = (status: string) => {
    if (status === "reconciled") {
      return "border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]";
    }
    if (status === "completed") {
      return "border-[#dbe7ef] bg-[#f3f8fb] text-[#527f95]";
    }
    if (status === "failed") {
      return "border-[#f4d6ce] bg-[#fff1ed] text-[#b9472d]";
    }
    return "border-[#f2dfca] bg-[#fff3e5] text-[#d5740b]";
  };

  const getPaymentMethodName = (method: string) => {
    if (method === "bank_transfer") return "Банковский перевод";
    if (method === "cash") return "Наличные";
    if (method === "credit_card") return "Карта";
    return method;
  };

  const downloadFinanceDocument = (
    document: FinanceDocument,
    entity: FinanceInvoice | FinancePayment
  ) => {
    if (document.url) {
      const link = window.document.createElement("a");
      link.href = document.url;
      link.download = document.fileName;
      link.target = "_blank";
      link.click();
      return;
    }

    const content = [
      "SUNGRAIN CRM",
      `Документ: ${document.title}`,
      `Тип: ${document.kind}`,
      `Номер: ${entity.id}`,
      `Дата обновления: ${document.updatedAt}`,
      `Сумма: ${formatMoney(entity.amount, entity.currency)}`,
      "Документ сформирован в SUNGRAIN CRM.",
    ].join("\n");

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.fileName.replace(/\.(pdf|xlsx)$/i, ".txt");
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateNewInvoice = (field: keyof typeof newInvoice, value: string) => {
    setNewInvoice((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateNewPayment = (field: keyof typeof newPayment, value: string) => {
    setNewPayment((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const invoiceFieldClassName =
    "h-10 rounded-md border-[#dce4da] bg-white text-[#223137] shadow-sm placeholder:text-[#9aa49f] focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20";
  const invoiceLabelClassName =
    "text-xs font-black uppercase tracking-[0.02em] text-[#5f6c66]";
  const invoiceSectionClassName =
    "rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]";
  const invoiceSectionHeaderClassName =
    "mb-4 flex items-center gap-3 border-b border-[#edf1eb] pb-3";
  const invoiceSectionIconClassName =
    "flex size-10 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]";
  const invoiceSummaryAmount = Number(
    newInvoice.total_amount_usd || newInvoice.payment_amount_usd || 0
  );
  const invoiceFilledCoreCount = [
    newInvoice.application_id,
    newInvoice.invoice_number,
    newInvoice.invoice_date,
    newInvoice.sender_company_name,
    newInvoice.product_name,
    newInvoice.total_amount_usd,
  ].filter(Boolean).length;
  const selectedPaymentInvoice = allInvoices.find(
    (invoice) => invoice.id === newPayment.invoice_id
  );
  const paymentSummaryAmount = Number(
    newPayment.payment_amount || selectedPaymentInvoice?.amount || 0
  );
  const paymentFilledCoreCount = [
    newPayment.invoice_id,
    newPayment.payment_date,
    newPayment.payment_amount,
    newPayment.payment_currency,
    newPayment.payment_method,
    newPayment.payment_reference,
  ].filter(Boolean).length;
  const selectedInvoiceDetails = selectedInvoice?.details || {};
  const selectedInvoiceReceiverCompany =
    selectedInvoiceDetails.receiver_company_name || "ТОО «SUN GRAIN»";
  const selectedInvoiceReceiverAddress = [
    selectedInvoiceDetails.receiver_legal_country || "Республика Казахстан",
    selectedInvoiceDetails.receiver_legal_region || "Алматинская область",
    selectedInvoiceDetails.receiver_legal_district || "Карасайский район",
    selectedInvoiceDetails.receiver_legal_city || "город Каскелен",
    selectedInvoiceDetails.receiver_legal_street || "ул. Наурызбай",
    selectedInvoiceDetails.receiver_legal_office || "88, офис 7",
  ]
    .filter(Boolean)
    .join(", ");
  const selectedInvoiceSenderAddress = [
    selectedInvoiceDetails.sender_country || "Республика Таджикистан",
    selectedInvoiceDetails.sender_region || "Согдийская область",
    selectedInvoiceDetails.sender_district || "Б.Гафуровский р-н",
    selectedInvoiceDetails.sender_street || "ул. Ленина",
  ]
    .filter(Boolean)
    .join(", ");
  const selectedInvoiceContractDate = selectedInvoiceDetails.contract_date
    ? format(new Date(selectedInvoiceDetails.contract_date), "d MMMM yyyy", {
        locale: ru,
      })
    : "1 февраля 2025";
  const selectedInvoiceContractText = `№${
    selectedInvoiceDetails.contract_number || "SG-MH-1"
  } от ${selectedInvoiceContractDate} года${
    selectedInvoiceDetails.contract_appendix_number
      ? `, приложение №${selectedInvoiceDetails.contract_appendix_number}`
      : ""
  }${
    selectedInvoiceDetails.contract_appendix_date
      ? ` от ${format(
          new Date(selectedInvoiceDetails.contract_appendix_date),
          "d MMMM yyyy",
          { locale: ru }
        )} года`
      : ""
  }`;
  const selectedInvoiceTotalAmount =
    selectedInvoiceDetails.total_amount_usd || "16 320";
  const selectedInvoiceTotalWords = selectedInvoiceDetails.total_amount_usd
    ? numberToWords(Number(selectedInvoiceDetails.total_amount_usd))
    : "Шестнадцать тысяч триста двадцать";
  const selectedInvoiceReceiverRequisites = [
    {
      label: "БИН",
      value: selectedInvoiceDetails.receiver_bin || "231240014096",
    },
    {
      label: "Текущий счет USD",
      value:
        selectedInvoiceDetails.receiver_account_usd ||
        "KZ0696507F0009576396",
    },
    {
      label: "Филиал банка",
      value:
        selectedInvoiceDetails.receiver_bank_branch ||
        'Филиал АО "ForteBank" в г. Павлодар',
    },
    {
      label: "БИК",
      value: selectedInvoiceDetails.receiver_bic || "IRTYKZKA",
    },
    {
      label: "Correspondent bank",
      value:
        selectedInvoiceDetails.receiver_correspondent_bank ||
        "Bank of New York, USA",
    },
    {
      label: "SWIFT",
      value: selectedInvoiceDetails.receiver_swift || "IRVTUS3N",
    },
    {
      label: "ACC",
      value: selectedInvoiceDetails.receiver_account_number || "890-0548-533",
    },
  ];
  const selectedInvoiceContractRows = [
    {
      label: "Контракт",
      value: selectedInvoiceContractText,
    },
    {
      label: selectedInvoiceDetails.product_name || "Пшеница мягкая",
      value: `${selectedInvoiceDetails.price_per_ton_usd || "120"} USD за тонну`,
    },
    {
      label: `Оплата за ${
        selectedInvoiceDetails.total_quantity_mt || "136"
      } МТ`,
      value: `${selectedInvoiceDetails.payment_amount_usd || "16 320"} USD`,
    },
  ];
  const selectedInvoiceCurrency =
    selectedInvoice?.currency || selectedInvoiceDetails.currency || "USD";
  const selectedInvoiceTotalMoney = selectedInvoice
    ? formatMoney(selectedInvoice.amount, selectedInvoice.currency)
    : `${selectedInvoiceTotalAmount} ${selectedInvoiceCurrency}`;
  const selectedInvoicePaidMoney = selectedInvoice
    ? formatMoney(getInvoicePaidAmount(selectedInvoice), selectedInvoice.currency)
    : "0";
  const selectedInvoiceBalanceMoney = selectedInvoice
    ? formatMoney(getInvoiceBalance(selectedInvoice), selectedInvoice.currency)
    : "0";
  const selectedInvoiceProgress = selectedInvoice
    ? getInvoiceProgress(selectedInvoice)
    : 0;
  const selectedInvoicePayments = selectedInvoice
    ? getInvoicePayments(selectedInvoice.id)
    : [];
  const selectedInvoiceDocuments = selectedInvoice?.documents || [];
  const selectedInvoiceHistory = selectedInvoice
    ? [
        ...selectedInvoice.history,
        ...selectedInvoicePayments.map((payment) => ({
          date: payment.date,
          title: `Платеж ${payment.id}`,
          description: `${formatMoney(payment.amount, payment.currency)} · ${
            payment.reference || "без референса"
          }`,
          tone: payment.status === "reconciled" ? "green" : "orange",
        })),
      ]
    : [];
  const selectedInvoiceContractHref = selectedInvoice
    ? `/admin/contracts/${
        selectedInvoice.contractNumericId ||
        Number(selectedInvoice.contractId.match(/\d+$/)?.[0] || "1")
      }`
    : "/admin/contracts";
  const selectedPaymentLinkedInvoice = selectedPayment
    ? allInvoices.find((invoice) => invoice.id === selectedPayment.invoice)
    : null;
  const selectedPaymentDocuments = selectedPayment?.documents || [];
  const selectedPaymentHistory = selectedPayment?.history || [];

  return (
    <>
      <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden px-0">
        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-bold uppercase text-[#2f6b4f]">
                  <WalletCards className="h-3.5 w-3.5" />
                  Финансовый центр
                </div>
                <CardTitle className="text-3xl font-black tracking-tight text-[#223137]">
                  Финансы
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm text-[#6f7774]">
                  Контроль счетов, оплат, просрочек и денежных потоков по контрактам.
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[620px]">
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Оплачено
                  </div>
                  <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                    {invoiceStats.paid}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    {paidCount} счетов
                  </div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Остаток в работе
                  </div>
                  <div className="mt-1 text-lg font-black text-[#d5740b]">
                    {invoiceStats.pending}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    {pendingCount + partialCount} счетов
                  </div>
                </div>
                <div className="rounded-md border border-[#f4d6ce] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Просрочка
                  </div>
                  <div className="mt-1 text-lg font-black text-[#b9472d]">
                    {invoiceStats.overdue}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    {overdueCount} счетов
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Сумма счетов
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {invoiceStats.total}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Поступления
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {invoiceStats.paid}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <Banknote className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      В работе
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#223137]">
                      {openInvoiceCount}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <Filter className="h-5 w-5" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase text-[#7b857f]">
                      Баланс
                    </div>
                    <div className="mt-2 text-2xl font-black text-[#d5740b]">
                      {invoiceStats.balance}
                    </div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isFinanceLoading && (
          <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3 text-sm font-semibold text-[#53605a] shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
            Загружаем данные из backend...
          </div>
        )}

        {financeError && (
          <div
            className="flex items-start gap-2 rounded-md border border-[#f4d6ce] bg-[#fff7f3] px-4 py-3 text-sm font-semibold text-[#9a3a1b]"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f38810]" />
            <span>{financeError}</span>
          </div>
        )}

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-md border border-[#dfe7de] bg-white p-1 shadow-[0_12px_28px_rgba(34,49,55,0.05)]">
            <TabsTrigger
              value="invoices"
              className="rounded-md py-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
            >
              Счета
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="rounded-md py-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
            >
              Платежи
            </TabsTrigger>
          </TabsList>
          <TabsContent value="invoices" className="space-y-4">
            <div className="rounded-md border border-[#dfe7de] bg-white p-3 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="relative min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    placeholder="Поиск счетов..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 rounded-md border-[#dce4da] bg-white pl-10 text-[#223137] shadow-sm"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-[200px_auto] sm:items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11! min-h-11 w-full rounded-md border-[#dce4da] bg-white px-3 font-semibold text-[#223137] shadow-sm [&>span]:flex [&>span]:items-center">
                      <SelectValue placeholder="Фильтр по статусу" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="paid">Оплачен</SelectItem>
                      <SelectItem value="pending">Ожидает оплаты</SelectItem>
                      <SelectItem value="partial">Частичная оплата</SelectItem>
                      <SelectItem value="overdue">Просрочен</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Invoice Dialog */}
                  <Dialog
                    open={isInvoiceDialogOpen}
                    onOpenChange={setIsInvoiceDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="h-11 gap-2 rounded-md bg-[#f38810] px-4 font-bold text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c]">
                        <Plus className="h-4 w-4" />
                        Создать счет
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="grid h-[92vh] max-h-[860px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-[#dfe7de] bg-[#f8faf7] [padding:0] sm:max-w-[1120px]">
                    <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-4 pr-12 sm:px-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                            <Receipt className="h-3.5 w-3.5" />
                            Новый счет
                          </div>
                          <DialogTitle className="text-2xl font-black tracking-tight text-[#223137]">
                            Создать счет
                          </DialogTitle>
                          <DialogDescription className="mt-1 text-sm text-[#6f7774]">
                            Реквизиты, контрагент, контракт и параметры оплаты.
                          </DialogDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:min-w-[330px]">
                          <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                            <div className="text-[10px] font-black uppercase text-[#7b857f]">
                              Готовность
                            </div>
                            <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                              {invoiceFilledCoreCount}/6
                            </div>
                          </div>
                          <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] px-3 py-2">
                            <div className="text-[10px] font-black uppercase text-[#7b857f]">
                              Сумма
                            </div>
                            <div className="mt-1 text-lg font-black text-[#d5740b]">
                              {invoiceSummaryAmount.toLocaleString()}{" "}
                              {newInvoice.currency}
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="grid min-h-0 lg:grid-cols-[290px_minmax(0,1fr)]">
                      <aside className="hidden border-r border-[#dfe7de] bg-[linear-gradient(180deg,#ffffff_0%,#f5faf5_100%)] p-5 lg:block">
                        <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                          <div className="flex size-11 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="mt-4 text-lg font-black text-[#223137]">
                            Черновик счета
                          </div>
                          <div className="mt-1 text-sm leading-5 text-[#6f7774]">
                            {newInvoice.invoice_number || "Номер не задан"}
                          </div>
                          <div className="mt-4 grid gap-2">
                            <div className="rounded-md bg-[#f7f8f5] px-3 py-2">
                              <div className="text-[10px] font-black uppercase text-[#7b857f]">
                                Получатель
                              </div>
                              <div className="mt-1 truncate text-sm font-bold text-[#223137]">
                                {newInvoice.receiver_company_name}
                              </div>
                            </div>
                            <div className="rounded-md bg-[#f7f8f5] px-3 py-2">
                              <div className="text-[10px] font-black uppercase text-[#7b857f]">
                                Отправитель
                              </div>
                              <div className="mt-1 truncate text-sm font-bold text-[#223137]">
                                {newInvoice.sender_company_name ||
                                  "Не выбран"}
                              </div>
                            </div>
                            <div className="rounded-md bg-[#fff3e5] px-3 py-2">
                              <div className="text-[10px] font-black uppercase text-[#9a621d]">
                                К оплате
                              </div>
                              <div className="mt-1 text-sm font-black text-[#d5740b]">
                                {invoiceSummaryAmount.toLocaleString()}{" "}
                                {newInvoice.currency}
                              </div>
                            </div>
                          </div>
                        </div>
                      </aside>

                      <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
                        <div className="grid gap-4">
                          <section className={invoiceSectionClassName}>
                            <div className={invoiceSectionHeaderClassName}>
                              <span className={invoiceSectionIconClassName}>
                                <CalendarDays className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="text-base font-black text-[#223137]">
                                  Информация о счете
                                </h3>
                                <p className="text-xs text-[#7b857f]">
                                  Номер документа и дата выставления.
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="invoice_number"
                                  className={invoiceLabelClassName}
                                >
                                  Номер счета
                                </Label>
                                <Input
                                  id="invoice_number"
                                  value={newInvoice.invoice_number}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "invoice_number",
                                      e.target.value
                                    )
                                  }
                                  placeholder="INV-2026-001"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="invoice_date"
                                  className={invoiceLabelClassName}
                                >
                                  Дата счета
                                </Label>
                                <DatePickerField
                                  id="invoice_date"
                                  value={newInvoice.invoice_date}
                                  onChange={(value) =>
                                    updateNewInvoice("invoice_date", value)
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                            </div>
                          </section>

                          <section className={invoiceSectionClassName}>
                            <div className={invoiceSectionHeaderClassName}>
                              <span className={invoiceSectionIconClassName}>
                                <Building2 className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="text-base font-black text-[#223137]">
                                  Получатель
                                </h3>
                                <p className="text-xs text-[#7b857f]">
                                  Юридический адрес и банковские реквизиты.
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label
                                  htmlFor="receiver_company_name"
                                  className={invoiceLabelClassName}
                                >
                                  Название компании
                                </Label>
                                <Input
                                  id="receiver_company_name"
                                  value={newInvoice.receiver_company_name}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_company_name",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="receiver_legal_country"
                                  className={invoiceLabelClassName}
                                >
                                  Страна
                                </Label>
                                <Input
                                  id="receiver_legal_country"
                                  value={newInvoice.receiver_legal_country}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_legal_country",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="receiver_legal_region"
                                  className={invoiceLabelClassName}
                                >
                                  Область
                                </Label>
                                <Input
                                  id="receiver_legal_region"
                                  value={newInvoice.receiver_legal_region}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_legal_region",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="receiver_legal_district"
                                  className={invoiceLabelClassName}
                                >
                                  Район
                                </Label>
                                <Input
                                  id="receiver_legal_district"
                                  value={newInvoice.receiver_legal_district}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_legal_district",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="receiver_legal_city"
                                  className={invoiceLabelClassName}
                                >
                                  Город
                                </Label>
                                <Input
                                  id="receiver_legal_city"
                                  value={newInvoice.receiver_legal_city}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_legal_city",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="receiver_legal_street"
                                  className={invoiceLabelClassName}
                                >
                                  Улица
                                </Label>
                                <Input
                                  id="receiver_legal_street"
                                  value={newInvoice.receiver_legal_street}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_legal_street",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="receiver_legal_office"
                                  className={invoiceLabelClassName}
                                >
                                  Офис
                                </Label>
                                <Input
                                  id="receiver_legal_office"
                                  value={newInvoice.receiver_legal_office}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_legal_office",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="receiver_bin"
                                  className={invoiceLabelClassName}
                                >
                                  БИН
                                </Label>
                                <Input
                                  id="receiver_bin"
                                  value={newInvoice.receiver_bin}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "receiver_bin",
                                      e.target.value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                            </div>

                            <div className="mt-4 rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                              <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#223137]">
                                <Landmark className="h-4 w-4 text-[#2f6b4f]" />
                                Банковские реквизиты
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="receiver_account_usd"
                                    className={invoiceLabelClassName}
                                  >
                                    Счет USD
                                  </Label>
                                  <Input
                                    id="receiver_account_usd"
                                    value={newInvoice.receiver_account_usd}
                                    onChange={(e) =>
                                      updateNewInvoice(
                                        "receiver_account_usd",
                                        e.target.value
                                      )
                                    }
                                    className={invoiceFieldClassName}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="receiver_bank_branch"
                                    className={invoiceLabelClassName}
                                  >
                                    Филиал банка
                                  </Label>
                                  <Input
                                    id="receiver_bank_branch"
                                    value={newInvoice.receiver_bank_branch}
                                    onChange={(e) =>
                                      updateNewInvoice(
                                        "receiver_bank_branch",
                                        e.target.value
                                      )
                                    }
                                    className={invoiceFieldClassName}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="receiver_bic"
                                    className={invoiceLabelClassName}
                                  >
                                    БИК
                                  </Label>
                                  <Input
                                    id="receiver_bic"
                                    value={newInvoice.receiver_bic}
                                    onChange={(e) =>
                                      updateNewInvoice(
                                        "receiver_bic",
                                        e.target.value
                                      )
                                    }
                                    className={invoiceFieldClassName}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="receiver_correspondent_bank"
                                    className={invoiceLabelClassName}
                                  >
                                    Банк-корреспондент
                                  </Label>
                                  <Input
                                    id="receiver_correspondent_bank"
                                    value={
                                      newInvoice.receiver_correspondent_bank
                                    }
                                    onChange={(e) =>
                                      updateNewInvoice(
                                        "receiver_correspondent_bank",
                                        e.target.value
                                      )
                                    }
                                    className={invoiceFieldClassName}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="receiver_swift"
                                    className={invoiceLabelClassName}
                                  >
                                    SWIFT
                                  </Label>
                                  <Input
                                    id="receiver_swift"
                                    value={newInvoice.receiver_swift}
                                    onChange={(e) =>
                                      updateNewInvoice(
                                        "receiver_swift",
                                        e.target.value
                                      )
                                    }
                                    className={invoiceFieldClassName}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="receiver_account_number"
                                    className={invoiceLabelClassName}
                                  >
                                    Номер счета
                                  </Label>
                                  <Input
                                    id="receiver_account_number"
                                    value={newInvoice.receiver_account_number}
                                    onChange={(e) =>
                                      updateNewInvoice(
                                        "receiver_account_number",
                                        e.target.value
                                      )
                                    }
                                    className={invoiceFieldClassName}
                                  />
                                </div>
                              </div>
                            </div>
                          </section>

                          <section className={invoiceSectionClassName}>
                            <div className={invoiceSectionHeaderClassName}>
                              <span className={invoiceSectionIconClassName}>
                                <Send className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="text-base font-black text-[#223137]">
                                  Отправитель
                                </h3>
                                <p className="text-xs text-[#7b857f]">
                                  Компания, страна и адрес контрагента.
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label
                                  htmlFor="sender_company_name"
                                  className={invoiceLabelClassName}
                                >
                                  Название компании
                                </Label>
                                <Input
                                  id="sender_company_name"
                                  value={newInvoice.sender_company_name}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "sender_company_name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="ООО «Название компании»"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="sender_country"
                                  className={invoiceLabelClassName}
                                >
                                  Страна
                                </Label>
                                <Input
                                  id="sender_country"
                                  value={newInvoice.sender_country}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "sender_country",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Республика Таджикистан"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="sender_region"
                                  className={invoiceLabelClassName}
                                >
                                  Область
                                </Label>
                                <Input
                                  id="sender_region"
                                  value={newInvoice.sender_region}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "sender_region",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Согдийская область"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="sender_district"
                                  className={invoiceLabelClassName}
                                >
                                  Район
                                </Label>
                                <Input
                                  id="sender_district"
                                  value={newInvoice.sender_district}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "sender_district",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Б.Гафуровский р-н"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="sender_street"
                                  className={invoiceLabelClassName}
                                >
                                  Улица
                                </Label>
                                <Input
                                  id="sender_street"
                                  value={newInvoice.sender_street}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "sender_street",
                                      e.target.value
                                    )
                                  }
                                  placeholder="ул. Ленина"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                            </div>
                          </section>

                          <section className={invoiceSectionClassName}>
                            <div className={invoiceSectionHeaderClassName}>
                              <span className={invoiceSectionIconClassName}>
                                <FileText className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="text-base font-black text-[#223137]">
                                  Контракт
                                </h3>
                                <p className="text-xs text-[#7b857f]">
                                  Номер договора и приложение.
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2 md:col-span-2">
                                <Label
                                  htmlFor="application_id"
                                  className={invoiceLabelClassName}
                                >
                                  Заявка
                                </Label>
                                <Select
                                  value={newInvoice.application_id}
                                  onValueChange={(value) => {
                                    const option = applicationOptions.find(
                                      (item) => item.applicationId === value
                                    );

                                    setNewInvoice((current) => ({
                                      ...current,
                                      application_id: value,
                                      contract_number:
                                        option?.contractNumber ||
                                        current.contract_number,
                                      contract:
                                        option?.contractNumber || current.contract,
                                      product_name:
                                        option?.productName ||
                                        current.product_name,
                                      sender_company_name:
                                        option?.counterparty ||
                                        current.sender_company_name,
                                      total_quantity_mt:
                                        option?.volume ||
                                        current.total_quantity_mt,
                                      payment_amount_usd:
                                        current.payment_amount_usd ||
                                        option?.amount ||
                                        "",
                                      total_amount_usd:
                                        current.total_amount_usd ||
                                        option?.amount ||
                                        "",
                                      currency:
                                        option?.currency || current.currency,
                                      description:
                                        option?.contractTitle ||
                                        current.description,
                                    }));
                                  }}
                                >
                                  <SelectTrigger
                                    id="application_id"
                                    className={`${invoiceFieldClassName} w-full`}
                                  >
                                    <SelectValue placeholder="Выберите заявку из backend" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {applicationOptions.length > 0 ? (
                                      applicationOptions.map((option) => (
                                        <SelectItem
                                          key={option.applicationId}
                                          value={option.applicationId}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-applications" disabled>
                                        Заявки не найдены
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="contract_number"
                                  className={invoiceLabelClassName}
                                >
                                  Номер контракта
                                </Label>
                                <Input
                                  id="contract_number"
                                  value={newInvoice.contract_number}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "contract_number",
                                      e.target.value
                                    )
                                  }
                                  placeholder="SG-MH-1"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="contract_date"
                                  className={invoiceLabelClassName}
                                >
                                  Дата контракта
                                </Label>
                                <DatePickerField
                                  id="contract_date"
                                  value={newInvoice.contract_date}
                                  onChange={(value) =>
                                    updateNewInvoice("contract_date", value)
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="contract_appendix_number"
                                  className={invoiceLabelClassName}
                                >
                                  Номер приложения
                                </Label>
                                <Input
                                  id="contract_appendix_number"
                                  value={newInvoice.contract_appendix_number}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "contract_appendix_number",
                                      e.target.value
                                    )
                                  }
                                  placeholder="3"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="contract_appendix_date"
                                  className={invoiceLabelClassName}
                                >
                                  Дата приложения
                                </Label>
                                <DatePickerField
                                  id="contract_appendix_date"
                                  value={newInvoice.contract_appendix_date}
                                  onChange={(value) =>
                                    updateNewInvoice(
                                      "contract_appendix_date",
                                      value
                                    )
                                  }
                                  className={invoiceFieldClassName}
                                />
                              </div>
                            </div>
                          </section>

                          <section className={invoiceSectionClassName}>
                            <div className={invoiceSectionHeaderClassName}>
                              <span className={invoiceSectionIconClassName}>
                                <Wheat className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="text-base font-black text-[#223137]">
                                  Продукт и оплата
                                </h3>
                                <p className="text-xs text-[#7b857f]">
                                  Товар, объем, ставка и итоговая сумма.
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              <div className="space-y-2 xl:col-span-2">
                                <Label
                                  htmlFor="product_name"
                                  className={invoiceLabelClassName}
                                >
                                  Название продукта
                                </Label>
                                <Input
                                  id="product_name"
                                  value={newInvoice.product_name}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "product_name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Пшеница мягкая"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="currency"
                                  className={invoiceLabelClassName}
                                >
                                  Валюта
                                </Label>
                                <Select
                                  value={newInvoice.currency}
                                  onValueChange={(value) =>
                                    updateNewInvoice("currency", value)
                                  }
                                >
                                  <SelectTrigger className={invoiceFieldClassName}>
                                    <SelectValue placeholder="Валюта" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="KZT">KZT</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="price_per_ton_usd"
                                  className={invoiceLabelClassName}
                                >
                                  Цена за тонну
                                </Label>
                                <Input
                                  id="price_per_ton_usd"
                                  type="number"
                                  min={0}
                                  value={newInvoice.price_per_ton_usd}
                                  onChange={(e) => {
                                    const price = e.target.value;
                                    const quantity =
                                      newInvoice.total_quantity_mt;
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
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="total_quantity_mt"
                                  className={invoiceLabelClassName}
                                >
                                  Количество, МТ
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
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label
                                  htmlFor="payment_amount_usd"
                                  className={invoiceLabelClassName}
                                >
                                  Сумма оплаты
                                </Label>
                                <Input
                                  id="payment_amount_usd"
                                  type="number"
                                  value={newInvoice.payment_amount_usd}
                                  onChange={(e) => {
                                    updateNewInvoice(
                                      "payment_amount_usd",
                                      e.target.value
                                    );
                                    updateNewInvoice(
                                      "total_amount_usd",
                                      e.target.value
                                    );
                                  }}
                                  placeholder="16320"
                                  className={invoiceFieldClassName}
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                                <Label
                                  htmlFor="total_amount_usd"
                                  className={invoiceLabelClassName}
                                >
                                  Итоговая сумма
                                </Label>
                                <Input
                                  id="total_amount_usd"
                                  type="number"
                                  value={newInvoice.total_amount_usd}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "total_amount_usd",
                                      e.target.value
                                    )
                                  }
                                  placeholder="16320"
                                  className="h-12 rounded-md border-[#f2dfca] bg-[#fffdf9] text-lg font-black text-[#d5740b] shadow-sm placeholder:text-[#c8b9a8] focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20"
                                />
                              </div>
                            </div>
                          </section>

                          <section className={invoiceSectionClassName}>
                            <div className={invoiceSectionHeaderClassName}>
                              <span className={invoiceSectionIconClassName}>
                                <UserRound className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="text-base font-black text-[#223137]">
                                  Подпись
                                </h3>
                                <p className="text-xs text-[#7b857f]">
                                  Ответственный подписант документа.
                                </p>
                              </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label
                                  htmlFor="director_name"
                                  className={invoiceLabelClassName}
                                >
                                  ФИО директора
                                </Label>
                                <Input
                                  id="director_name"
                                  value={newInvoice.director_name}
                                  onChange={(e) =>
                                    updateNewInvoice(
                                      "director_name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Иванов И.И."
                                  className={invoiceFieldClassName}
                                />
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="border-t border-[#dfe7de] bg-white px-5 py-4 sm:px-6">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-md border-[#dce4da] px-5 font-bold text-[#53605a]"
                        onClick={() => setIsInvoiceDialogOpen(false)}
                      >
                        Отмена
                      </Button>
                      <Button
                        onClick={handleAddInvoice}
                        disabled={isSubmitting}
                        className="h-11 rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            </div>

            <Card className="sungrain-analytics-card overflow-hidden">
              <CardHeader className="border-b border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-[#223137]">
                        Реестр счетов
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-[#6f7774]">
                        Выставленные счета, статусы оплат и контроль просрочек
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 text-xs font-black text-[#2f6b4f]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {paidCount} оплачено
                    </span>
                    <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#f2dfca] bg-[#fff3e5] px-3 text-xs font-black text-[#d5740b]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {pendingCount} ожидает
                    </span>
                    <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#f2dfca] bg-[#fff8ed] px-3 text-xs font-black text-[#c16f11]">
                      <CircleDollarSign className="h-3.5 w-3.5" />
                      {partialCount} частично
                    </span>
                    <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#f4d6ce] bg-[#fff1ed] px-3 text-xs font-black text-[#b9472d]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {overdueCount} просрочено
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
                <div className="overflow-hidden rounded-md bg-white shadow-[0_16px_36px_rgba(34,49,55,0.06)]">
                <Table className="min-w-[1180px]">
                  <TableHeader className="bg-[#f7f8f5]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">№ счета</TableHead>
                      <TableHead>Контракт</TableHead>
                      <TableHead>Срок</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Оплата</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead className="pr-4 text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => {
                        const progress = getInvoiceProgress(invoice);
                        const balance = getInvoiceBalance(invoice);

                        return (
                        <TableRow key={invoice.id} className="hover:bg-[#f8faf7]">
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-black text-[#223137]">
                                  {invoice.id}
                                </div>
                                <div className="text-xs text-[#7b857f]">
                                  {invoice.date}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[260px]">
                              <div className="flex items-center gap-1.5 font-bold text-[#223137]">
                                {invoice.contractId}
                                <ArrowUpRight className="h-3.5 w-3.5 text-[#8a928f]" />
                              </div>
                              <div className="mt-0.5 truncate text-xs text-[#7b857f]">
                                {invoice.contractTitle}
                              </div>
                              <div className="mt-0.5 truncate text-xs font-semibold text-[#2f6b4f]">
                                {invoice.counterparty}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="inline-flex flex-col rounded-md border border-[#e5ece4] bg-[#fbfcfa] px-2.5 py-1.5">
                              <span className="text-xs font-black text-[#223137]">
                                {invoice.dueDate}
                              </span>
                              <span className="text-[11px] font-semibold text-[#7b857f]">
                                {invoice.status === "overdue"
                                  ? `${invoice.overdueDays || 1} дн. просрочки`
                                  : "контроль оплаты"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusClassName(invoice.status)}
                            >
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-[220px]">
                              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                <span className="font-black text-[#223137]">
                                  {progress}%
                                </span>
                                <span className="font-semibold text-[#7b857f]">
                                  остаток {formatMoney(balance, invoice.currency)}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-[#edf1eb]">
                                <div
                                  className={`h-full rounded-full ${
                                    invoice.status === "overdue"
                                      ? "bg-[#b9472d]"
                                      : invoice.status === "paid"
                                        ? "bg-[#2f6b4f]"
                                        : "bg-[#f38810]"
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-black text-[#223137]">
                              {formatMoney(invoice.amount, invoice.currency)}
                            </div>
                            <div className="text-xs font-bold text-[#2f6b4f]">
                              оплачено{" "}
                              {formatMoney(
                                getInvoicePaidAmount(invoice),
                                invoice.currency
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                className="h-9 rounded-md px-3 text-xs font-black text-[#2f6b4f] hover:bg-[#eef5ef]"
                                onClick={() => openViewInvoiceDialog(invoice)}
                              >
                                Подробнее
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-9 w-9 rounded-md p-0 hover:bg-[#fff3e5]"
                                onClick={() =>
                                  downloadFinanceDocument(
                                    invoice.documents[0],
                                    invoice
                                  )
                                }
                              >
                                <FileDown className="h-4 w-4" />
                                <span className="sr-only">Скачать</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Счета не найдены.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments" className="space-y-4">
            <div className="rounded-md border border-[#dfe7de] bg-white p-3 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                <Input
                  placeholder="Поиск платежей..."
                  className="h-11 rounded-md border-[#dce4da] bg-white pl-10 text-[#223137] shadow-sm"
                />
              </div>
              <Dialog
                open={isPaymentDialogOpen}
                onOpenChange={setIsPaymentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="h-11 gap-2 rounded-md bg-[#f38810] px-4 font-bold text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c]">
                    <Plus className="h-4 w-4" />
                    Добавить платеж
                  </Button>
                </DialogTrigger>
                <DialogContent className="grid h-[86vh] max-h-[760px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-[#dfe7de] bg-[#f8faf7] [padding:0] sm:max-w-[940px]">
                  <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-4 pr-12 sm:px-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                          <Banknote className="h-3.5 w-3.5" />
                          Новый платеж
                        </div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-[#223137]">
                          Добавить платеж
                        </DialogTitle>
                        <DialogDescription className="mt-1 text-sm text-[#6f7774]">
                          Свяжите поступление со счетом и зафиксируйте банковские данные.
                        </DialogDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:min-w-[320px]">
                        <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                          <div className="text-[10px] font-black uppercase text-[#7b857f]">
                            Готовность
                          </div>
                          <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                            {paymentFilledCoreCount}/6
                          </div>
                        </div>
                        <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] px-3 py-2">
                          <div className="text-[10px] font-black uppercase text-[#7b857f]">
                            Сумма
                          </div>
                          <div className="mt-1 text-lg font-black text-[#d5740b]">
                            {paymentSummaryAmount.toLocaleString()}{" "}
                            {newPayment.payment_currency}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogHeader>

                  <div className="grid min-h-0 lg:grid-cols-[270px_minmax(0,1fr)]">
                    <aside className="hidden border-r border-[#dfe7de] bg-[linear-gradient(180deg,#ffffff_0%,#f5faf5_100%)] p-5 lg:block">
                      <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                        <div className="flex size-11 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                          <FileCheck2 className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-lg font-black text-[#223137]">
                          Черновик платежа
                        </div>
                        <div className="mt-1 text-sm leading-5 text-[#6f7774]">
                          {newPayment.invoice_id
                            ? `К счету ${newPayment.invoice_id}`
                            : "Счет не выбран"}
                        </div>
                        <div className="mt-4 grid gap-2">
                          <div className="rounded-md bg-[#f7f8f5] px-3 py-2">
                            <div className="text-[10px] font-black uppercase text-[#7b857f]">
                              Метод
                            </div>
                            <div className="mt-1 truncate text-sm font-bold text-[#223137]">
                              {getPaymentMethodName(newPayment.payment_method)}
                            </div>
                          </div>
                          <div className="rounded-md bg-[#f7f8f5] px-3 py-2">
                            <div className="text-[10px] font-black uppercase text-[#7b857f]">
                              Референс
                            </div>
                            <div className="mt-1 truncate text-sm font-bold text-[#223137]">
                              {newPayment.payment_reference || "Не указан"}
                            </div>
                          </div>
                          <div className="rounded-md bg-[#fff3e5] px-3 py-2">
                            <div className="text-[10px] font-black uppercase text-[#9a621d]">
                              Поступление
                            </div>
                            <div className="mt-1 text-sm font-black text-[#d5740b]">
                              {paymentSummaryAmount.toLocaleString()}{" "}
                              {newPayment.payment_currency}
                            </div>
                          </div>
                        </div>
                      </div>
                    </aside>

                    <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-5 lg:px-6">
                      <div className="grid gap-4">
                        <section className={invoiceSectionClassName}>
                          <div className={invoiceSectionHeaderClassName}>
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                              <Receipt className="h-5 w-5" />
                            </span>
                            <div>
                              <h3 className="text-base font-black text-[#223137]">
                                Счет и сумма
                              </h3>
                              <p className="text-xs text-[#7b857f]">
                                Выберите счет, дату поступления и валюту.
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <Label
                                htmlFor="invoice_id"
                                className={invoiceLabelClassName}
                              >
                                Счет
                              </Label>
                              <Select
                                value={newPayment.invoice_id}
                                onValueChange={(value) => {
                                  const invoice = allInvoices.find(
                                    (item) => item.id === value
                                  );

                                  setNewPayment((current) => ({
                                    ...current,
                                    invoice_id: value,
                                    payment_amount:
                                      current.payment_amount ||
                                      String(invoice?.amount ?? ""),
                                    payment_currency:
                                      invoice?.currency ||
                                      current.payment_currency,
                                  }));
                                }}
                              >
                                <SelectTrigger
                                  id="invoice_id"
                                  className={`${invoiceFieldClassName} w-full`}
                                >
                                  <SelectValue placeholder="Выберите счет" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allInvoices.map((invoice) => (
                                    <SelectItem
                                      key={invoice.id}
                                      value={invoice.id}
                                    >
                                      {invoice.id} ·{" "}
                                      {formatMoney(
                                        invoice.amount,
                                        invoice.currency || "USD"
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="payment_date"
                                className={invoiceLabelClassName}
                              >
                                Дата платежа
                              </Label>
                              <DatePickerField
                                id="payment_date"
                                value={newPayment.payment_date}
                                onChange={(value) =>
                                  updateNewPayment("payment_date", value)
                                }
                                className={invoiceFieldClassName}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="payment_currency"
                                className={invoiceLabelClassName}
                              >
                                Валюта
                              </Label>
                              <Select
                                value={newPayment.payment_currency}
                                onValueChange={(value) =>
                                  updateNewPayment("payment_currency", value)
                                }
                              >
                                <SelectTrigger
                                  id="payment_currency"
                                  className={`${invoiceFieldClassName} w-full`}
                                >
                                  <SelectValue placeholder="Выберите валюту" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="USD">USD</SelectItem>
                                  <SelectItem value="KZT">KZT</SelectItem>
                                  <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label
                                htmlFor="payment_amount"
                                className={invoiceLabelClassName}
                              >
                                Сумма платежа
                              </Label>
                              <Input
                                id="payment_amount"
                                type="number"
                                value={newPayment.payment_amount}
                                onChange={(e) =>
                                  updateNewPayment(
                                    "payment_amount",
                                    e.target.value
                                  )
                                }
                                placeholder="1000"
                                className="h-12 rounded-md border-[#f2dfca] bg-[#fffdf9] text-lg font-black text-[#d5740b] shadow-sm placeholder:text-[#c8b9a8] focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20"
                              />
                            </div>
                          </div>
                        </section>

                        <section className={invoiceSectionClassName}>
                          <div className={invoiceSectionHeaderClassName}>
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                              <CreditCard className="h-5 w-5" />
                            </span>
                            <div>
                              <h3 className="text-base font-black text-[#223137]">
                                Детали платежа
                              </h3>
                              <p className="text-xs text-[#7b857f]">
                                Метод оплаты, референс и статус обработки.
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label
                                htmlFor="payment_method"
                                className={invoiceLabelClassName}
                              >
                                Способ оплаты
                              </Label>
                              <Select
                                value={newPayment.payment_method}
                                onValueChange={(value) =>
                                  updateNewPayment("payment_method", value)
                                }
                              >
                                <SelectTrigger
                                  id="payment_method"
                                  className={`${invoiceFieldClassName} w-full`}
                                >
                                  <SelectValue placeholder="Способ оплаты" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bank_transfer">
                                    Банковский перевод
                                  </SelectItem>
                                  <SelectItem value="credit_card">
                                    Карта
                                  </SelectItem>
                                  <SelectItem value="cash">
                                    Наличные
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="payment_status"
                                className={invoiceLabelClassName}
                              >
                                Статус
                              </Label>
                              <Select
                                value={newPayment.payment_status}
                                onValueChange={(value) =>
                                  updateNewPayment("payment_status", value)
                                }
                              >
                                <SelectTrigger
                                  id="payment_status"
                                  className={`${invoiceFieldClassName} w-full`}
                                >
                                  <SelectValue placeholder="Статус" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="completed">
                                    Проведен
                                  </SelectItem>
                                  <SelectItem value="processing">
                                    В обработке
                                  </SelectItem>
                                  <SelectItem value="failed">
                                    Отклонен
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label
                                htmlFor="payment_reference"
                                className={invoiceLabelClassName}
                              >
                                Референс платежа
                              </Label>
                              <Input
                                id="payment_reference"
                                value={newPayment.payment_reference}
                                onChange={(e) =>
                                  updateNewPayment(
                                    "payment_reference",
                                    e.target.value
                                  )
                                }
                                placeholder="REF123456"
                                className={invoiceFieldClassName}
                              />
                            </div>
                          </div>
                        </section>

                        <section className={invoiceSectionClassName}>
                          <div className={invoiceSectionHeaderClassName}>
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                              <Landmark className="h-5 w-5" />
                            </span>
                            <div>
                              <h3 className="text-base font-black text-[#223137]">
                                Банк и комментарий
                              </h3>
                              <p className="text-xs text-[#7b857f]">
                                Дополнительная банковская информация.
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label
                                htmlFor="bank_name"
                                className={invoiceLabelClassName}
                              >
                                Банк
                              </Label>
                              <Input
                                id="bank_name"
                                value={newPayment.bank_name}
                                onChange={(e) =>
                                  updateNewPayment("bank_name", e.target.value)
                                }
                                placeholder="ForteBank"
                                className={invoiceFieldClassName}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="bank_account"
                                className={invoiceLabelClassName}
                              >
                                Банковский счет
                              </Label>
                              <Input
                                id="bank_account"
                                value={newPayment.bank_account}
                                onChange={(e) =>
                                  updateNewPayment(
                                    "bank_account",
                                    e.target.value
                                  )
                                }
                                placeholder="KZ..."
                                className={invoiceFieldClassName}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label
                                htmlFor="payment_description"
                                className={invoiceLabelClassName}
                              >
                                Комментарий
                              </Label>
                              <Input
                                id="payment_description"
                                value={newPayment.payment_description}
                                onChange={(e) =>
                                  updateNewPayment(
                                    "payment_description",
                                    e.target.value
                                  )
                                }
                                placeholder="Комментарий к поступлению"
                                className={invoiceFieldClassName}
                              />
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="border-t border-[#dfe7de] bg-white px-5 py-4 sm:px-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-md border-[#dce4da] px-5 font-bold text-[#53605a]"
                      onClick={() => setIsPaymentDialogOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleAddPayment}
                      disabled={isSubmitting}
                      className="h-11 rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            </div>

            <Card className="sungrain-analytics-card overflow-hidden">
              <CardHeader className="border-b border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-[#223137]">
                        История платежей
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-[#6f7774]">
                        Поступления, банковские референсы и связка со счетами
                      </CardDescription>
                    </div>
                  </div>
                  <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-2 text-right shadow-sm">
                    <div className="text-[11px] font-black uppercase text-[#7b857f]">
                      Всего поступило
                    </div>
                    <div className="text-lg font-black text-[#2f6b4f]">
                      {paymentTotalText}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
                <div className="overflow-hidden rounded-md bg-white shadow-[0_16px_36px_rgba(34,49,55,0.06)]">
                <Table className="min-w-[1120px]">
                  <TableHeader className="bg-[#f7f8f5]">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">№ платежа</TableHead>
                      <TableHead>Связка</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Способ оплаты</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead className="pr-4 text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayments.length > 0 ? (
                      allPayments.map((payment) => (
                        <TableRow key={payment.id} className="hover:bg-[#f8faf7]">
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                                <FileCheck2 className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-black text-[#223137]">
                                  {payment.id}
                                </div>
                                <div className="text-xs text-[#7b857f]">
                                  {payment.reference || "без референса"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-bold text-[#223137]">
                                {payment.invoice}
                              </div>
                              <div className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[#2f6b4f]">
                                <Link2 className="h-3.5 w-3.5" />
                                {payment.contract}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex rounded-md bg-[#f7f8f5] px-2.5 py-1 text-xs font-semibold text-[#53605a]">
                              {payment.date}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getPaymentStatusClassName(payment.status)}
                            >
                              {getPaymentStatusLabel(payment.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]"
                            >
                              {getPaymentMethodName(payment.method)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="font-black text-[#223137]">
                              {formatMoney(payment.amount, payment.currency)}
                            </div>
                            <div className="text-xs font-bold text-[#2f6b4f]">
                              {payment.currency}
                            </div>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                className="h-9 rounded-md px-3 text-xs font-black text-[#2f6b4f] hover:bg-[#eef5ef]"
                                onClick={() => openViewPaymentDialog(payment)}
                              >
                                Подробнее
                              </Button>
                              <Button
                                variant="ghost"
                                className="h-9 w-9 rounded-md p-0 hover:bg-[#fff3e5]"
                                onClick={() =>
                                  downloadFinanceDocument(
                                    payment.documents[0],
                                    payment
                                  )
                                }
                              >
                                <FileDown className="h-4 w-4" />
                                <span className="sr-only">Скачать</span>
                              </Button>
                            </div>
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
                </div>
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
          <DialogContent className="grid h-[96vh] max-h-[900px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-[#dfe7de] bg-[#f8faf7] [padding:0] sm:max-w-[1120px]">
            <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-4 pr-12 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                    <Receipt className="h-3.5 w-3.5" />
                    Счет на оплату
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-[#223137]">
                    Детали счета
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-[#6f7774]">
                    Информация о счете №{selectedInvoice.id}
                  </DialogDescription>
                </div>

                <div className="grid grid-cols-2 gap-2 lg:min-w-[560px] xl:grid-cols-4">
                  <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-[#7b857f]">
                      Дата
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm font-black text-[#223137]">
                      <CalendarDays className="h-3.5 w-3.5 text-[#2f6b4f]" />
                      {selectedInvoice.date}
                    </div>
                  </div>
                  <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-[#7b857f]">
                      Сумма
                    </div>
                    <div className="mt-1 truncate text-sm font-black text-[#d5740b]">
                      {selectedInvoiceTotalMoney}
                    </div>
                  </div>
                  <div className="rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-[#7b857f]">
                      Оплачено
                    </div>
                    <div className="mt-1 truncate text-sm font-black text-[#2f6b4f]">
                      {selectedInvoicePaidMoney}
                    </div>
                  </div>
                  <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-[#7b857f]">
                      Статус
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-1 rounded-md px-2 py-0.5 text-[11px] font-black ${getStatusClassName(
                        selectedInvoice.status
                      )}`}
                    >
                      {getStatusLabel(selectedInvoice.status)}
                    </Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 space-y-3 overflow-y-auto px-4 py-3 sm:px-6">
              <section className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                        <Link2 className="h-3.5 w-3.5" />
                        Привязка к контракту
                      </div>
                      <h3 className="mt-3 text-xl font-black text-[#223137]">
                        {selectedInvoice.contractTitle}
                      </h3>
                      <p className="mt-1 text-sm text-[#6f7774]">
                        {selectedInvoice.counterparty} · {selectedInvoice.paymentTerms}
                      </p>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      className="h-10 shrink-0 rounded-md border-[#dce8dc] px-3 font-black text-[#2f6b4f] hover:bg-[#eef5ef]"
                    >
                      <a href={selectedInvoiceContractHref}>
                        Открыть контракт
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                      <div className="text-[10px] font-black uppercase text-[#7b857f]">
                        Оплачено
                      </div>
                      <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                        {selectedInvoicePaidMoney}
                      </div>
                    </div>
                    <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                      <div className="text-[10px] font-black uppercase text-[#7b857f]">
                        Остаток
                      </div>
                      <div className="mt-1 text-lg font-black text-[#d5740b]">
                        {selectedInvoiceBalanceMoney}
                      </div>
                    </div>
                    <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                      <div className="text-[10px] font-black uppercase text-[#7b857f]">
                        Дедлайн
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-lg font-black text-[#223137]">
                        <TimerReset className="h-4 w-4 text-[#f38810]" />
                        {selectedInvoice.dueDate}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-black uppercase text-[#7b857f]">
                        Прогресс оплаты
                      </span>
                      <span className="font-black text-[#223137]">
                        {selectedInvoiceProgress}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#edf1eb]">
                      <div
                        className={`h-full rounded-full ${
                          selectedInvoice.status === "overdue"
                            ? "bg-[#b9472d]"
                            : selectedInvoice.status === "paid"
                              ? "bg-[#2f6b4f]"
                              : "bg-[#f38810]"
                        }`}
                        style={{ width: `${selectedInvoiceProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                  <div className="mb-3 flex items-center gap-3 border-b border-[#edf1eb] pb-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                      <FileDown className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-[#223137]">
                        Документы
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Счета, акты и платежные файлы.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedInvoiceDocuments.map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() =>
                          downloadFinanceDocument(document, selectedInvoice)
                        }
                        className="flex w-full items-center justify-between gap-3 rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-3 py-2 text-left transition hover:border-[#f2c184] hover:bg-[#fff8ed]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black text-[#223137]">
                            {document.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#7b857f]">
                            {document.kind} · {document.size} · {document.updatedAt}
                          </span>
                        </span>
                        <Download className="h-4 w-4 shrink-0 text-[#f38810]" />
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                  <div className="mb-3 flex items-center gap-3 border-b border-[#edf1eb] pb-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                      <Banknote className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-[#223137]">
                        Платежи по счету
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Частичные поступления и банковские референсы.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedInvoicePayments.length > 0 ? (
                      selectedInvoicePayments.map((payment) => (
                        <button
                          key={payment.id}
                          type="button"
                          onClick={() => openViewPaymentDialog(payment)}
                          className="flex w-full items-center justify-between gap-3 rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-3 py-2 text-left transition hover:border-[#dce8dc] hover:bg-[#f5faf5]"
                        >
                          <span>
                            <span className="block text-sm font-black text-[#223137]">
                              {payment.id} · {payment.date}
                            </span>
                            <span className="mt-0.5 block text-xs text-[#7b857f]">
                              {payment.reference || "Без референса"} ·{" "}
                              {getPaymentStatusLabel(payment.status)}
                            </span>
                          </span>
                          <span className="text-sm font-black text-[#2f6b4f]">
                            {formatMoney(payment.amount, payment.currency)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-md border border-dashed border-[#dfe7de] bg-[#fbfcfa] px-3 py-5 text-center text-sm font-semibold text-[#7b857f]">
                        Поступлений по счету пока нет.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                  <div className="mb-3 flex items-center gap-3 border-b border-[#edf1eb] pb-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                      <History className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-[#223137]">
                        История изменений
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Журнал действий по счету и оплатам.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {selectedInvoiceHistory.map((item, index) => (
                      <div key={`${item.date}-${item.title}-${index}`} className="flex gap-3">
                        <span
                          className={`mt-1 size-2.5 rounded-full ${
                            item.tone === "red"
                              ? "bg-[#b9472d]"
                              : item.tone === "green"
                                ? "bg-[#2f6b4f]"
                                : item.tone === "orange"
                                  ? "bg-[#f38810]"
                                  : "bg-[#8a928f]"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-black text-[#223137]">
                            {item.title}
                          </div>
                          <div className="text-xs font-semibold text-[#7b857f]">
                            {item.date}
                          </div>
                          <p className="mt-1 text-sm leading-5 text-[#53605a]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-[#dfe7de] bg-white p-3.5 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#edf1eb] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-[#223137]">
                        Получатель
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Юридические данные и банковские реквизиты.
                      </p>
                    </div>
                  </div>
                  <span className="hidden rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-xs font-black text-[#2f6b4f] sm:inline-flex">
                    {selectedInvoiceReceiverCompany}
                  </span>
                </div>

                <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3 md:col-span-2 lg:col-span-3">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase text-[#7b857f]">
                      <Landmark className="h-3.5 w-3.5 text-[#2f6b4f]" />
                      Юридический адрес
                    </div>
                    <p className="text-sm font-semibold leading-6 text-[#223137]">
                      {selectedInvoiceReceiverAddress}
                    </p>
                  </div>

                  {selectedInvoiceReceiverRequisites.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-md border border-[#edf1eb] bg-white p-2.5"
                    >
                      <div className="text-[11px] font-black uppercase text-[#7b857f]">
                        {item.label}
                      </div>
                      <div className="mt-1 break-words text-sm font-bold text-[#223137]">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-md border border-[#dfe7de] bg-white p-3.5 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                <div className="mb-3 flex items-center gap-3 border-b border-[#edf1eb] pb-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                    <Send className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#223137]">
                      Отправитель
                    </h3>
                    <p className="text-xs text-[#7b857f]">
                      Контрагент, указанный в счете.
                    </p>
                  </div>
                </div>
                <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                  <div className="text-sm font-black text-[#223137]">
                    ООО «
                    {selectedInvoiceDetails.sender_company_name ||
                      "Манучехр Хучаев"}
                    »
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#53605a]">
                    {selectedInvoiceSenderAddress}
                  </div>
                </div>
              </section>

              <section className="grid gap-3 lg:grid-cols-[1fr_280px]">
                <div className="rounded-md border border-[#dfe7de] bg-white p-3.5 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                  <div className="mb-3 flex items-center gap-3 border-b border-[#edf1eb] pb-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                      <FileCheck2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-[#223137]">
                        Контракт и товар
                      </h3>
                      <p className="text-xs text-[#7b857f]">
                        Основание, номенклатура и расчет оплаты.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedInvoiceContractRows.map((item) => (
                      <div
                        key={item.label}
                        className="grid gap-2 rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3 sm:grid-cols-[190px_1fr]"
                      >
                        <div className="text-sm font-black text-[#223137]">
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold leading-6 text-[#53605a]">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] p-3.5 shadow-[0_12px_28px_rgba(243,136,16,0.08)]">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#f38810] text-white">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="text-[11px] font-black uppercase text-[#7b857f]">
                        Итого к оплате
                      </div>
                      <div className="mt-1 text-2xl font-black text-[#223137]">
                        {selectedInvoiceTotalMoney}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-md border border-[#f2dfca] bg-white p-3 text-sm font-semibold leading-6 text-[#53605a]">
                    {selectedInvoiceDetails.total_amount_usd
                      ? `${selectedInvoiceTotalWords} долларов США, 00 центов`
                      : "Сумма сформирована по данным счета."}
                  </div>
                </div>
              </section>

              {selectedInvoiceDetails.director_name && (
                <section className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                        <UserRound className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="text-[11px] font-black uppercase text-[#7b857f]">
                          Подписант
                        </div>
                        <div className="mt-1 text-sm font-black text-[#223137]">
                          Директор: {selectedInvoiceDetails.director_name}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>

            <DialogFooter className="border-t border-[#dfe7de] bg-white px-5 py-4 sm:px-6">
              <Button
                variant="outline"
                onClick={() => setIsViewInvoiceDialogOpen(false)}
                className="h-11 rounded-md border-[#dce4da] px-5 font-bold text-[#53605a]"
              >
                Закрыть
              </Button>
              <Button
                className="h-11 gap-2 rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
                onClick={() =>
                  selectedInvoiceDocuments[0] &&
                  downloadFinanceDocument(
                    selectedInvoiceDocuments[0],
                    selectedInvoice
                  )
                }
              >
                <Download className="h-4 w-4" />
                Скачать счет
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedPayment && (
        <Dialog
          open={isViewPaymentDialogOpen}
          onOpenChange={setIsViewPaymentDialogOpen}
        >
          <DialogContent className="grid h-[90vh] max-h-[780px] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-[#dfe7de] bg-[#f8faf7] [padding:0] sm:max-w-[920px]">
            <DialogHeader className="border-b border-[#dfe7de] bg-white px-5 py-4 pr-12 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
                    <Banknote className="h-3.5 w-3.5" />
                    Платеж
                  </div>
                  <DialogTitle className="text-2xl font-black tracking-tight text-[#223137]">
                    {selectedPayment.id}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-[#6f7774]">
                    Банковское поступление, сверка и связанные документы.
                  </DialogDescription>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:min-w-[420px]">
                  <div className="rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-[#7b857f]">
                      Статус
                    </div>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${getPaymentStatusClassName(
                        selectedPayment.status
                      )}`}
                    >
                      {getPaymentStatusLabel(selectedPayment.status)}
                    </Badge>
                  </div>
                  <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] px-3 py-2">
                    <div className="text-[10px] font-black uppercase text-[#7b857f]">
                      Сумма
                    </div>
                    <div className="mt-1 text-lg font-black text-[#d5740b]">
                      {formatMoney(selectedPayment.amount, selectedPayment.currency)}
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                <aside className="space-y-3">
                  <section className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                    <div className="flex size-11 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-[11px] font-black uppercase text-[#7b857f]">
                      Счет
                    </div>
                    <div className="mt-1 text-lg font-black text-[#223137]">
                      {selectedPayment.invoice}
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-5 text-[#53605a]">
                      {selectedPaymentLinkedInvoice?.contractTitle ||
                        "Связанный контракт"}
                    </div>
                    <div className="mt-4 grid gap-2">
                      <div className="rounded-md bg-[#f7f8f5] px-3 py-2">
                        <div className="text-[10px] font-black uppercase text-[#7b857f]">
                          Референс
                        </div>
                        <div className="mt-1 truncate text-sm font-bold text-[#223137]">
                          {selectedPayment.reference || "Не указан"}
                        </div>
                      </div>
                      <div className="rounded-md bg-[#f7f8f5] px-3 py-2">
                        <div className="text-[10px] font-black uppercase text-[#7b857f]">
                          Метод
                        </div>
                        <div className="mt-1 text-sm font-bold text-[#223137]">
                          {getPaymentMethodName(selectedPayment.method)}
                        </div>
                      </div>
                      <div className="rounded-md bg-[#fff3e5] px-3 py-2">
                        <div className="text-[10px] font-black uppercase text-[#9a621d]">
                          Дата поступления
                        </div>
                        <div className="mt-1 text-sm font-black text-[#d5740b]">
                          {selectedPayment.date}
                        </div>
                      </div>
                    </div>
                  </section>
                </aside>

                <div className="grid gap-4">
                  {selectedPaymentLinkedInvoice && (
                    <section className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                      <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#edf1eb] pb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                            <Link2 className="h-5 w-5" />
                          </span>
                          <div>
                            <h3 className="text-base font-black text-[#223137]">
                              Связанный счет
                            </h3>
                            <p className="text-xs text-[#7b857f]">
                              Остаток и прогресс обновляются по связанным платежам.
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={getStatusClassName(
                            selectedPaymentLinkedInvoice.status
                          )}
                        >
                          {getStatusLabel(selectedPaymentLinkedInvoice.status)}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                          <div className="text-[10px] font-black uppercase text-[#7b857f]">
                            Сумма счета
                          </div>
                          <div className="mt-1 text-base font-black text-[#223137]">
                            {formatMoney(
                              selectedPaymentLinkedInvoice.amount,
                              selectedPaymentLinkedInvoice.currency
                            )}
                          </div>
                        </div>
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                          <div className="text-[10px] font-black uppercase text-[#7b857f]">
                            Остаток
                          </div>
                          <div className="mt-1 text-base font-black text-[#d5740b]">
                            {formatMoney(
                              getInvoiceBalance(selectedPaymentLinkedInvoice),
                              selectedPaymentLinkedInvoice.currency
                            )}
                          </div>
                        </div>
                        <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-3">
                          <div className="text-[10px] font-black uppercase text-[#7b857f]">
                            Прогресс
                          </div>
                          <div className="mt-1 text-base font-black text-[#2f6b4f]">
                            {getInvoiceProgress(selectedPaymentLinkedInvoice)}%
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                      <div className="mb-3 flex items-center gap-3 border-b border-[#edf1eb] pb-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                          <FileDown className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-black text-[#223137]">
                            Документы
                          </h3>
                          <p className="text-xs text-[#7b857f]">
                            Поручения, выписки и подтверждения.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {selectedPaymentDocuments.map((document) => (
                          <button
                            key={document.id}
                            type="button"
                            onClick={() =>
                              downloadFinanceDocument(document, selectedPayment)
                            }
                            className="flex w-full items-center justify-between gap-3 rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-3 py-2 text-left transition hover:border-[#f2c184] hover:bg-[#fff8ed]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-black text-[#223137]">
                                {document.title}
                              </span>
                              <span className="mt-0.5 block text-xs text-[#7b857f]">
                                {document.kind} · {document.size}
                              </span>
                            </span>
                            <Download className="h-4 w-4 shrink-0 text-[#f38810]" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                      <div className="mb-3 flex items-center gap-3 border-b border-[#edf1eb] pb-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                          <History className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-black text-[#223137]">
                            История
                          </h3>
                          <p className="text-xs text-[#7b857f]">
                            События обработки платежа.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {selectedPaymentHistory.map((item, index) => (
                          <div
                            key={`${item.date}-${item.title}-${index}`}
                            className="flex gap-3"
                          >
                            <span
                              className={`mt-1 size-2.5 rounded-full ${
                                item.tone === "green"
                                  ? "bg-[#2f6b4f]"
                                  : item.tone === "red"
                                    ? "bg-[#b9472d]"
                                    : "bg-[#f38810]"
                              }`}
                            />
                            <div>
                              <div className="text-sm font-black text-[#223137]">
                                {item.title}
                              </div>
                              <div className="text-xs font-semibold text-[#7b857f]">
                                {item.date}
                              </div>
                              <p className="mt-1 text-sm leading-5 text-[#53605a]">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-[#dfe7de] bg-white px-5 py-4 sm:px-6">
              <Button
                variant="outline"
                onClick={() => setIsViewPaymentDialogOpen(false)}
                className="h-11 rounded-md border-[#dce4da] px-5 font-bold text-[#53605a]"
              >
                Закрыть
              </Button>
              <Button
                className="h-11 gap-2 rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c]"
                onClick={() =>
                  selectedPaymentDocuments[0] &&
                  downloadFinanceDocument(
                    selectedPaymentDocuments[0],
                    selectedPayment
                  )
                }
              >
                <Download className="h-4 w-4" />
                Скачать документ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
