import { ProductAlert } from "./Product";

export interface DashboardStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  todayOrders: number;
}

export interface DashboardResponse{
  stats: DashboardStats;
  alerts: ProductAlert[]
}