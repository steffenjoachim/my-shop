export interface Category {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  image: string;
}

// 🧩 Backend liefert color, size, stock
export interface ProductVariation {
  id: number;
  color?: string | null;
  size?: string | null;
  stock: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  main_image: string;
  external_image?: string | null;
  category: Category;
  images: ProductImage[];
  variations: ProductVariation[];  // ✅ backend-konform
}

export interface CartItem extends Product {
  quantity: number;
  selectedAttributes: { [key: string]: string };
  stock?: number;  // optional
}
