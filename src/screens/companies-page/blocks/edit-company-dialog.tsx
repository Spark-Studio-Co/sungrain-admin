import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save } from "lucide-react";
import { useUpdateCompanies } from "@/entities/companies/hooks/mutations/use-update-company.mutation";
import { CompanyData } from "@/entities/companies/api/patch/update-company.api";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";

interface EditCompanyDialogProps {
  companyId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

export default function EditCompanyDialog({
  companyId,
  isOpen,
  onOpenChange,
  onClose,
}: EditCompanyDialogProps) {
  const [editingCompany, setEditingCompany] = useState({
    id: companyId,
    name: "",
  });

  const updateMutation = useUpdateCompanies();
  const { data: companiesData } = useGetCompanies(1, 1000); // Get all companies to find the one we're editing

  useEffect(() => {
    if (companiesData?.data && companyId) {
      const company = companiesData.data.find((c: any) => c.id === companyId);
      if (company) {
        setEditingCompany({
          id: companyId,
          name: company.name || "",
        });
      }
    }
  }, [companiesData, companyId]);

  const handleEditCompany = () => {
    const updateData: CompanyData = {
      id: editingCompany.id,
      name: editingCompany.name,
    };

    updateMutation.mutate(updateData, {
      onSuccess: () => {
        onOpenChange(false);
        onClose();
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] !max-w-[520px] gap-0 overflow-hidden rounded-md border-[#f2dfca] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
        <DialogHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-5 py-5 pr-14">
          <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-black uppercase text-[#2f6b4f]">
            <Building2 className="h-3.5 w-3.5" />
            Профиль компании
          </div>
          <DialogTitle className="text-2xl font-black text-[#223137]">
            Редактировать компанию
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6f7774]">
            Редактирование компании: {editingCompany.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="font-black text-[#223137]">
              Название компании <span className="text-[#f38810]">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
              <Input
                id="edit-name"
                value={editingCompany.name}
                onChange={(e) =>
                  setEditingCompany({
                    ...editingCompany,
                    name: e.target.value,
                  })
                }
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
            onClick={handleEditCompany}
            disabled={updateMutation.isPending || !editingCompany.name.trim()}
            className="h-10 w-full rounded-md bg-[#f38810] px-5 font-black text-white shadow-[0_10px_24px_rgba(243,136,16,0.20)] hover:bg-[#db790c] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
          >
            {updateMutation.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
