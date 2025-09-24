export interface Category {
  id: number;
  name: string;
}

export interface ProductImage {
  id: number;
  image: string;
}

export interface AttributeType {
  id: number;
  name: string;
}

export interface AttributeValue {
  id: number;
  value: string;
  attribute_type: AttributeType;
}

export interface ProductAttribute {
  id: number;
  value: AttributeValue;
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
  attributes?: ProductAttribute[]; // <-- hier sind die Farben/Werte
}
