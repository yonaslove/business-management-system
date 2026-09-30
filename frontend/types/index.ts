export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  business_id: number;
  business_name?: string;
}

export interface Business {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  business_id: number;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  business_id: number;
  user_id: number;
  user_name: string;
  action: 'DELETE_REQUEST' | 'DELETE_PERMANENT' | 'PRICE_CHANGE' | 'STOCK_UPDATE' | 'PRICE_STOCK_REQUEST' | 'HIRE_EMPLOYEE' | 'REMOVE_EMPLOYEE' | string;
  entity_type: 'product' | 'customer' | 'sale' | 'user' | string;
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
  stock_status: 'IN STOCK' | 'LOW STOCK' | 'OUT OF STOCK';
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
  total_amount: number;
  payment_method: string;
  notes?: string | null;
  created_at: string;
  items: SaleItem[];
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
