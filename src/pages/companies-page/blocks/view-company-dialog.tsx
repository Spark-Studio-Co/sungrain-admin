import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Building } from "lucide-react";

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <DialogHeader>
          <DialogTitle>Информация о компании</DialogTitle>
          <DialogDescription>
            Детальная информация о компании: {company.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold break-words">
                  {company.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  ID: {company.id}
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Закрыть
          </Button>
          <Button onClick={onEdit} className="w-full sm:w-auto">
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
