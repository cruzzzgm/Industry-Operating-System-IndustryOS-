import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MoneyInputBr } from "@/components/ui/masked-input";
import { FinanceEntry } from "@/data/mockData";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (entry: Omit<FinanceEntry, "id"> | FinanceEntry) => void;
  entry?: FinanceEntry | null;
}

const CATEGORIES_RECEITA = ["Vendas", "Rendimentos"] as const;
const CATEGORIES_DESPESA = ["Insumos", "RH", "Logística", "Impostos", "Utilidades"] as const;

export default function TransactionModal({ open, onClose, onSave, entry }: Props) {
  const isEdit = !!entry;
  const [description, setDescription] = useState("");
  const [type] = useState<"receita" | "despesa">("despesa");
  const [value, setValue] = useState<number | "">("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [paid, setPaid] = useState(false);
  const [category, setCategory] = useState("");

  const categories = useMemo(
    () => (type === "receita" ? CATEGORIES_RECEITA : CATEGORIES_DESPESA),
    [type],
  );

  useEffect(() => {
    if (!open) return;
    if (entry) {
      setDescription(entry.description);
      setValue(entry.value);
      setDueDate(entry.dueDate);
      setPaid(entry.paid);
      setCategory(entry.category);
    } else {
      setDescription("");
      setValue("");
      setDueDate(new Date().toISOString().slice(0, 10));
      setPaid(false);
      setCategory("");
    }
  }, [open, entry]);

  const isIncome = type === "receita";

  const handleSubmit = () => {
    if (!description.trim() || value === "" || !category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const data = {
      ...(isEdit ? { id: entry!.id } : {}),
      description: description.trim(),
      type,
      value: Number(value),
      dueDate,
      paid,
      category,
    };
    onSave(data as any);
    toast.success(isEdit ? "Transação atualizada!" : "Transação adicionada!");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={o => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Pencil className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
            {isEdit ? "Editar Transação" : "Nova Transação"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Altere os campos necessários" : "Registre uma nova entrada ou saída"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tx-desc">Descrição</Label>
            <Input id="tx-desc" name="tx-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição da transação" />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="tx-category"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tx-value">Valor</Label>
              <MoneyInputBr id="tx-value" name="tx-value" value={value} onValueChange={setValue} placeholder="R$ 0,00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tx-date">Vencimento</Label>
              <Input id="tx-date" name="tx-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <Label htmlFor="tx-paid" className="text-sm">Pago?</Label>
            <Switch id="tx-paid" checked={paid} onCheckedChange={setPaid} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{isEdit ? "Salvar" : "Adicionar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
