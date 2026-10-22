export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  available: boolean;
  createdAt: string;
  updatedAt: string;

  categoryId: number;
  categoryName: string;

  minStock: number;
  stock: number;
  unit: string
}


export interface ProductAlert {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit?: string;
}

export interface Category{
  id: number;
  name: string
}

