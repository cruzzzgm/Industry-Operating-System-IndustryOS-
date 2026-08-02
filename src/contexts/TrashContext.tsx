import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export interface TrashedItem {
  id: string;
  type: "order" | "product" | "customer" | "finance" | "carrier";
  name: string;
  deletedAt: Date;
  data: any;
}

interface TrashContextType {
  trashedItems: TrashedItem[];
  addToTrash: (item: Omit<TrashedItem, "deletedAt">) => void;
  restoreItem: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  registerRestoreCallback: (type: string, callback: (data: any) => void) => () => void;
}

const TrashContext = createContext<TrashContextType | undefined>(undefined);

export function TrashProvider({ children }: { children: React.ReactNode }) {
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  
  // Usar ref para callbacks para evitar stale closure
  const callbacksRef = useRef<Record<string, Set<(data: any) => void>>>({});

  const registerRestoreCallback = useCallback((type: string, callback: (data: any) => void) => {
    // Inicializar o Set se não existir
    if (!callbacksRef.current[type]) {
      callbacksRef.current[type] = new Set();
    }
    // Adicionar callback
    callbacksRef.current[type].add(callback);
    
    // Retornar função de cleanup
    return () => {
      callbacksRef.current[type]?.delete(callback);
    };
  }, []);

  const addToTrash = useCallback((item: Omit<TrashedItem, "deletedAt">) => {
    const newItem: TrashedItem = {
      ...item,
      deletedAt: new Date(),
    };
    setTrashedItems((prev) => [newItem, ...prev]);
    toast.success(`${item.name} movido para a lixeira`);
  }, []);

  const restoreItem = useCallback((id: string) => {
    const item = trashedItems.find(i => i.id === id);
    if (!item) {
      toast.error("Item não encontrado na lixeira");
      return;
    }

    // Chama TODOS os callbacks registrados para o tipo específico
    const callbacks = callbacksRef.current[item.type];
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach(callback => {
        try {
          callback(item.data);
        } catch (error) {
          console.error("Erro ao restaurar item:", error);
        }
      });
    } else {
      console.warn(`Nenhum callback registrado para tipo: ${item.type}`);
    }

    setTrashedItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(`${item.name} restaurado com sucesso!`);
  }, [trashedItems]);

  const permanentlyDelete = useCallback((id: string) => {
    const item = trashedItems.find(i => i.id === id);
    setTrashedItems((prev) => prev.filter((i) => i.id !== id));
    if (item) {
      toast.success(`${item.name} excluído permanentemente!`);
    }
  }, [trashedItems]);

  return (
    <TrashContext.Provider
      value={{
        trashedItems,
        addToTrash,
        restoreItem,
        permanentlyDelete,
        registerRestoreCallback,
      }}
    >
      {children}
    </TrashContext.Provider>
  );
}

export function useTrash() {
  const context = useContext(TrashContext);
  if (context === undefined) {
    throw new Error("useTrash must be used within a TrashProvider");
  }
  return context;
}
