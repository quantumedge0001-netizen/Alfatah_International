// Shared, hand-maintained lists that mirror DB enum values. Keep in sync
// with the `district_name` enum (supabase/migrations/0001_init.sql,
// 0006_invoices_v2.sql).
export const DISTRICTS = ["Jamshoro", "Tharparkar", "Umerkot", "Islamkot", "Mithi"] as const;
