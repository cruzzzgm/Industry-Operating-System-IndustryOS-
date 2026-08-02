// Camada de dados — Catálogo de produtos, registros de clientes e histórico de transações
// Estruturado para fluxos de análise orientada por dados e inteligência de negócios

export type OrderStatus = "Pendente" | "Em Produção" | "Finalizado" | "Aguardando Coleta" | "Retirado" | "Cancelado";
export type DeliveryMethod = "Retirada" | "Transportadora";
export type FreightResponsibility = "Remetente" | "Destinatário";

export interface OrderItem {
  id: number;
  description: string;
  ncmCode: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weightPerUnit: number;
}

export interface Order {
  id: number;
  customerId?: number;
  customerName: string;
  product: string;
  items: OrderItem[];
  quantity: number;
  totalValue: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  hasRecibo: boolean;
  reciboNumber: string | null;
  shippingType: string;
  carrierName: string | null;
  freightResponsibility: FreightResponsibility | null;
  grossWeight: number | null;
  packageType: string | null;
  taxAmount: number | null;
  icmsCredit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  cnpj: string;
  stateRegistration?: string;
  address: string | { street: string; neighborhood: string; city: string; state: string; zipCode: string };
  city?: string;
  state?: string;
  country?: string;
  segment?: string;
  contact?: string;
  notes?: string;
  lastOrderDate?: string;
  totalOrders?: number;
  totalSpent?: number;
  icmsCredit?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  costPrice: number;
  salePrice: number;
  minSalePrice?: number;
  stockQuantity: number;
  minStock?: number;
  maxStock?: number;
  unit: string;
  weightKg?: number;
  dimensions?: any;
  supplierId?: string;
  supplierCode?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  totalSales?: number;
  totalRevenue?: number;
  lastSaleDate?: string;
  imageUrl?: string;
  galleryUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  material?: string;
  ncm_code?: string;
}

export interface FinanceEntry {
  id: string;
  description: string;
  type: "receita" | "despesa";
  value: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
  category: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  category: string;
  estimatedValue: number;
  dueDay: number; // dia do mês
  active: boolean;
}

export interface ContaPagar {
  id: string;
  fixedExpenseId: string | null;
  description: string;
  category: string;
  value: number;
  dueDate: string;
  paid: boolean;
  paidAt?: string;
  isFixed: boolean;
  month: string;
}

export type PaymentMethod = "boleto" | "pix" | "transferencia" | "dinheiro" | "cheque" | "cartao";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type RevenueSource = "vendas" | "servicos" | "consultoria" | "licenciamento" | "outros";

export interface RevenueEntry {
  id: string;
  sourceType: "client" | "external";
  customerId?: string;
  customerName?: string;
  orderId?: string;
  source?: string;  // Para receitas externas - texto livre
  description: string;
  value: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  dueDate: string;
  expectedDate?: string;
  paidAt?: string;
  daysOverdue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountHistory {
  accountName: string;
  months: { month: string; value: number; isPrediction: boolean }[];
}

export interface Carrier {
  id: string;
  name: string;
  cnpj: string;
}

// Fatores de peso por categoria de produto (kg por unidade)
export const WEIGHT_FACTORS: Record<string, number> = {
  "ILHÓS": 0.005,
  "REBITE": 0.003,
  "ENGRENAGEM": 2.4,
  "BUCHA": 0.35,
  "SUPORTE": 8.9,
  "VÁLVULA": 1.5,
  "EIXO": 12.0,
  "FLANGE": 1.55,
};

export const PACKAGE_SUGGESTIONS: Record<string, string> = {
  "ILHÓS": "Fardo",
  "REBITE": "Sacos",
  "ENGRENAGEM": "Caixa",
  "BUCHA": "Caixa",
  "SUPORTE": "Palete",
  "VÁLVULA": "Caixa",
  "EIXO": "Palete",
  "FLANGE": "Caixa",
};

export function suggestWeight(items: OrderItem[]): number {
  return items.reduce((total, item) => {
    const key = Object.keys(WEIGHT_FACTORS).find(k => item.description.toUpperCase().includes(k));
    const factor = key ? WEIGHT_FACTORS[key] : 0.5;
    return total + item.quantity * factor;
  }, 0);
}

export function suggestPackageType(items: OrderItem[]): string {
  const desc = items[0]?.description?.toUpperCase() || "";
  const key = Object.keys(PACKAGE_SUGGESTIONS).find(k => desc.includes(k));
  return key ? PACKAGE_SUGGESTIONS[key] : "Caixa";
}

// ---------- Transportadoras ----------
export const carriers: Carrier[] = [
  { id: "TR-001", name: "Leofran Transportes", cnpj: "12.345.678/0001-01" },
  { id: "TR-002", name: "DHL Express", cnpj: "23.456.789/0001-02" },
  { id: "TR-003", name: "FedEx Brasil", cnpj: "34.567.890/0001-03" },
  { id: "TR-004", name: "Loggi", cnpj: "45.678.901/0001-04" },
  { id: "TR-005", name: "Rodonaves", cnpj: "56.789.012/0001-05" },
  { id: "TR-006", name: "Jadlog", cnpj: "67.890.123/0001-06" },
];

// ---------- Despesas Fixas ----------
export const initialFixedExpenses: FixedExpense[] = [
  { id: "FIX-001", name: "Aluguel Galpão", category: "Infraestrutura", estimatedValue: 9500, dueDay: 10, active: true },
  { id: "FIX-002", name: "Salários", category: "RH", estimatedValue: 22000, dueDay: 5, active: true },
  { id: "FIX-003", name: "Pro-labore", category: "RH", estimatedValue: 8000, dueDay: 5, active: true },
  { id: "FIX-004", name: "Sabesp (Água)", category: "Utilidades", estimatedValue: 1800, dueDay: 15, active: true },
  { id: "FIX-005", name: "Enel (Energia)", category: "Utilidades", estimatedValue: 4200, dueDay: 20, active: true },
  { id: "FIX-006", name: "Internet/Telefone", category: "Utilidades", estimatedValue: 450, dueDay: 12, active: true },
];

// ---------- Histórico Mensal (últimos 6 meses) ----------
export interface MonthlyClosing {
  month: string;
  revenue: number;
  expenses: number;
  taxes: number;
  netProfit: number;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const now = new Date();

export const monthlyHistory: MonthlyClosing[] = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
  const label = `${monthNames[d.getMonth()]}/${d.getFullYear()}`;
  const rev = 40000 + Math.round(Math.random() * 50000);
  const exp = 20000 + Math.round(Math.random() * 25000);
  const tax = Math.round(rev * 0.0282);
  return { month: label, revenue: rev, expenses: exp, taxes: tax, netProfit: rev - exp - tax };
});

// ---------- Histórico de Contas para Previsão ----------
function generateAccountHistory(name: string, baseValue: number, variance: number): AccountHistory {
  const months: AccountHistory["months"] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]}/${d.getFullYear()}`;
    const val = Math.round(baseValue + (Math.random() - 0.5) * variance);
    months.push({ month: label, value: val, isPrediction: false });
  }
  // Calcula média dos últimos 3 meses reais para previsão
  const last3 = months.slice(-3).map(m => m.value);
  const avg = Math.round(last3.reduce((s, v) => s + v, 0) / 3);
  for (let i = 1; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const label = `${monthNames[d.getMonth()]}/${d.getFullYear()}`;
    months.push({ month: label, value: avg, isPrediction: true });
  }
  return { accountName: name, months };
}

export const accountHistories: AccountHistory[] = [
  generateAccountHistory("Sabesp (Água)", 1800, 600),
  generateAccountHistory("Enel (Energia)", 4200, 1200),
  generateAccountHistory("Aluguel Galpão", 9500, 0),
  generateAccountHistory("Internet/Telefone", 450, 100),
];

// ---------- Sementes Contas a Pagar (mês atual auto-gerado) ----------
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export const initialContasPagar: ContaPagar[] = [
  ...initialFixedExpenses
    .filter(fe => fe.active)
    .map((fe, i) => ({
      id: `CP-${String(i + 1).padStart(3, "0")}`,
      fixedExpenseId: fe.id,
      description: fe.name,
      category: fe.category,
      value: fe.estimatedValue,
      dueDate: `${currentMonth}-${String(fe.dueDay).padStart(2, "0")}`,
      paid: fe.dueDay < now.getDate(), // marca automaticamente como pago se a data de vencimento passou
      isFixed: true,
      month: currentMonth,
    })),
  {
    id: "CP-VAR-001",
    fixedExpenseId: null,
    description: "Manutenção preventiva equipamentos",
    category: "Manutenção",
    value: 3200,
    dueDate: `${currentMonth}-18`,
    paid: false,
    isFixed: false,
    month: currentMonth,
  },
  {
    id: "CP-VAR-002",
    fixedExpenseId: null,
    description: "Compra EPIs e consumíveis",
    category: "Operacional",
    value: 1450,
    dueDate: `${currentMonth}-25`,
    paid: false,
    isFixed: false,
    month: currentMonth,
  },
];

// ---------- Dados Iniciais ----------

const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

let nfCounter = 2260;
const nextNF = () => String(++nfCounter);

export const initialOrders: Order[] = [
  {
    id: 1, customerName: "Ind. Metalúrgica Silva", product: "Engrenagem Cônica 45mm",
    items: [
      { id: 1, description: "ENGRENAGEM CÔNICA 45MM AÇO SAE 4140", ncmCode: "8483.40.90", unit: "PÇ", quantity: 200, unitPrice: 62.00, totalPrice: 12400, weightPerUnit: 2.4 },
    ],
    quantity: 200, totalValue: 12400, status: "Finalizado", deliveryMethod: "Transportadora",
    hasRecibo: true, reciboNumber: "2261", shippingType: "Transportadora", carrierName: "Leofran Transportes",
    freightResponsibility: "Remetente", grossWeight: 480, packageType: "Caixa", taxAmount: 349.68, icmsCredit: 349.68,
    createdAt: daysAgo(30), updatedAt: daysAgo(28),
  },
  {
    id: 2, customerName: "AutoPeças Oliveira", product: "Bucha de Bronze",
    items: [
      { id: 2, description: "BUCHA DE BRONZE TM-23", ncmCode: "7415.21.00", unit: "PÇ", quantity: 500, unitPrice: 17.50, totalPrice: 8750, weightPerUnit: 0.35 },
    ],
    quantity: 500, totalValue: 8750, status: "Em Produção", deliveryMethod: "Retirada",
    hasRecibo: false, reciboNumber: null, shippingType: "Retirada", carrierName: null,
    freightResponsibility: null, grossWeight: null, packageType: null, taxAmount: null, icmsCredit: null,
    createdAt: daysAgo(15), updatedAt: daysAgo(10),
  },
  {
    id: 3, customerName: "Construtora Horizonte", product: "Suporte Estrutural Aço",
    items: [
      { id: 3, description: "SUPORTE ESTRUTURAL AÇO GALVANIZADO", ncmCode: "7308.90.90", unit: "PÇ", quantity: 50, unitPrice: 446.00, totalPrice: 22300, weightPerUnit: 8.9 },
    ],
    quantity: 50, totalValue: 22300, status: "Pendente", deliveryMethod: "Transportadora",
    hasRecibo: false, reciboNumber: null, shippingType: "Transportadora", carrierName: null,
    freightResponsibility: null, grossWeight: null, packageType: null, taxAmount: null, icmsCredit: null,
    createdAt: daysAgo(5), updatedAt: daysAgo(5),
  },
  {
    id: 4, customerName: "Farmaquímica Ltda", product: "Válvula Inox 316L",
    items: [
      { id: 4, description: "VÁLVULA INOX 316L DN50", ncmCode: "8481.80.99", unit: "PÇ", quantity: 120, unitPrice: 157.50, totalPrice: 18900, weightPerUnit: 1.5 },
    ],
    quantity: 120, totalValue: 18900, status: "Em Produção", deliveryMethod: "Retirada",
    hasRecibo: false, reciboNumber: null, shippingType: "Retirada", carrierName: null,
    freightResponsibility: null, grossWeight: null, packageType: null, taxAmount: null, icmsCredit: null,
    createdAt: daysAgo(8), updatedAt: daysAgo(6),
  },
  {
    id: 5, customerName: "Agro Máquinas BR", product: "Eixo Cardã Temperado",
    items: [
      { id: 5, description: "EIXO CARDÃ TEMPERADO 1045", ncmCode: "8483.10.90", unit: "PÇ", quantity: 30, unitPrice: 1150.00, totalPrice: 34500, weightPerUnit: 12.0 },
    ],
    quantity: 30, totalValue: 34500, status: "Pendente", deliveryMethod: "Transportadora",
    hasRecibo: false, reciboNumber: null, shippingType: "Transportadora", carrierName: null,
    freightResponsibility: null, grossWeight: null, packageType: null, taxAmount: null, icmsCredit: null,
    createdAt: daysAgo(2), updatedAt: daysAgo(2),
  },
  {
    id: 6, customerName: "TechParts Global", product: "Flange DIN 150",
    items: [
      { id: 6, description: "FLANGE DIN 150 AÇO CARBONO", ncmCode: "7307.91.00", unit: "PÇ", quantity: 80, unitPrice: 77.50, totalPrice: 6200, weightPerUnit: 1.55 },
    ],
    quantity: 80, totalValue: 6200, status: "Finalizado", deliveryMethod: "Retirada",
    hasRecibo: true, reciboNumber: "2260", shippingType: "Retirada", carrierName: null,
    freightResponsibility: null, grossWeight: null, packageType: null, taxAmount: 174.84, icmsCredit: 174.84,
    createdAt: daysAgo(45), updatedAt: daysAgo(40),
  },
  {
    id: 7, customerName: "Ind. Metalúrgica Silva", product: "Ilhós Nº 51 Ferro Niquelado",
    items: [
      { id: 7, description: "ILHÓS N 51 FERRO NIQUELADO", ncmCode: "8308.10.00", unit: "MIL", quantity: 150, unitPrice: 17.64, totalPrice: 2646, weightPerUnit: 0.005 },
      { id: 8, description: "REBITE FERRO 3/16 X 5/8", ncmCode: "7318.29.00", unit: "MIL", quantity: 100, unitPrice: 71.54, totalPrice: 7154, weightPerUnit: 0.003 },
    ],
    quantity: 250, totalValue: 9800, status: "Finalizado", deliveryMethod: "Transportadora",
    hasRecibo: false, reciboNumber: null, shippingType: "Transportadora", carrierName: "DHL Express",
    freightResponsibility: "Destinatário", grossWeight: 320, packageType: "Fardo", taxAmount: null, icmsCredit: null,
    createdAt: daysAgo(20), updatedAt: daysAgo(18),
  },
];

export const initialCustomers: Customer[] = [
  { 
    id: "CLI-005", 
    name: "Agro Máquinas BR", 
    email: "pedidos@agromaquinas.com.br", 
    phone: "(62) 92345-6789", 
    company: "Agro Máquinas do Brasil", 
    cnpj: "56.789.012/0001-34",
    stateRegistration: "567.890.123-4",
    address: "Rodovia BR-116, Km 5 - Zona Rural",
    city: "Londrina/PR",
    segment: "Alimentos",
    contact: "Ana Costa - Financeiro",
    notes: "Entrega segunda e sexta",
    lastOrderDate: daysAgo(2), 
    totalOrders: 2, 
    totalSpent: 34500 
  },
  { 
    id: "CLI-002", 
    name: "AutoPeças Oliveira", 
    email: "contato@autopecas.com.br", 
    phone: "(21) 91234-5678", 
    company: "Oliveira Auto Peças EIRELI", 
    cnpj: "23.456.789/0001-01",
    stateRegistration: "234.567.890-1",
    address: "Avenida Brasil, 567",
    city: "Rio de Janeiro/RJ",
    segment: "Automotivo",
    contact: "João Oliveira - Proprietário",
    notes: "Peças originais e genéricas",
    lastOrderDate: daysAgo(10), 
    totalOrders: 8, 
    totalSpent: 67500 
  },
  { 
    id: "CLI-003", 
    name: "Construtora Horizonte", 
    email: "eng@horizonte.com.br", 
    phone: "(31) 99876-5432", 
    company: "Horizonte Engenharia Ltda", 
    cnpj: "34.567.890/0001-12",
    stateRegistration: "345.678.901-2",
    address: "Rua das Construções, 890",
    city: "Belo Horizonte/MG",
    segment: "Construção Civil",
    contact: "Maria Silva - Engenheira",
    notes: "Obras residenciais e comerciais",
    lastOrderDate: daysAgo(5), 
    totalOrders: 3, 
    totalSpent: 89000 
  },
  { 
    id: "CLI-004", 
    name: "Farmaquímica Ltda", 
    email: "compras@farmaquimica.com", 
    phone: "(41) 93456-7890", 
    company: "Farmaquímica Ltda", 
    cnpj: "45.678.901/0001-23",
    stateRegistration: "456.789.012-3",
    address: "Rua das Flores, 500 - Jardim Botânico",
    city: "Curitiba/PR",
    segment: "Serviços",
    contact: "Carlos Mendes - Diretor",
    notes: "Contrato anual, revisão trimestral",
    lastOrderDate: daysAgo(6), 
    totalOrders: 5, 
    totalSpent: 52300 
  },
  { 
    id: "CLI-009", 
    name: "Hidráulica Center", 
    email: "vendas@hidraulicacenter.com.br", 
    phone: "(51) 97890-1234", 
    company: "Hidráulica Center EIRELI", 
    cnpj: "90.123.456/0001-78",
    stateRegistration: "901.234.567-8",
    address: "Avenida Hidráulica, 345",
    city: "Porto Alegre/RS",
    segment: "Comércio",
    contact: "José Santos - Comprador",
    notes: "Pagamento em 60 dias, NF-e obrigatório",
    lastOrderDate: daysAgo(95), 
    totalOrders: 7, 
    totalSpent: 56800 
  },
  { 
    id: "CLI-008", 
    name: "Plásticos Renova", 
    email: "contato@plasticosrenova.com.br", 
    phone: "(47) 96789-0123", 
    company: "Renova Ind. de Plásticos", 
    cnpj: "89.012.345/0001-67",
    stateRegistration: "890.123.456-7",
    address: "Av. Paulista, 2000 - Consolação",
    city: "Porto Alegre/RS",
    segment: "Comércio",
    contact: "José Santos - Comprador",
    notes: "Pagamento em 60 dias, NF-e obrigatório",
    lastOrderDate: daysAgo(100), 
    totalOrders: 4, 
    totalSpent: 28700 
  },
  { 
    id: "CLI-007", 
    name: "Siderúrgica Nacional", 
    email: "logistica@sidnacional.com.br", 
    phone: "(19) 95678-9012", 
    company: "Siderúrgica Nacional S/A", 
    cnpj: "78.901.234/0001-56",
    stateRegistration: "789.012.345-6",
    address: "Rua do Aço, 789",
    city: "Campinas/SP",
    segment: "Metalurgia",
    contact: "Roberto Alves - Engenheiro",
    notes: "Obras públicas e privadas",
    lastOrderDate: daysAgo(120), 
    totalOrders: 15, 
    totalSpent: 230000 
  },
  { 
    id: "CLI-006", 
    name: "TechParts Global", 
    email: "sales@techparts.io", 
    phone: "(11) 94567-8901", 
    company: "TechParts Global Inc", 
    cnpj: "67.890.123/0001-45",
    stateRegistration: "678.901.234-5",
    address: "Avenida Tecnologia, 456",
    city: "São Paulo/SP",
    segment: "Tecnologia",
    contact: "Maria Silva - Gerente Comercial",
    notes: "Peças originais e genéricas",
    lastOrderDate: daysAgo(40), 
    totalOrders: 6, 
    totalSpent: 41200 
  },
  // Novos clientes - Ativos (10)
  { 
    id: "CLI-010", 
    name: "Carlos Alberto Mendes", 
    email: "carlos.mendes@metalurgica.com.br", 
    phone: "(16) 93456-7890", 
    company: "Mendes & Cia Ltda", 
    cnpj: "11.234.567/0001-89",
    stateRegistration: "112.345.678-9",
    address: "Rua das Indústrias, 1234 - Centro",
    city: "São Paulo/SP",
    segment: "Metalurgia",
    contact: "Maria Silva - Gerente Comercial",
    notes: "Cliente preferencial, pagamento em 30 dias",
    lastOrderDate: daysAgo(15), 
    totalOrders: 4, 
    totalSpent: 28500 
  },
  { 
    id: "CLI-011", 
    name: "Roberto Ferreira Santos", 
    email: "roberto.santos@construtora.com.br", 
    phone: "(85) 98765-4321", 
    company: "Construtora Santos Ltda", 
    cnpj: "22.345.678/0001-90",
    stateRegistration: "223.456.789-0",
    address: "Avenida Principal, 789",
    city: "Fortaleza/CE",
    segment: "Construção Civil",
    contact: "Roberto Alves - Engenheiro",
    notes: "Obras públicas e privadas",
    lastOrderDate: daysAgo(8), 
    totalOrders: 6, 
    totalSpent: 45200 
  },
  { 
    id: "CLI-012", 
    name: "Maria das Dores Oliveira", 
    email: "maria.oliveira@alimentos.com.br", 
    phone: "(71) 92345-6789", 
    company: "Alimentos Oliveira S/A", 
    cnpj: "33.456.789/0001-01",
    stateRegistration: "334.567.890-1",
    address: "Rua da Alimentação, 123",
    city: "Salvador/BA",
    segment: "Alimentos",
    contact: "Ana Costa - Financeiro",
    notes: "Entrega segunda e sexta",
    lastOrderDate: daysAgo(12), 
    totalOrders: 8, 
    totalSpent: 67800 
  },
  { 
    id: "CLI-013", 
    name: "José Antonio Silva", 
    email: "jose.silva@transportes.com.br", 
    phone: "(81) 93456-7890", 
    company: "Transportes Silva Ltda", 
    cnpj: "44.567.890/0001-12",
    stateRegistration: "445.678.901-2",
    address: "Rodovia PE-60, km 15",
    city: "Recife/PE",
    segment: "Transporte",
    contact: "José Santos - Comprador",
    notes: "Pagamento em 60 dias, NF-e obrigatório",
    lastOrderDate: daysAgo(20), 
    totalOrders: 3, 
    totalSpent: 23400 
  },
  { 
    id: "CLI-014", 
    name: "Ana Paula Costa", 
    email: "ana.costa@textil.com.br", 
    phone: "(27) 98765-4321", 
    company: "Textil Costa EIRELI", 
    cnpj: "55.678.901/0001-23",
    stateRegistration: "556.789.012-3",
    address: "Rua das Tecelagens, 456",
    city: "Vitória/ES",
    segment: "Têxtil",
    contact: "Maria Silva - Gerente Comercial",
    notes: "Peças originais e genéricas",
    lastOrderDate: daysAgo(25), 
    totalOrders: 5, 
    totalSpent: 38900 
  },
  { 
    id: "CLI-015", 
    name: "Pedro Henrique Lima", 
    email: "pedro.lima@eletrica.com.br", 
    phone: "(92) 92345-6789", 
    company: "Elétrica Lima Ltda", 
    cnpj: "66.789.012/0001-34",
    stateRegistration: "667.890.123-4",
    address: "Avenida da Eletricidade, 789",
    city: "Manaus/AM",
    segment: "Energia",
    contact: "Roberto Alves - Engenheiro",
    notes: "Obras públicas e privadas",
    lastOrderDate: daysAgo(7), 
    totalOrders: 9, 
    totalSpent: 72100 
  },
  { 
    id: "CLI-016", 
    name: "Fernanda Gomes Pereira", 
    email: "fernanda.pereira@moveleira.com.br", 
    phone: "(51) 93456-7890", 
    company: "Moveleira Pereira S/A", 
    cnpj: "77.890.123/0001-45",
    stateRegistration: "778.901.234-5",
    address: "Rua dos Móveis, 123",
    city: "Caxias do Sul/RS",
    segment: "Moveleira",
    contact: "José Santos - Comprador",
    notes: "Pagamento em 60 dias, NF-e obrigatório",
    lastOrderDate: daysAgo(18), 
    totalOrders: 7, 
    totalSpent: 56300 
  },
  { 
    id: "CLI-017", 
    name: "Luiz Carlos Rocha", 
    email: "luiz.rocha@quimica.com.br", 
    phone: "(19) 98765-4321", 
    company: "Química Rocha Ltda", 
    cnpj: "88.901.234/0001-56",
    stateRegistration: "889.012.345-6",
    address: "Rua da Química, 456",
    city: "Campinas/SP",
    segment: "Química",
    contact: "Maria Silva - Gerente Comercial",
    notes: "Peças originais e genéricas",
    lastOrderDate: daysAgo(30), 
    totalOrders: 4, 
    totalSpent: 31200 
  },
  { 
    id: "CLI-018", 
    name: "Tatiane Souza Dias", 
    email: "tatiane.dias@plastico.com.br", 
    phone: "(41) 92345-6789", 
    company: "Plástico Dias EIRELI", 
    cnpj: "99.012.345/0001-67",
    stateRegistration: "990.123.456-7",
    address: "Rua dos Plásticos, 789",
    city: "Curitiba/PR",
    segment: "Comércio",
    contact: "José Santos - Comprador",
    notes: "Pagamento em 60 dias, NF-e obrigatório",
    lastOrderDate: daysAgo(14), 
    totalOrders: 6, 
    totalSpent: 48700 
  },
  { 
    id: "CLI-019", 
    name: "Ricardo Almeida Barbosa", 
    email: "ricardo.barbosa@metalurgica.com.br", 
    phone: "(31) 93456-7890", 
    company: "Metalúrgica Barbosa Ltda", 
    cnpj: "10.123.456/0001-78",
    stateRegistration: "101.234.567-8",
    address: "Av. Brasil, 1500 - Centro",
    city: "Belo Horizonte/MG",
    segment: "Construção Civil",
    contact: "Roberto Alves - Engenheiro",
    notes: "Obras públicas e privadas",
    lastOrderDate: daysAgo(22), 
    totalOrders: 5, 
    totalSpent: 39800 
  },
  // Novos clientes - Inativos (10)
  { 
    id: "CLI-020", 
    name: "Francisco de Assis Costa", 
    email: "francisco.costa@madeireira.com.br", 
    phone: "(69) 92345-6789", 
    company: "Madeireira Costa S/A", 
    cnpj: "12.345.678/0001-90",
    stateRegistration: "123.456.789-0",
    address: {
      street: "Rodovia BR-364, km 200",
      neighborhood: "Zona Rural",
      city: "Porto Velho",
      state: "RO",
      zipCode: "76800-000"
    },
    lastOrderDate: daysAgo(95), 
    totalOrders: 2, 
    totalSpent: 15600 
  },
  { 
    id: "CLI-021", 
    name: "Helena Maria Santos", 
    email: "helena.santos@ceramica.com.br", 
    phone: "(83) 98765-4321", 
    company: "Cerâmica Santos Ltda", 
    cnpj: "23.456.789/0001-01",
    stateRegistration: "234.567.890-1",
    address: {
      street: "Rua das Cerâmicas, 456",
      neighborhood: "Industrial",
      city: "João Pessoa",
      state: "PB",
      zipCode: "58000-000"
    },
    lastOrderDate: daysAgo(110), 
    totalOrders: 3, 
    totalSpent: 23400 
  },
  { 
    id: "CLI-022", 
    name: "Antonio Carlos Pereira", 
    email: "antonio.pereira@calçados.com.br", 
    phone: "(54) 93456-7890", 
    company: "Calçados Pereira EIRELI", 
    cnpj: "34.567.890/0001-12",
    stateRegistration: "345.678.901-2",
    address: {
      street: "Rua dos Calçados, 789",
      neighborhood: "Industrial",
      city: "Caxias do Sul",
      state: "RS",
      zipCode: "95000-000"
    },
    lastOrderDate: daysAgo(125), 
    totalOrders: 1, 
    totalSpent: 8900 
  },
  { 
    id: "CLI-023", 
    name: "Cláudia Regina Oliveira", 
    email: "claudia.oliveira@vestuario.com.br", 
    phone: "(11) 92345-6789", 
    company: "Vestuário Oliveira Ltda", 
    cnpj: "45.678.901/0001-23",
    stateRegistration: "456.789.012-3",
    address: "Rua das Indústrias, 1234 - Centro",
    city: "São Paulo/SP",
    state: "SP",
    country: "Brasil",
    segment: "Metalurgia",
    contact: "Maria Silva - Gerente Comercial",
    notes: "Cliente preferencial, pagamento em 30 dias",
    lastOrderDate: daysAgo(150), 
    totalOrders: 4, 
    totalSpent: 32100 
  },
  { 
    id: "CLI-013", 
    name: "Marcos Roberto Silva", 
    email: "marcos.silva@eletronica.com.br", 
    phone: "(27) 98765-4321", 
    company: "Eletrônica Silva S/A", 
    cnpj: "56.789.012/0001-34",
    stateRegistration: "567.890.123-4",
    address: "Avenida da Eletrônica, 456",
    city: "Vitória/ES",
    state: "ES",
    country: "Brasil",
    lastOrderDate: daysAgo(98), 
    totalOrders: 2, 
    totalSpent: 18700 
  },
  { 
    id: "CLI-014", 
    name: "Patricia Aparecida Costa", 
    email: "patricia.costa@imobiliaria.com.br", 
    phone: "(61) 93456-7890", 
    company: "Imobiliária Costa Ltda", 
    cnpj: "67.890.123/0001-45",
    stateRegistration: "678.901.234-5",
    address: "Setor Comercial Sul, Qd 502",
    city: "Brasília/DF",
    state: "DF",
    country: "Brasil",
    lastOrderDate: daysAgo(180), 
    totalOrders: 1, 
    totalSpent: 12300 
  },
  { 
    id: "CLI-015", 
    name: "Jorge Luis Mendes", 
    email: "jorge.mendes@agroindustria.com.br", 
    phone: "(66) 98765-4321", 
    company: "Agroindústria Mendes S/A", 
    cnpj: "78.901.234/0001-56",
    stateRegistration: "789.012.345-6",
    address: "Rodovia BR-116, Km 5 - Zona Rural",
    city: "Londrina/PR",
    state: "PR",
    country: "Brasil",
    segment: "Alimentos",
    contact: "Ana Costa - Financeira",
    notes: "Entrega segunda e sexta",
    lastOrderDate: daysAgo(92), 
    totalOrders: 3, 
    totalSpent: 26700 
  },
  { 
    id: "CLI-016", 
    name: "Sandra Regina Ferreira", 
    email: "sandra.ferreira@cosmeticos.com.br", 
    phone: "(21) 92345-6789", 
    company: "Cosméticos Ferreira Ltda", 
    cnpj: "89.012.345/0001-67",
    stateRegistration: "890.123.456-7",
    address: "Rua dos Cosméticos, 789",
    city: "Rio de Janeiro/RJ",
    state: "RJ",
    country: "Brasil",
    lastOrderDate: daysAgo(135), 
    totalOrders: 2, 
    totalSpent: 19800 
  },
  { 
    id: "CLI-017", 
    name: "Paulo Roberto Gomes", 
    email: "paulo.gomes@transportadora.com.br", 
    phone: "(31) 98765-4321", 
    company: "Transportadora Gomes Ltda", 
    cnpj: "90.123.456/0001-78",
    stateRegistration: "901.234.567-8",
    address: "Avenida Brasil, 1500 - Centro",
    city: "Belo Horizonte/MG",
    state: "MG",
    country: "Brasil",
    segment: "Construção Civil",
    contact: "Maria Silva - Engenheira",
    notes: "Obras públicas e privadas",
    lastOrderDate: daysAgo(105), 
    totalOrders: 1, 
    totalSpent: 9800 
  },
  { 
    id: "CLI-018", 
    name: "Lúcia Helena Barbosa", 
    email: "lucia.barbosa@farmacia.com.br", 
    phone: "(85) 93456-7890", 
    company: "Farmácia Barbosa Ltda", 
    cnpj: "10.234.567/0001-89",
    stateRegistration: "102.345.678-9",
    address: "Av. Paulista, 2000 - Consolação",
    city: "Porto Alegre/RS",
    state: "RS",
    country: "Brasil",
    segment: "Comércio",
    contact: "José Santos - Comprador",
    notes: "Pagamento em 60 dias, NF-e obrigatório",
    lastOrderDate: daysAgo(200), 
    totalOrders: 1, 
    totalSpent: 6700 
  },
];

export const initialFinances: FinanceEntry[] = [
  { id: "FIN-001", description: "Pedido PED-001 – Engrenagem Cônica", type: "receita", value: 12400, dueDate: daysAgo(25), paid: true, category: "Vendas" },
  { id: "FIN-002", description: "Matéria-prima – Aço SAE 4140", type: "despesa", value: 8500, dueDate: daysAgo(20), paid: true, category: "Insumos" },
  { id: "FIN-003", description: "Energia elétrica – Fábrica", type: "despesa", value: 4200, dueDate: daysAgo(10), paid: true, category: "Utilidades" },
  { id: "FIN-004", description: "Pedido PED-006 – Flange DIN", type: "receita", value: 6200, dueDate: daysAgo(35), paid: true, category: "Vendas" },
  { id: "FIN-005", description: "Folha de pagamento", type: "despesa", value: 22000, dueDate: daysAgo(5), paid: false, category: "RH" },
  { id: "FIN-006", description: "Pedido PED-004 – Válvula Inox", type: "receita", value: 18900, dueDate: daysAgo(0), paid: false, category: "Vendas" },
  { id: "FIN-007", description: "Manutenção CNC", type: "despesa", value: 3800, dueDate: daysAgo(-2), paid: false, category: "Manutenção" },
  { id: "FIN-008", description: "Pedido PED-005 – Eixo Cardã", type: "receita", value: 34500, dueDate: daysAgo(-10), paid: false, category: "Vendas" },
  { id: "FIN-009", description: "Frete transportadora", type: "despesa", value: 2100, dueDate: daysAgo(-3), paid: false, category: "Logística" },
  { id: "FIN-010", description: "Aluguel galpão", type: "despesa", value: 9500, dueDate: daysAgo(-15), paid: false, category: "Infraestrutura" },
];

// Taxa de crédito ICMS (simulada em 2.82%)
export const ICMS_CREDIT_RATE = 0.0282;
