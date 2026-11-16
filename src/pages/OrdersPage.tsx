import { useState, useCallback, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, FileText, Search, Clock, ClipboardList, Plus, X, Package, TrendingUp, PieChart, Calendar, ArrowUpRight, Truck, BarChart3, Users, Filter } from "lucide-react";
import { toast } from "sonner";
import { fetchOrders, fetchOrderStatistics, updateOrderStatus, finalizeOrder, fetchCustomers, addOrder } from "@/services/api";
import { Order, OrderStatus, OrderItem, initialCustomers, initialOrders } from "@/data/mockData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import OrderFinalizationModal from "@/components/OrderFinalizationModal";
import DocumentOrderModal from "@/components/DocumentOrderModal";
import AddOrderModal from "@/components/AddOrderModal";
import ViewOrderModal from "@/components/ViewOrderModal";
import ViewNFModal from "@/components/ViewNFModal";
import { addFinanceEntry } from "@/services/api";
import { useTrash } from "@/contexts/TrashContext";

const MIN_TABLE_ROWS = 7;
const FIXED_TABLE_HEIGHT = "380px";

const statusColors: Record<OrderStatus, string> = {
  Pendente: "bg-warning/15 text-warning border-warning/30",
  "Em Produção": "bg-info/15 text-info border-info/30",
  Finalizado: "bg-success/15 text-success border-success/30",
  "Aguardando Coleta": "bg-primary/15 text-primary border-primary/30",
  Retirado: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Cancelado: "bg-destructive/15 text-destructive border-destructive/30",
};

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

// =============================================================================
// COMPONENTE STATCARD - ARQUITETURA ESCALÁVEL
// =============================================================================

type StatCardVariant = "compact" | "expanded";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  meta: string;
  colorClass: string;
  variant?: StatCardVariant;
  to?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  meta,
  colorClass,
  variant = "compact",
  to,
}: StatCardProps) {
  const isExpanded = variant === "expanded";
  
  const cardContent = (
    <Card 
      className={`
        rounded-2xl transition-all duration-200 ease-in-out
        hover:bg-zinc-800/50 hover:shadow-lg hover:shadow-black/5
        ${to ? 'cursor-pointer' : ''}
        ${isExpanded ? 'min-h-[180px]' : 'min-h-[160px]'}
      `}
    >
      <CardContent className={`
        flex flex-col h-full
        ${isExpanded ? 'p-8' : 'p-6'}
      `}>
        {/* Header: Label + Icon */}
        <div className="flex items-start justify-between gap-3">
          <p 
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate"
            title={label}
          >
            {label}
          </p>
          <div 
            className={`
              flex shrink-0 items-center justify-center rounded-2xl 
              ${colorClass} bg-white/10 dark:bg-white/10
              ${isExpanded ? 'h-12 w-12' : 'h-10 w-10'}
            `}
          >
            <Icon className={`${isExpanded ? 'h-6 w-6' : 'h-5 w-5'}`} />
          </div>
        </div>

        {/* Value Section */}
        <div className="mt-auto py-4 min-w-0">
          <p 
            className={`
              font-bold tracking-tight tabular-nums truncate
              overflow-hidden whitespace-nowrap
              ${isExpanded ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}
            `}
            title={value}
          >
            {value}
          </p>
        </div>

        {/* Footer: Badge */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span 
            className={`
              inline-flex items-center rounded-full border px-2.5 py-1 truncate
              ${colorClass.replace("text-", "border-").replace("-400", "-500/20")} 
              ${colorClass.replace("text-", "bg-").replace("-400", "-500/10")} 
              ${colorClass.replace("-400", "-300")}
            `}
            title={meta}
          >
            {meta}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

// =============================================================================
// CONFIGURAÇÃO DE CARDS - CLEAN CODE
// =============================================================================

interface CardConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getValue: (kpi: ReturnType<typeof useKpiData>) => string;
  getMeta: (kpi: ReturnType<typeof useKpiData>) => string;
  colorClass: string;
  variant: StatCardVariant;
  to?: string;
  tier: "financial" | "operational";
}

const DASHBOARD_CARDS: CardConfig[] = [
  // OPERATIONAL TIER - Apenas 3 cards
  {
    id: "pending",
    label: "Pendentes",
    icon: Clock,
    getValue: (kpi) => String(kpi.pendingCount),
    getMeta: () => "Em espera",
    colorClass: "text-amber-400",
    variant: "compact",
    to: "/pedidos",
    tier: "operational",
  },
  {
    id: "production",
    label: "Em Produção",
    icon: Package,
    getValue: (kpi) => String(kpi.productionCount),
    getMeta: () => "Produzindo",
    colorClass: "text-blue-400",
    variant: "compact",
    to: "/pedidos",
    tier: "operational",
  },
  {
    id: "finalized",
    label: "Finalizados",
    icon: CheckCircle2,
    getValue: (kpi) => String(kpi.finalizedCount),
    getMeta: () => "Prontos",
    colorClass: "text-emerald-400",
    variant: "compact",
    to: "/pedidos",
    tier: "operational",
  },
];

// =============================================================================
// HOOK CUSTOMIZADO PARA KPIs
// =============================================================================

function useKpiData(orders: Order[]) {
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = orders.filter((o) => o.createdAt === today);
    const todayTotal = todayOrders.reduce((sum, o) => sum + o.totalValue, 0);
    const pendingCount = orders.filter((o) => o.status === "Pendente").length;
    const productionCount = orders.filter((o) => o.status === "Em Produção").length;
    const finalizedCount = orders.filter((o) => o.status === "Finalizado" || o.status === "Aguardando Coleta" || o.status === "Retirado").length;
    const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0);
    const avgOrderValue = orders.length > 0 ? Math.round(totalValue / orders.length) : 0;

    return {
      todayTotal,
      todayOrders,
      pendingCount,
      productionCount,
      finalizedCount,
      totalValue,
      totalCount: orders.length,
      avgOrderValue,
    };
  }, [orders]);
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [collectionStatus, setCollectionStatus] = useState<Record<string, "Pendente" | "Realizado">>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [nfSearchQuery, setNfSearchQuery] = useState("");
  const [nfFilterStatus, setNfFilterStatus] = useState("all");
  const [chartPeriod, setChartPeriod] = useState("month");
  const [filterStatus, setFilterStatus] = useState("all");
  const [finalizingOrder, setFinalizingOrder] = useState<Order | null>(null);
  const [docOrder, setDocOrder] = useState<Order | null>(null);
  const [docFocus, setDocFocus] = useState<"pedido" | "nf">("pedido");
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingNF, setViewingNF] = useState<Order | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "", direction: "asc" });

  // Carregar pedidos do backend
  useEffect(() => {
    loadOrders();
    loadCustomers();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar pedidos. Usando dados de exemplo.");
      // Fallback para mockData se a API falhar
      setOrders(initialOrders);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      // Fallback para mockData se a API falhar
      setCustomers(initialCustomers);
    }
  };

  const handleUpdateStatus = useCallback(async (orderId: number, newStatus: OrderStatus) => {
    if (newStatus === "Finalizado") {
      const order = orders.find((o) => o.id === orderId);
      if (order) setFinalizingOrder(order);
      return;
    }

    try {
      console.log("Atualizando status do pedido", orderId, "para", newStatus);
      await updateOrderStatus(orderId, newStatus);
      await loadOrders();
      toast.success(`Pedido ${orderId} movido para ${newStatus}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status do pedido.");
    }
  }, [orders]);

  const handleFinalizeConfirm = useCallback(async (data: {
    hasRecibo: boolean;
    reciboNumber: string | null;
    carrierName: string | null;
    freightResponsibility: string | null;
    grossWeight: number | null;
    packageType: string | null;
    generateFinanceEntry: boolean;
  }) => {
    if (!finalizingOrder) return;

    try {
      await finalizeOrder(finalizingOrder.id, {
        hasRecibo: data.hasRecibo,
        reciboNumber: data.reciboNumber,
        carrierName: data.carrierName,
        freightResponsibility: data.freightResponsibility as any,
        grossWeight: data.grossWeight,
        packageType: data.packageType,
      });
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      toast.error("Erro ao finalizar pedido.");
      return;
    }

    if (data.generateFinanceEntry) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        await addFinanceEntry({
          description: `Receita do pedido ${finalizingOrder.id} - ${finalizingOrder.customerName}`,
          type: "receita",
          value: finalizingOrder.totalValue,
          dueDate: today,
          paid: false,
          category: "Vendas",
        });
        toast.success("Conta a receber gerada no financeiro!", {
          description: `R$ ${finalizingOrder.totalValue.toLocaleString("pt-BR")} - ${finalizingOrder.customerName}`,
        });
      } catch (error) {
        toast.error("Erro ao gerar entrada no financeiro", {
          description: "O pedido foi finalizado, mas a entrada financeira não foi criada.",
        });
        console.error(error);
      }
    }

    setFinalizingOrder(null);
    toast.success(`Pedido ${finalizingOrder.id} finalizado!`);
    await loadOrders();
  }, [finalizingOrder]);

  const collectionRows = useMemo(() => orders.filter((o) => o.status === "Finalizado" && !o.hasRecibo), [orders]);

  useEffect(() => {
    setCollectionStatus((prev) => {
      const next = { ...prev };
      let changed = false;
      collectionRows.forEach((o) => {
        if (next[o.id] === undefined) {
          next[o.id] = "Pendente";
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [collectionRows]);

  const handleUpdateOrder = useCallback((updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    toast.success(`Pedido ${updated.id} atualizado!`);
  }, []);

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
    const result = [...orders];

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "id":
            aValue = a.id;
            bValue = b.id;
            break;
          case "customerName":
            aValue = a.customerName.toLowerCase();
            bValue = b.customerName.toLowerCase();
            break;
          case "product":
            aValue = a.product.toLowerCase();
            bValue = b.product.toLowerCase();
            break;
          case "quantity":
            aValue = a.quantity;
            bValue = b.quantity;
            break;
          case "totalValue":
            aValue = a.totalValue;
            bValue = b.totalValue;
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          case "deliveryMethod":
            aValue = a.deliveryMethod;
            bValue = b.deliveryMethod;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [orders, sortConfig]);

  const { addToTrash, registerRestoreCallback } = useTrash();

  useEffect(() => {
    const unregister = registerRestoreCallback("order", (orderData: Order) => {
      setOrders((prev) => [orderData, ...prev]);
    });
    return unregister;
  }, [registerRestoreCallback]);

  const handleCancelOrder = useCallback((orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    if (order.status !== "Pendente" && order.status !== "Em Produção" && order.status !== "Finalizado") {
      toast.error("Apenas pedidos Pendentes, Em Produção ou Finalizados podem ser cancelados");
      return;
    }

    addToTrash({
      id: String(orderId),
      type: "order",
      name: `Pedido ${orderId} - ${order.customerName}`,
      data: order,
    });

    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, [orders, addToTrash]);

  const handleAddOrder = useCallback(async (newOrderData: {
    customerName: string;
    customerData: any;
    orderDate: string;
    estimatedDeliveryDate: string;
    deliveryMethod: "Retirada" | "Transportadora";
    carrierName: string | null;
    items: OrderItem[];
    totalValue: number;
  }) => {
    try {
      toast.info("Criando pedido...", { duration: 2000 });
      
      const newOrder = await addOrder({
        customerId: newOrderData.customerData.id,
        customerName: newOrderData.customerName,
        product: newOrderData.items[0]?.description || "Múltiplos itens",
        items: newOrderData.items,
        quantity: newOrderData.items.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: newOrderData.totalValue,
        status: "Pendente",
        deliveryMethod: newOrderData.deliveryMethod,
        hasRecibo: false,
        reciboNumber: null,
        shippingType: "Padrão",
        carrierName: newOrderData.carrierName,
        freightResponsibility: newOrderData.deliveryMethod === "Transportadora" ? "Destinatário" : null,
        grossWeight: newOrderData.items.reduce((sum, item) => sum + item.weightPerUnit * item.quantity, 0),
        packageType: newOrderData.deliveryMethod === "Transportadora" ? "Caixa" : null,
        taxAmount: null,
        icmsCredit: null,
        createdAt: newOrderData.orderDate,
        updatedAt: newOrderData.orderDate,
      });

      setOrders((prev) => [newOrder, ...prev]);
      setShowAddModal(false);
      toast.success(`Pedido ${newOrder.id} adicionado com sucesso!`, {
        description: `${newOrderData.customerName} - ${newOrderData.items.length} item(ns) - R$ ${newOrderData.totalValue.toLocaleString("pt-BR")}`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast.error("Erro ao criar pedido");
    }
  }, []);

  const filteredOrders = useMemo(() => {
    return sortedData.filter((order) => {
      const matchesSearch =
        searchQuery === "" ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "all") return true;
      if (filterStatus === "pendentes") return order.status === "Pendente";
      if (filterStatus === "producao") return order.status === "Em Produção";
      if (filterStatus === "finalizados") return order.status === "Finalizado" || order.status === "Aguardando Coleta";
      if (filterStatus === "retirados") return order.status === "Retirado";

      return order.status === filterStatus;
    });
  }, [sortedData, filterStatus, searchQuery]);

  const kpiData = useKpiData(orders);

  const filteredNFOrders = useMemo(
    () => orders.filter((o) => {
      if (!o.hasRecibo) return false;
      
      const matchesSearch = nfSearchQuery === "" || o.customerName.toLowerCase().includes(nfSearchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (nfFilterStatus === "all") return true;
      if (nfFilterStatus === "finalizados") return o.status === "Finalizado" || o.status === "Aguardando Coleta" || o.status === "Retirado";
      if (nfFilterStatus === "producao") return o.status === "Em Produção";
      if (nfFilterStatus === "pendentes") return o.status === "Pendente";
      
      return o.status === nfFilterStatus;
    }),
    [orders, nfSearchQuery, nfFilterStatus],
  );

  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date range based on selected period
    let startDate = new Date(today);
    let endDate = new Date(today);
    let labels: string[] = [];
    
    switch (chartPeriod) {
      case "day":
        startDate = new Date(today);
        labels = ["00h", "04h", "08h", "12h", "16h", "20h"];
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
        break;
      case "month":
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        labels = ["1-7", "8-14", "15-21", "22-30"];
        break;
      case "last_month":
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        endDate = new Date(today);
        endDate.setDate(0);
        labels = ["1-7", "8-14", "15-21", "22-30"];
        break;
      case "last_3_months":
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 3);
        labels = ["Mês 1", "Mês 2", "Mês 3"];
        break;
      case "last_6_months":
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 6);
        labels = ["Mês 1", "Mês 2", "Mês 3", "Mês 4", "Mês 5", "Mês 6"];
        break;
      case "year":
        startDate = new Date(today);
        startDate.setMonth(0);
        startDate.setDate(1);
        labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        labels = ["1-7", "8-14", "15-21", "22-30"];
    }

    // Filter orders within the period
    const periodOrders = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });

    // Calculate period metrics
    const periodTotalOrders = periodOrders.length;
    const periodTotalRevenue = periodOrders.reduce((sum, o) => sum + o.totalValue, 0);
    const periodTotalExpenses = periodOrders.reduce((sum, o) => sum + (o.totalValue * 0.3), 0); // Simulated expense (30% of revenue)

    // Generate chart data with REAL data grouped by period
    const lineChartData = labels.map((label, index) => {
      // Calculate date range for this label
      let labelStartDate: Date;
      let labelEndDate: Date;
      
      if (chartPeriod === "day") {
        // For hourly data
        labelStartDate = new Date(today);
        labelStartDate.setHours(index * 4, 0, 0, 0);
        labelEndDate = new Date(labelStartDate);
        labelEndDate.setHours(labelEndDate.getHours() + 4);
      } else if (chartPeriod === "week") {
        // For daily data
        labelStartDate = new Date(startDate);
        labelStartDate.setDate(labelStartDate.getDate() + index);
        labelEndDate = new Date(labelStartDate);
        labelEndDate.setDate(labelEndDate.getDate() + 1);
      } else if (chartPeriod === "month" || chartPeriod === "last_month") {
        // For weekly data
        labelStartDate = new Date(startDate);
        labelStartDate.setDate(labelStartDate.getDate() + (index * 7));
        labelEndDate = new Date(labelStartDate);
        labelEndDate.setDate(labelEndDate.getDate() + 7);
      } else if (chartPeriod === "last_3_months" || chartPeriod === "last_6_months") {
        // For monthly data
        labelStartDate = new Date(startDate);
        labelStartDate.setMonth(labelStartDate.getMonth() + index);
        labelEndDate = new Date(labelStartDate);
        labelEndDate.setMonth(labelEndDate.getMonth() + 1);
      } else if (chartPeriod === "year") {
        // For monthly data (full year)
        labelStartDate = new Date(today.getFullYear(), index, 1);
        labelEndDate = new Date(today.getFullYear(), index + 1, 1);
      } else {
        labelStartDate = startDate;
        labelEndDate = endDate;
      }

      // Filter orders for this specific period
      const periodOrdersFiltered = periodOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= labelStartDate && orderDate < labelEndDate;
      });

      // Calculate REAL metrics for this period
      const pedidos = periodOrdersFiltered.length;
      const faturamento = periodOrdersFiltered.reduce((sum, o) => sum + o.totalValue, 0);
      const despesa = periodOrdersFiltered.reduce((sum, o) => sum + (o.totalValue * 0.3), 0);

      return {
        period: label,
        pedidos,
        faturamento,
        despesa,
      };
    });

    const statusDistribution = [
      { label: "Pendentes", value: orders.filter((o) => o.status === "Pendente").length, color: "#f59e0b" },
      { label: "Em Produção", value: orders.filter((o) => o.status === "Em Produção").length, color: "#3b82f6" },
      { label: "Finalizados", value: orders.filter((o) => o.status === "Finalizado").length, color: "#10b981" },
      { label: "Retirados", value: orders.filter((o) => o.status === "Retirado").length, color: "#8b5cf6" },
    ].filter((item) => item.value > 0);

    return {
      periodTotalOrders,
      periodTotalRevenue,
      periodTotalExpenses,
      lineChartData,
      statusDistribution,
    };
  }, [orders, chartPeriod]);

  return (
    <div className="space-y-20 pb-32">
      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Pedidos</h1>
          </div>
        </div>

        {/* METRICS DASHBOARD - 3 Cards Operacionais */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {DASHBOARD_CARDS.map((card) => (
            <StatCard
              key={card.id}
              label={card.label}
              value={card.getValue(kpiData)}
              icon={card.icon}
              meta={card.getMeta(kpiData)}
              colorClass={card.colorClass}
              variant={card.variant}
              to={card.to}
            />
          ))}
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between min-h-[92px]">
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold">
                Lista de Pedidos
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{filteredOrders.length} pedidos encontrados</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button className="bg-white hover:bg-zinc-100 text-black h-10 md:h-8 text-xs border border-zinc-200" onClick={() => setShowAddModal(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Novo Pedido
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 w-56 pl-8 text-xs" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
                <TabsTrigger value="producao">Em Produção</TabsTrigger>
                <TabsTrigger value="finalizados">Finalizados</TabsTrigger>
                <TabsTrigger value="retirados">Retirados</TabsTrigger>
              </TabsList>

              <div style={{ height: FIXED_TABLE_HEIGHT }} className="relative overflow-x-auto overflow-y-auto">
                <Table className="min-w-[640px] w-full md:min-w-0">
                  <TableHeader className="sticky top-0 z-10 bg-zinc-900">
                    <TableRow className="h-11 hover:bg-transparent">
                      <TableHead className="w-[70px] cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white" onClick={() => handleSort("id")}>
                        <div className="flex items-center justify-between gap-1">
                          <span>ID</span>
                          <div className="flex w-4 justify-center">
                            {sortConfig.key === "id" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px] cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white" onClick={() => handleSort("customerName")}>
                        <div className="flex items-center justify-between gap-1">
                          <span>Cliente</span>
                          <div className="flex w-4 justify-center">
                            {sortConfig.key === "customerName" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px] cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white" onClick={() => handleSort("product")}>
                        <div className="flex items-center justify-between gap-1">
                          <span>Produto</span>
                          <div className="flex w-4 justify-center">
                            {sortConfig.key === "product" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] cursor-pointer text-center text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white" onClick={() => handleSort("quantity")}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Qtd</span>
                          <div className="flex w-4 justify-center">
                            {sortConfig.key === "quantity" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px] cursor-pointer text-right text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white" onClick={() => handleSort("totalValue")}>
                        <div className="flex items-center justify-end gap-1">
                          <span>Valor</span>
                          <div className="flex w-4 justify-center">
                            {sortConfig.key === "totalValue" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[130px] cursor-pointer text-center text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white" onClick={() => handleSort("status")}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Status</span>
                          <div className="flex w-4 justify-center">
                            {sortConfig.key === "status" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      <TableHead className="w-[130px] cursor-pointer text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white" onClick={() => handleSort("deliveryMethod")}>
                        <div className="flex items-center justify-between gap-1">
                          <span>Entrega</span>
                          <div className="flex w-4 justify-center">
                            {sortConfig.key === "deliveryMethod" && <span className="text-xs text-zinc-400">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
                          </div>
                        </div>
                      </TableHead>
                      {filterStatus !== "retirados" && (
                        <TableHead className="w-[220px] text-center text-[10px] uppercase tracking-wider text-zinc-400">Ações</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-xs font-mono">
                          <button className="cursor-pointer transition-colors hover:text-blue-400 hover:underline" onClick={() => setViewingOrder(order)}>
                            {order.id}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs">{order.customerName}</TableCell>
                        <TableCell className="text-xs">{order.product}</TableCell>
                        <TableCell className="text-xs text-center">{order.quantity}</TableCell>
                        <TableCell className="text-xs text-right">{formatCurrency(order.totalValue)}</TableCell>
                        <TableCell className="w-[130px] text-center">
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs capitalize">{order.deliveryMethod}</TableCell>
                        {filterStatus !== "retirados" && (
                          <TableCell className="w-[220px]">
                            <div className="flex items-center justify-end gap-2">
                              {order.status === "Pendente" && (
                                <Button size="sm" className="w-[110px] bg-white/10 border border-white/30 px-2 font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50" onClick={() => handleUpdateStatus(order.id, "Em Produção")}>
                                  Iniciar
                                </Button>
                              )}
                              {order.status === "Em Produção" && (
                                <Button size="sm" className="w-[110px] bg-white/10 border border-white/30 px-2 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50" onClick={() => setFinalizingOrder(order)}>
                                  Finalizar
                                </Button>
                              )}
                              {order.status === "Finalizado" && (
                                <Button size="sm" className="w-[110px] bg-white/10 border border-white/30 px-2 font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50" onClick={() => handleUpdateStatus(order.id, "Retirado")}>
                                  Retirar
                                </Button>
                              )}
                              {order.status === "Aguardando Coleta" && (
                                <Button size="sm" className="w-[110px] bg-white/10 border border-white/30 px-2 font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/50" onClick={() => handleUpdateStatus(order.id, "Retirado")}>
                                  Confirmar
                                </Button>
                              )}
                              {(order.status === "Pendente" || order.status === "Em Produção" || order.status === "Finalizado" || order.status === "Aguardando Coleta") && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleCancelOrder(order.id)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filteredOrders.length < MIN_TABLE_ROWS &&
                      Array.from({ length: MIN_TABLE_ROWS - filteredOrders.length }).map((_, i) => (
                        <TableRow key={`empty-order-${i}`} className="h-12 border-b border-zinc-800 hover:bg-transparent">
                          <TableCell colSpan={filterStatus === "retirados" ? 7 : 8}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 dark:border-zinc-800 opacity-30" />
      </div>

      <section className="flex flex-col justify-center space-y-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Gestão de Notas Fiscais e Recibos</h2>
            <p className="text-muted-foreground">Visualize e gerencie as notas fiscais e recibos de seus pedidos.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar cliente..."
                value={nfSearchQuery}
                onChange={(e) => setNfSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={nfFilterStatus} onValueChange={setNfFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendentes">Pendentes</SelectItem>
                <SelectItem value="producao">Em Produção</SelectItem>
                <SelectItem value="finalizados">Finalizados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col justify-center min-h-[92px]">
            <div>
              <CardTitle className="text-base font-semibold">
                Recibos Emitidos
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{filteredNFOrders.length} registros encontrados</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: FIXED_TABLE_HEIGHT }} className="relative overflow-y-auto overflow-x-hidden">
              <Table className="min-w-[640px] w-full">
                <TableHeader className="sticky top-0 z-10 bg-zinc-900">
                  <TableRow className="h-11 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Pedido</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Recibo/NF</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Cliente</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wider text-zinc-400">Valor Total</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wider text-zinc-400">ICMS (2,82%)</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wider text-zinc-400">Crédito ICMS</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wider text-zinc-400">Valor Líquido</TableHead>
                    <TableHead className="text-center text-[10px] uppercase tracking-wider text-zinc-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNFOrders.map((order) => (
                    <TableRow key={`nf-${order.id}`} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="text-xs font-mono">
                        <button className="cursor-pointer transition-colors hover:text-blue-400 hover:underline" onClick={() => setViewingNF(order)}>
                          {order.id}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{order.reciboNumber}</TableCell>
                      <TableCell className="text-xs">{order.customerName}</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-emerald-400">{formatCurrency(order.totalValue)}</TableCell>
                      <TableCell className="text-right text-xs text-zinc-400">{formatCurrency(order.taxAmount || 0)}</TableCell>
                      <TableCell className="text-right text-xs text-zinc-400">{formatCurrency(order.icmsCredit || 0)}</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-zinc-200">{formatCurrency(order.totalValue - (order.taxAmount || 0))}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={statusColors[order.status]}>{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredNFOrders.length < MIN_TABLE_ROWS &&
                    Array.from({ length: MIN_TABLE_ROWS - filteredNFOrders.length }).map((_, i) => (
                      <TableRow key={`empty-nf-${i}`} className="h-12 border-b border-zinc-800 hover:bg-transparent">
                        <TableCell colSpan={8}>&nbsp;</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 dark:border-zinc-800 opacity-30" />
      </div>

      <section className="flex flex-col justify-center space-y-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Análises e Estatísticas</h2>
            <p className="text-muted-foreground">Visualize dados e métricas do período selecionado</p>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Select value={chartPeriod} onValueChange={setChartPeriod}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="last_month">Mês Anterior</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                  <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>

        {/* Cards de Métricas do Período */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard 
            label="Pedidos no Período" 
            value={String(chartData.periodTotalOrders)} 
            icon={ClipboardList} 
            meta="Total do filtro" 
            colorClass="text-blue-400"
            variant="compact"
          />
          <StatCard 
            label="Receita do Período" 
            value={formatCurrency(chartData.periodTotalRevenue)} 
            icon={TrendingUp} 
            meta="Faturamento filtrado" 
            colorClass="text-amber-400"
            variant="compact"
          />
        </div>

        {/* Gráfico de Linhas Full-Width: Pedidos x Faturamento x Despesa */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col justify-center min-h-[92px]">
            <div>
              <CardTitle className="text-sm font-medium">
                Análise Comparativa por Período
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Pedidos, Faturamento e Despesas ao longo do período selecionado.</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#71717a" 
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'pedidos') return [value, 'Pedidos'];
                      return [formatCurrency(value), name === 'faturamento' ? 'Faturamento' : 'Despesa'];
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="pedidos" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Pedidos"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="faturamento" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Faturamento"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="despesa" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Despesa"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Status */}
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-col justify-center min-h-[92px]">
            <div>
              <CardTitle className="text-sm font-medium">
                Distribuição por Status
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Proporção de pedidos por status atual.</p>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex h-[250px] items-center justify-center">
              <div className="relative h-[200px] w-[200px]">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {chartData.statusDistribution.map((item, index) => {
                    const total = chartData.statusDistribution.reduce((sum, i) => sum + i.value, 0);
                    const percentage = (item.value / total) * 100;
                    const circumference = 2 * Math.PI * 40;
                    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                    const offset =
                      chartData.statusDistribution
                        .slice(0, index)
                        .reduce((sum, i) => sum + (i.value / total) * 100, 0) *
                      (circumference / 100);

                    return (
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={-offset}
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{chartData.periodTotalOrders}</span>
                </div>
              </div>
              <div className="ml-6 space-y-2">
                {chartData.statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-zinc-400">{item.label}</span>
                    <span className="ml-auto text-sm font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <AddOrderModal open={showAddModal} onClose={() => setShowAddModal(false)} onConfirm={handleAddOrder} customers={customers} />

      {finalizingOrder && (
        <OrderFinalizationModal
          order={finalizingOrder}
          open={!!finalizingOrder}
          onClose={() => setFinalizingOrder(null)}
          onConfirm={handleFinalizeConfirm}
        />
      )}

      {docOrder && (
        <DocumentOrderModal
          order={docOrder}
          open={!!docOrder}
          onClose={() => setDocOrder(null)}
          onSave={handleUpdateOrder}
          focus={docFocus}
        />
      )}

      {viewingOrder && (
        <ViewOrderModal
          order={viewingOrder}
          customer={customers.find((c) => c.name === viewingOrder.customerName) || null}
          open={!!viewingOrder}
          onClose={() => setViewingOrder(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {viewingNF && (
        <ViewNFModal
          order={viewingNF}
          customer={customers.find((c) => c.name === viewingNF.customerName) || null}
          open={!!viewingNF}
          onClose={() => setViewingNF(null)}
        />
      )}
    </div>
  );
}