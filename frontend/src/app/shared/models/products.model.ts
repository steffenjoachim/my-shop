export interface DeliveryTime {
  id?: number;
  name?: string;
  min_days?: number;
  max_days?: number;
  is_default?: boolean;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  main_image: string;
  description?: string;
  variations?: ProductVariation[];
  stock?: number;
  external_image?: string;
  images?: { id: number; image: string }[];
  delivery_time?: string | DeliveryTime; 
}

export interface ProductVariation {
  // Generische Attributdarstellung aus dem Backend (ManyToMany AttributeValue)
  attributes?: { attribute_type: string; value: string }[];
  // Kompatibilität zu älteren Datenständen (direkte Felder)
  color?: string;
  size?: string;
  stock: number;
  price?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedAttributes?: { [key: string]: string };
}
