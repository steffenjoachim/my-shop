import { AttributeValue } from './products.model';

// 🚚 Zulässige Versanddienstleister (synchron zum Backend)
export type ShippingCarrier = 'dhl' | 'hermes' | 'ups' | 'post';

export interface ShippingCarrierOption {
  value: ShippingCarrier;
  label: string;
}

export const SHIPPING_CARRIER_OPTIONS: ShippingCarrierOption[] = [
  { value: 'dhl', label: 'DHL' },
  { value: 'hermes', label: 'Hermes' },
  { value: 'ups', label: 'UPS' },
  { value: 'post', label: 'Deutsche Post' },
];

// 🛒 Cart / Checkout
export interface CartItem {
  id: number;
  title: string;
  price: number;
  main_image: string | null;
  quantity: number;
  selectedAttributes: Record<string, string>;
}

// 🧾 Order Items
export interface OrderItemVariationDetails {
  id: number;
  attributes: AttributeValue[];
}

export interface OrderItem {
  id: number;
  product: number;
  variation: number | null;
  product_title?: string;
  product_image?: string | null;
  price: number;
  quantity: number;
  variation_details?: OrderItemVariationDetails | null;
}

// 📦 Orders
export interface BaseOrder {
  id: number;
  user: string;
  total: number;
  status: string;
  paid: boolean;
  created_at: string;
  name?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  payment_method?: string | null;
  shipping_carrier?: ShippingCarrier | null;
  tracking_number?: string | null;
}

export interface OrderSummary extends BaseOrder {
  items?: OrderItem[];
}

export interface OrderDetail extends BaseOrder {
  items: OrderItem[];
}
