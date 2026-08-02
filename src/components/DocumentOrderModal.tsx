import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Package } from "lucide-react";
import { Order } from "@/data/mockData";
import { MoneyInputBr } from "@/components/ui/masked-input";

interface Props {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onSave?: (order: Order) => void;
  /** destaque visual: pedido | nf */
  focus?: "pedido" | "nf";
}

export default function DocumentOrderModal({ order, open, onClose, onSave, focus = "pedido" }: Props) {
  const [editedOrder, setEditedOrder] = useState<Order | null>(order);

  useEffect(() => {
    setEditedOrder(order);
  }, [order]);

  if (!order) return null;

  const workingOrder = editedOrder || order;
  const calculatedTotal = workingOrder.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const updateItem = (index: number, changes: Partial<typeof workingOrder.items[number]>) => {
    setEditedOrder(prev => {
      if (!prev) return prev;
      const newItems = prev.items.map((item, i) => (i === index ? { ...item, ...changes } : item));
      return { ...prev, items: newItems, totalValue: newItems.reduce((s, it) => s + Number(it.totalPrice || 0), 0) };
    });
  };

  const handleSave = () => {
    if (workingOrder && onSave) onSave({ ...workingOrder, totalValue: calculatedTotal });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="w-[min(95vw,1200px)] sm:max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Documento — Pedido <span className={focus === "pedido" ? "text-primary font-mono" : "font-mono"}>{workingOrder.id}</span>
          </DialogTitle>
          <DialogDescription>
            {workingOrder.customerName} · {workingOrder.product}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/30">
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-semibold">R$ {calculatedTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Input value={workingOrder.status} onChange={e => setEditedOrder(prev => prev ? { ...prev, status: e.target.value as any } : prev)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">NF / Recibo</p>
              {workingOrder.hasRecibo && workingOrder.reciboNumber ? (
                <Input
                  value={workingOrder.reciboNumber}
                  onChange={e => setEditedOrder(prev => prev ? { ...prev, reciboNumber: e.target.value } : prev)}
                  className={focus === "nf" ? "text-primary font-mono" : "font-mono"}
                />
              ) : (
                <p className="text-muted-foreground">Sem recibo</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Atualizado</p>
              <Input value={workingOrder.updatedAt} onChange={e => setEditedOrder(prev => prev ? { ...prev, updatedAt: e.target.value } : prev)} />
            </div>
          </div>

          {workingOrder.items.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Itens (editável)
              </p>
              <div className="max-h-[340px] overflow-auto rounded-md border relative">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-xs">NCM</TableHead>
                      <TableHead className="text-xs text-right">Qtd</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workingOrder.items.map((it, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs max-w-[200px]">
                          <Input
                            value={it.description}
                            onChange={e => updateItem(i, { description: e.target.value })}
                            className="text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <Input
                            value={it.ncmCode}
                            onChange={e => updateItem(i, { ncmCode: e.target.value })}
                            className="text-xs"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-right tabular-nums">
                          <Input
                            type="number"
                            value={String(it.quantity)}
                            min={0}
                            onChange={e => updateItem(i, { quantity: Number(e.target.value) })}
                            className="text-xs text-right"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          <MoneyInputBr
                            value={it.totalPrice}
                            onValueChange={value => updateItem(i, { totalPrice: Number(value) })}
                            className="text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
