export interface User {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: 'admin' | 'co_admin' | 'employee' | 'delivery';
  business_id: number;
  business_name?: string;
  currency?: string;
  currency_symbol?: string;
}

export interface Business {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  currency?: string;
  currency_symbol?: string;
  payment_phone?: string;
  payment_account_name?: string;
  cbe_account?: string;
  other_bank_info?: string;
  payment_instructions?: string;
}

export interface Employee {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: 'admin' | 'co_admin' | 'employee' | 'delivery';
  business_id: number;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  business_id: number;
  user_id: number;
  user_name: string;
  action: 'DELETE_REQUEST' | 'DELETE_PERMANENT' | 'PRICE_CHANGE' | 'STOCK_UPDATE' | 'PRICE_STOCK_REQUEST' | 'CREATE_PRODUCT_REQUEST' | 'UPDATE_PRODUCT_REQUEST' | 'CREATE_CUSTOMER_REQUEST' | 'UPDATE_CUSTOMER_REQUEST' | 'UPDATE_SETTINGS_REQUEST' | 'HIRE_EMPLOYEE' | 'REMOVE_EMPLOYEE' | 'SALE_RECORDED' | string;
  entity_type: 'product' | 'customer' | 'sale' | 'user' | 'business' | string;
  entity_id?: number | null;
  entity_name: string;
  details: string;
  payload?: string | null;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'DISMISSED' | 'LOGGED';
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  business_id: number;
}

export interface Product {
  id: number;
  business_id: number;
  category_id?: number | null;
  category_name?: string | null;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  sku?: string | null;
  is_verified: boolean;
  stock_status: 'IN STOCK' | 'LOW STOCK' | 'EMPTY';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  business_id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  is_verified: boolean;
  total_purchases: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  business_id: number;
  customer_id?: number | null;
  customer_name?: string;
  customer_phone?: string | null;
  customer_address?: string | null;
  is_online?: boolean;
  order_status?: 'PENDING_VERIFICATION' | 'VERIFIED' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'REJECTED' | 'PENDING' | string;
  user_id?: number | null;
  user_name?: string | null;
  total_amount: number;
  payment_method: string;
  notes?: string | null;
  payment_receipt?: string | null;
  payment_ref?: string | null;
  delivery_notes?: string | null;
  delivery_user_name?: string | null;
  delivery_proof_image?: string | null;
  customer_acknowledged?: boolean;
  customer_acknowledged_at?: string | null;
  customer_feedback?: string | null;
  created_at: string;
  items: SaleItem[];
}

export interface CustomerUser {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}


export interface DashboardSummary {
  total_revenue: number;
  total_sales: number;
  total_products: number;
  low_stock_count: number;
  total_customers: number;
}

export interface SalesChartPoint {
  date: string;
  amount: number;
  order_count: number;
}

export interface DashboardRecentSale {
  id: number;
  customer_name: string;
  item_count: number;
  total_amount: number;
  payment_method: string;
  created_at: string;
}

export interface DashboardLowStockProduct {
  id: number;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
  category_name?: string | null;
  status: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface BusinessSettings {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  currency: string;
  currency_symbol: string;
  payment_phone?: string | null;
  payment_account_name?: string | null;
  cbe_account?: string | null;
  other_bank_info?: string | null;
  payment_instructions?: string | null;
  available_currencies: CurrencyInfo[];
}

export interface DailyReportSummary {
  date: string;
  total_revenue: number;
  total_sales_count: number;
  total_units_sold: number;
  total_inventory_items: number;
  total_remaining_stock: number;
  empty_products_count: number;
  low_stock_products_count: number;
  currency: string;
  currency_symbol: string;
}

export interface StaffDailySales {
  user_id?: number | null;
  user_name: string;
  role: string;
  sales_count: number;
  units_sold: number;
  total_revenue: number;
}

export interface PaymentMethodDaily {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ItemSoldDaily {
  product_id: number;
  product_name: string;
  category_name?: string | null;
  quantity_sold: number;
  unit_price: number;
  total_revenue: number;
}

export interface InventoryStockDaily {
  product_id: number;
  product_name: string;
  category_name?: string | null;
  price: number;
  remaining_stock: number;
  low_stock_threshold: number;
  status: 'IN STOCK' | 'LOW STOCK' | 'EMPTY' | string;
  is_verified: boolean;
}

export interface DailyReport {
  summary: DailyReportSummary;
  staff_sales: StaffDailySales[];
  payment_methods: PaymentMethodDaily[];
  items_sold: ItemSoldDaily[];
  inventory_status: InventoryStockDaily[];
}

export interface AdminNotificationSummary {
  pending_approvals_count: number;
  pending_approvals: ActivityLog[];
  recent_activities: ActivityLog[];
  coadmin_activities_count?: number;
  coadmin_activities?: ActivityLog[];
  pending_orders_count?: number;
  pending_orders?: ActivityLog[];
  delivery_orders_count?: number;
  delivery_orders?: ActivityLog[];
  total_notifications_count?: number;
}

