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
  // is_primary: boolean;
}

export interface ProductAttributeValue {
  id: number;
  value: string;
  attribute_type: {
    id: number;
    name: string;
  };
}

export interface ProductAttribute {
  id: number;
  value: {
    id: number;
    value: string;
    attribute_type: {
      id: number;
      name: string;
    };
  };
  stock: number;   // 👈 ergänzen
}


export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  main_image: string;
  category: string;
  category_id: number;
  images: ProductImage[];
  product_attributes: ProductAttribute[];
}

// für den Warenkorb
export interface CartItem extends Product {
  quantity: number;
  selectedAttributes: { [key: string]: string };
}
