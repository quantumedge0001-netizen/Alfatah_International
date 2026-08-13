export interface ChallanItem {
  id: string;
  challan_id: string;
  description: string;
  uom: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
}

export interface Challan {
  id: string;
  challan_no: string;
  invoice_id: string;
  customer_name: string;
  customer_address: string | null;
  challan_date: string;
  payment_method: string;
  subtotal: number;
  region_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ChallanWithItems extends Challan {
  challan_items: ChallanItem[];
}
