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

// ✅ Bewertungen
export interface Review {
  id: number;
  product: number;
  product_title: string;
  product_image: string | null;
  user: string;
  rating: number;
  title: string;
  body: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

// ✅ Produkt
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;

  category?: {
    id: number;
    name: string;
    display_name?: string;
  } | null;

  main_image: string | null;
  external_image: string | null;
  image_url: string | null;

  images: ProductImage[];
  variations: ProductVariation[];
  delivery_time: DeliveryTime | null;

  rating_avg: number | null;
  rating_count: number | null;
  recent_reviews: Review[];
}
