import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-[425px] mx-2 sm:mx-0">
        <DialogHeader>
          <DialogTitle>Удалить компанию</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите удалить компанию "{company.name}"?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Это действие нельзя отменить. Компания будет удалена из системы.
          </p>
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
            variant="destructive"
            onClick={handleDeleteCompany}
            disabled={deleteMutation.isPending}
            className="w-full sm:w-auto"
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
