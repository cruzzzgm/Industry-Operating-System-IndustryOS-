import { useState } from "react";
import { Trash2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTrash } from "@/contexts/TrashContext";

export function TrashBin() {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { trashedItems, restoreItem, permanentlyDelete } = useTrash();

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "order":
        return "Pedido";
      case "product":
        return "Produto";
      case "customer":
        return "Cliente";
      case "finance":
        return "Financeiro";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "order":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "product":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "customer":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "finance":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-10 w-10 hover:bg-accent relative"
        title="Lixeira"
      >
        <Trash2 className="h-5 w-5" />
        {trashedItems.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
            {trashedItems.length}
          </Badge>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Lixeira
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {trashedItems.length} itens excluídos. Restaure ou exclua permanentemente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {trashedItems.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>A lixeira está vazia</p>
              </div>
            ) : (
              trashedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getTypeColor(item.type)}>
                      {getTypeLabel(item.type)}
                    </Badge>
                    <div>
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        Excluído em {item.deletedAt.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                      onClick={() => restoreItem(item.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => setConfirmDelete(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão permanente */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">
              Excluir Permanentemente?
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Esta ação não pode ser desfeita. O item será removido permanentemente do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              className="border-zinc-700"
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (confirmDelete) {
                  permanentlyDelete(confirmDelete);
                  setConfirmDelete(null);
                }
              }}
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
