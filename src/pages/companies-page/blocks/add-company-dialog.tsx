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
import { Plus } from "lucide-react";
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
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Добавить компанию</span>
          <span className="sm:hidden">Добавить</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        <DialogHeader>
          <DialogTitle>Добавить новую компанию</DialogTitle>
          <DialogDescription>
            Заполните информацию о новой компании
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">
              Название компании <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={newCompany.name}
              onChange={(e) =>
                setNewCompany({ ...newCompany, name: e.target.value })
              }
              placeholder="ООО Компания"
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
            onClick={handleAddCompany}
            disabled={createMutation.isPending || !newCompany.name.trim()}
            className="w-full sm:w-auto"
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
