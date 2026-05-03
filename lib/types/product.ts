export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  images: string[];
  sellerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  images: File[];
}

export interface CreateProductPayload {
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  images: string[]; // Base64 or URLs after upload
}
