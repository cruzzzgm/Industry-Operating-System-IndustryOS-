import { ContaPagar, FinanceEntry, Order } from "@/data/mockData";

export const DEFAULT_INITIAL_BALANCE = 10000;

type MarginHealth = "excellent" | "attention" | "risk";

function periodKeyFromDateString(dateStr: string): string {
  if (!dateStr || dateStr.length < 7) return dateStr;
  return dateStr.slice(0, 7);
}

export interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  totalReceived: number;
  totalPaid: number;
  unpaidRevenue: number;
  unpaidExpenses: number;
  cpUnpaid: number;
  totalOpenPayables: number;
  totalTaxes: number;
  projectedBalance: number;
  marginPercent: number;
  marginHealth: MarginHealth;
}

export function calculatePeriodFinanceSummary({
  finances,
  contasPagar,
  orders,
  selectedPeriod,
  initialBalance = DEFAULT_INITIAL_BALANCE,
}: {
  finances: FinanceEntry[];
  contasPagar: ContaPagar[];
  orders: Order[];
  selectedPeriod: string;
  initialBalance?: number;
}): FinanceSummary {
  const isAll = selectedPeriod === "all";
  const matchesPeriod = (date: string) => isAll || periodKeyFromDateString(date) === selectedPeriod;

  // Receita Total: valor de todo o saldo que entrou no sistema (independente de estar pago ou não, para fins de faturamento)
  // Mas o usuário pediu "valor de todo o saldo que entrou", o que pode significar recebidos.
  // Vamos considerar o total de faturamento no período.
  const revenue = finances.filter(f => f.type === "receita" && matchesPeriod(f.dueDate));
  
  // Despesas Totais: calculo de todas as despesas no sistema no período
  const expenses = finances.filter(f => f.type === "despesa" && matchesPeriod(f.dueDate));

  const payableMatches = (item: ContaPagar) => isAll || (item.month || periodKeyFromDateString(item.dueDate)) === selectedPeriod;
  const payables = contasPagar.filter(payableMatches);

  const totalRevenue = revenue.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.value, 0) + payables.reduce((sum, item) => sum + item.value, 0);

  // A Receber: todos os pagamentos de cliente pendente no período
  const unpaidRevenue = revenue.filter(item => !item.paid).reduce((sum, item) => sum + item.value, 0);
  
  // A Pagar: valor de todos as contas em aberto no período
  const unpaidExpenses = expenses.filter(item => !item.paid).reduce((sum, item) => sum + item.value, 0);
  const cpUnpaid = payables.filter(c => !c.paid).reduce((sum, item) => sum + item.value, 0);
  const totalOpenPayables = unpaidExpenses + cpUnpaid;

  // Tributos: valor de impostos pago em cima de NF emitidas (taxAmount das ordens)
  const totalTaxes = orders
    .filter(o => o.hasRecibo && o.taxAmount && matchesPeriod(o.updatedAt))
    .reduce((sum, order) => sum + (order.taxAmount || 0), 0);

  const profit = totalRevenue - totalExpenses;
  const projectedBalance = initialBalance + totalRevenue - totalExpenses;
  const marginPercent = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  let marginHealth: MarginHealth = "risk";
  if (marginPercent > 15) marginHealth = "excellent";
  else if (marginPercent >= 5) marginHealth = "attention";

  return {
    totalRevenue,
    totalExpenses,
    profit,
    totalReceived: revenue.filter(item => item.paid).reduce((sum, item) => sum + item.value, 0),
    totalPaid: expenses.filter(item => item.paid).reduce((sum, item) => sum + item.value, 0),
    unpaidRevenue,
    unpaidExpenses,
    cpUnpaid,
    totalOpenPayables,
    totalTaxes,
    projectedBalance,
    marginPercent,
    marginHealth,
  };
}
