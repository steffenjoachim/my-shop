export interface ReturnItem {
  id: number;
  order_id: number;

  product_image: string | null;

  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'received'
    | 'refunded';

  reason: string;
  comments?: string;

  created_at: string; // ISO date string
}
