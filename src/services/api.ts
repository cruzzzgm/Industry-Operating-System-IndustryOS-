// ============================================================
// Camada de Serviço de API – Consumindo Backend Python (FastAPI)
// IndustryOS - Sistema de Gestão Industrial
// ============================================================

import { Order, OrderStatus, FinanceEntry, Customer, FixedExpense, ContaPagar, Product } from "@/data/mockData";

// URL do backend Python (FastAPI)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Helper para fazer requisições HTTP
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`fetchApi - ${options?.method || 'GET'} ${url}`);
  console.log("fetchApi - Options:", options);
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  
  console.log(`fetchApi - Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro desconhecido" }));
    console.error("fetchApi - Error response:", error);
    console.error("fetchApi - Error details:", JSON.stringify(error, null, 2));
    throw new Error(error.message || error.error?.message || `HTTP ${response.status}`);
  }

  // Lidar com respostas 204 No Content (sem corpo)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    console.log("fetchApi - No content response");
    return undefined as T;
  }

  const result = await response.json();
  console.log("fetchApi - Success response:", result);
  return result;
}

// ---------- Pedidos (backend real) ----------

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface OrderStatisticsResponse {
  total: number;
  pending: number;
  in_production: number;
  finalized: number;
  waiting_pickup: number;
  picked_up: number;
  canceled: number;
  with_recibo: number;
  without_recibo: number;
  today_total: number;
  today_orders: number;
  avg_order_value: number;
}

// Helper para converter snake_case (Backend) para camelCase (Frontend)
function convertOrderToCamelCase(apiOrder: any): Order {
  return {
    id: apiOrder.id,
    customerId: apiOrder.customer_id,
    customerName: apiOrder.customer_name,
    product: apiOrder.product,
    quantity: apiOrder.quantity,
    totalValue: apiOrder.total_value,
    status: apiOrder.status,
    deliveryMethod: apiOrder.delivery_method,
    hasRecibo: apiOrder.has_recibo,
    reciboNumber: apiOrder.recibo_number,
    shippingType: apiOrder.shipping_type || "Padrão",
    carrierName: apiOrder.carrier_name,
    freightResponsibility: apiOrder.freight_responsibility,
    grossWeight: apiOrder.gross_weight,
    packageType: apiOrder.package_type,
    taxAmount: apiOrder.tax_amount,
    icmsCredit: apiOrder.icms_credit,
    createdAt: apiOrder.created_at,
    updatedAt: apiOrder.updated_at,
    items: (apiOrder.items || []).map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      description: item.description,
      ncmCode: item.ncm_code,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      weightPerUnit: item.weight_per_unit,
    })),
  };
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await fetchApi<OrderListResponse>("/orders/");
  return response.items.map(convertOrderToCamelCase);
}

export async function addOrder(order: any): Promise<Order> {
  const response = await fetchApi<any>("/orders/", {
    method: "POST",
    body: JSON.stringify({
      customer_id: Number(order.customerId),
      customer_name: order.customerName,
      product: order.product,
      quantity: Number(order.quantity),
      total_value: Number(order.totalValue),
      status: order.status,
      delivery_method: order.deliveryMethod,
      has_recibo: Boolean(order.hasRecibo),
      recibo_number: order.reciboNumber,
      carrier_name: order.carrierName,
      gross_weight: order.grossWeight ? Number(order.grossWeight) : null,
      tax_amount: order.taxAmount ? Number(order.taxAmount) : null,
      icms_credit: order.icmsCredit ? Number(order.icmsCredit) : null,
      items: order.items.map((item: any) => ({
        description: item.description,
        ncm_code: item.ncmCode,
        unit: item.unit,
        quantity: Number(item.quantity),
        unit_price: Number(item.unitPrice),
        total_price: Number(item.totalPrice),
        weight_per_unit: item.weightPerUnit ? Number(item.weightPerUnit) : 1,
      })),
    }),
  });
  return convertOrderToCamelCase(response);
}

export async function fetchOrderStatistics(period?: string): Promise<OrderStatisticsResponse> {
  const query = period ? `?period=${period}` : "";
  return fetchApi<OrderStatisticsResponse>(`/orders/statistics/summary${query}`);
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
  payload?: any
): Promise<Order> {
  return fetchApi<Order>(`/orders/${orderId}/status`, {
    method: "POST",
    body: JSON.stringify({ status: newStatus, ...payload }),
  });
}

export async function finalizeOrder(
  orderId: number,
  data: {
    hasRecibo: boolean;
    reciboNumber?: string | null;
    carrierName?: string | null;
    freightResponsibility?: string | null;
    grossWeight?: number | null;
    packageType?: string | null;
    taxAmount?: number | null;
    icmsCredit?: number | null;
  }
): Promise<{ success: boolean; reciboNumber: string | null }> {
  return fetchApi<{ success: boolean; reciboNumber: string | null }>(`/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...data,
      status: "Finalizado",
    }),
  });
}

// ============================================================
// FINANCEIRO - Integração com Backend Python (FastAPI)
// ============================================================

// Tipos de resposta do backend (camelCase para compatibilidade com frontend)
export interface FinanceSummaryResponse {
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
  marginHealth: "excellent" | "attention" | "risk";
  period?: string;
  initialBalance?: number;
  // Detalhamento de impostos brasileiros
  totalIcms?: number;
  totalIpi?: number;
  totalPis?: number;
  totalCofins?: number;
  totalIcmsCredit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ---------- Lançamentos Financeiros ----------

// Helper para converter snake_case (Backend) para camelCase (Frontend)
function convertEntryToCamelCase(apiEntry: any): FinanceEntry {
  return {
    id: apiEntry.id,
    description: apiEntry.description,
    type: apiEntry.entry_type,
    value: apiEntry.value,
    dueDate: apiEntry.due_date,
    paid: apiEntry.paid,
    category: apiEntry.category,
    paidAt: apiEntry.paid_at,
  };
}

export async function fetchFinances(params?: {
  search?: string;
  entry_type?: "receita" | "despesa";
  paid?: boolean;
  category?: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<FinanceEntry>> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await fetchApi<PaginatedResponse<any>>(`/financeiro/entries${query}`);
  return {
    ...response,
    items: response.items.map(convertEntryToCamelCase),
  };
}

export async function fetchFinanceEntry(id: string): Promise<FinanceEntry> {
  const response = await fetchApi<any>(`/financeiro/entries/${id}`);
  return convertEntryToCamelCase(response);
}

// Helper para converter camelCase (Frontend) para snake_case (Backend)
function convertEntryToSnakeCase(entry: Omit<FinanceEntry, "id"> | Partial<FinanceEntry>): any {
  return {
    description: entry.description,
    entry_type: entry.type,
    value: entry.value,
    due_date: entry.dueDate,
    paid: entry.paid,
    category: entry.category,
    paid_at: entry.paidAt,
  };
}

export async function addFinanceEntry(entry: Omit<FinanceEntry, "id">): Promise<FinanceEntry> {
  return fetchApi<FinanceEntry>("/financeiro/entries", {
    method: "POST",
    body: JSON.stringify(convertEntryToSnakeCase(entry)),
  });
}

// ---------- Notificações (backend real) ----------

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  icon?: string;
  color?: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_text?: string;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}

export async function fetchNotifications(params?: {
  unread_only?: boolean;
  limit?: number;
  offset?: number;
}): Promise<NotificationListResponse> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return fetchApi<NotificationListResponse>(`/notifications${query}`);
}

export async function fetchUnreadCount(): Promise<{ unread_count: number }> {
  return fetchApi<{ unread_count: number }>("/notifications/unread-count");
}

export async function markNotificationAsRead(notificationId: number): Promise<any> {
  return fetchApi<any>(`/notifications/${notificationId}/mark-read`, {
    method: "POST",
  });
}

export async function markAllNotificationsAsRead(): Promise<any> {
  return fetchApi<any>("/notifications/mark-all-read", {
    method: "POST",
  });
}

export async function deleteNotification(notificationId: number): Promise<any> {
  return fetchApi<any>(`/notifications/${notificationId}`, {
    method: "DELETE",
  });
}

export async function updateFinanceEntry(id: string, updates: Partial<FinanceEntry>): Promise<FinanceEntry> {
  return fetchApi<FinanceEntry>(`/financeiro/entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(convertEntryToSnakeCase(updates)),
  });
}

export async function deleteFinanceEntry(id: string): Promise<void> {
  return fetchApi<void>(`/financeiro/entries/${id}`, {
    method: "DELETE",
  });
}

// ---------- Receitas (Entry Type = Receita) ----------

export async function fetchRevenues(params?: {
  search?: string;
  paid?: boolean;
  category?: string;
  period?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<FinanceEntry>> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await fetchApi<PaginatedResponse<any>>(`/financeiro/revenues${query}`);
  return {
    ...response,
    items: response.items.map(convertEntryToCamelCase),
  };
}

// ---------- Resumo Financeiro ----------

// Helper para converter snake_case (API) para camelCase (Frontend)
function convertSummaryToCamelCase(apiResponse: any): FinanceSummaryResponse {
  return {
    totalRevenue: apiResponse.total_revenue ?? apiResponse.totalRevenue ?? 0,
    totalExpenses: apiResponse.total_expenses ?? apiResponse.totalExpenses ?? 0,
    profit: apiResponse.profit ?? 0,
    totalReceived: apiResponse.total_received ?? apiResponse.totalReceived ?? 0,
    totalPaid: apiResponse.total_paid ?? apiResponse.totalPaid ?? 0,
    unpaidRevenue: apiResponse.unpaid_revenue ?? apiResponse.unpaidRevenue ?? 0,
    unpaidExpenses: apiResponse.unpaid_expenses ?? apiResponse.unpaidExpenses ?? 0,
    cpUnpaid: apiResponse.cp_unpaid ?? apiResponse.cpUnpaid ?? 0,
    totalOpenPayables: apiResponse.total_open_payables ?? apiResponse.totalOpenPayables ?? 0,
    totalTaxes: apiResponse.total_taxes ?? apiResponse.totalTaxes ?? 0,
    projectedBalance: apiResponse.projected_balance ?? apiResponse.projectedBalance ?? 0,
    marginPercent: apiResponse.margin_percent ?? apiResponse.marginPercent ?? 0,
    marginHealth: apiResponse.margin_health ?? apiResponse.marginHealth ?? "attention",
    period: apiResponse.period,
    initialBalance: apiResponse.initial_balance ?? apiResponse.initialBalance ?? 0,
    // Detalhamento de impostos brasileiros
    totalIcms: apiResponse.total_icms ?? apiResponse.totalIcms ?? 0,
    totalIpi: apiResponse.total_ipi ?? apiResponse.totalIpi ?? 0,
    totalPis: apiResponse.total_pis ?? apiResponse.totalPis ?? 0,
    totalCofins: apiResponse.total_cofins ?? apiResponse.totalCofins ?? 0,
    totalIcmsCredit: apiResponse.total_icms_credit ?? apiResponse.totalIcmsCredit ?? 0,
  };
}

export async function fetchFinanceSummary(period: string): Promise<FinanceSummaryResponse> {
  const response = await fetchApi<any>(`/financeiro/summary?period=${encodeURIComponent(period)}`);
  return convertSummaryToCamelCase(response);
}

export async function fetchCategories(): Promise<string[]> {
  return fetchApi<string[]>("/financeiro/categories");
}

export async function fetchAvailablePeriods(): Promise<string[]> {
  return fetchApi<string[]>("/financeiro/periods");
}

export async function fetchMonthlyClosings(): Promise<any[]> {
  return fetchApi<any[]>("/financeiro/closings");
}

// ---------- Despesas Fixas ----------

export async function fetchFixedExpenses(activeOnly?: boolean): Promise<FixedExpense[]> {
  const query = activeOnly !== undefined ? `?active_only=${activeOnly}` : "";
  return fetchApi<FixedExpense[]>(`/financeiro/fixed-expenses${query}`);
}

export async function addFixedExpense(expense: Omit<FixedExpense, "id">): Promise<FixedExpense> {
  return fetchApi<FixedExpense>("/financeiro/fixed-expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
}

// ---------- Contas a Pagar ----------

export async function fetchContasPagar(params?: {
  month?: string;
  paid?: boolean;
}): Promise<ContaPagar[]> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  return fetchApi<ContaPagar[]>(`/financeiro/contas-pagar${query}`);
}

export async function addContaPagar(conta: Omit<ContaPagar, "id">): Promise<ContaPagar> {
  return fetchApi<ContaPagar>("/financeiro/contas-pagar", {
    method: "POST",
    body: JSON.stringify(conta),
  });
}

export async function markContaPaid(id: string): Promise<ContaPagar> {
  return fetchApi<ContaPagar>(`/financeiro/contas-pagar/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ paid: true, paid_at: new Date().toISOString().split("T")[0] }),
  });
}

// ---------- Clientes (backend real) ----------

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CustomerStatisticsResponse {
  total: number;
  active: number;
  inactive: number;
  at_risk: number;
  avg_ticket: number;
  total_revenue: number;
}

// Helper para converter snake_case (Backend) para camelCase (Frontend)
function convertCustomerToCamelCase(apiCustomer: any): Customer {
  return {
    id: apiCustomer.id,
    cnpj: apiCustomer.cnpj,
    name: apiCustomer.name,
    company: apiCustomer.company,
    contact: apiCustomer.contact,
    phone: apiCustomer.phone,
    email: apiCustomer.email,
    address: apiCustomer.address,
    city: apiCustomer.city,
    state: apiCustomer.state,
    country: apiCustomer.country,
    segment: apiCustomer.segment,
    notes: apiCustomer.notes,
    lastOrderDate: apiCustomer.last_order_date,
    totalOrders: apiCustomer.total_orders,
    totalSpent: apiCustomer.total_spent,
    icmsCredit: apiCustomer.icms_credit,
    createdAt: apiCustomer.created_at,
    updatedAt: apiCustomer.updated_at,
  };
}

export async function fetchCustomers(): Promise<Customer[]> {
  const response = await fetchApi<CustomerListResponse>("/customers/");
  return response.items.map(convertCustomerToCamelCase);
}

export async function addCustomer(customer: Omit<Customer, "id">): Promise<Customer> {
  const response = await fetchApi<any>("/customers/", {
    method: "POST",
    body: JSON.stringify({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      cnpj: customer.cnpj,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      segment: customer.segment,
      contact: customer.contact,
      notes: customer.notes,
    }),
  });
  return convertCustomerToCamelCase(response);
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const response = await fetchApi<any>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      company: updates.company,
      cnpj: updates.cnpj,
      address: updates.address,
      city: updates.city,
      state: updates.state,
      country: updates.country,
      segment: updates.segment,
      contact: updates.contact,
      notes: updates.notes,
    }),
  });
  return convertCustomerToCamelCase(response);
}

export async function fetchCustomerStatistics(): Promise<CustomerStatisticsResponse> {
  return fetchApi<CustomerStatisticsResponse>("/customers/statistics/summary");
}

export async function sendReengagementMessage(
  customerId: string,
  channel: "email" | "whatsapp",
  message: string
): Promise<{ success: boolean }> {
  // TODO: Implementar no backend
  return { success: true };
}

// ---------- Receitas (Gestão de Receitas e Entradas) ----------

import { RevenueEntry, PaymentMethod, PaymentStatus, RevenueSource } from "@/data/mockData";

export interface RevenueListResponse {
  items: RevenueEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// Helper para converter snake_case da API para camelCase
function convertRevenueToCamelCase(apiData: any): RevenueEntry {
  const dueDate = apiData.due_date || apiData.dueDate;
  const today = new Date();
  const due = dueDate ? new Date(dueDate) : null;
  let daysOverdue = 0;
  
  if (apiData.payment_status === "overdue" || (due && due < today && apiData.payment_status !== "paid")) {
    daysOverdue = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  return {
    id: apiData.id,
    sourceType: apiData.source_type || (apiData.order_id ? "client" : "external"),
    customerId: apiData.customer_id || apiData.customerId,
    customerName: apiData.customer_name || apiData.customerName,
    orderId: apiData.order_id || apiData.orderId,
    source: apiData.source,
    description: apiData.description,
    value: apiData.value,
    paymentMethod: apiData.payment_method || apiData.paymentMethod,
    paymentStatus: apiData.payment_status || apiData.paymentStatus,
    dueDate: apiData.due_date || apiData.dueDate,
    expectedDate: apiData.expected_date || apiData.expectedDate,
    paidAt: apiData.paid_at || apiData.paidAt,
    daysOverdue: daysOverdue,
    notes: apiData.notes,
    createdAt: apiData.created_at || apiData.createdAt,
    updatedAt: apiData.updated_at || apiData.updatedAt,
  };
}

// Buscar receitas externas
export async function fetchExternalRevenues(params?: {
  source?: string;
  payment_status?: string;
  period?: string;
  page?: number;
  limit?: number;
}): Promise<RevenueListResponse> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await fetchApi<any>(`/financeiro/external-revenues${query}`);
  return {
    ...response,
    items: response.items.map(convertRevenueToCamelCase),
  };
}

// Criar receita externa
export async function addExternalRevenue(data: {
  source: RevenueSource;
  description: string;
  value: number;
  paymentMethod?: PaymentMethod;
  dueDate?: string;
  expectedDate?: string;
  notes?: string;
}): Promise<RevenueEntry> {
  const response = await fetchApi<any>("/financeiro/external-revenues", {
    method: "POST",
    body: JSON.stringify({
      source: data.source,
      description: data.description,
      value: data.value,
      payment_method: data.paymentMethod,
      due_date: data.dueDate,
      expected_date: data.expectedDate,
      notes: data.notes,
    }),
  });
  return convertRevenueToCamelCase(response);
}

// Atualizar receita externa
export async function updateExternalRevenue(
  id: string,
  data: Partial<{
    source: RevenueSource;
    description: string;
    value: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    dueDate: string;
    expectedDate: string;
    notes: string;
  }>
): Promise<RevenueEntry> {
  const response = await fetchApi<any>(`/financeiro/external-revenues/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      source: data.source,
      description: data.description,
      value: data.value,
      payment_method: data.paymentMethod,
      payment_status: data.paymentStatus,
      due_date: data.dueDate,
      expected_date: data.expectedDate,
      notes: data.notes,
    }),
  });
  return convertRevenueToCamelCase(response);
}

// Deletar receita externa
export async function deleteExternalRevenue(id: string): Promise<void> {
  return fetchApi<void>(`/financeiro/external-revenues/${id}`, {
    method: "DELETE",
  });
}

// Marcar receita externa como paga
export async function markExternalRevenuePaid(id: string): Promise<RevenueEntry> {
  const response = await fetchApi<any>(`/financeiro/external-revenues/${id}/mark-paid`, {
    method: "POST",
  });
  return convertRevenueToCamelCase(response);
}

// Buscar receitas de pedidos (clientes)
export async function fetchOrderRevenues(params?: {
  period?: string;
  payment_status?: string;
}): Promise<RevenueEntry[]> {
  // Por enquanto busca pedidos e converte para RevenueEntry
  // Depois teremos endpoint específico
  const orders = await fetchApi<any[]>(`/orders?${new URLSearchParams(params as any).toString()}`).catch(() => []);
  return orders.map((order: any) => convertRevenueToCamelCase({
    ...order,
    source_type: "client",
    customer_id: order.customer_id,
    customer_name: order.customer_name,
    order_id: order.id,
    description: `Pedido ${order.id} - ${order.product}`,
    value: order.total_value,
    due_date: order.due_date || order.created_at?.slice(0, 10),
    payment_method: order.payment_method,
    payment_status: order.payment_status,
  }));
}

// ---------- Impostos de Notas Fiscais ----------

export interface TaxesSummaryResponse {
  period: string;
  total_icms: number;
  total_ipi: number;
  total_pis: number;
  total_cofins: number;
  total_taxes: number;
  total_icms_credit: number;
  total_revenue: number;
  orders_count: number;
}

export async function fetchTaxesSummary(period: string): Promise<TaxesSummaryResponse> {
  return fetchApi<TaxesSummaryResponse>(`/orders/taxes/summary?period=${encodeURIComponent(period)}`);
}

// ---------- Produtos (backend real) ----------

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ProductStatisticsResponse {
  total: number;
  total_value: number;
  avg_price: number;
  low_stock: number;
  out_of_stock: number;
}

// Helper para converter snake_case da API para camelCase
function convertProductToCamelCase(apiData: any): Product {
  return {
    id: apiData.id,
    code: apiData.code,
    name: apiData.name,
    description: apiData.description,
    category: apiData.category,
    subcategory: apiData.subcategory,
    material: apiData.material,
    costPrice: apiData.cost_price,
    salePrice: apiData.sale_price,
    minSalePrice: apiData.min_sale_price,
    stockQuantity: apiData.stock_quantity,
    minStock: apiData.min_stock,
    maxStock: apiData.max_stock,
    unit: apiData.unit,
    weightKg: apiData.weight_kg,
    dimensions: apiData.dimensions,
    supplierId: apiData.supplier_id,
    supplierCode: apiData.supplier_code,
    isActive: apiData.is_active,
    isFeatured: apiData.is_featured,
    totalSales: apiData.total_sales,
    totalRevenue: apiData.total_revenue,
    lastSaleDate: apiData.last_sale_date,
    imageUrl: apiData.image_url,
    galleryUrls: apiData.gallery_urls,
    createdAt: apiData.created_at,
    updatedAt: apiData.updated_at,
  };
}

export async function fetchProducts(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<Product[]> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const response = await fetchApi<ProductListResponse>(`/products${query}`);
  return response.items.map(convertProductToCamelCase);
}

export async function fetchProductStatistics(): Promise<ProductStatisticsResponse> {
  return fetchApi<ProductStatisticsResponse>("/statistics/products");
}

// Helper para converter camelCase para snake_case
function convertProductToSnakeCase(product: Omit<Product, "id"> | Partial<Product>): any {
  return {
    code: product.code,
    name: product.name,
    description: product.description,
    category: product.category,
    subcategory: product.subcategory,
    cost_price: product.costPrice,
    sale_price: product.salePrice,
    min_sale_price: product.minSalePrice,
    stock_quantity: product.stockQuantity,
    min_stock: product.minStock,
    max_stock: product.maxStock,
    unit: product.unit,
    weight_kg: product.weightKg,
    dimensions: product.dimensions,
    supplier_id: product.supplierId,
    supplier_code: product.supplierCode,
    is_active: product.isActive,
    is_featured: product.isFeatured,
    image_url: product.imageUrl,
    gallery_urls: product.galleryUrls,
  };
}

export async function addProduct(product: Omit<Product, "id">): Promise<Product> {
  console.log("=== addProduct CHAMADA ===");
  console.log("Dados recebidos:", product);
  
  try {
    const converted = convertProductToSnakeCase(product);
    console.log("Dados convertidos:", converted);
    
    console.log("Fazendo requisição POST para /products");
    const response = await fetchApi<any>("/products", {
      method: "POST",
      body: JSON.stringify(converted),
    });
    console.log("Resposta recebida:", response);
    
    const result = convertProductToCamelCase(response);
    console.log("Resultado final:", result);
    return result;
  } catch (error) {
    console.error("=== ERRO EM addProduct ===");
    console.error("Erro:", error);
    throw error;
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const response = await fetchApi<any>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(convertProductToSnakeCase(updates)),
  });
  return convertProductToCamelCase(response);
}

export async function deleteProduct(id: string | number): Promise<void> {
  return fetchApi<void>(`/products/${id}`, {
    method: "DELETE",
  });
}

// ---------- Transportadoras ----------

export interface Carrier {
  id: string;
  name: string;
  cnpj: string;
  isActive: boolean;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchCarriers(): Promise<Carrier[]> {
  const response = await fetchApi<any[]>("/carriers/");
  return response.map(c => ({
    id: c.id,
    name: c.name,
    cnpj: c.cnpj,
    // Converter para booleano explicitamente (SQLite pode retornar 0/1 ou "true"/"false")
    isActive: c.is_active === true || c.is_active === 1 || c.isActive === true || c.isActive === 1 || false,
    phone: c.phone,
    email: c.email,
    website: c.website,
    address: c.address,
    city: c.city,
    state: c.state,
    zipCode: c.zip_code || c.zipCode,
    contactPerson: c.contact_person || c.contactPerson,
    contactPhone: c.contact_phone || c.contactPhone,
    contactEmail: c.contact_email || c.contactEmail,
    createdAt: c.created_at || c.createdAt,
    updatedAt: c.updated_at || c.updatedAt,
  }));
}

export async function addCarrier(carrier: Omit<Carrier, "id">): Promise<Carrier> {
  const response = await fetchApi<any>("/carriers/", {
    method: "POST",
    body: JSON.stringify({
      id: `CAR-${Date.now()}`,
      name: carrier.name,
      cnpj: carrier.cnpj,
      is_active: carrier.isActive,
      phone: carrier.phone,
      email: carrier.email,
      website: carrier.website,
      address: carrier.address,
      city: carrier.city,
      state: carrier.state,
      zip_code: carrier.zipCode,
      contact_person: carrier.contactPerson,
      contact_phone: carrier.contactPhone,
      contact_email: carrier.contactEmail,
    }),
  });
  return {
    id: response.id,
    name: response.name,
    cnpj: response.cnpj,
    // Converter para booleano explicitamente
    isActive: response.is_active === true || response.is_active === 1 || response.isActive === true || response.isActive === 1 || false,
    phone: response.phone,
    email: response.email,
    website: response.website,
    address: response.address,
    city: response.city,
    state: response.state,
    zipCode: response.zip_code || response.zipCode,
    contactPerson: response.contact_person || response.contactPerson,
    contactPhone: response.contact_phone || response.contactPhone,
    contactEmail: response.contact_email || response.contactEmail,
    createdAt: response.created_at || response.createdAt,
    updatedAt: response.updated_at || response.updatedAt,
  };
}

export async function updateCarrier(id: string, updates: Partial<Carrier>): Promise<Carrier> {
  const response = await fetchApi<any>(`/carriers/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      name: updates.name,
      cnpj: updates.cnpj,
      is_active: updates.isActive,
      phone: updates.phone,
      email: updates.email,
      website: updates.website,
      address: updates.address,
      city: updates.city,
      state: updates.state,
      zip_code: updates.zipCode,
      contact_person: updates.contactPerson,
      contact_phone: updates.contactPhone,
      contact_email: updates.contactEmail,
    }),
  });
  return {
    id: response.id,
    name: response.name,
    cnpj: response.cnpj,
    // Converter para booleano explicitamente
    isActive: response.is_active === true || response.is_active === 1 || response.isActive === true || response.isActive === 1 || false,
    phone: response.phone,
    email: response.email,
    website: response.website,
    address: response.address,
    city: response.city,
    state: response.state,
    zipCode: response.zip_code || response.zipCode,
    contactPerson: response.contact_person || response.contactPerson,
    contactPhone: response.contact_phone || response.contactPhone,
    contactEmail: response.contact_email || response.contactEmail,
    createdAt: response.created_at || response.createdAt,
    updatedAt: response.updated_at || response.updatedAt,
  };
}

export async function deleteCarrier(id: string): Promise<void> {
  return fetchApi<void>(`/carriers/${id}`, {
    method: "DELETE",
  });
}

export async function checkCarriersHealth(): Promise<{ status: string; module: string }> {
  return fetchApi<{ status: string; module: string }>("/carriers/health");
}
