const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status}`
    );
  }

  return response.json();
}

export interface Overview {
  total_orders: number;
  purchasing_customers: number;
  total_revenue: number;
  average_order_value: number;
  revenue_per_customer: number;
  customer_purchase_rate: number;
}

export interface RevenuePoint {
  month: string;
  orders: number;
  customers: number;
  revenue: number;
  average_order_value: number;
}

export interface Funnel {
  visitors: number;
  product_viewers: number;
  cart_users: number;
  checkout_users: number;
  payment_users: number;
  purchasers: number;
  view_rate_percent: number;
  add_to_cart_rate_percent: number;
  checkout_rate_percent: number;
  payment_attempt_rate_percent: number;
  purchase_rate_percent: number;
}

export interface DevicePerformance {
  device_type: string;
  sessions: number;
  product_view_sessions: number;
  cart_sessions: number;
  checkout_sessions: number;
  purchase_sessions: number;
  conversion_percent: number;
}

export interface PaymentPerformance {
  payment_method: string;
  attempts: number;
  successful_payments: number;
  failed_payments: number;
  failure_rate_percent: number;
}

export interface CategoryPerformance {
  category_name: string;
  orders: number;
  units_sold: number;
  revenue: number;
  estimated_gross_profit: number;
  gross_margin_percent: number;
}

export interface ProductPerformance {
  product_id: number;
  product_name: string;
  brand: string;
  category_name: string;
  units_sold: number;
  revenue: number;
  estimated_gross_profit: number;
}

export interface AcquisitionChannel {
  acquisition_channel: string;
  users: number;
  purchasing_users: number;
  orders: number;
  revenue: number;
  conversion_percent: number;
  revenue_per_user: number;
}

export interface CustomerSegment {
  customer_segment: string;
  customers: number;
  revenue: number;
  average_customer_revenue: number;
}

export interface RepeatRate {
  purchasing_customers: number;
  repeat_customers: number;
  repeat_purchase_rate_percent: number;
}

export interface ExperimentGroup {
  experiment_group: string;
  failed_payments: number;
  recovered_payments: number;
  recovery_rate_percent: number;
  recovered_revenue: number;
}

export interface ExperimentStatistics {
  control: {
    observations: number;
    recoveries: number;
    recovery_rate: number;
  };
  treatment: {
    observations: number;
    recoveries: number;
    recovery_rate: number;
  };
  absolute_lift: number;
  absolute_lift_percentage_points: number;
  relative_lift: number;
  relative_lift_percent: number;
  z_statistic: number;
  p_value: number;
  statistically_significant: boolean;
  recommendation: string;
}

export const api = {
  overview: () =>
    fetchAPI<Overview>("/overview"),

  revenue: () =>
    fetchAPI<RevenuePoint[]>("/revenue"),

  funnel: () =>
    fetchAPI<Funnel>("/funnel"),

  devices: () =>
    fetchAPI<DevicePerformance[]>("/devices"),

  payments: () =>
    fetchAPI<PaymentPerformance[]>("/payments"),

  categories: () =>
    fetchAPI<CategoryPerformance[]>("/categories"),

  products: (limit = 20) =>
    fetchAPI<ProductPerformance[]>(
      `/products?limit=${limit}`
    ),

  acquisition: () =>
    fetchAPI<AcquisitionChannel[]>("/acquisition"),

  customerSegments: () =>
    fetchAPI<CustomerSegment[]>(
      "/customer-segments"
    ),

  repeatRate: () =>
    fetchAPI<RepeatRate>("/repeat-rate"),

  experiment: () =>
    fetchAPI<ExperimentGroup[]>("/experiment"),

  experimentStatistics: () =>
    fetchAPI<ExperimentStatistics>(
      "/experiment/statistics"
    ),
};