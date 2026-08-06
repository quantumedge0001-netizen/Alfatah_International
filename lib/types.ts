// Hand-written types matching supabase/migrations/0001_init.sql.
// Once the project is linked, replace this with generated types:
//   npx supabase gen types typescript --project-id <ref> > lib/types.ts

export type Role = "super_admin" | "admin" | "user";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  region_id: string | null;
  status: "active" | "suspended";
  created_at: string;
}

export interface Region {
  id: string;
  name: string;
  created_at: string;
}

export interface GovernmentInstitution {
  id: string;
  name: string;
  district: "Jamshoro" | "Tharparkar" | "Umerkot";
  contact_info: string | null;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  description: string | null;
}

export interface ImportRecord {
  id: string;
  product_id: string;
  supplier: string;
  country: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  currency: string;
  invoice_no: string | null;
  import_date: string;
  expected_arrival: string | null;
  region_id: string;
  created_by: string;
  created_at: string;
}

export interface InventoryRow {
  id: string;
  product_id: string;
  region_id: string;
  quantity_available: number;
}

export interface SaleRecord {
  id: string;
  institution_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  status: "pending" | "dispatched" | "delivered";
  region_id: string;
  created_by: string;
  created_at: string;
}

export interface SheetSyncLog {
  id: string;
  source: string;
  rows_synced: number;
  status: "success" | "partial" | "failed";
  synced_at: string;
}

// Minimal Database shape so @supabase/ssr generics compile without the
// full generated file. Swap in `supabase gen types` output when ready.
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      regions: { Row: Region; Insert: Partial<Region>; Update: Partial<Region> };
      government_institutions: {
        Row: GovernmentInstitution;
        Insert: Partial<GovernmentInstitution>;
        Update: Partial<GovernmentInstitution>;
      };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      imports: { Row: ImportRecord; Insert: Partial<ImportRecord>; Update: Partial<ImportRecord> };
      inventory: { Row: InventoryRow; Insert: Partial<InventoryRow>; Update: Partial<InventoryRow> };
      sales: { Row: SaleRecord; Insert: Partial<SaleRecord>; Update: Partial<SaleRecord> };
      sheet_sync_logs: { Row: SheetSyncLog; Insert: Partial<SheetSyncLog>; Update: Partial<SheetSyncLog> };
    };
  };
};
