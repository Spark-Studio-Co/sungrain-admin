import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Edit3, Hash } from "lucide-react";

interface Company {
  id: number;
  name: string;
}

interface ViewCompanyDialogProps {
  company: Company;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export default function ViewCompanyDialog({
  company,
  isOpen,
  onOpenChange,
  onEdit,
}: ViewCompanyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] !max-w-[560px] gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
        <DialogHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
            <Building2 className="h-3.5 w-3.5" />
            Компания
          </div>
          <DialogTitle className="text-2xl font-black text-[#223137]">
            Информация о компании
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6f7774]">
            Детальная информация о компании: {company.name}
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-5">
          <div className="rounded-md border border-[#e5ece4] bg-[#fbfcfa] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-md bg-[#eef5ef] text-[#2f6b4f]">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-lg font-black text-[#223137]">
                  {company.name}
                </h3>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[#dfe7de] bg-white px-2.5 py-1 text-sm font-black text-[#53605a]">
                  <Hash className="h-3.5 w-3.5 text-[#8a928f]" />
                  ID {company.id}
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-5 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f] sm:w-auto"
          >
            Закрыть
          </Button>
          <Button
            onClick={onEdit}
            className="h-10 w-full rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] sm:w-auto"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Редактировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
