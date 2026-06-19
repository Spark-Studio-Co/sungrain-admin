import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus } from "lucide-react";
import { useCreateCompany } from "@/entities/companies/hooks/mutations/use-create-company.mutation";

interface AddCompanyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCompanyDialog({
  isOpen,
  onOpenChange,
}: AddCompanyDialogProps) {
  const [newCompany, setNewCompany] = useState({
    name: "",
  });

  const createMutation = useCreateCompany();

  const handleAddCompany = () => {
    createMutation.mutate(newCompany, {
      onSuccess: () => {
        setNewCompany({
          name: "",
        });
        onOpenChange(false);
      },
    });
  };

  const resetForm = () => {
    setNewCompany({
      name: "",
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-10 w-full gap-2 rounded-md bg-[#f38810] px-4 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.22)] hover:bg-[#db790c] sm:w-auto">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Добавить компанию</span>
          <span className="sm:hidden">Добавить</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] !max-w-[520px] gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
        <DialogHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
            <Building2 className="h-3.5 w-3.5" />
            Новая компания
          </div>
          <DialogTitle className="text-2xl font-black text-[#223137]">
            Добавить компанию
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6f7774]">
            Создайте новую запись в партнерской базе.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-black text-[#223137]">
              Название компании <span className="text-[#f38810]">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
              <Input
                id="name"
                value={newCompany.name}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, name: e.target.value })
                }
                placeholder="ТОО Sungrain Export"
                className="h-11 rounded-md border-[#dce4da] bg-white pl-10 text-[#223137] shadow-sm focus-visible:border-[#f38810] focus-visible:ring-[#f38810]/20"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-[#e5ece4] bg-[#fbfcfa] px-5 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full rounded-md border-[#dce4da] bg-white px-5 font-bold text-[#53605a] hover:bg-[#eef5ef] hover:text-[#2f6b4f] sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            onClick={handleAddCompany}
            disabled={createMutation.isPending || !newCompany.name.trim()}
            className="h-10 w-full rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
          >
            {createMutation.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Добавление...
              </>
            ) : (
              "Добавить компанию"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
