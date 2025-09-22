export interface Category {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  image: string;
}

export interface Product {
  id: number;
  title: string;
  description?: string;
  price: number;
  stock: number;
  main_image?: string | null;
  category?: Category | null;
  images?: ProductImage[];
}
