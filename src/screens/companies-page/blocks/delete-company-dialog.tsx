import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useDeleteCompany } from "@/entities/companies/hooks/mutations/use-delete-company.mutation";

interface Company {
  id: number;
  name: string;
}

interface DeleteCompanyDialogProps {
  company: Company;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteCompanyDialog({
  company,
  isOpen,
  onOpenChange,
}: DeleteCompanyDialogProps) {
  const deleteMutation = useDeleteCompany();

  const handleDeleteCompany = () => {
    deleteMutation.mutate(company.id.toString(), {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] !max-w-[480px] gap-0 overflow-hidden rounded-md border-[#f4d6ce] bg-white p-0 shadow-[0_24px_70px_rgba(34,49,55,0.22)]">
        <DialogHeader className="border-b border-[#f4d6ce] bg-[#fff8f6] px-5 py-5 pr-14">
          <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-[#fff1ed] text-[#b9472d]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-2xl font-black text-[#223137]">
            Удалить компанию
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6f7774]">
            Вы уверены, что хотите удалить компанию "{company.name}"?
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-5">
          <p className="rounded-md border border-[#f4d6ce] bg-[#fff8f6] px-4 py-3 text-sm font-medium text-[#7b857f]">
            Это действие нельзя отменить. Компания будет удалена из системы.
          </p>
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
            variant="destructive"
            onClick={handleDeleteCompany}
            disabled={deleteMutation.isPending}
            className="h-10 w-full rounded-md bg-[#b9472d] px-5 font-black text-white shadow-[0_10px_24px_rgba(185,71,45,0.20)] hover:bg-[#9f3925] disabled:bg-[#d8ded6] disabled:text-[#7b857f] sm:w-auto"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Удаление...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
