import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  TooltipProps,
} from "recharts";
import {
  ClipboardList,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  Percent,
  ArrowUpRight,
  Phone,
  MessageCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchFinanceSummary, type FinanceSummaryResponse } from "@/services/api";
import { fetchOrderStatistics, type OrderStatisticsResponse } from "@/services/api";
import { fetchCustomerStatistics, type CustomerStatisticsResponse } from "@/services/api";
import { fetchCustomers } from "@/services/api";
import { toast } from "sonner";
import type { Customer } from "@/data/mockData";

const STATUS_COLORS = [
  "#737373",
  "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

interface ChartDataPoint {
  fill?: string;
  color?: string;
  name?: string;
  dataKey?: string;
}

interface PieDataPoint {
  fill: string;
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
  to,
}: {
  icon: any;
  label: string;
  value: string | number;
  sub: string;
  colorClass: string;
  to?: string;
}) {
  const cardContent = (
    <Card className={`rounded-2xl transition-colors hover:bg-zinc-800/50 ${to ? 'cursor-pointer' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate" style={{ fontSize: '9px' }} title={label}>{label}</p>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClass} bg-white/10 dark:bg-white/10`}>
            <Icon className="h-5 w-5 shrink-0" />
          </div>
        </div>
        <div className="mt-6 min-w-0">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate overflow-hidden whitespace-nowrap" title={String(value)}>{value}</p>
        </div>
        <div className="mt-6 flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 truncate max-w-full ${colorClass.replace("text-", "border-").replace("-400", "-500/20")} ${colorClass.replace("text-", "bg-").replace("-400", "-500/10")} ${colorClass.replace("-400", "-300")}`} title={sub}>
            {sub}
          </span>
          <span />
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

function SectionCard({
  title,
  description,
  icon: Icon,
  iconClassName = "text-white",
  children,
}: {
  title: string;
  description?: string;
  icon?: any;
  iconClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-col justify-center min-h-[92px]">
        <CardTitle className="text-sm font-medium min-w-0">
          <span className="truncate">{title}</span>
        </CardTitle>
        {description ? <p className="mt-1 text-xs text-muted-foreground truncate">{description}</p> : null}
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function BarChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm shadow-lg backdrop-blur-sm">
      <p className="mb-1 font-semibold text-white">{label}</p>
      {payload.map((entry, i) => {
        const dataPoint = entry.payload as ChartDataPoint;
        return (
          <p key={i} className="text-zinc-300">
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: dataPoint.fill || dataPoint.color }}
            />
            {entry.name || dataPoint.dataKey}:
            <span className="ml-1 font-medium text-white">{entry.value} pedidos</span>
          </p>
        );
      })}
    </div>
  );
}

function PieChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const dataPoint = entry.payload as PieDataPoint;

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm shadow-lg backdrop-blur-sm">
      <p className="font-semibold text-white">
        <span
          className="mr-2 inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: dataPoint.fill }}
        />
        {entry.name}
      </p>
      <p className="text-zinc-400">
        Quantidade: <span className="font-medium text-zinc-50">{entry.value}</span>
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [, setMessagedCustomers] = useState<Set<string>>(new Set());
  const [, setStatusFilter] = useState<string>("all");
  const [financeSummary, setFinanceSummary] = useState<FinanceSummaryResponse | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatisticsResponse | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStatisticsResponse | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const FIXED_TABLE_HEIGHT = "380px";

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const currentPeriod = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

        const [financeSummaryResponse, orderStatsResponse, customerStatsResponse, customersResponse] = await Promise.all([
          fetchFinanceSummary(currentPeriod),
          fetchOrderStatistics(currentPeriod),
          fetchCustomerStatistics(),
          fetchCustomers(),
        ]);

        setFinanceSummary(financeSummaryResponse);
        setOrderStats(orderStatsResponse);
        setCustomerStats(customerStatsResponse);
        setCustomers(customersResponse);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
        toast.error("Erro ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const totalOrders = orderStats?.total || 0;
    const pending = orderStats?.pending || 0;
    const inProduction = orderStats?.in_production || 0;
    const finished = orderStats?.finalized || 0;
    const withRecibo = orderStats?.with_recibo || 0;
    const withoutRecibo = orderStats?.without_recibo || 0;

    const totalRevenue = financeSummary?.totalRevenue || 0;
    const totalExpenses = financeSummary?.totalExpenses || 0;
    const profit = financeSummary?.profit || 0;

    const activeCustomers = customerStats?.active || 0;
    const inactiveCount = customerStats?.inactive || 0;
    const atRiskCount = customerStats?.at_risk || 0;

    const totalTaxes = financeSummary?.totalTaxes || 0;
    const totalIcms = financeSummary?.totalIcms || 0;
    const totalIpi = financeSummary?.totalIcms || 0;
    const totalPis = financeSummary?.totalPis || 0;
    const totalCofins = financeSummary?.totalCofins || 0;
    const totalIcmsCredit = financeSummary?.totalIcmsCredit || 0;

    return {
      totalOrders,
      pending,
      inProduction,
      finished,
      totalRevenue,
      totalExpenses,
      profit,
      activeCustomers,
      withRecibo,
      withoutRecibo,
      inactiveCount,
      atRiskCount,
      totalTaxes,
      totalIcms,
      totalIpi,
      totalPis,
      totalCofins,
      totalIcmsCredit,
    };
  }, [financeSummary, orderStats, customerStats]);

  const inactiveThresholdDays = 90;
  const riskThresholdDays = 60;

  const getCustomerStatus = (c: Customer) => {
    if (!c.lastOrderDate) return { status: "Sem Pedido", days: 0, color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" };
    const days = Math.floor((Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
    if (days > inactiveThresholdDays) return { status: "Inativo", days, color: "bg-red-500/10 text-red-400 border-red-500/30" };
    if (days > riskThresholdDays) return { status: "Em Risco", days, color: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
    return { status: "Ativo", days, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
  };

  const atRiskCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c.lastOrderDate) return false;
      const days = Math.floor((Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
      return days > riskThresholdDays;
    }).sort((a, b) => {
      const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
      const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [customers]);

  const inactiveCustomers = useMemo(() => {
    return customers.filter(c => {
      if (!c.lastOrderDate) return false;
      const days = Math.floor((Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
      return days > inactiveThresholdDays;
    }).sort((a, b) => {
      const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
      const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [customers]);

  const statusData = useMemo(() => {
    const data = [
      { name: "Pendente", value: stats.pending },
      { name: "Em Produção", value: stats.inProduction },
      { name: "Finalizado", value: stats.finished },
    ];
    // Se todos os valores forem 0, retorna dados de placeholder com valor 1 para visualização
    if (data.every(d => d.value === 0)) {
      return [
        { name: "Pendente", value: 1 },
        { name: "Em Produção", value: 1 },
        { name: "Finalizado", value: 1 },
      ];
    }
    return data;
  }, [stats.pending, stats.inProduction, stats.finished]);

  const reciboData = useMemo(() => {
    const data = [
      { name: "Com Recibo", value: stats.withRecibo },
      { name: "Simples Remessa", value: stats.withoutRecibo },
    ];
    // Se todos os valores forem 0, retorna dados de placeholder com valor 1 para visualização
    if (data.every(d => d.value === 0)) {
      return [
        { name: "Com Recibo", value: 1 },
        { name: "Simples Remessa", value: 1 },
      ];
    }
    return data;
  }, [stats.withRecibo, stats.withoutRecibo]);

  const finHealthy = stats.profit >= 0;
  const totalFlow = Math.max(stats.totalRevenue + stats.totalExpenses, 1);
  const revenueShare = Math.round((stats.totalRevenue / totalFlow) * 100);
  const expenseShare = 100 - revenueShare;

  return (
    <div className="space-y-20 pb-32">
      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardMetricCard
            icon={ClipboardList}
            label="Total de Pedidos"
            value={stats.totalOrders}
            sub={`${stats.pending} pendentes`}
            colorClass="text-blue-400"
            to="/pedidos"
          />
          <DashboardMetricCard
            icon={DollarSign}
            label="Receita Total"
            value={`R$ ${(stats.totalRevenue / 1000).toFixed(1)}k`}
            sub={`Despesas: R$ ${(stats.totalExpenses / 1000).toFixed(1)}k`}
            colorClass="text-emerald-400"
            to="/financeiro"
          />
          <DashboardMetricCard
            icon={TrendingUp}
            label="Lucro Líquido"
            value={`R$ ${(stats.profit / 1000).toFixed(1)}k`}
            sub={finHealthy ? "Saldo positivo" : "Risco de déficit"}
            colorClass={finHealthy ? "text-emerald-400" : "text-red-400"}
            to="/financeiro"
          />
          <DashboardMetricCard
            icon={Users}
            label="Total de Clientes"
            value={customerStats?.total || 0}
            sub={`${customerStats?.active || 0} ativos`}
            colorClass="text-blue-400"
            to="/clientes"
          />
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Saúde Financeira</p>
                <h2 className="mt-6 text-4xl font-bold tracking-tight tabular-nums">{formatCurrency(stats.profit)}</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                  {finHealthy ? "Previsão de saldo positivo ao fim do mês." : "Atenção ao risco de saldo negativo no fechamento do período."}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:w-[400px]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-muted-foreground">
                  <span>Receita</span>
                  <span>Despesas</span>
                </div>
                <div className="mt-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                  <div className="flex h-4">
                    <div style={{ width: `${revenueShare}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${expenseShare}%` }} className="bg-red-500" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Receita</p>
                    <p className="mt-2 text-lg font-bold text-emerald-300">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Despesas</p>
                    <p className="mt-2 text-lg font-bold text-red-300">{formatCurrency(stats.totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {finHealthy ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${finHealthy ? "text-emerald-300" : "text-red-300"}`}>
                    {finHealthy ? "Previsão de Saldo Positivo" : "Atenção: Risco de Saldo Negativo"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resultado líquido projetado com base nas entradas e saídas do período atual.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800/70 px-3 py-2 text-sm text-muted-foreground">
                <ArrowUpRight className={`h-4 w-4 ${finHealthy ? "text-emerald-400" : "text-red-400"}`} />
                {formatCurrency(stats.profit)}
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.totalTaxes > 0 && (
          <SectionCard
            title="Detalhamento de Impostos (Sistema Tributário Brasileiro)"
            description="Distribuição atual dos principais tributos apurados no período."
            icon={Receipt}
            iconClassName="text-amber-400"
          >
            <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">ICMS (12%)</p>
                <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">{formatCurrency(stats.totalIcms)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">IPI (10%)</p>
                <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">{formatCurrency(stats.totalIpi)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">PIS (1.65%)</p>
                <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">{formatCurrency(stats.totalPis)}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">COFINS (7.6%)</p>
                <p className="mt-3 text-xl font-bold tracking-tight tabular-nums">{formatCurrency(stats.totalCofins)}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-zinc-900 p-4">
                <p className="text-[10px] uppercase tracking-[0.28em] text-emerald-300">Crédito ICMS</p>
                <p className="mt-3 text-xl font-bold tracking-tight tabular-nums text-emerald-300">
                  {formatCurrency(stats.totalIcmsCredit)}
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Pedidos por Status"
            description="Comparativo atual da carteira de pedidos por etapa."
          >
            <div className="h-80 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="name" fontSize={12} stroke="#71717a" />
                  <YAxis fontSize={12} stroke="#71717a" />
                  <Tooltip content={<BarChartTooltip />} cursor={{ fill: "#18181b" }} />
                  <Bar dataKey="value" name="Pedidos" radius={[4, 4, 0, 0]}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title="Documentação: Com Recibo vs Simples Remessa"
            description="Proporção dos pedidos conforme o tipo de documentação emitida."
          >
            <div className="h-96 p-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reciboData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={450}
                    labelLine={false}
                  >
                    <Cell fill={STATUS_COLORS[2]} />
                    <Cell fill={STATUS_COLORS[0]} />
                  </Pie>
                  <Legend 
                    wrapperStyle={{ color: "#a1a1aa", fontSize: "14px" }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                    itemStyle={{ color: "#a1a1aa" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {(inactiveCustomers.length > 0) && (
          <SectionCard
            title={`Alertas de Inatividade – ${inactiveCustomers.length} Inativo(s)`}
            description="Acompanhe sinais de queda de recorrência e ative ações de reengajamento."
            icon={AlertTriangle}
            iconClassName="text-amber-400"
          >
            <div style={{ height: FIXED_TABLE_HEIGHT }} className="overflow-auto relative">
              <Table className="w-full min-w-[640px]">
                <TableHeader className="sticky top-0 bg-zinc-900 z-10">
                  <TableRow className="h-11 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Empresa</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">CNPJ</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Último Pedido</TableHead>
                    <TableHead className="text-center text-[10px] uppercase tracking-wider text-zinc-400">Status</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Dias</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wider text-zinc-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveCustomers.map((customer) => {
                    const statusInfo = getCustomerStatus(customer);
                    return (
                      <TableRow key={customer.id} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                        <TableCell className="text-xs">{customer.company}</TableCell>
                        <TableCell className="text-xs font-mono">{customer.cnpj}</TableCell>
                        <TableCell className="text-xs">{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('pt-BR') : '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${statusInfo.color} border`}>
                            {statusInfo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{statusInfo.days} dias</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              onClick={() => {
                                if (customer.phone) {
                                  window.open(`tel:${customer.phone}`, '_blank');
                                } else {
                                  toast.error('Cliente não possui telefone cadastrado');
                                }
                              }}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                              onClick={() => {
                                if (customer.phone) {
                                  const phoneClean = customer.phone.replace(/\D/g, '');
                                  window.open(`https://wa.me/55${phoneClean}`, '_blank');
                                } else {
                                  toast.error('Cliente não possui telefone cadastrado');
                                }
                              }}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {inactiveCustomers.length < 7 && Array.from({ length: 7 - inactiveCustomers.length }).map((_, i) => (
                    <TableRow key={`empty-risk-${i}`} className="h-11 border-b border-zinc-800 hover:bg-transparent">
                      <TableCell colSpan={6}>&nbsp;</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        )}

        {loading && (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Carregando dados do dashboard...</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}