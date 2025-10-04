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
import { Save } from "lucide-react";
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <DialogHeader>
          <DialogTitle>Редактировать компанию</DialogTitle>
          <DialogDescription>
            Редактирование компании: {editingCompany.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="font-medium">
              Название компании <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              value={editingCompany.name}
              onChange={(e) =>
                setEditingCompany({
                  ...editingCompany,
                  name: e.target.value,
                })
              }
              className="w-full"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            type="submit"
            onClick={handleEditCompany}
            disabled={updateMutation.isPending || !editingCompany.name.trim()}
            className="w-full sm:w-auto"
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
