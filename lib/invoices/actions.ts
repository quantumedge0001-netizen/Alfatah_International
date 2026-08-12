"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PAYMENT_METHODS } from "./constants";
import type { InvoiceCustomerType, SourceableSale } from "./types";

// `invoices` / `invoice_items` aren't in the generated Database type yet
// (they're new — see supabase/migrations/0005_invoices.sql and
// 0006_invoices_v2.sql), so these queries go through an `any`-cast client
// rather than fighting the types.

export async function getUninvoicedSales(
  customerType: InvoiceCustomerType,
  customerId: string
): Promise<SourceableSale[]> {
  if (customerType === "custom" || !customerId) return [];
  const supabase = (await createClient()) as any;

  // Sale rows already pulled into an invoice — exclude them so the same
  // sale can't be double-invoiced by accident.
  const { data: usedItems } = await supabase
    .from("invoice_items")
    .select("sale_id, private_sale_id");
  const usedSaleIds = new Set((usedItems ?? []).map((r: any) => r.sale_id).filter(Boolean));
  const usedPrivateSaleIds = new Set((usedItems ?? []).map((r: any) => r.private_sale_id).filter(Boolean));

  if (customerType === "government_institution") {
    const { data } = await supabase
      .from("sales")
      .select("id, quantity, unit_price, sale_date, products(name, unit)")
      .eq("institution_id", customerId)
      .order("sale_date", { ascending: false });

    return (data ?? [])
      .filter((row: any) => !usedSaleIds.has(row.id))
      .map((row: any) => ({
        source: "sale" as const,
        id: row.id,
        description: row.products?.name ?? "Product",
        uom: row.products?.unit ?? "Units",
        quantity: row.quantity,
        unit_price: row.unit_price,
        sale_date: row.sale_date,
      }));
  }

  const { data } = await supabase
    .from("private_sales")
    .select("id, quantity_sold, unit_price, sale_date, products(name, unit)")
    .eq("company_id", customerId)
    .order("sale_date", { ascending: false });

  return (data ?? [])
    .filter((row: any) => !usedPrivateSaleIds.has(row.id))
    .map((row: any) => ({
      source: "private_sale" as const,
      id: row.id,
      description: row.products?.name ?? "Product",
      uom: row.products?.unit ?? "Units",
      quantity: row.quantity_sold,
      unit_price: row.unit_price,
      sale_date: row.sale_date,
    }));
}

const InvoiceItemInput = z.object({
  description: z.string().min(1),
  uom: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().nonnegative(),
  sale_id: z.string().uuid().nullable().optional(),
  private_sale_id: z.string().uuid().nullable().optional(),
});

const CreateInvoiceInput = z.object({
  customer_type: z.enum(["private_company", "government_institution", "custom"]),
  private_company_id: z.string().uuid().nullable().optional(),
  institution_id: z.string().uuid().nullable().optional(),
  customer_name: z.string().min(1),
  customer_address: z.string().nullable().optional(),
  invoice_date: z.string().min(1),
  payment_method: z.enum(PAYMENT_METHODS as [string, ...string[]]),
  notes: z.string().nullable().optional(),
  items: z.array(InvoiceItemInput).min(1, "Add at least one item"),
});

export async function createInvoice(input: z.infer<typeof CreateInvoiceInput>) {
  const profile = await requireProfile();
  const parsed = CreateInvoiceInput.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }
  const { items, ...invoiceFields } = parsed.data;
  const grand_total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const supabase = (await createClient()) as any;

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert({
      ...invoiceFields,
      subtotal: grand_total,
      grand_total,
      region_id: profile.region_id ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (invoiceError || !invoice) {
    return { error: "Could not save the invoice. " + (invoiceError?.message ?? "") };
  }

  const { error: itemsError } = await supabase.from("invoice_items").insert(
    items.map((item, index) => ({
      invoice_id: invoice.id,
      description: item.description,
      uom: item.uom,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
      sale_id: item.sale_id ?? null,
      private_sale_id: item.private_sale_id ?? null,
      sort_order: index,
    }))
  );

  if (itemsError) {
    await supabase.from("invoices").delete().eq("id", invoice.id);
    return { error: "Could not save invoice items. " + itemsError.message };
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices/${invoice.id}`);
}

export async function updateInvoiceStatus(id: string, status: "draft" | "sent" | "paid") {
  await requireProfile();
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  return { error: null };
}

export async function deleteInvoice(id: string) {
  await requireProfile();
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect("/invoices");
}
