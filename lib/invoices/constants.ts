import type { PaymentMethod } from "./types";

// Mirrors the DB check constraint on invoices.payment_method
// (supabase/migrations/0006_invoices_v2.sql).
export const PAYMENT_METHODS: readonly PaymentMethod[] = ["Online", "Cash"];

// The sign-off block on every invoice (PDF footer + in-app preview) — same
// details that were on the old MS Word letterhead invoices.
export const COMPANY_INFO = {
  signerName: "Muhammad Farhan Chaudhary",
  signerTitle: "CEO",
  companyName: "ALFATAH INTERNATIONAL TRADING",
  phone: "0317-0000320",
  phoneIntl: "+92 317 0000320",
  email: "alfatahinternationaltrading93@gmail.com",
  address: "MC 233, street no 1, Green town, Shah Faisal Colony Karachi",
} as const;
