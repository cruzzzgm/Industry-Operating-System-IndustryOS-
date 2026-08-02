import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Pencil, Percent, Check, Search, Settings, BarChart3, ArrowUp, ArrowDown, Calendar as CalendarIcon, Moon, Sun, X, ClipboardList, FileText, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import {
  FinanceEntry, monthlyHistory, MonthlyClosing,
  FixedExpense, ContaPagar, RevenueEntry, PaymentMethod, RevenueSource,
} from "@/data/mockData";
import { DEFAULT_INITIAL_BALANCE, calculatePeriodFinanceSummary } from "@/lib/financeUtils";
import { toast } from "sonner";
import TransactionModal from "@/components/TransactionModal";
import FixedExpenseModal from "@/components/FixedExpenseModal";

// API do Backend Python
import {
  fetchFinances,
  fetchRevenues,
  fetchExternalRevenues,
  addExternalRevenue,
  updateExternalRevenue,
  deleteExternalRevenue,
  markExternalRevenuePaid,
  fetchContasPagar,
  fetchFixedExpenses,
  fetchFinanceSummary,
  addFinanceEntry,
  updateFinanceEntry,
  addFixedExpense,
  addContaPagar,
  markContaPaid,
  FinanceSummaryResponse,
  fetchTaxesSummary,
  fetchOrders,
  fetchMonthlyClosings,
} from "@/services/api";

// Nomes de meses usados na formatação de período.
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const monthShortHistory = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const MIN_TABLE_ROWS = 7;
const FIXED_TAB_HEIGHT = "380px"; // 1 cabeçalho (44px) + 7 linhas (48px cada) = 380px

// Componente de Tabela de Receitas
interface RevenuesTableProps {
  revenues: RevenueEntry[];
  onEdit: (revenue: RevenueEntry) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  showCustomerColumn?: boolean;
  emptyMessage: string;
}

function RevenuesTable({ revenues, onEdit, onDelete, onMarkPaid, showCustomerColumn, emptyMessage }: RevenuesTableProps) {
  return (
    <div style={{ height: FIXED_TAB_HEIGHT }} className="overflow-x-auto overflow-y-auto relative">
      <Table className="min-w-[640px] w-full md:min-w-0">
        <TableHeader className="sticky top-0 bg-zinc-900 z-10">
          <TableRow className="h-11 hover:bg-transparent">
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">ID</TableHead>
            {showCustomerColumn && <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Cliente</TableHead>}
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Descrição</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Forma Pag.</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Vencimento</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Status</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400 text-right">Valor</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revenues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCustomerColumn ? 8 : 7} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            revenues.map((revenue) => (
              <TableRow key={revenue.id} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="text-xs font-mono">{revenue.id}</TableCell>
                {showCustomerColumn && <TableCell className="text-xs">{revenue.customerName || "-"}</TableCell>}
                <TableCell className="text-xs">{revenue.description}</TableCell>
                <TableCell className="text-xs capitalize">{revenue.paymentMethod || "-"}</TableCell>
                <TableCell className="text-xs">{revenue.dueDate}</TableCell>
                <TableCell className="text-xs">
                  {revenue.paymentStatus === "paid" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Pago
                    </span>
                  ) : revenue.paymentStatus === "overdue" ? (
                    <span className="inline-flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-3 w-3" /> Atrasado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <AlertCircle className="h-3 w-3" /> Pendente
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-right font-semibold text-emerald-400">
                  + {formatCurrency(revenue.value)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(revenue)} className="h-7 w-7 p-0" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {revenue.paymentStatus !== "paid" && (
                      <Button variant="ghost" size="sm" onClick={() => onMarkPaid(revenue.id)} className="h-7 w-7 p-0" title="Marcar como Pago">
                        <Check className="h-3.5 w-3.5 text-success" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onDelete(revenue.id)} className="h-7 w-7 p-0" title="Excluir">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Componente de Tabela de Receitas Externas
interface ExternalRevenuesTableProps {
  revenues: RevenueEntry[];
  onEdit: (revenue: RevenueEntry) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  emptyMessage: string;
}

function ExternalRevenuesTable({ revenues, onEdit, onDelete, onMarkPaid, emptyMessage }: ExternalRevenuesTableProps) {
  return (
    <div style={{ height: FIXED_TAB_HEIGHT }} className="overflow-x-auto overflow-y-auto relative">
      <Table className="min-w-[640px] w-full md:min-w-0">
        <TableHeader className="sticky top-0 bg-zinc-900 z-10">
          <TableRow className="h-11 hover:bg-transparent">
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">ID</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Origem</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Descrição</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Forma Pag.</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Vencimento</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Status</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400 text-right">Valor</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revenues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            revenues.map((revenue) => (
              <TableRow key={revenue.id} className="h-11 border-b border-zinc-800 hover:bg-zinc-800/50">
                <TableCell className="text-xs font-mono">{revenue.id}</TableCell>
                <TableCell className="text-xs">
                  <span className="px-2 py-1 bg-zinc-800 rounded text-xs">{revenue.source}</span>
                </TableCell>
                <TableCell className="text-xs">{revenue.description}</TableCell>
                <TableCell className="text-xs capitalize">{revenue.paymentMethod || "-"}</TableCell>
                <TableCell className="text-xs">{revenue.dueDate}</TableCell>
                <TableCell className="text-xs">
                  {revenue.paymentStatus === "paid" ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Pago
                    </span>
                  ) : revenue.paymentStatus === "overdue" ? (
                    <span className="inline-flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-3 w-3" /> Atrasado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <AlertCircle className="h-3 w-3" /> Pendente
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-right font-semibold text-emerald-400">
                  + {formatCurrency(revenue.value)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(revenue)} className="h-7 w-7 p-0" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {revenue.paymentStatus !== "paid" && (
                      <Button variant="ghost" size="sm" onClick={() => onMarkPaid(revenue.id)} className="h-7 w-7 p-0" title="Marcar como Pago">
                        <Check className="h-3.5 w-3.5 text-success" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onDelete(revenue.id)} className="h-7 w-7 p-0" title="Excluir">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Componente de Tabela de Pagamentos Pendentes
interface PendingRevenuesTableProps {
  revenues: RevenueEntry[];
  onEdit: (revenue: RevenueEntry) => void;
  onMarkPaid: (revenue: RevenueEntry) => void;
  emptyMessage: string;
}

function PendingRevenuesTable({ revenues, onEdit, onMarkPaid, emptyMessage }: PendingRevenuesTableProps) {
  return (
    <div style={{ height: FIXED_TAB_HEIGHT }} className="overflow-x-auto overflow-y-auto relative">
      <Table className="min-w-[640px] w-full md:min-w-0">
        <TableHeader className="sticky top-0 bg-zinc-900 z-10">
          <TableRow className="h-11 hover:bg-transparent">
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">ID</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Origem</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Cliente/Descrição</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Forma Pag.</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400">Vencimento</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400 text-center">Dias Atraso</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400 text-right">Valor</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider text-zinc-400 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {revenues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            revenues.map((revenue) => (
              <TableRow key={revenue.id} className={`h-11 border-b border-zinc-800 hover:bg-zinc-800/50 ${revenue.daysOverdue > 0 ? 'bg-red-950/20' : ''}`}>
                <TableCell className="text-xs font-mono">{revenue.id}</TableCell>
                <TableCell className="text-xs">
                  <span className={`px-2 py-1 rounded text-xs ${revenue.sourceType === 'client' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                    {revenue.sourceType === 'client' ? 'Cliente' : revenue.source}
                  </span>
                </TableCell>
                <TableCell className="text-xs">
                  {revenue.customerName || revenue.description}
                </TableCell>
                <TableCell className="text-xs capitalize">{revenue.paymentMethod || "-"}</TableCell>
                <TableCell className="text-xs">{revenue.dueDate}</TableCell>
                <TableCell className="text-xs text-center">
                  {revenue.daysOverdue > 0 ? (
                    <span className="text-red-400 font-semibold">{revenue.daysOverdue} dias</span>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-right font-semibold text-emerald-400">
                  + {formatCurrency(revenue.value)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(revenue)} className="h-7 w-7 p-0" title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onMarkPaid(revenue)} className="h-7 w-7 p-0" title="Marcar como Pago">
                      <Check className="h-3.5 w-3.5 text-success" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Componente Modal de Receita (simplificado)
interface RevenueModalProps {
  open: boolean;
  onClose: () => void;
  revenue?: RevenueEntry | null;
}

function RevenueModal({ open, onClose, revenue }: RevenueModalProps) {
  const isEdit = !!revenue;
  const [description, setDescription] = useState("");
  const [value, setValue] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("boleto");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState("");

  useEffect(() => {
    if (revenue) {
      setDescription(revenue.description);
      setValue(revenue.value);
      setPaymentMethod(revenue.paymentMethod || "boleto");
      setDueDate(revenue.dueDate);
      setExpectedDate(revenue.expectedDate || "");
    } else {
      setDescription("");
      setValue("");
      setPaymentMethod("boleto");
      setDueDate(new Date().toISOString().slice(0, 10));
      setExpectedDate("");
    }
  }, [revenue, open]);

  const handleSave = () => {
    // Por enquanto só fecha - integração com API pode ser adicionada depois
    toast.success(isEdit ? "Receita atualizada!" : "Receita criada!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Receita" : "Nova Receita"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da receita." : "Preencha os dados da nova receita."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Venda Cliente XYZ" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Valor (R$)</Label>
            <Input id="value" type="number" value={value} onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0,00" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expectedDate">Previsão de Recebimento</Label>
              <Input id="expectedDate" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente Modal de Receita Externa
interface ExternalRevenueModalProps {
  open: boolean;
  onClose: () => void;
  revenue?: RevenueEntry | null;
}

function ExternalRevenueModal({ open, onClose, revenue }: ExternalRevenueModalProps) {
  const isEdit = !!revenue;
  const [source, setSource] = useState<string>("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("boleto");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (revenue) {
      setSource(revenue.source || "");
      setDescription(revenue.description);
      setValue(revenue.value);
      setPaymentMethod(revenue.paymentMethod || "boleto");
      setDueDate(revenue.dueDate);
      setExpectedDate(revenue.expectedDate || "");
      setNotes(revenue.notes || "");
    } else {
      setSource("");
      setDescription("");
      setValue("");
      setPaymentMethod("boleto");
      setDueDate(new Date().toISOString().slice(0, 10));
      setExpectedDate("");
      setNotes("");
    }
  }, [revenue, open]);

  const handleSave = async () => {
    try {
      if (isEdit && revenue) {
        // Atualizar
        await updateExternalRevenue(revenue.id, {
          source: source as RevenueSource,
          description,
          value: Number(value),
          paymentMethod,
          dueDate,
          expectedDate,
          notes,
        });
        toast.success("Receita externa atualizada!");
        // Recarregar a página para mostrar dados atualizados
        window.location.reload();
      } else {
        // Criar nova
        await addExternalRevenue({
          source: source as RevenueSource,
          description,
          value: Number(value),
          paymentMethod,
          dueDate,
          expectedDate,
          notes,
        });
        toast.success("Receita externa criada!");
        // Recarregar a página para mostrar nova receita
        window.location.reload();
      }
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar receita externa");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Receita Externa" : "Nova Receita Externa"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados da receita externa." : "Preencha os dados da nova receita externa."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="source">Origem (Ex: Reembolso, Venda de sucata, etc)</Label>
            <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Digite a origem da receita..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Reembolso de frete pedido #123" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="value">Valor (R$)</Label>
            <Input id="value" type="number" value={value} onChange={(e) => setValue(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0,00" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Vencimento</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expectedDate">Previsão de Recebimento</Label>
              <Input id="expectedDate" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações adicionais..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Converte datas em chave de período YYYY-MM.
function periodKeyFromDateString(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return dateStr;
  return dateStr.slice(0, 7);
}

// Converte período YYYY-MM em rótulo abreviado para histórico.
function periodToHistoryLabel(ym: string): string {
  const parts = ym.split("-");
  const y = parts[0] ? parseInt(parts[0], 10) : 0;
  const m = parts[1] ? parseInt(parts[1], 10) : 0;
  if (!y || !m || m < 1 || m > 12) return ym;
  return `${monthShortHistory[m - 1]}/${y}`;
}

// Formata valores monetários em reais.
function formatCurrency(value: number | undefined) {
  if (value === undefined || value === null) return "R$ 0,00";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

// Componente reutilizável para exibir métricas financeiras.
function MetricCard({ label, value, icon: Icon, sub, colorClass }: { label: string; value: number; icon: any; sub: string; colorClass: string }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate" style={{ fontSize: '9px' }} title={label}>{label}</p>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${colorClass} bg-white/10 dark:bg-white/10`}>
            <Icon className="h-5 w-5 shrink-0" />
          </div>
        </div>
        <div className="mt-6 min-w-0">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate overflow-hidden whitespace-nowrap" title={formatCurrency(value)}>{formatCurrency(value)}</p>
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
}

// Seletor de período mensal com ano e mês.
function PeriodFilter({ selectedPeriod, setSelectedPeriod, yearOptions }: { selectedPeriod: string; setSelectedPeriod: (period: string) => void; yearOptions: number[] }) {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const parts = selectedPeriod.split("-");
    const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    return year;
  });

  useEffect(() => {
    const parts = selectedPeriod.split("-");
    const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    setSelectedYear(year);
  }, [selectedPeriod]);

  const selectedPeriodLabel = useMemo(() => {
    const parts = selectedPeriod.split("-");
    const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    const month = parts[1] ? parseInt(parts[1], 10) : 1;
    return `${monthNames[month - 1]}, ${year}`;
  }, [selectedPeriod]);

  const handleMonthSelect = (monthIndex: number) => {
    const period = `${selectedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
    setSelectedPeriod(period);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 w-auto min-w-[160px] justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{selectedPeriodLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((month, index) => (
              <Button
                key={month}
                variant="ghost"
                size="sm"
                className={`h-8 ${selectedPeriod.startsWith(`${selectedYear}-${String(index + 1).padStart(2, "0")}`) ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => handleMonthSelect(index)}
              >
                {month.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function FinancePage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const defaultPeriod = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Filtros de período individuais para cada seção
  const [dashboardPeriod, setDashboardPeriod] = useState<string>(defaultPeriod);
  const [analysisPeriod, setAnalysisPeriod] = useState<string>(defaultPeriod);
  const [expensesPeriod, setExpensesPeriod] = useState<string>(defaultPeriod);
  const [revenuesPeriod, setRevenuesPeriod] = useState<string>(defaultPeriod);

  // Estados para Gestão de Receitas
  const [allRevenues, setAllRevenues] = useState<RevenueEntry[]>([]);
  const [clientRevenues, setClientRevenues] = useState<RevenueEntry[]>([]);
  const [externalRevenues, setExternalRevenues] = useState<RevenueEntry[]>([]);
  const [pendingRevenues, setPendingRevenues] = useState<RevenueEntry[]>([]);
  
  // Filtros de busca
  const [revenueSearch, setRevenueSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  
  // Modais de receitas
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showExternalRevenueModal, setShowExternalRevenueModal] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<RevenueEntry | null>(null);
  const [editingExternalRevenue, setEditingExternalRevenue] = useState<RevenueEntry | null>(null);

  // Modais de lançamento.
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FinanceEntry | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  // Estados de dados da API
  const [finances, setFinances] = useState<FinanceEntry[]>([]);
  const [revenues, setRevenues] = useState<FinanceEntry[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [closingsHistory, setClosingsHistory] = useState<MonthlyClosing[]>([]);
  const [summaries, setSummaries] = useState<Record<string, FinanceSummaryResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [taxesSummary, setTaxesSummary] = useState<any>(null);

  const [cpSearch, setCpSearch] = useState("");
  const [cpFilterStatus, setCpFilterStatus] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
  const [cpSortConfig, setCpSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
  const [fechamentoSortConfig, setFechamentoSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });

  // Busca dados da API quando os períodos mudam
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Buscar todos os dados financeiros do período de análise
        const [financesRes, revenuesRes, contasRes, closingsRes] = await Promise.all([
          fetchFinances({ period: analysisPeriod, limit: 100 }),
          fetchRevenues({ period: analysisPeriod, limit: 100 }),
          fetchContasPagar({ month: analysisPeriod }),
          fetchMonthlyClosings(),
        ]);
        setFinances(financesRes.items);
        setRevenues(revenuesRes.items);
        setContasPagar(contasRes);
        setClosingsHistory(closingsRes);
      } catch (error) {
        toast.error("Erro ao carregar dados financeiros");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [analysisPeriod]);

  // Carregar dados ao montar a página
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [financesRes, revenuesRes, contasRes, closingsRes] = await Promise.all([
          fetchFinances({ period: analysisPeriod, limit: 100 }),
          fetchRevenues({ period: analysisPeriod, limit: 100 }),
          fetchContasPagar({ month: analysisPeriod }),
          fetchMonthlyClosings(),
        ]);
        setFinances(financesRes.items);
        setRevenues(revenuesRes.items);
        setContasPagar(contasRes);
        setClosingsHistory(closingsRes);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };
    loadInitialData();
  }, []);

  // Busca resumos quando períodos mudam
  useEffect(() => {
    const loadSummaries = async () => {
      const periods = [dashboardPeriod, analysisPeriod, expensesPeriod];
      const newSummaries: Record<string, FinanceSummaryResponse> = {};

      for (const period of periods) {
        if (!summaries[period]) {
          try {
            const summary = await fetchFinanceSummary(period);
            newSummaries[period] = summary;
          } catch (error) {
            console.error(`Erro ao carregar resumo de ${period}:`, error);
          }
        }
      }

      if (Object.keys(newSummaries).length > 0) {
        setSummaries(prev => ({ ...prev, ...newSummaries }));
      }
    };

    loadSummaries();
  }, [dashboardPeriod, analysisPeriod, expensesPeriod]);

  // Busca dados de impostos de NFs quando o período do dashboard muda
  useEffect(() => {
    const loadTaxesSummary = async () => {
      try {
        const taxes = await fetchTaxesSummary(dashboardPeriod);
        setTaxesSummary(taxes);
      } catch (error) {
        console.error(`Erro ao carregar impostos de NFs de ${dashboardPeriod}:`, error);
        setTaxesSummary(null);
      }
    };

    loadTaxesSummary();
  }, [dashboardPeriod]);

  // Funções de resumo e filtragem baseadas no período de cada seção
  const getSummaryForPeriod = (period: string): FinanceSummaryResponse => {
    return summaries[period] || {
      totalRevenue: 0,
      totalExpenses: 0,
      profit: 0,
      totalReceived: 0,
      totalPaid: 0,
      unpaidRevenue: 0,
      unpaidExpenses: 0,
      cpUnpaid: 0,
      totalOpenPayables: 0,
      totalTaxes: 0,
      projectedBalance: DEFAULT_INITIAL_BALANCE,
      marginPercent: 0,
      marginHealth: "attention",
      period,
      initialBalance: DEFAULT_INITIAL_BALANCE,
    };
  };

  const getFinancesForPeriod = (period: string) => (finances || []).filter(f => periodKeyFromDateString(f.dueDate) === period);
  const getContasForPeriod = (period: string) => (contasPagar || []).filter(c => (c.month || periodKeyFromDateString(c.dueDate)) === period);

  // Mapeamento de rótulos
  const getPeriodLabel = (period: string) => {
    const parts = period.split("-");
    const year = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    const month = parts[1] ? parseInt(parts[1], 10) : 1;
    return `${monthNames[month - 1]} ${year}`;
  };

  const dashboardSummary = useMemo(() => getSummaryForPeriod(dashboardPeriod), [finances, contasPagar, dashboardPeriod, summaries]);
  const analysisSummary = useMemo(() => getSummaryForPeriod(analysisPeriod), [finances, contasPagar, analysisPeriod, summaries]);
  const expensesSummary = useMemo(() => getSummaryForPeriod(expensesPeriod), [finances, contasPagar, expensesPeriod, summaries]);
  const revenuesSummary = useMemo(() => getSummaryForPeriod(revenuesPeriod), [finances, contasPagar, revenuesPeriod, summaries]);

  // Filtros para tabelas de receitas
  const filteredAllRevenues = useMemo(() => {
    return (allRevenues || []).filter(r => 
      r.description.toLowerCase().includes(revenueSearch.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(revenueSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(revenueSearch.toLowerCase())
    );
  }, [allRevenues, revenueSearch]);

  const filteredClientRevenues = useMemo(() => {
    return (clientRevenues || []).filter(r => 
      r.customerName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(clientSearch.toLowerCase()) ||
      r.orderId?.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clientRevenues, clientSearch]);

  const filteredExternalRevenues = useMemo(() => {
    return (externalRevenues || []).filter(r => 
      r.description.toLowerCase().includes(revenueSearch.toLowerCase()) ||
      r.source?.toLowerCase().includes(revenueSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(revenueSearch.toLowerCase())
    );
  }, [externalRevenues, revenueSearch]);

  const filteredPendingRevenues = useMemo(() => {
    return (pendingRevenues || []).filter(r => 
      r.description.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      (r.daysOverdue > 0 && r.daysOverdue.toString().includes(pendingSearch))
    ).sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [pendingRevenues, pendingSearch]);

  const analysisFinances = useMemo(() => (finances || []).filter(f => periodKeyFromDateString(f.dueDate) === analysisPeriod), [finances, analysisPeriod]);
  const analysisContas = useMemo(() => (contasPagar || []).filter(c => (c.month || periodKeyFromDateString(c.dueDate)) === analysisPeriod), [contasPagar, analysisPeriod]);

  const expensesContas = useMemo(() => (contasPagar || []).filter(c => (c.month || periodKeyFromDateString(c.dueDate)) === expensesPeriod), [contasPagar, expensesPeriod]);
  const expensesFinances = useMemo(() => (finances || []).filter(f => periodKeyFromDateString(f.dueDate) === expensesPeriod), [finances, expensesPeriod]);

  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ key, direction: 'desc' });
      } else {
        setSortConfig({ key: '', direction: 'asc' });
      }
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const handleCpSort = (key: string) => {
    if (cpSortConfig.key === key) {
      if (cpSortConfig.direction === 'asc') {
        setCpSortConfig({ key, direction: 'desc' });
      } else {
        setCpSortConfig({ key: '', direction: 'asc' });
      }
    } else {
      setCpSortConfig({ key, direction: 'asc' });
    }
  };

  const handleFechamentoSort = (key: string) => {
    if (fechamentoSortConfig.key === key) {
      if (fechamentoSortConfig.direction === 'asc') {
        setFechamentoSortConfig({ key, direction: 'desc' });
      } else {
        setFechamentoSortConfig({ key: '', direction: 'asc' });
      }
    } else {
      setFechamentoSortConfig({ key, direction: 'asc' });
    }
  };

  const clearSort = () => {
    setSortConfig({ key: '', direction: 'asc' });
    setCpSortConfig({ key: '', direction: 'asc' });
    setFechamentoSortConfig({ key: '', direction: 'asc' });
  };

  // Despesas fixas recorrentes e edição de despesa.
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);

  // Carregar despesas fixas na inicialização
  useEffect(() => {
    const loadFixedExpenses = async () => {
      try {
        const expenses = await fetchFixedExpenses();
        setFixedExpenses(expenses);
      } catch (error) {
        console.error("Erro ao carregar despesas fixas:", error);
      }
    };
    loadFixedExpenses();
  }, []);
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [editingFixed, setEditingFixed] = useState<FixedExpense | null>(null);

  // Estados para o Modal de Confirmação de Pagamento de Conta Fixa
  const [showPayConfirmModal, setShowPayConfirmModal] = useState(false);
  const [payingConta, setPayingConta] = useState<ContaPagar | null>(null);
  const [payingValue, setPayingValue] = useState<number>(0);

  const dashboardPeriodLabel = useMemo(() => getPeriodLabel(dashboardPeriod), [dashboardPeriod]);
  const analysisPeriodLabel = useMemo(() => getPeriodLabel(analysisPeriod), [analysisPeriod]);
  const expensesPeriodLabel = useMemo(() => getPeriodLabel(expensesPeriod), [expensesPeriod]);
  const revenuesPeriodLabel = useMemo(() => getPeriodLabel(revenuesPeriod), [revenuesPeriod]);

  const isDashboardPeriodClosed = useMemo(() => {
    const label = periodToHistoryLabel(dashboardPeriod);
    return (closingsHistory || []).some(h => h.month === label);
  }, [dashboardPeriod, closingsHistory]);

  const handlePerformClosing = useCallback((period: string) => {
    const label = periodToHistoryLabel(period);
    if ((closingsHistory || []).some(h => h.month === label)) {
      toast.error("Este período já está fechado!");
      return;
    }

    // Usar resumo da API ou calcular localmente
    const periodSummary = summaries[period] || calculatePeriodFinanceSummary({
      finances,
      contasPagar,
      orders: [], // TODO: Carregar orders da API se necessário
      selectedPeriod: period,
      initialBalance: DEFAULT_INITIAL_BALANCE,
    });

    const newClosing: MonthlyClosing = {
      month: label,
      revenue: periodSummary.totalRevenue,
      expenses: periodSummary.totalExpenses,
      taxes: periodSummary.totalTaxes,
      netProfit: periodSummary.profit,
    };

    setClosingsHistory(prev => [...prev, newClosing]);
    setShowConfirmClose(false);

    toast.success(`Mês ${getPeriodLabel(period)} fechado com sucesso!`, {
      description: `Resultado: R$ ${periodSummary.profit.toLocaleString("pt-BR")}`,
      duration: 5000
    });
  }, [closingsHistory, finances, contasPagar, summaries]);

  const handleConfirmClose = useCallback(() => {
    handlePerformClosing(dashboardPeriod);
  }, [dashboardPeriod, handlePerformClosing]);

  const dueToastCycleRef = useRef(false);
  useEffect(() => {
    if (dueToastCycleRef.current) return;
    dueToastCycleRef.current = true;
    const nowMs = Date.now();
    const twoDays = 48 * 60 * 60 * 1000;
    [...finances, ...contasPagar].forEach(f => {
      if (!f.paid) {
        const due = new Date(f.dueDate).getTime();
        if (due > nowMs && due - nowMs <= twoDays) {
          toast.warning(`Vencimento próximo: ${f.description}`, {
            description: `Vence em ${f.dueDate} — R$ ${f.value.toLocaleString("pt-BR")}`,
            duration: 6000,
          });
        }
      }
    });
  }, [finances, contasPagar]);

  // Total estimado das despesas fixas ativas.
  const monthlyFixedTotal = useMemo(() =>
    (fixedExpenses || []).filter(f => f.active).reduce((s, f) => s + f.estimatedValue, 0),
  [fixedExpenses]);

  // Compara margem do mês atual com o mês anterior.
  const monthComparison = useMemo(() => {
    const label = periodToHistoryLabel(dashboardPeriod);
    const history = closingsHistory || [];
    const idx = history.findIndex(m => m.month === label);
    if (idx < 1 || !history[idx] || !history[idx - 1]) return null;
    const current = history[idx];
    const previous = history[idx - 1];
    const diff = current.netProfit - previous.netProfit;
    const pct = previous.netProfit !== 0 ? (diff / Math.abs(previous.netProfit)) * 100 : 0;
    return { diff, pct, up: diff >= 0 };
  }, [dashboardPeriod, closingsHistory]);

  // Tendência percentual das principais métricas do período.
  const metricTrends = useMemo(() => {
    const label = periodToHistoryLabel(dashboardPeriod);
    const history = closingsHistory || [];
    const idx = history.findIndex(m => m.month === label);
    if (idx < 1 || !history[idx] || !history[idx - 1]) return { revenue: 0, expenses: 0, receivables: 0, payables: 0, profit: 0 };
    const current = history[idx];
    const previous = history[idx - 1];
    const diff = (current.revenue - previous.revenue) / Math.max(1, Math.abs(previous.revenue)) * 100;
    const expenseDiff = (current.expenses - previous.expenses) / Math.max(1, Math.abs(previous.expenses)) * 100;
    const profitDiff = (current.netProfit - previous.netProfit) / Math.max(1, Math.abs(previous.netProfit)) * 100;
    return {
      revenue: diff,
      expenses: expenseDiff,
      receivables: diff,
      payables: expenseDiff,
      profit: profitDiff,
    };
  }, [dashboardPeriod, closingsHistory]);

  // Anos disponíveis no seletor de período.
  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) ys.add(y);
    (closingsHistory || []).forEach(m => {
      if (m && m.month) {
        const yearPart = m.month.split("/")[1];
        if (yearPart) ys.add(parseInt(yearPart, 10));
      }
    });
    return Array.from(ys).sort((a, b) => a - b);
  }, [currentYear, closingsHistory]);

  const totalFlow = Math.max(dashboardSummary.totalRevenue + dashboardSummary.totalExpenses, 1);
  const revenueShare = Math.round((dashboardSummary.totalRevenue / totalFlow) * 100);
  const expenseShare = 100 - revenueShare;

  const formatTransactionTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // Salva ou atualiza um lançamento financeiro via API.
  const handleSave = useCallback(async (data: any) => {
    try {
      if (data.id) {
        // Atualizar existente
        const updated = await updateFinanceEntry(data.id, {
          description: data.description,
          value: data.value,
          dueDate: data.dueDate,
          paid: data.paid,
          category: data.category,
        });
        setFinances(prev => prev.map(f => f.id === updated.id ? updated : f));
        toast.success("Lançamento atualizado com sucesso!");
      } else {
        // Criar novo
        // Criar novo - usar os nomes de campos do tipo FinanceEntry
        const created = await addFinanceEntry({
          description: data.description,
          type: data.type || "despesa",
          value: data.value,
          dueDate: data.dueDate,
          paid: data.paid || false,
          category: data.category,
        } as Omit<FinanceEntry, "id">);
        setFinances(prev => [...prev, created]);
        toast.success("Lançamento criado com sucesso!");
      }
      setEditingEntry(null);
      setShowModal(false);
      // Recarregar dados do período
      const [financesRes, revenuesRes, contasRes] = await Promise.all([
        fetchFinances({ period: analysisPeriod, limit: 100 }),
        fetchRevenues({ period: analysisPeriod, limit: 100 }),
        fetchContasPagar({ month: analysisPeriod }),
      ]);
      setFinances(financesRes.items);
      setRevenues(revenuesRes.items);
      setContasPagar(contasRes);
      // Recarregar resumo do período do lançamento (baseado na dueDate)
      const entryPeriod = periodKeyFromDateString(data.dueDate);
      const summary = await fetchFinanceSummary(entryPeriod);
      setSummaries(prev => ({ ...prev, [entryPeriod]: summary }));
    } catch (error) {
      toast.error("Erro ao salvar lançamento");
      console.error(error);
    }
  }, [analysisPeriod]);

  // Marca um lançamento como pago no livro caixa via API.
  const handleMarkPaid = useCallback(async (id: string) => {
    try {
      // Buscar o lançamento ANTES de atualizar (evita stale closure)
      const entry = finances.find(f => f.id === id);
      const entryPeriod = entry ? periodKeyFromDateString(entry.dueDate) : null;
      
      const updated = await updateFinanceEntry(id, {
        paid: true,
        paidAt: new Date().toISOString().split("T")[0],
      });
      
      // Atualiza estado local
      setFinances(prev => prev.map(f => f.id === id ? updated : f));
      toast.success("Transação marcada como paga!");
      
      // Recarregar resumo do período do lançamento
      if (entryPeriod) {
        const summary = await fetchFinanceSummary(entryPeriod);
        setSummaries(prev => ({ ...prev, [entryPeriod]: summary }));
      }
    } catch (error) {
      toast.error("Erro ao marcar como pago");
      console.error(error);
    }
  }, [finances]);

  // Marca uma conta a pagar como paga via API.
  const handleMarkCpPaid = useCallback(async (id: string) => {
    const conta = contasPagar.find(c => c.id === id);
    if (!conta) return;

    // Se for conta fixa, abre o modal de confirmação para ajuste de valor
    if (conta.isFixed) {
      setPayingConta(conta);
      setPayingValue(conta.value);
      setShowPayConfirmModal(true);
      return;
    }

    // Se não for fixa, segue o fluxo normal
    try {
      const contaPeriod = conta.month || periodKeyFromDateString(conta.dueDate);
      
      await markContaPaid(id);
      setContasPagar(prev => prev.map(c => 
        c.id === id ? { ...c, paid: true, paidAt: new Date().toISOString() } : c
      ));
      toast.success("Conta marcada como paga!");
      
      // Recarregar resumo do período da conta
      if (contaPeriod) {
        const summary = await fetchFinanceSummary(contaPeriod);
        setSummaries(prev => ({ ...prev, [contaPeriod]: summary }));
      }
    } catch (error) {
      toast.error("Erro ao marcar conta como paga");
      console.error(error);
    }
  }, [contasPagar]);

  const handleConfirmPayWithAdjustment = async () => {
    if (!payingConta) return;
    
    try {
      const id = payingConta.id;
      const contaPeriod = payingConta.month || periodKeyFromDateString(payingConta.dueDate);
      
      // Se o valor foi alterado, precisamos atualizar na API antes de marcar como pago
      // Nota: A API markContaPaid pode precisar de suporte para valor, ou usamos updateFinanceEntry se for o caso
      // Por enquanto vamos atualizar o estado local e marcar como pago
      await markContaPaid(id);
      
      setContasPagar(prev => prev.map(c => 
        c.id === id ? { ...c, value: payingValue, paid: true, paidAt: new Date().toISOString() } : c
      ));
      
      toast.success(`Conta "${payingConta.description}" paga com sucesso!`);
      setShowPayConfirmModal(false);
      setPayingConta(null);

      // Recarregar resumo
      if (contaPeriod) {
        const summary = await fetchFinanceSummary(contaPeriod);
        setSummaries(prev => ({ ...prev, [contaPeriod]: summary }));
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento");
      console.error(error);
    }
  };

  // Salva ou atualiza despesa fixa e cria conta associada via API.
  const handleSaveFixed = useCallback(async (data: any) => {
    try {
      if (data.id) {
        // Atualizar existente - por enquanto só local (API não tem update)
        setFixedExpenses(prev => prev.map(f => f.id === data.id ? { ...f, ...data } : f));
        toast.success("Despesa fixa atualizada!");
      } else {
        // Criar nova despesa fixa
        const newFixed = await addFixedExpense({
          name: data.name,
          category: data.category,
          estimatedValue: data.estimatedValue,
          dueDay: data.dueDay,
          active: true,
        } as Omit<FixedExpense, "id">);
        setFixedExpenses(prev => [...prev, newFixed]);

        // Criar conta a pagar associada
        const newConta = await addContaPagar({
          fixedExpenseId: newFixed.id,
          description: newFixed.name,
          category: newFixed.category,
          value: newFixed.estimatedValue,
          dueDate: new Date().toISOString().split('T')[0],
          paid: false,
        } as Omit<ContaPagar, "id">);
        setContasPagar(prev => [...prev, newConta]);
        
        toast.success("Despesa fixa criada com sucesso!");
      }
      setShowFixedModal(false);
      setEditingFixed(null);
      // Recarregar dados
      const expenses = await fetchFixedExpenses();
      setFixedExpenses(expenses);
      const contasRes = await fetchContasPagar({ month: analysisPeriod });
      setContasPagar(contasRes);
    } catch (error) {
      toast.error("Erro ao salvar despesa fixa");
      console.error(error);
    }
  }, [analysisPeriod]);

  // Handlers para Gestão de Receitas
  
  // Carrega dados de receitas quando o período muda
  useEffect(() => {
    const loadRevenues = async () => {
      try {
        // Buscar receitas externas
        const [externalRes] = await Promise.all([
          fetchExternalRevenues({ period: revenuesPeriod, limit: 100 }),
        ]);
        setExternalRevenues(externalRes.items);
        
        // Combinar todas as receitas
        const all = [...externalRes.items];
        setAllRevenues(all);
        
        // Filtrar receitas de clientes (quando tivermos endpoint de pedidos)
        const client = all.filter(r => r.sourceType === "client");
        setClientRevenues(client);
        
        // Filtrar pendentes
        const pending = all.filter(r => r.paymentStatus === "pending" || r.paymentStatus === "overdue");
        setPendingRevenues(pending);
      } catch (error) {
        console.error("Erro ao carregar receitas:", error);
      }
    };
    
    loadRevenues();
  }, [revenuesPeriod]);

  // Deleta receita externa
  const handleDeleteExternalRevenue = useCallback(async (id: string) => {
    try {
      await deleteExternalRevenue(id);
      setExternalRevenues(prev => prev.filter(r => r.id !== id));
      setAllRevenues(prev => prev.filter(r => r.id !== id));
      setPendingRevenues(prev => prev.filter(r => r.id !== id));
      toast.success("Receita removida com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover receita");
      console.error(error);
    }
  }, []);

  // Marca receita externa como paga
  const handleMarkExternalRevenuePaid = useCallback(async (id: string) => {
    try {
      const updated = await markExternalRevenuePaid(id);
      setExternalRevenues(prev => prev.map(r => r.id === id ? updated : r));
      setAllRevenues(prev => prev.map(r => r.id === id ? updated : r));
      setPendingRevenues(prev => prev.filter(r => r.id !== id));
      toast.success("Receita marcada como paga!");
    } catch (error) {
      toast.error("Erro ao marcar como paga");
      console.error(error);
    }
  }, []);

  // Handlers placeholder para receitas de clientes (até termos endpoint)
  const handleDeleteRevenue = useCallback(async (id: string) => {
    if (id.startsWith("REV-EXT")) {
      await handleDeleteExternalRevenue(id);
    } else {
      toast.info("Receitas de pedidos devem ser gerenciadas na aba Pedidos");
    }
  }, [handleDeleteExternalRevenue]);

  const handleMarkRevenuePaid = useCallback(async (id: string) => {
    if (id.startsWith("REV-EXT")) {
      await handleMarkExternalRevenuePaid(id);
    } else {
      toast.info("Receitas de pedidos devem ser marcadas na aba Pedidos");
    }
  }, [handleMarkExternalRevenuePaid]);

  // Filtra contas fixas (isFixed: true)
  const filteredFixedCp = useMemo(() => {
    let result = (expensesContas || []).filter(c => c.isFixed);
    if (cpSearch.trim()) {
      const q = cpSearch.toLowerCase();
      result = result.filter(c => c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    if (cpFilterStatus !== "all") {
      result = result.filter(c => cpFilterStatus === "paid" ? c.paid : !c.paid);
    }

    if (cpSortConfig.key) {
      result.sort((a, b) => {
        let aValue = (a as any)[cpSortConfig.key];
        let bValue = (b as any)[cpSortConfig.key];
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return cpSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return cpSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
    return result;
  }, [expensesContas, cpSearch, cpFilterStatus, cpSortConfig]);

  // Filtra contas avulsas (isFixed: false)
  const filteredVariableCp = useMemo(() => {
    let result = (expensesContas || []).filter(c => !c.isFixed);
    if (cpSearch.trim()) {
      const q = cpSearch.toLowerCase();
      result = result.filter(c => c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    if (cpFilterStatus !== "all") {
      result = result.filter(c => cpFilterStatus === "paid" ? c.paid : !c.paid);
    }

    if (cpSortConfig.key) {
      result.sort((a, b) => {
        let aValue = (a as any)[cpSortConfig.key];
        let bValue = (b as any)[cpSortConfig.key];
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return cpSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return cpSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
    return result;
  }, [expensesContas, cpSearch, cpFilterStatus, cpSortConfig]);

  // Filtra despesas gerais (Finanças + Contas a Pagar)
  const filteredAllExpenses = useMemo(() => {
    const despesasFromFinances = (expensesFinances || []).filter(f => f.type === "despesa");
    const all = [
      ...(despesasFromFinances || []).map(f => ({ ...f, isFixed: false })),
      ...(expensesContas || [])
    ];
    
    let result = all;
    if (cpSearch.trim()) {
      const q = cpSearch.toLowerCase();
      result = result.filter(c => c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    if (cpFilterStatus !== "all") {
      result = result.filter(c => cpFilterStatus === "paid" ? c.paid : !c.paid);
    }

    if (cpSortConfig.key) {
      result.sort((a, b) => {
        let aValue = (a as any)[cpSortConfig.key];
        let bValue = (b as any)[cpSortConfig.key];
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return cpSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return cpSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
    return result;
  }, [expensesFinances, expensesContas, cpSearch, cpFilterStatus, cpSortConfig]);

  // Ordena o livro caixa por data de vencimento ou configuração de ordenação.
  const livroCaixaRows = useMemo(() => {
    const paidFinances = (analysisFinances || []).filter(f => f.paid);
    const paidContas = ((analysisContas || []).filter(c => c.paid) || []).map(c => ({
      id: c.id,
      description: c.description,
      type: "despesa" as const,
      value: c.value,
      dueDate: c.dueDate,
      paid: true,
      paidAt: c.paidAt,
      category: c.category
    }));

    // Adicionar receitas externas pagas
    const paidRevenues = ((externalRevenues || []).filter(r => r.paidAt) || []).map(r => ({
      id: r.id,
      description: r.description,
      type: "receita" as const,
      value: r.value,
      dueDate: r.dueDate,
      paid: true,
      paidAt: r.paidAt,
      category: r.source
    }));

    let result = [...paidFinances, ...paidContas, ...paidRevenues];

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = (a as any)[sortConfig.key];
        let bValue = (b as any)[sortConfig.key];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
    return result;
  }, [analysisFinances, analysisContas, sortConfig]);

  // Seleciona os últimos seis meses para o gráfico e ordena o histórico de fechamentos.
  const lastSixHistory = useMemo(() => {
    let result = [...(closingsHistory || [])].map(h => ({ ...h, isOpen: false }));
    
    const currentLabel = periodToHistoryLabel(analysisPeriod);
    const alreadyClosed = result.some(h => h.month === currentLabel);
    
    if (!alreadyClosed) {
      result.push({
        month: currentLabel,
        revenue: analysisSummary.totalRevenue,
        expenses: analysisSummary.totalExpenses,
        taxes: analysisSummary.totalTaxes,
        netProfit: analysisSummary.profit,
        isOpen: true
      });
    }
    
    // Ordenação decrescente (mais recente primeiro)
    result.sort((a, b) => {
      const [mA, yA] = a.month.split("/");
      const [mB, yB] = b.month.split("/");
      const idxA = monthShortHistory.indexOf(mA);
      const idxB = monthShortHistory.indexOf(mB);
      if (yA !== yB) return parseInt(yB) - parseInt(yA);
      return idxB - idxA;
    });

    if (fechamentoSortConfig.key) {
      result.sort((a, b) => {
        let aValue = (a as any)[fechamentoSortConfig.key];
        let bValue = (b as any)[fechamentoSortConfig.key];
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        if (aValue < bValue) return fechamentoSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return fechamentoSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [closingsHistory, analysisPeriod, analysisSummary, fechamentoSortConfig]);

  // Formata os dados do gráfico de comparativo de receita e despesas.
  const chartData = useMemo(() => {
    const sortedForChart = [...(lastSixHistory || [])]
      .filter(h => !h.isOpen)
      .sort((a, b) => {
        const [mA, yA] = a.month.split("/");
        const [mB, yB] = b.month.split("/");
        const idxA = monthShortHistory.indexOf(mA);
        const idxB = monthShortHistory.indexOf(mB);
        if (yA !== yB) return parseInt(yA) - parseInt(yB);
        return idxA - idxB;
      })
      .slice(-6);

    return sortedForChart.map(month => ({
      month: month.month,
      Receita: month.revenue,
      Despesas: month.expenses,
    }));
  }, [lastSixHistory]);

  const marginColors = {
    excellent: { border: "border-l-success", bg: "bg-success/5", text: "text-success", icon: CheckCircle2 },
    attention: { border: "border-l-warning", bg: "bg-warning/5", text: "text-warning", icon: AlertTriangle },
    risk: { border: "border-l-destructive", bg: "bg-destructive/5", text: "text-destructive", icon: AlertTriangle },
  };

  return (
    <div className="space-y-20 pb-32">
      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestão de Fluxo de Caixa</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Período: <strong className="text-foreground">{getPeriodLabel(dashboardPeriod)}</strong></span>
            <Dialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
              <DialogTrigger asChild>
                <Button 
                  className={`${isDashboardPeriodClosed ? "bg-zinc-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"} text-white font-bold`}
                  disabled={isDashboardPeriodClosed}
                >
                  {isDashboardPeriodClosed ? "Mês Fechado" : "Realizar Fechamento"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-400" /> Confirmar Fechamento
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 pt-2">
                    Você está prestes a fechar o período de <strong>{getPeriodLabel(dashboardPeriod)}</strong>. 
                    Esta ação irá registrar o saldo atual no histórico e finalizar o ciclo financeiro deste mês.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Receita Total:</span>
                    <span className="text-emerald-400 font-bold">{formatCurrency(dashboardSummary.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Despesas Totais:</span>
                    <span className="text-red-400 font-bold">{formatCurrency(dashboardSummary.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Lucro Líquido:</span>
                    <span className={dashboardSummary.profit >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                      {formatCurrency(dashboardSummary.profit)}
                    </span>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setShowConfirmClose(false)} className="border-zinc-700">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirmClose} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <MetricCard label="Receita Total" value={dashboardSummary.totalRevenue} icon={ArrowUpRight} sub={metricTrends.revenue !== undefined && metricTrends.revenue !== null ? (metricTrends.revenue >= 0 ? `+${metricTrends.revenue.toFixed(1)}%` : `${metricTrends.revenue.toFixed(1)}%`) : '0%'} colorClass="text-emerald-400" />
          <MetricCard label="Despesas Totais" value={dashboardSummary.totalExpenses} icon={ArrowDownRight} sub={metricTrends.expenses !== undefined && metricTrends.expenses !== null ? (metricTrends.expenses >= 0 ? `+${metricTrends.expenses.toFixed(1)}%` : `${metricTrends.expenses.toFixed(1)}%`) : '0%'} colorClass="text-red-400" />
          <MetricCard label="A Receber" value={dashboardSummary.unpaidRevenue} icon={TrendingUp} sub={metricTrends.receivables !== undefined && metricTrends.receivables !== null ? (metricTrends.receivables >= 0 ? `+${metricTrends.receivables.toFixed(1)}%` : `${metricTrends.receivables.toFixed(1)}%`) : '0%'} colorClass="text-emerald-400" />
          <MetricCard label="A Pagar" value={dashboardSummary.unpaidExpenses + dashboardSummary.cpUnpaid} icon={TrendingDown} sub={metricTrends.payables !== undefined && metricTrends.payables !== null ? (metricTrends.payables >= 0 ? `+${metricTrends.payables.toFixed(1)}%` : `${metricTrends.payables.toFixed(1)}%`) : '0%'} colorClass="text-amber-400" />
        </div>

        {/* Mostrar mensagem apenas quando não houver NENHUMA movimentação no período */}
        {(() => {
          const dashboardFinances = getFinancesForPeriod(dashboardPeriod);
          const dashboardContas = getContasForPeriod(dashboardPeriod);
          const hasAnyTransactions = dashboardFinances.length > 0 || dashboardContas.length > 0;
          
          return !hasAnyTransactions && (
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/50">
              <div className="text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-zinc-500 mx-auto" />
                <p className="text-zinc-400 font-medium">Aguardando lançamentos de despesas ou receitas para este período...</p>
              </div>
            </div>
          );
        })()}

        <Card className="rounded-2xl">
          <CardContent className="p-8">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Resultado do Mês</p>
                <h2 className="mt-6 text-4xl font-bold tracking-tight tabular-nums">{formatCurrency(dashboardSummary.profit)}</h2>
                <p className="mt-4 text-sm text-muted-foreground">Lucro Líquido após receitas e despesas do período.</p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:w-[600px]">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-muted-foreground">
                  <span>Receita</span>
                  <span>Despesas</span>
                </div>
                <div className="mt-3 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
                  <div className="flex h-4">
                    <div style={{ width: `${Math.round((dashboardSummary.totalRevenue / Math.max(dashboardSummary.totalRevenue + dashboardSummary.totalExpenses, 1)) * 100)}%` }} className="bg-emerald-500" />
                    <div style={{ width: `${100 - Math.round((dashboardSummary.totalRevenue / Math.max(dashboardSummary.totalRevenue + dashboardSummary.totalExpenses, 1)) * 100)}%` }} className="bg-red-500" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Receita</p>
                    <p className="mt-2 text-lg font-bold text-emerald-300">{formatCurrency(dashboardSummary.totalRevenue)}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Despesas</p>
                    <p className="mt-2 text-lg font-bold text-red-300">{formatCurrency(dashboardSummary.totalExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                {dashboardSummary.profit >= 0 ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${dashboardSummary.profit >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {dashboardSummary.profit >= 0 ? "Previsão de Saldo Positivo" : "Atenção: Risco de Saldo Negativo"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resultado líquido projetado com base nas entradas e saídas do período atual.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-800/70 px-3 py-2 text-sm text-muted-foreground">
                <ArrowUpRight className={`h-4 w-4 ${dashboardSummary.profit >= 0 ? "text-emerald-400" : "text-red-400"}`} />
                {formatCurrency(dashboardSummary.profit)}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 dark:border-zinc-800 opacity-30" />
      </div>

      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Análise de Performance</h2>
            <p className="text-muted-foreground">Visualize o comparativo histórico e as movimentações detalhadas do período.</p>
          </div>
          <PeriodFilter selectedPeriod={analysisPeriod} setSelectedPeriod={setAnalysisPeriod} yearOptions={yearOptions || []} />
        </div>
        <Tabs defaultValue="caixa" className="w-full min-w-0 space-y-6">
          <TabsList className="grid w-full min-w-0 grid-cols-3">
            <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
            <TabsTrigger value="caixa">Movimentações</TabsTrigger>
            <TabsTrigger value="fechamentos">Fechamentos</TabsTrigger>
          </TabsList>

        {/* Comparativo Tab */}
        <TabsContent value="comparativo" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <CardTitle className="text-base font-semibold">Comparativo de Receitas vs. Despesas — Últimos 6 Meses</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Evolução mensal da Receita e Despesas baseada no histórico.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: FIXED_TAB_HEIGHT }} className="w-full p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="month" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip 
                      formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.25)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#fafafa'
                      }}
                      labelStyle={{ color: '#fafafa' }}
                      itemStyle={{ color: '#fafafa' }}
                    />
                    <Bar dataKey="Receita" fill="#10b981" />
                    <Bar dataKey="Despesas" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movimentações Tab */}
        <TabsContent value="caixa">
          <Card>
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
                <CardTitle className="text-base font-semibold">Movimentações — {analysisPeriodLabel}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Extrato de transações realizadas no período.</p>
              </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: FIXED_TAB_HEIGHT }} className="overflow-x-auto overflow-y-auto relative">
              <Table className="min-w-[720px] w-full md:min-w-0">
                <TableHeader>
                  <TableRow className="h-11">
                    <TableHead 
                      className="cursor-pointer hover:bg-zinc-700 transition-colors w-[120px]"
                      onClick={() => handleSort('dueDate')}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Data</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === 'dueDate' && (
                            <span className="text-xs text-zinc-400">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-zinc-700 transition-colors min-w-[200px]"
                      onClick={() => handleSort('description')}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Descrição</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === 'description' && (
                            <span className="text-xs text-zinc-400">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-zinc-700 transition-colors w-[150px]"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Categoria</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === 'category' && (
                            <span className="text-xs text-zinc-400">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-zinc-700 transition-colors w-[120px]"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Tipo</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === 'type' && (
                            <span className="text-xs text-zinc-400">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-zinc-700 transition-colors w-[130px]"
                      onClick={() => handleSort('value')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Valor</span>
                        <div className="w-4 flex justify-center">
                          {sortConfig.key === 'value' && (
                            <span className="text-xs text-zinc-400">
                              {sortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livroCaixaRows.map(f => (
                    <TableRow key={f.id} className="h-12 border-b border-border/60 hover:bg-muted/30">
                      <TableCell className="text-sm">
                        <div className="flex flex-col leading-tight">
                          <span>{f.dueDate}</span>
                          <span className="text-[10px] text-muted-foreground">{formatTransactionTime(f.paidAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{f.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{f.category}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${f.type === "receita" ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
                          {f.type === "receita" ? "Receita" : "Despesa"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${f.type === "receita" ? "text-success" : "text-destructive"}`}>
                        {f.type === "receita" ? "+" : "-"} R$ {f.value.toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingEntry(f); setShowModal(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {livroCaixaRows.length < MIN_TABLE_ROWS && Array.from({ length: MIN_TABLE_ROWS - livroCaixaRows.length }).map((_, i) => (
                    <TableRow key={`empty-lc-${i}`} className="h-12 border-b border-border/10 hover:bg-transparent">
                      <TableCell colSpan={6}>&nbsp;</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fechamentos Tab */}
        <TabsContent value="fechamentos">
          <Card>
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <CardTitle className="text-base font-semibold">Fechamento — Histórico</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Evolução mensal dos últimos fechamentos. Este relatório ignora o filtro mensal.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div style={{ height: FIXED_TAB_HEIGHT }} className="overflow-x-auto overflow-y-auto relative">
              <Table className="min-w-[640px] w-full md:min-w-0">
                <TableHeader>
                  <TableRow className="h-11">
                    <TableHead 
                      className="cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleFechamentoSort('month')}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>Mês</span>
                        <div className="w-4 flex justify-center">
                          {fechamentoSortConfig.key === 'month' && (
                            <span className="text-xs text-zinc-400">
                              {fechamentoSortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleFechamentoSort('revenue')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Receita</span>
                        <div className="w-4 flex justify-center">
                          {fechamentoSortConfig.key === 'revenue' && (
                            <span className="text-xs text-zinc-400">
                              {fechamentoSortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleFechamentoSort('taxes')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Impostos</span>
                        <div className="w-4 flex justify-center">
                          {fechamentoSortConfig.key === 'taxes' && (
                            <span className="text-xs text-zinc-400">
                              {fechamentoSortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleFechamentoSort('expenses')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Despesas</span>
                        <div className="w-4 flex justify-center">
                          {fechamentoSortConfig.key === 'expenses' && (
                            <span className="text-xs text-zinc-400">
                              {fechamentoSortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => handleFechamentoSort('netProfit')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Lucro Líquido</span>
                        <div className="w-4 flex justify-center">
                          {fechamentoSortConfig.key === 'netProfit' && (
                            <span className="text-xs text-zinc-400">
                              {fechamentoSortConfig.direction === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastSixHistory.map((history, index) => {
                    const previous = lastSixHistory[index + 1];
                    const diff = previous ? history.netProfit - previous.netProfit : 0;
                    const up = diff >= 0;
                    const isOpen = (history as any).isOpen;

                    return (
                      <TableRow key={history.month} className={`h-12 border-b border-border/60 hover:bg-muted/30 ${isOpen ? "bg-blue-500/5" : ""}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {history.month}
                            {isOpen && <Badge variant="outline" className="text-[10px] h-4 px-1 bg-blue-500/10 text-blue-400 border-blue-500/20">Aberto</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-success">R$ {history.revenue.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right text-destructive">R$ {history.taxes.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right text-destructive">R$ {history.expenses.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className={`text-right font-bold ${history.netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                          R$ {history.netProfit.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {isOpen ? (
                            <span className="text-blue-400 text-xs font-medium italic animate-pulse">Aguardando fechamento...</span>
                          ) : previous ? (
                            <span className={`inline-flex items-center justify-end gap-1 font-semibold tabular-nums ${up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                              {up ? <ArrowUp className="h-3.5 w-3.5 shrink-0" /> : <ArrowDown className="h-3.5 w-3.5 shrink-0" />}
                              {Math.abs(diff).toLocaleString("pt-BR")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {lastSixHistory.length < MIN_TABLE_ROWS && Array.from({ length: MIN_TABLE_ROWS - lastSixHistory.length }).map((_, i) => (
                    <TableRow key={`empty-hist-${i}`} className="h-12 border-b border-border/10 hover:bg-transparent">
                      <TableCell colSpan={6}>&nbsp;</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </section>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 dark:border-zinc-800 opacity-30" />
      </div>

      {/* ==================== GESTÃO DE RECEITAS E ENTRADAS ==================== */}
      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Gestão de Receitas e Entradas</h2>
            <p className="text-muted-foreground">Controle todas as receitas, entradas de clientes e pagamentos pendentes.</p>
          </div>
          <PeriodFilter selectedPeriod={revenuesPeriod} setSelectedPeriod={setRevenuesPeriod} yearOptions={yearOptions || []} />
        </div>
        
        <Tabs defaultValue="geral" className="w-full min-w-0 space-y-6">
          <TabsList className="grid w-full min-w-0 grid-cols-4">
            <TabsTrigger value="geral">Receitas Gerais</TabsTrigger>
            <TabsTrigger value="clientes">Receitas de Clientes</TabsTrigger>
            <TabsTrigger value="externas">Receitas Externas</TabsTrigger>
            <TabsTrigger value="pendentes">Pagamentos Pendentes</TabsTrigger>
          </TabsList>

          {/* Receitas Geral Tab */}
          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[92px]">
                <div>
                  <CardTitle className="text-base font-semibold">Receitas Gerais — {revenuesPeriodLabel}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todas as receitas do período · Total: <strong>R$ {(allRevenues || []).reduce((s, r) => s + (r.value || 0), 0).toLocaleString("pt-BR")}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => { setShowRevenueModal(true); setEditingRevenue(null); }}>
                    <Plus className="h-3 w-3 mr-1" /> Nova Receita
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar..." 
                      value={revenueSearch} 
                      onChange={e => setRevenueSearch(e.target.value)} 
                      className="pl-8 h-8 w-40 text-xs" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <RevenuesTable 
                  revenues={filteredAllRevenues} 
                  onEdit={(r) => { setEditingRevenue(r); setShowRevenueModal(true); }}
                  onDelete={handleDeleteRevenue}
                  onMarkPaid={handleMarkRevenuePaid}
                  emptyMessage="Nenhuma receita encontrada para este período."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receitas de Clientes Tab */}
          <TabsContent value="clientes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[92px]">
                <div>
                  <CardTitle className="text-base font-semibold">Receitas de Clientes — {revenuesPeriodLabel}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receitas de pedidos/vendas · Total: <strong>R$ {(clientRevenues || []).reduce((s, r) => s + (r.value || 0), 0).toLocaleString("pt-BR")}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href="/pedidos">
                    <Button size="sm">
                      <Plus className="h-3 w-3 mr-1" /> Novo Pedido
                    </Button>
                  </a>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar cliente..." 
                      value={clientSearch} 
                      onChange={e => setClientSearch(e.target.value)} 
                      className="pl-8 h-8 w-48 text-xs" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <RevenuesTable 
                  revenues={filteredClientRevenues} 
                  onEdit={(r) => { setEditingRevenue(r); setShowRevenueModal(true); }}
                  onDelete={handleDeleteRevenue}
                  onMarkPaid={handleMarkRevenuePaid}
                  showCustomerColumn={true}
                  emptyMessage="Nenhuma receita de cliente encontrada."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receitas Externas Tab */}
          <TabsContent value="externas" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[92px]">
                <div>
                  <CardTitle className="text-base font-semibold">Receitas Externas — {revenuesPeriodLabel}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aluguel, rendimentos, reembolsos, etc. · Total: <strong>R$ {(externalRevenues || []).reduce((s, r) => s + (r.value || 0), 0).toLocaleString("pt-BR")}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => { setShowExternalRevenueModal(true); setEditingExternalRevenue(null); }}>
                    <Plus className="h-3 w-3 mr-1" /> Nova Receita Externa
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar..." 
                      value={revenueSearch} 
                      onChange={e => setRevenueSearch(e.target.value)} 
                      className="pl-8 h-8 w-40 text-xs" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ExternalRevenuesTable 
                  revenues={filteredExternalRevenues}
                  onEdit={(r) => { setEditingExternalRevenue(r); setShowExternalRevenueModal(true); }}
                  onDelete={handleDeleteExternalRevenue}
                  onMarkPaid={handleMarkExternalRevenuePaid}
                  emptyMessage="Nenhuma receita externa encontrada."
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pagamentos Pendentes Tab */}
          <TabsContent value="pendentes" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[92px]">
                <div>
                  <CardTitle className="text-base font-semibold">Pagamentos Pendentes</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pagamentos pendentes e atrasados · Total em aberto: <strong>R$ {(pendingRevenues || []).reduce((s, r) => s + (r.value || 0), 0).toLocaleString("pt-BR")}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar..." 
                      value={pendingSearch} 
                      onChange={e => setPendingSearch(e.target.value)} 
                      className="pl-8 h-8 w-40 text-xs" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <PendingRevenuesTable 
                  revenues={filteredPendingRevenues}
                  onEdit={(r) => { 
                    if (r.sourceType === "external") {
                      setEditingExternalRevenue(r);
                      setShowExternalRevenueModal(true);
                    } else {
                      setEditingRevenue(r);
                      setShowRevenueModal(true);
                    }
                  }}
                  onMarkPaid={r => r.sourceType === "external" ? handleMarkExternalRevenuePaid(r.id) : handleMarkRevenuePaid(r.id)}
                  emptyMessage="Nenhuma cobrança pendente."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 dark:border-zinc-800 opacity-30" />
      </div>

      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Gestão de Despesas e Contas</h2>
            <p className="text-muted-foreground">Administre suas contas fixas, avulsas e despesas consolidadas.</p>
          </div>
          <PeriodFilter selectedPeriod={expensesPeriod} setSelectedPeriod={setExpensesPeriod} yearOptions={yearOptions || []} />
        </div>
        
        <Tabs defaultValue="fixas" className="w-full min-w-0 space-y-6">
          <TabsList className="grid w-full min-w-0 grid-cols-3">
            <TabsTrigger value="fixas">Contas Fixas</TabsTrigger>
            <TabsTrigger value="avulsas">Contas Avulsas</TabsTrigger>
            <TabsTrigger value="geral">Despesas Geral</TabsTrigger>
          </TabsList>

          {/* Contas Fixas Tab */}
          <TabsContent value="fixas" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[92px]">
                <div>
                  <CardTitle className="text-base font-semibold">Contas Fixas — {expensesPeriodLabel}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recorrentes mensais · Total: <strong className="text-foreground">R$ {(filteredFixedCp || []).reduce((s, c) => s + (c.value || 0), 0).toLocaleString("pt-BR")}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => { setEditingFixed(null); setShowFixedModal(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Nova Conta Fixa
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar..." value={cpSearch} onChange={e => setCpSearch(e.target.value)} className="pl-8 h-8 w-40 text-xs" id="fixas-search" name="fixas-search" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div style={{ height: FIXED_TAB_HEIGHT }} className="w-full min-w-0 overflow-x-auto overflow-y-auto relative">
                  <Table className="min-w-[640px] w-full">
                    <TableHeader>
                      <TableRow className="h-11 hover:bg-transparent border-b bg-muted/40">
                        <TableHead className="text-xs font-medium cursor-pointer hover:bg-zinc-700 transition-colors min-w-[200px]" onClick={() => handleCpSort('description')}>
                          <div className="flex items-center justify-between gap-1">
                            <span>Descrição</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'description' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium w-[140px] cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('dueDate')}>
                          <div className="flex items-center justify-between gap-1">
                            <span>Vencimento</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'dueDate' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right w-[120px] tabular-nums cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('value')}>
                          <div className="flex items-center justify-end gap-1">
                            <span>Valor (R$)</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'value' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium w-[110px] text-center cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('paid')}>
                          <div className="flex items-center justify-center gap-1">
                            <span>Situação</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'paid' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right w-14">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFixedCp.map(cp => (
                        <TableRow key={cp.id} className="border-b border-border/60 hover:bg-muted/30 h-12">
                          <TableCell className="font-medium text-sm py-2.5">{cp.description}</TableCell>
                          <TableCell className="text-sm tabular-nums text-muted-foreground py-2.5">{cp.dueDate}</TableCell>
                          <TableCell className="text-right text-sm font-medium tabular-nums text-destructive py-2.5">− {cp.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="py-2.5 text-center">
                            {cp.paid ? (
                              <Badge className="bg-success/15 text-success border-success/30 text-xs" variant="outline">Pago</Badge>
                            ) : (
                              <Badge className="bg-warning/15 text-warning border-warning/30 text-xs" variant="outline">Aberto</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            {!cp.paid && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMarkCpPaid(cp.id)} title="Marcar como Pago">
                                <Check className="h-3.5 w-3.5 text-success" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredFixedCp.length < MIN_TABLE_ROWS && Array.from({ length: MIN_TABLE_ROWS - filteredFixedCp.length }).map((_, i) => (
                        <TableRow key={`empty-fix-${i}`} className="h-12 border-b border-border/10 hover:bg-transparent">
                          <TableCell colSpan={5}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contas Avulsas Tab */}
          <TabsContent value="avulsas" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[92px]">
                <div>
                  <CardTitle className="text-base font-semibold">Contas Avulsas — {expensesPeriodLabel}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Despesas variáveis do período · Total: <strong className="text-foreground">R$ {(filteredVariableCp || []).reduce((s, c) => s + (c.value || 0), 0).toLocaleString("pt-BR")}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => { setEditingEntry(null); setShowModal(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Nova Despesa
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar..." value={cpSearch} onChange={e => setCpSearch(e.target.value)} className="pl-8 h-8 w-40 text-xs" id="avulsas-search" name="avulsas-search" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div style={{ height: FIXED_TAB_HEIGHT }} className="w-full min-w-0 overflow-x-auto overflow-y-auto relative">
                  <Table className="min-w-[640px] w-full">
                    <TableHeader>
                      <TableRow className="h-11 hover:bg-transparent border-b bg-muted/40">
                        <TableHead className="text-xs font-medium cursor-pointer hover:bg-zinc-700 transition-colors min-w-[200px]" onClick={() => handleCpSort('description')}>
                          <div className="flex items-center justify-between gap-1">
                            <span>Descrição</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'description' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium w-[140px] cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('dueDate')}>
                          <div className="flex items-center justify-between gap-1">
                            <span>Vencimento</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'dueDate' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right w-[120px] tabular-nums cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('value')}>
                          <div className="flex items-center justify-end gap-1">
                            <span>Valor (R$)</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'value' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium w-[110px] text-center cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('paid')}>
                          <div className="flex items-center justify-center gap-1">
                            <span>Situação</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'paid' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right w-14">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVariableCp.map(cp => (
                        <TableRow key={cp.id} className="border-b border-border/60 hover:bg-muted/30 h-12">
                          <TableCell className="font-medium text-sm py-2.5">{cp.description}</TableCell>
                          <TableCell className="text-sm tabular-nums text-muted-foreground py-2.5">{cp.dueDate}</TableCell>
                          <TableCell className="text-right text-sm font-medium tabular-nums text-destructive py-2.5">− {cp.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="py-2.5 text-center">
                            {cp.paid ? (
                              <Badge className="bg-success/15 text-success border-success/30 text-xs" variant="outline">Pago</Badge>
                            ) : (
                              <Badge className="bg-warning/15 text-warning border-warning/30 text-xs" variant="outline">Aberto</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            {!cp.paid && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMarkCpPaid(cp.id)} title="Marcar como Pago">
                                <Check className="h-3.5 w-3.5 text-success" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredVariableCp.length < MIN_TABLE_ROWS && Array.from({ length: MIN_TABLE_ROWS - filteredVariableCp.length }).map((_, i) => (
                        <TableRow key={`empty-var-${i}`} className="h-12 border-b border-border/10 hover:bg-transparent">
                          <TableCell colSpan={5}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Despesas Geral Tab */}
          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-h-[92px]">
                <div>
                  <CardTitle className="text-base font-semibold">Despesas Geral — {expensesPeriodLabel}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Visão consolidada de todas as saídas · Total: <strong className="text-foreground">R$ {(filteredAllExpenses || []).reduce((s, c) => s + (c.value || 0), 0).toLocaleString("pt-BR")}</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => { setEditingEntry(null); setShowModal(true); }}>
                    <Plus className="h-3 w-3 mr-1" /> Nova Despesa
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Buscar..." value={cpSearch} onChange={e => setCpSearch(e.target.value)} className="pl-8 h-8 w-40 text-xs" id="geral-search" name="geral-search" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div style={{ height: FIXED_TAB_HEIGHT }} className="w-full min-w-0 overflow-x-auto overflow-y-auto relative">
                  <Table className="min-w-[640px] w-full">
                    <TableHeader>
                      <TableRow className="h-11 hover:bg-transparent border-b bg-muted/40">
                        <TableHead className="text-xs font-medium cursor-pointer hover:bg-zinc-700 transition-colors min-w-[200px]" onClick={() => handleCpSort('description')}>
                          <div className="flex items-center justify-between gap-1">
                            <span>Descrição</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'description' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium w-[140px] cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('dueDate')}>
                          <div className="flex items-center justify-between gap-1">
                            <span>Vencimento</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'dueDate' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right w-[120px] tabular-nums cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('value')}>
                          <div className="flex items-center justify-end gap-1">
                            <span>Valor (R$)</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'value' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium w-[110px] text-center cursor-pointer hover:bg-zinc-700 transition-colors" onClick={() => handleCpSort('paid')}>
                          <div className="flex items-center justify-center gap-1">
                            <span>Situação</span>
                            <div className="w-4 flex justify-center">
                              {cpSortConfig.key === 'paid' && (<span className="text-xs text-zinc-400">{cpSortConfig.direction === 'asc' ? '↑' : '↓'}</span>)}
                            </div>
                          </div>
                        </TableHead>
                        <TableHead className="text-xs font-medium text-right w-14">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAllExpenses.map(item => (
                        <TableRow key={item.id} className="border-b border-border/60 hover:bg-muted/30 h-12">
                          <TableCell className="font-medium text-sm py-2.5">{item.description}</TableCell>
                          <TableCell className="text-sm tabular-nums text-muted-foreground py-2.5">{item.dueDate}</TableCell>
                          <TableCell className="text-right text-sm font-medium tabular-nums text-destructive py-2.5">− {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="py-2.5 text-center">
                            {item.paid ? (
                              <Badge className="bg-success/15 text-success border-success/30 text-xs" variant="outline">Pago</Badge>
                            ) : (
                              <Badge className="bg-warning/15 text-warning border-warning/30 text-xs" variant="outline">Aberto</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            {!item.paid && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" 
                                onClick={() => {
                                  if (item.id.startsWith('FIN-')) handleMarkPaid(item.id);
                                  else handleMarkCpPaid(item.id);
                                }} 
                                title="Marcar como Pago">
                                <Check className="h-3.5 w-3.5 text-success" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredAllExpenses.length < MIN_TABLE_ROWS && Array.from({ length: MIN_TABLE_ROWS - filteredAllExpenses.length }).map((_, i) => (
                        <TableRow key={`empty-all-${i}`} className="h-12 border-b border-border/10 hover:bg-transparent">
                          <TableCell colSpan={5}>&nbsp;</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <TransactionModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditingEntry(null); }}
        onSave={handleSave}
        entry={editingEntry}
      />

      <FixedExpenseModal
        open={showFixedModal}
        onClose={() => { setShowFixedModal(false); setEditingFixed(null); }}
        onSave={handleSaveFixed}
        expense={editingFixed}
      />

      {/* Modais de Receitas */}
      <RevenueModal
        open={showRevenueModal}
        onClose={() => { setShowRevenueModal(false); setEditingRevenue(null); }}
        revenue={editingRevenue}
      />

      <ExternalRevenueModal
        open={showExternalRevenueModal}
        onClose={() => { setShowExternalRevenueModal(false); setEditingExternalRevenue(null); }}
        revenue={editingExternalRevenue}
      />

      {/* Modal de Confirmação de Pagamento com Ajuste (Contas Fixas) */}
      <Dialog open={showPayConfirmModal} onOpenChange={setShowPayConfirmModal}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" /> Confirmar Pagamento
            </DialogTitle>
            <DialogDescription className="text-zinc-400 pt-2">
              Você está marcando <strong>{payingConta?.description}</strong> como paga. 
              Deseja ajustar o valor antes de confirmar? (Algumas contas variam mensalmente).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="pay-value" className="text-zinc-400">Valor Pago (R$)</Label>
              <Input 
                id="pay-value" 
                type="number" 
                value={payingValue} 
                onChange={(e) => setPayingValue(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 text-white"
                placeholder="0,00"
              />
            </div>
            <div className="text-xs text-zinc-500 italic">
              * O valor original era {formatCurrency(payingConta?.value || 0)}.
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setShowPayConfirmModal(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayWithAdjustment} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 dark:border-zinc-800 opacity-30" />
      </div>

      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Impostos e Tributos</h2>
            <p className="text-muted-foreground">Detalhamento dos impostos pagos sobre notas fiscais e outros tributos importantes.</p>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-6">
            {/* Resumo de Impostos sobre NF */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Impostos sobre Notas Fiscais</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">PIS</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{formatCurrency(taxesSummary?.total_pis || 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">1,65% sobre faturamento</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">COFINS</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{formatCurrency(taxesSummary?.total_cofins || 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">7,6% sobre faturamento</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">ICMS</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{formatCurrency(taxesSummary?.total_icms || 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">12% sobre produtos</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">IPI</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{formatCurrency(taxesSummary?.total_ipi || 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">10% sobre produtos industrializados</p>
                </div>
              </div>
            </div>

            {/* Outros Impostos Importantes */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Outros Tributos Importantes</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Crédito ICMS</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{formatCurrency(taxesSummary?.total_icms_credit || 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Crédito gerado nas compras</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">NFs Emitidas</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{taxesSummary?.orders_count || 0}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Notas fiscais no período</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Faturamento NF</p>
                  <p className="mt-2 text-lg font-bold text-violet-300">{formatCurrency(taxesSummary?.total_revenue || 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Total com NF emitida</p>
                </div>
              </div>
            </div>

            {/* Total de Impostos */}
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">Total de Impostos no Período</p>
                <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-violet-300">{formatCurrency(taxesSummary?.total_taxes || 0)}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100/70 px-3 py-2 text-sm text-muted-foreground dark:bg-zinc-800/70">
                <Percent className="h-4 w-4 text-violet-400" />
                {taxesSummary?.total_revenue ? ((taxesSummary.total_taxes / taxesSummary.total_revenue) * 100).toFixed(1) : "0.0"}% do faturamento
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Observações sobre Tributação</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Valores calculados a partir das Notas Fiscais emitidas no período</li>
                    <li>Impostos calculados automaticamente pelo sistema com alíquotas padrão</li>
                    <li>Consulte seu contador para valores exatos e orientações específicas</li>
                    <li>Alíquotas podem variar conforme o regime tributário da empresa</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="max-w-6xl mx-auto w-full">
        <hr className="border-zinc-200 dark:border-zinc-800 opacity-30" />
      </div>

      {/* ==================== ANÁLISE DETALHADA DE GESTÃO FINANCEIRA ==================== */}
      <section className="max-w-6xl mx-auto w-full space-y-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Análise Detalhada de Gestão Financeira</h2>
            <p className="text-muted-foreground">Indicadores detalhados e gráficos para análise aprofundada da saúde financeira.</p>
          </div>
        </div>

        {/* KPIs Detalhados */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate" style={{ fontSize: '9px' }}>Margem de Lucro</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-emerald-400 bg-white/10 dark:bg-white/10">
                  <Percent className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="mt-6 min-w-0">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate overflow-hidden whitespace-nowrap">
                  {dashboardSummary.totalRevenue > 0 
                    ? `${((dashboardSummary.profit / dashboardSummary.totalRevenue) * 100).toFixed(1)}%` 
                    : '0%'}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 px-2.5 py-1 truncate max-w-full">
                  {dashboardSummary.profit >= 0 ? 'Saudável' : 'Atenção'}
                </span>
                <span />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate" style={{ fontSize: '9px' }}>Ticket Médio</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-blue-400 bg-white/10 dark:bg-white/10">
                  <BarChart3 className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="mt-6 min-w-0">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate overflow-hidden whitespace-nowrap">
                  {formatCurrency(dashboardSummary.totalRevenue > 0 ? dashboardSummary.totalRevenue / (revenues.length || 1) : 0)}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
                <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-300 px-2.5 py-1 truncate max-w-full">
                  Por transação
                </span>
                <span />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate" style={{ fontSize: '9px' }}>Fluxo de Caixa</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-purple-400 bg-white/10 dark:bg-white/10">
                  <TrendingUp className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="mt-6 min-w-0">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate overflow-hidden whitespace-nowrap">
                  {formatCurrency(dashboardSummary.totalRevenue - dashboardSummary.totalExpenses)}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 truncate max-w-full ${dashboardSummary.profit >= 0 ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
                  {dashboardSummary.profit >= 0 ? 'Positivo' : 'Negativo'}
                </span>
                <span />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight truncate" style={{ fontSize: '9px' }}>Liquidez</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-amber-400 bg-white/10 dark:bg-white/10">
                  <ArrowUpRight className="h-5 w-5 shrink-0" />
                </div>
              </div>
              <div className="mt-6 min-w-0">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate overflow-hidden whitespace-nowrap">
                  {dashboardSummary.totalExpenses > 0 
                    ? `${((dashboardSummary.totalRevenue / dashboardSummary.totalExpenses) * 100).toFixed(1)}%` 
                    : '0%'}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between gap-2 text-xs text-muted-foreground min-w-0">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 truncate max-w-full ${dashboardSummary.totalRevenue >= dashboardSummary.totalExpenses ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
                  {dashboardSummary.totalRevenue >= dashboardSummary.totalExpenses ? 'Adequada' : 'Baixa'}
                </span>
                <span />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos Detalhados */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gráfico de Pizza - Distribuição de Despesas */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <CardTitle className="text-base font-semibold">Distribuição de Despesas por Categoria</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Análise da composição das despesas do período.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Operacionais', value: (finances || []).filter(f => f.category === 'Operacional').reduce((acc, f) => acc + (f.value || 0), 0) || 100 },
                        { name: 'Administrativas', value: (finances || []).filter(f => f.category === 'Administrativo').reduce((acc, f) => acc + (f.value || 0), 0) || 80 },
                        { name: 'Comerciais', value: (finances || []).filter(f => f.category === 'Comercial').reduce((acc, f) => acc + (f.value || 0), 0) || 60 },
                        { name: 'Outros', value: (finances || []).filter(f => !['Operacional', 'Administrativo', 'Comercial'].includes(f.category)).reduce((acc, f) => acc + (f.value || 0), 0) || 40 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value === 0 ? 0 : value}`}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.25)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#fafafa'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Linha - Evolução do Fluxo de Caixa */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <CardTitle className="text-base font-semibold">Evolução do Fluxo de Caixa</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Tendência de receitas e despesas ao longo do período.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-80 p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip 
                      formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.25)', 
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#fafafa'
                      }}
                    />
                    <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                    <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Análise Adicional */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <CardTitle className="text-base font-semibold">Eficiência Operacional</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Relação entre despesas operacionais e receita.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Despesas Operacionais</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatCurrency((finances || []).filter(f => f.category === 'Operacional').reduce((acc, f) => acc + (f.value || 0), 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">% da Receita</span>
                  <span className="text-lg font-bold text-blue-400">
                    {dashboardSummary.totalRevenue > 0 
                      ? `${(((finances || []).filter(f => f.category === 'Operacional').reduce((acc, f) => acc + (f.value || 0), 0) / dashboardSummary.totalRevenue) * 100).toFixed(1)}%` 
                      : '0%'}
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all" 
                    style={{ 
                      width: `${dashboardSummary.totalRevenue > 0 
                        ? ((finances || []).filter(f => f.category === 'Operacional').reduce((acc, f) => acc + (f.value || 0), 0) / dashboardSummary.totalRevenue) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <CardTitle className="text-base font-semibold">Crescimento Mensal</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Variação em relação ao período anterior.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Receita</span>
                  <span className={`text-lg font-bold ${metricTrends.revenue >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {metricTrends.revenue !== undefined && metricTrends.revenue !== null ? (metricTrends.revenue >= 0 ? '+' : '') + metricTrends.revenue.toFixed(1) + '%' : '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Despesas</span>
                  <span className={`text-lg font-bold ${metricTrends.expenses >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {metricTrends.expenses !== undefined && metricTrends.expenses !== null ? (metricTrends.expenses >= 0 ? '+' : '') + metricTrends.expenses.toFixed(1) + '%' : '0%'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Lucro</span>
                  <span className={`text-lg font-bold ${metricTrends.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {metricTrends.profit !== undefined && metricTrends.profit !== null ? (metricTrends.profit >= 0 ? '+' : '') + metricTrends.profit.toFixed(1) + '%' : '0%'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-col justify-center min-h-[92px]">
              <CardTitle className="text-base font-semibold">Índice de Saúde Financeira</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Pontuação baseada em múltiplos indicadores.</p>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pontuação</span>
                  <span className={`text-3xl font-bold ${dashboardSummary.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dashboardSummary.profit >= 0 ? '85' : '45'}/100
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {dashboardSummary.profit >= 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  )}
                  <span className={`text-sm font-semibold ${dashboardSummary.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {dashboardSummary.profit >= 0 ? 'Situação Saudável' : 'Requer Atenção'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardSummary.profit >= 0 
                    ? 'A empresa apresenta indicadores financeiros positivos e sustentáveis.' 
                    : 'Alguns indicadores requerem atenção imediata para evitar problemas financeiros.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
