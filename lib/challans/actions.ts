"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// `challans` / `challan_items` aren't in the generated Database type yet
// (see supabase/migrations/0007_challans.sql), so these queries go through
// an `any`-cast client rather than fighting the types — same approach as
// lib/invoices/actions.ts.

export async function createChallan(invoiceId: string) {
  const profile = await requireProfile();
  const supabase = (await createClient()) as any;

  // RLS scopes this to invoices the caller can actually see, so a
  // region-scoped user can't generate a challan for someone else's invoice
  // by guessing an id.
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, customer_name, customer_address, payment_method, grand_total, invoice_items(*)")
    .eq("id", invoiceId)
    .single();

  if (invoiceError || !invoice) {
    return { error: "Invoice not found." };
  }

  const { data: challan, error: challanError } = await supabase
    .from("challans")
    .insert({
      invoice_id: invoice.id,
      customer_name: invoice.customer_name,
      customer_address: invoice.customer_address,
      payment_method: invoice.payment_method,
      subtotal: invoice.grand_total,
      region_id: profile.region_id ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (challanError || !challan) {
    return { error: "Could not create the challan. " + (challanError?.message ?? "") };
  }

  const items = (invoice.invoice_items ?? []) as any[];
  const { error: itemsError } = await supabase.from("challan_items").insert(
    items.map((item, index) => ({
      challan_id: challan.id,
      description: item.description,
      uom: item.uom,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
      sort_order: index,
    }))
  );

  if (itemsError) {
    await supabase.from("challans").delete().eq("id", challan.id);
    return { error: "Could not save challan items. " + itemsError.message };
  }

  revalidatePath(`/invoices/${invoiceId}`);
  return { error: null };
}

export async function deleteChallan(id: string, invoiceId: string) {
  await requireProfile();
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from("challans").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/invoices/${invoiceId}`);
  return { error: null };
}
