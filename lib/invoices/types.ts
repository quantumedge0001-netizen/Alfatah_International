export type InvoiceStatus = "draft" | "sent" | "paid";
export type InvoiceCustomerType = "private_company" | "government_institution" | "custom";
export type PaymentMethod = "Online" | "Cash";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  uom: string;
  quantity: number;
  unit_price: number;
  amount: number;
  sale_id: string | null;
  private_sale_id: string | null;
  sort_order: number;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  customer_type: InvoiceCustomerType;
  private_company_id: string | null;
  institution_id: string | null;
  customer_name: string;
  customer_address: string | null;
  invoice_date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  subtotal: number;
  grand_total: number;
  status: InvoiceStatus;
  region_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
}

// A source row an invoice line item can be pulled in from — either a
// government sale or a private sale, normalized to one shape for the UI.
export interface SourceableSale {
  source: "sale" | "private_sale";
  id: string;
  description: string;
  uom: string;
  quantity: number;
  unit_price: number;
  sale_date: string;
}
