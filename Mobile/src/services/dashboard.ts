import { DashboardResponse } from "@/models/DashboardStats";
import { api } from "./api";

export const getDashboard = async (): Promise<DashboardResponse> => {
  const response = await api.get<DashboardResponse>("/dashboard");
  return response.data;
};
