import { Category, Product } from "@/models/Product";
import { api } from "./api";

export const getProducts = async (): Promise<Product[]> => {
  const response = await api.get<Product[]>("/product/all");
  return response.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const categoryResponse = await api.get<Category[]>("/categories");
  return categoryResponse.data;
};
