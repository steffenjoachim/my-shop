// ✅ Produktbilder
export interface ProductImage {
  id: number;
  image: string;
}

// ✅ Attribut-Werte
export interface AttributeValue {
  id: number;
  value: string;
  attribute_type: string;
}

// ✅ Produktvariationen
export interface ProductVariation {
  id: number;
  stock: number;
  attributes: AttributeValue[];
}

// ✅ Lieferzeit
export interface DeliveryTime {
  id: number;
  name: string;
  min_days: number;
  max_days: number;
  is_default: boolean;
}

// ✅ Produkt
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;

  main_image: string | null;
  external_image: string | null;
  image_url: string | null;

  images: ProductImage[];
  variations: ProductVariation[];
  delivery_time: DeliveryTime | null;

  rating_avg: number | null;
  rating_count: number | null;
  recent_reviews: any[];
}

export interface CartItem {
  id: number;
  title: string;
  price: number;

  main_image: string | null;
  selectedAttributes: { [key: string]: string };

  quantity: number;
}
