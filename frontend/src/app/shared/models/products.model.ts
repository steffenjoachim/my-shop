// products.model.ts
export interface Product {
  id: number;
  title: string;
  price: number;
  main_image: string;
  description?: string;
  variations?: ProductVariation[];
  stock?: number;
  // Bilder als String-Array, nicht als Objekt-Array
  external_image?: string;
  images?: string[]; // Array von Bild-URLs als Strings
}

export interface ProductVariation {
  color?: string;
  size?: string;
  stock: number;
  price?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedAttributes?: { [key: string]: string };
}