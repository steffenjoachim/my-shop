// src/app/shared/models/products.model.ts

export interface Category {
  id: number;
  name: string;
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

export interface ProductImage {
  id: number;
  image: string;
}

export interface ProductVariation {
  id: number;
  attributes: AttributeValue[];
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
  variations: ProductVariation[];   // ✅ hier wird die Backend-Struktur übernommen
}

export interface CartItem extends Product {
  quantity: number;
  selectedAttributes: { [key: string]: string };
  stock?: number;   // ✅ optional, damit TS2339 weg ist
}
