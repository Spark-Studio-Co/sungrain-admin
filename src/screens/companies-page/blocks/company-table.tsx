import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Edit3, Eye, Hash, Trash2 } from "lucide-react";

interface Company {
  id: number;
  name: string;
}

interface CompanyTableProps {
  companies: Company[];
  isLoading: boolean;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onView: (company: Company) => void;
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CO";

export default function CompanyTable({
  companies,
  isLoading,
  onEdit,
  onDelete,
  onView,
}: CompanyTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-3 sm:hidden">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Card
                key={`mobile-company-skeleton-${index}`}
                className="rounded-md border-[#dfe7de] bg-white shadow-sm"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-11 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-md" />
                </CardContent>
              </Card>
            ))}
        </div>

        <div className="hidden overflow-hidden rounded-md border border-[#e5ece4] sm:block">
          <Table>
            <TableHeader className="bg-[#f7f8f5]">
              <TableRow className="border-[#e5ece4] hover:bg-[#f7f8f5]">
                <TableHead>Компания</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={`desktop-company-skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-md" />
                        <Skeleton className="h-5 w-52" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-20 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-24 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-9 w-32 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="px-4 py-12 text-center sm:px-6">
        <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-black text-[#223137]">
          Компании не найдены
        </h3>
        <p className="mt-1 text-sm text-[#7b857f]">
          Попробуйте изменить поисковый запрос.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-3 p-4 sm:hidden">
        {companies.map((company) => (
          <Card
            key={company.id}
            className="rounded-md border-[#dfe7de] bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                    {getInitials(company.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[#223137]">
                      {company.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#7b857f]">
                      <Hash className="h-3.5 w-3.5" />
                      ID {company.id}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-md border-[#dce8dc] bg-[#f5faf5] px-2 py-1 text-[11px] font-black text-[#2f6b4f]"
                >
                  Активна
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => onView(company)}
                  className="h-10 rounded-md border-[#dce4da] bg-white font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onEdit(company)}
                  className="h-10 rounded-md border-[#dce4da] bg-white font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onDelete(company)}
                  className="h-10 rounded-md border-[#f4d6ce] bg-white font-bold text-[#b9472d] hover:bg-[#fff1ed] hover:text-[#9f3925]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <Table>
          <TableHeader className="bg-[#f7f8f5]">
            <TableRow className="border-[#e5ece4] hover:bg-[#f7f8f5]">
              <TableHead className="h-11 px-5 text-xs font-black uppercase text-[#7b857f]">
                Компания
              </TableHead>
              <TableHead className="h-11 text-xs font-black uppercase text-[#7b857f]">
                ID
              </TableHead>
              <TableHead className="h-11 text-xs font-black uppercase text-[#7b857f]">
                Статус
              </TableHead>
              <TableHead className="h-11 pr-5 text-right text-xs font-black uppercase text-[#7b857f]">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow
                key={company.id}
                className="border-[#edf1eb] transition-colors hover:bg-[#fbfcfa]"
              >
                <TableCell className="px-5 py-4">
                  <div className="flex min-w-[260px] items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#eef5ef] text-sm font-black text-[#2f6b4f]">
                      {getInitials(company.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-black text-[#223137]">
                        {company.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[#7b857f]">
                        <Building2 className="h-3.5 w-3.5" />
                        Партнер CRM
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-2.5 py-1 text-sm font-black text-[#53605a]">
                    <Hash className="h-3.5 w-3.5 text-[#8a928f]" />
                    {company.id}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="rounded-md border-[#dce8dc] bg-[#f5faf5] px-2.5 py-1 text-xs font-black text-[#2f6b4f]"
                  >
                    Активна
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onView(company)}
                      className="h-9 w-9 rounded-md border-[#dce4da] bg-white text-[#53605a] shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                      aria-label="Посмотреть компанию"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onEdit(company)}
                      className="h-9 w-9 rounded-md border-[#dce4da] bg-white text-[#53605a] shadow-sm hover:bg-[#eef5ef] hover:text-[#2f6b4f]"
                      aria-label="Редактировать компанию"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onDelete(company)}
                      className="h-9 w-9 rounded-md border-[#f4d6ce] bg-white text-[#b9472d] shadow-sm hover:bg-[#fff1ed] hover:text-[#9f3925]"
                      aria-label="Удалить компанию"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
