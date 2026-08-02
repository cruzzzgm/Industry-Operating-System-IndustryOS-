import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInputBr } from "@/components/ui/masked-input";
import { FixedExpense } from "@/data/mockData";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (expense: Omit<FixedExpense, "id"> | FixedExpense) => void;
  expense?: FixedExpense | null;
}

const categories = ["Infraestrutura", "RH", "Utilidades", "Manutenção", "Logística", "Imposto", "Taxa", "Outros"];

export default function FixedExpenseModal({ open, onClose, onSave, expense }: Props) {
  const isEdit = !!expense;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number | "">("");
  const [dueDay, setDueDay] = useState("10");

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setName(expense.name);
      setCategory(expense.category);
      setEstimatedValue(expense.estimatedValue);
      setDueDay(String(expense.dueDay));
    } else {
      setName("");
      setCategory("");
      setEstimatedValue("");
      setDueDay("10");
    }
  }, [open, expense]);

  const handleSubmit = () => {
    if (!name.trim() || estimatedValue === "" || !category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const data = {
      ...(isEdit ? { id: expense!.id } : {}),
      name: name.trim(),
      category,
      estimatedValue: Number(estimatedValue),
      dueDay: Number(dueDay),
      active: true,
    };
    onSave(data as any);
    toast.success(isEdit ? "Conta fixa atualizada!" : "Conta fixa cadastrada!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
            {isEdit ? "Editar Conta Fixa" : "Nova Conta Fixa"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Altere os dados da conta fixa recorrente" : "Cadastre uma conta fixa mensal recorrente"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="fe-name">Nome da Conta</Label>
            <Input id="fe-name" name="fe-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Aluguel, Sabesp, Enel..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="fe-category"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fe-value">Valor estimado</Label>
              <MoneyInputBr id="fe-value" name="fe-value" value={estimatedValue} onValueChange={setEstimatedValue} placeholder="R$ 0,00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fe-day">Dia de Vencimento</Label>
            <Input id="fe-day" name="fe-day" type="number" min={1} max={28} value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="10" />
            <p className="text-xs text-muted-foreground">Dia do mês em que a conta vence (1-28)</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Salvar" : "Cadastrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
