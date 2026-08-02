import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Phone, Search, Users, RefreshCw, Building2, TrendingUp, Trash2, DollarSign, Plus, MessageSquare, Mail, MessageCircle, CheckCircle } from "lucide-react";
import { CnpjInput, CellPhoneBrInput } from "@/components/ui/masked-input";
import { toast } from "sonner";
import { fetchCustomers, fetchCustomerStatistics, addCustomer, updateCustomer } from "@/services/api";
import { Customer } from "@/data/mockData";
import AutomationModal from "@/components/AutomationModal";
import { useDebounce } from "@/hooks/useDebounce";
import { Country, State, City } from "country-state-city";
import { useTrash } from "@/contexts/TrashContext";

const MIN_TABLE_ROWS = 7;
const FIXED_TABLE_HEIGHT = "380px";

interface ContactHistory {
  id: string;
  date: string;
  type: "email" | "whatsapp";
  recipient: string;
  message: string;
  status: "sent" | "failed" | "pending";
}

function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass,
  footer,
}: {
  label: string;
  value: string | number;
  icon: any;
  colorClass: string;
  footer: string;
}) {
  return (
    <Card className="rounded-2xl border-zinc-800 bg-zinc-900/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{label}</p>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClass} bg-white/10 dark:bg-white/10`}>
            <Icon className={`h-5 w-5 shrink-0 ${colorClass}`} />
          </div>
        </div>
        <div className="mt-6 min-w-0">
          <p className="text-3xl font-bold tracking-tight tabular-nums truncate">{value}</p>
          <p className="text-xs text-muted-foreground">{footer}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactCustomer, setContactCustomer] = useState<Customer | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const [messagedCustomers, setMessagedCustomers] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "", direction: "asc" });
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [globalContactHistory, setGlobalContactHistory] = useState<Record<string, ContactHistory[]>>({});
  const [viewingMessage, setViewingMessage] = useState<ContactHistory | null>(null);

  const { addToTrash, registerRestoreCallback } = useTrash();

  // Carregar clientes do backend
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes. Usando dados de exemplo.");
      // Fallback para mockData se a API falhar
      // Importar initialCustomers se necessário
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unregister = registerRestoreCallback("customer", (customerData: Customer) => {
      setCustomers((prev) => [customerData, ...prev]);
    });
    return unregister;
  }, [registerRestoreCallback]);

  const handleDeleteCustomer = useCallback((customer: Customer) => {
    addToTrash({
      id: customer.cnpj,
      type: "customer",
      name: customer.company,
      data: customer,
    });
    setCustomers((prev) => prev.filter((c) => c.cnpj !== customer.cnpj));
    setDeleteConfirm(null);
  }, [addToTrash]);

  const inactiveThresholdDays = 90;

  const getStatus = useCallback((c: Customer) => {
    const days = Math.floor((Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days > inactiveThresholdDays) return "Inativo";
    return "Ativo";
  }, []);

  const { active, inactive } = useMemo(() => {
    let a = 0;
    let i = 0;
    customers.forEach((c) => {
      const s = getStatus(c);
      if (s === "Ativo") a++;
      else if (s === "Inativo") i++;
    });
    return { active: a, inactive: i };
  }, [customers, getStatus]);

  const avgTicket = useMemo(() => {
    const total = customers.reduce((s, c) => s + c.totalSpent, 0);
    const orders = customers.reduce((s, c) => s + c.totalOrders, 0);
    return orders > 0 ? total / orders : 0;
  }, [customers]);

  const totalRevenue = useMemo(() => {
    return customers.reduce((s, c) => s + c.totalSpent, 0);
  }, [customers]);

  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig({ key: "", direction: "asc" });
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  const sortedData = useMemo(() => {
    const uniqueCustomersMap = new Map();
    customers.forEach((c) => uniqueCustomersMap.set(c.id, c));
    const result = Array.from(uniqueCustomersMap.values()) as Customer[];

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "company":
            aValue = a.company.toLowerCase();
            bValue = b.company.toLowerCase();
            break;
          case "cnpj":
            aValue = a.cnpj.toLowerCase();
            bValue = b.cnpj.toLowerCase();
            break;
          case "email":
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
            break;
          case "phone":
            aValue = a.phone.toLowerCase();
            bValue = b.phone.toLowerCase();
            break;
          case "status":
            aValue = getStatus(a);
            bValue = getStatus(b);
            break;
          default:
            return 0;
        }

        if (aValue === bValue) return 0;
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [customers, sortConfig, getStatus]);

  const filteredCustomers = useMemo(() => {
    let result = sortedData;

    if (debouncedSearch) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.company.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.phone.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.cnpj.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    return result;
  }, [sortedData, debouncedSearch]);

  const handleSuggestContact = useCallback((customer: Customer) => {
    setContactCustomer(customer);
  }, []);

  const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  const handleMessageSent = (customerId: string) => {
    setMessagedCustomers((prev) => new Set(prev).add(customerId));
  };

  const handleSaveCustomer = useCallback(async (data: Partial<Customer>) => {
    if (editCustomer) {
      try {
        toast.info("Sincronizando dados...", { duration: 2000 });
        const updated = await updateCustomer(editCustomer.id, data);
        setCustomers((prev) => prev.map((c) => c.id === editCustomer.id ? updated : c));
        toast.success("Cliente atualizado com sucesso!", {
          icon: <RefreshCw className="h-4 w-4" />,
          duration: 4000,
        });
      } catch (error) {
        console.error("Erro ao atualizar cliente:", error);
        toast.error("Erro ao atualizar cliente");
      }
    } else {
      try {
        toast.info("Criando novo cliente...", { duration: 2000 });
        const newCustomer = await addCustomer(data as Omit<Customer, "id">);
        setCustomers((prev) => [...prev, newCustomer]);
        toast.success("Cliente cadastrado com sucesso!", {
          icon: <RefreshCw className="h-4 w-4" />,
          duration: 4000,
        });
      } catch (error) {
        console.error("Erro ao criar cliente:", error);
        toast.error("Erro ao criar cliente");
      }
    }
    setShowForm(false);
    setEditCustomer(null);
  }, [editCustomer]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Ativo: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      Inativo: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    };
    return <Badge variant="outline" className={`text-xs ${styles[status] || ""}`}>{status}</Badge>;
  };

  const customersNeedingAttention = customers.filter((c) => getStatus(c) !== "Ativo");

  return (
    <div className="space-y-20 pb-32">
      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Clientes</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setEditCustomer(null); setShowForm(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <MetricCard label="Total" value={customers.length} icon={Users} colorClass="text-blue-400" footer={`${active} ativos`} />
          <MetricCard label="Ativos" value={active} icon={Users} colorClass="text-emerald-400" footer="Clientes engajados" />
          <MetricCard label="Inativos" value={inactive} icon={AlertTriangle} colorClass="text-amber-400" footer="Reengajamento" />
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[92px]">
            <div>
              <CardTitle className="text-lg font-medium">Clientes</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Lista completa de clientes cadastrados no sistema.</p>
            </div>
            <div className="relative min-w-[220px] w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
                id="customer-search"
                name="customer-search"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: FIXED_TABLE_HEIGHT }} className="overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="w-full min-w-[640px]">
                <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                  <TableRow className="h-11 hover:bg-transparent">
                    <TableHead className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("company")}>
                      <div className="flex items-center justify-between gap-1">
                        <span>Empresa</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === "company" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("cnpj")}>
                      <div className="flex items-center justify-between gap-1">
                        <span>CNPJ</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === "cnpj" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("email")}>
                      <div className="flex items-center justify-between gap-1">
                        <span>E-mail</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === "email" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("phone")}>
                      <div className="flex items-center justify-between gap-1">
                        <span>Telefone</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === "phone" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="text-center text-[10px] uppercase tracking-wider text-zinc-400" onClick={() => handleSort("status")}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Status</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === "status" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wider text-zinc-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((c) => {
                    const status = getStatus(c);
                    return (
                      <TableRow key={c.id} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-xs">{c.company}</TableCell>
                        <TableCell className="text-xs font-mono">{c.cnpj}</TableCell>
                        <TableCell className="text-xs">{c.email}</TableCell>
                        <TableCell className="text-xs">{c.phone}</TableCell>
                        <TableCell className="text-center">{statusBadge(status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(c)} className="h-7 w-7 p-0 hover:text-red-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredCustomers.length < MIN_TABLE_ROWS && Array.from({ length: MIN_TABLE_ROWS - filteredCustomers.length }).map((_, i) => (
                    <TableRow key={`empty-cust-${i}`} className="h-11 border-b border-zinc-800 hover:bg-transparent">
                      <TableCell colSpan={6}>&nbsp;</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 opacity-30 dark:border-zinc-800" />
      </div>

      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Inatividade</h2>
            <p className="text-sm text-muted-foreground">Análise de clientes inativos e ações de reengajamento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <MetricCard label="Clientes Inativos" value={inactive} icon={AlertTriangle} colorClass="text-amber-400" footer={`${((inactive / customers.length) * 100).toFixed(1)}% do total`} />
          <MetricCard label="Contatos Enviados" value={messagedCustomers.size} icon={MessageSquare} colorClass="text-sky-400" footer="Reengajamento ativo" />
          <MetricCard label="Taxa de Recuperação" value={customersNeedingAttention.length > 0 ? `${((messagedCustomers.size / customersNeedingAttention.length) * 100).toFixed(0)}%` : "0%"} icon={TrendingUp} colorClass="text-emerald-400" footer="Eficiência de contato" />
        </div>

        {customersNeedingAttention.length > 0 && (
          <Card className="rounded-2xl border-2 border-amber-500/30">
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <div>
                <CardTitle className="text-lg font-medium">Alertas de Inatividade</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {messagedCustomers.size > 0 ? `${messagedCustomers.size} contato(s) enviado(s)` : "Módulo de reengajamento e recuperação de carteira"}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: FIXED_TABLE_HEIGHT }} className="overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <Table className="w-full">
                  <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                    <TableRow className="h-11 hover:bg-transparent border-b border-zinc-800">
                      <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Cliente</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Último Pedido</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Email</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Pedidos</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Total Gasto</TableHead>
                      <TableHead className="text-center text-[10px] uppercase tracking-wider text-zinc-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customersNeedingAttention.map((c) => {
                      const wasMessaged = messagedCustomers.has(c.id);
                      return (
                        <TableRow key={c.id} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-zinc-100">{c.name}</TableCell>
                          <TableCell className="text-zinc-400">{daysSince(c.lastOrderDate)} dias</TableCell>
                          <TableCell className="text-zinc-400 truncate max-w-[200px]">{c.email}</TableCell>
                          <TableCell className="text-zinc-400">{c.totalOrders}</TableCell>
                          <TableCell className="text-zinc-400">R$ {c.totalSpent.toLocaleString("pt-BR")}</TableCell>
                          <TableCell className="text-center">
                            {wasMessaged ? (
                              <Button size="sm" variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 h-8 px-3" onClick={() => handleSuggestContact(c)}>
                                <RefreshCw className="mr-1 h-3 w-3" /> Reenviar
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 h-8 px-3" onClick={() => handleSuggestContact(c)}>
                                <Phone className="mr-1 h-3 w-3" /> Contatar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {customersNeedingAttention.length < MIN_TABLE_ROWS && Array.from({ length: MIN_TABLE_ROWS - customersNeedingAttention.length }).map((_, i) => (
                      <TableRow key={`empty-inactive-${i}`} className="h-11 border-b border-zinc-800 hover:bg-transparent">
                        <TableCell colSpan={6}>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico Ativos vs Inativos */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col justify-center min-h-[92px]">
            <div>
              <CardTitle className="text-sm font-medium">Distribuição de Clientes</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Comparativo entre clientes ativos e inativos</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="relative h-4 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(active / customers.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    Ativos ({active})
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    Inativos ({inactive})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-foreground">{((active / customers.length) * 100).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">Taxa de Atividade</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <AutomationModal
        open={!!contactCustomer}
        onClose={() => setContactCustomer(null)}
        customer={contactCustomer}
        handleMessageSent={handleMessageSent}
        globalContactHistory={globalContactHistory}
        setGlobalContactHistory={setGlobalContactHistory}
      />

      <CustomerFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setEditCustomer(null); }}
        onSave={handleSaveCustomer}
        customer={editCustomer || undefined}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir o cliente <strong>{deleteConfirm?.company}</strong>?
              <br />
              CNPJ: {deleteConfirm?.cnpj}
              <br />
              <br />
              Esta ação moverá o cliente para a lixeira, onde poderá ser restaurado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-zinc-700">
              Cancelar
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => deleteConfirm && handleDeleteCustomer(deleteConfirm)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Todas as Mensagens */}
      <Dialog open={showAllMessages} onOpenChange={() => setShowAllMessages(false)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Histórico de Mensagens
            </DialogTitle>
            <DialogDescription>
              Todas as mensagens enviadas para clientes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {Object.entries(globalContactHistory || {}).length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                Nenhuma mensagem enviada ainda
              </div>
            ) : (
              Object.entries(globalContactHistory || {}).map(([customerId, messages]) => {
                const customer = customers.find(c => c.id === customerId);
                if (!customer) return null;
                
                return (
                  <div key={customerId} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                      <Building2 className="h-4 w-4" />
                      {customer.company}
                    </div>
                    <div className="space-y-2 pl-6">
                      {messages.map((msg) => (
                        <div 
                          key={msg.id}
                          className="p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors"
                          onClick={() => setViewingMessage(msg)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {msg.type === "email" ? (
                                <Mail className="h-3.5 w-3.5 text-zinc-400" />
                              ) : (
                                <MessageCircle className="h-3.5 w-3.5 text-zinc-400" />
                              )}
                              <span className="text-xs text-zinc-400">{msg.date}</span>
                            </div>
                            <Badge variant={msg.status === "sent" ? "default" : "secondary"} className="text-xs">
                              {msg.status === "sent" ? "Enviado" : msg.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-zinc-400 mb-1">{msg.recipient}</div>
                          <div className="text-sm text-zinc-200 truncate">{msg.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowAllMessages(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização Detalhada da Mensagem */}
      <Dialog open={!!viewingMessage} onOpenChange={(open) => !open && setViewingMessage(null)}>
        <DialogContent className="sm:max-w-xl bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingMessage?.type === "email" ? <Mail className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
              Detalhes da Mensagem
            </DialogTitle>
            <DialogDescription>
              {viewingMessage?.date} - {viewingMessage?.type === "email" ? "E-mail" : "WhatsApp"}
            </DialogDescription>
          </DialogHeader>
          
          {viewingMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Destinatário</Label>
                  <div className="text-zinc-100">{viewingMessage.recipient}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={viewingMessage.status === "sent" ? "default" : viewingMessage.status === "failed" ? "destructive" : "secondary"}>
                      {viewingMessage.status === "sent" ? "Enviado com sucesso" : viewingMessage.status === "failed" ? "Falha no envio" : "Aguardando envio"}
                    </Badge>
                    {viewingMessage.status === "sent" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Mensagem Completa</Label>
                <div className="p-4 bg-zinc-800 rounded text-zinc-100 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {viewingMessage.message.replace(/\\n/g, '\n')}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setViewingMessage(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerFormModal({
  open,
  onClose,
  onSave,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Customer>) => void;
  customer?: Customer;
}) {
  const [name, setName] = useState(customer?.name || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [company, setCompany] = useState(customer?.company || "");
  const [cnpj, setCnpj] = useState(customer?.cnpj || "");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState(customer?.city || "");
  const [state, setState] = useState(customer?.state || "");
  const [country, setCountry] = useState(customer?.country || "");
  const [selectedState, setSelectedState] = useState(customer?.state || "");
  const [selectedCity, setSelectedCity] = useState(customer?.city || "");
  const [segment, setSegment] = useState(customer?.segment || "");
  const [contact, setContact] = useState(customer?.contact || "");
  const [notes, setNotes] = useState(customer?.notes || "");
  const [showNewSegmentInput, setShowNewSegmentInput] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");

  const allCountries = Country.getAllCountries();
  const states = country ? State.getStatesOfCountry(country) : [];
  const cities = selectedState ? City.getCitiesOfState(country, selectedState) : [];

  const getCountryName = (countryItem: any) => {
    const countryNames: Record<string, string> = {
      BR: "Brasil",
      US: "Estados Unidos",
      AR: "Argentina",
      CL: "Chile",
      CO: "Colômbia",
      MX: "México",
      PE: "Peru",
      UY: "Uruguai",
      PY: "Paraguai",
      BO: "Bolívia",
      EC: "Equador",
      VE: "Venezuela",
      PT: "Portugal",
      ES: "Espanha",
      IT: "Itália",
      FR: "França",
      DE: "Alemanha",
      GB: "Reino Unido",
      CA: "Canadá",
      AU: "Austrália",
      JP: "Japão",
      CN: "China",
      IN: "Índia",
      RU: "Rússia",
    };
    return countryNames[countryItem.isoCode] || countryItem.name;
  };

  const getStateName = (stateItem: any) => {
    if (country === "BR") {
      const stateNames: Record<string, string> = {
        AC: "Acre",
        AL: "Alagoas",
        AP: "Amapá",
        AM: "Amazonas",
        BA: "Bahia",
        CE: "Ceará",
        DF: "Distrito Federal",
        ES: "Espírito Santo",
        GO: "Goiás",
        MA: "Maranhão",
        MT: "Mato Grosso",
        MS: "Mato Grosso do Sul",
        MG: "Minas Gerais",
        PA: "Pará",
        PB: "Paraíba",
        PR: "Paraná",
        PE: "Pernambuco",
        PI: "Piauí",
        RJ: "Rio de Janeiro",
        RN: "Rio Grande do Norte",
        RS: "Rio Grande do Sul",
        RO: "Rondônia",
        RR: "Roraima",
        SC: "Santa Catarina",
        SP: "São Paulo",
        SE: "Sergipe",
        TO: "Tocantins",
      };
      return stateNames[stateItem.isoCode] || stateItem.name;
    }
    return stateItem.name;
  };

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone);
      setCompany(customer.company);
      setCnpj(customer.cnpj);
      setStreet("");
      setNumber("");
      setNeighborhood("");
      setCep("");
      setCity(customer.city);
      setState(customer.state);
      setCountry(customer.country);
      setSelectedState(customer.state || "");
      setSelectedCity(customer.city || "");
      setSegment(customer.segment);
      setContact(customer.contact);
      setNotes(customer.notes);
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setCnpj("");
      setStreet("");
      setNumber("");
      setNeighborhood("");
      setCep("");
      setCity("");
      setState("");
      setCountry("");
      setSelectedState("");
      setSelectedCity("");
      setSegment("");
      setContact("");
      setNotes("");
    }
  }, [open, customer]);

  const handleSubmit = () => {
    if (!name.trim() || !company.trim()) {
      toast.error("Nome e Empresa são obrigatórios");
      return;
    }

    const addressString = `${street}, ${number} - ${neighborhood}, ${city} - ${state}, ${cep}`.trim();

    const sanitizedData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, ""),
      company: company.trim(),
      cnpj: cnpj.replace(/\D/g, ""),
      address: addressString,
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      segment: segment.trim(),
      contact: contact.trim(),
      notes: notes.trim(),
    };

    onSave(sanitizedData);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {customer ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {customer ? "Atualize os dados do cliente" : "Cadastre um novo cliente no sistema"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name" className="text-xs">Nome *</Label>
              <Input id="cust-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-company" className="text-xs">Empresa *</Label>
              <Input id="cust-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Razão social" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-cnpj" className="text-xs">CNPJ</Label>
            <CnpjInput id="cust-cnpj" name="cust-cnpj" value={cnpj} onValueChange={setCnpj} placeholder="00.000.000/0001-00" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-email" className="text-xs">E-mail (Recibo)</Label>
              <Input id="cust-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone" className="text-xs">WhatsApp (Logística)</Label>
              <CellPhoneBrInput id="cust-phone" name="cust-phone" value={phone} onValueChange={setPhone} placeholder="(11) 99999-0000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-country" className="text-xs">País *</Label>
            <Select value={country} onValueChange={(value) => {
              setCountry(value);
              setSelectedState("");
              setSelectedCity("");
              setState("");
              setCity("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {allCountries.map((countryItem) => (
                  <SelectItem key={countryItem.isoCode} value={countryItem.isoCode}>
                    {getCountryName(countryItem)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-state" className="text-xs">Estado *</Label>
            <Select value={selectedState} onValueChange={(value) => {
              setSelectedState(value);
              setState(value);
              setSelectedCity("");
              setCity("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {states.map((stateItem) => (
                  <SelectItem key={stateItem.isoCode} value={stateItem.isoCode}>
                    {getStateName(stateItem)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-city" className="text-xs">Cidade *</Label>
            <Select value={selectedCity} onValueChange={(value) => {
              setSelectedCity(value);
              setCity(value);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a cidade" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((cityItem) => (
                  <SelectItem key={cityItem.name} value={cityItem.name}>
                    {cityItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-address" className="text-xs">Rua *</Label>
              <Input id="cust-address" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Nome da rua" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-number" className="text-xs">Número *</Label>
              <Input id="cust-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-cep" className="text-xs">CEP</Label>
              <Input 
                id="cust-cep" 
                value={cep} 
                onChange={(e) => {
                  const input = e.target.value;
                  const numbers = input.replace(/\D/g, '');
                  const cep = numbers.slice(0, 8);
                  let formatted = cep;
                  if (cep.length > 5) {
                    formatted = cep.slice(0, 5) + '-' + cep.slice(5);
                  }
                  setCep(formatted);
                }} 
                placeholder="00000-000" 
                maxLength={9}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-neighborhood" className="text-xs">Bairro</Label>
              <Input id="cust-neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Nome do bairro" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cust-segment" className="text-xs">Segmento</Label>
              {showNewSegmentInput ? (
                <div className="flex gap-2">
                  <Input
                    id="cust-new-segment"
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    placeholder="Nome do novo segmento"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (newSegmentName.trim()) {
                        setSegment(newSegmentName.trim());
                        setShowNewSegmentInput(false);
                        setNewSegmentName("");
                      }
                    }}
                  >
                    OK
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewSegmentInput(false);
                      setNewSegmentName("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={segment} onValueChange={(value) => {
                    if (value === "__new__") {
                      setShowNewSegmentInput(true);
                    } else {
                      setSegment(value);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indústria">Indústria</SelectItem>
                      <SelectItem value="Comércio">Comércio</SelectItem>
                      <SelectItem value="Serviços">Serviços</SelectItem>
                      <SelectItem value="Construção Civil">Construção Civil</SelectItem>
                      <SelectItem value="Agricultura">Agricultura</SelectItem>
                      <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="Saúde">Saúde</SelectItem>
                      <SelectItem value="Educação">Educação</SelectItem>
                      <SelectItem value="Logística">Logística</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="__new__">+ Novo Segmento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-contact" className="text-xs">Contato Responsável</Label>
              <Input id="cust-contact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Nome do responsável" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-notes" className="text-xs">Observações</Label>
            <textarea
              id="cust-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências, informações adicionais..."
              className="h-20 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>
        </div>
        <DialogFooter className="pt-4 border-t border-zinc-800">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {customer ? "Salvar & Sincronizar" : "Cadastrar & Sincronizar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}