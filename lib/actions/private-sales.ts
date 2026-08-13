"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { syncInvoiceForSale, syncInvoiceAfterSaleEdit } from "@/lib/invoices/auto";

const PrivateSaleSchema = z.object({
  company_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity_sold: z.coerce.number().positive(),
  unit_price: z.coerce.number().nonnegative(),
  sale_date: z.string().min(1),
  delivery_status: z.enum(["pending", "delivered", "cancelled"]),
});

export async function createPrivateSale(_prevState: { error: string | null }, formData: FormData) {
  const profile = await requireProfile();

  const parsed = PrivateSaleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form — some fields are missing or invalid." };
  }

  const supabase = await createClient();

  // Unlike government sales, private_sales.region_id is nullable in your
  // schema — so unlike createSale() this does not hard-block users with no
  // assigned region. It just tags the row with their region if they have one.
  const { data: sale, error } = await supabase
    .from("private_sales")
    .insert({
      ...parsed.data,
      region_id: profile.region_id ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !sale) {
    return { error: "Could not save the sale. " + (error?.message ?? "") };
  }

  // Best-effort: the sale is already saved either way, so a hiccup here
  // shouldn't block the user — it just means the invoice/challan won't be
  // ready automatically for this one and can be added manually later.
  try {
    await syncInvoiceForSale({
      source: "private_sale",
      saleId: sale.id,
      customerType: "private_company",
      customerId: parsed.data.company_id,
      productId: parsed.data.product_id,
      quantity: parsed.data.quantity_sold,
      unit_price: parsed.data.unit_price,
      sale_date: parsed.data.sale_date,
      region_id: profile.region_id ?? null,
      created_by: profile.id,
    });
  } catch (syncError) {
    console.error("[createPrivateSale] auto invoice/challan sync failed:", syncError);
  }

  redirect("/private-sales");
}

export async function updatePrivateSale(id: string, _prevState: { error: string | null }, formData: FormData) {
  const profile = await requireProfile();

  const parsed = PrivateSaleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form — some fields are missing or invalid." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("private_sales")
    .update({ ...parsed.data })
    .eq("id", id);

  if (error) {
    return { error: "Could not update the sale. " + error.message };
  }

  // Best-effort: the sale is already corrected either way, so a hiccup here
  // shouldn't block the user — it just means the invoice/challan may be
  // left out of date for this one and can be fixed manually.
  try {
    await syncInvoiceAfterSaleEdit({
      source: "private_sale",
      saleId: id,
      customerType: "private_company",
      customerId: parsed.data.company_id,
      productId: parsed.data.product_id,
      quantity: parsed.data.quantity_sold,
      unit_price: parsed.data.unit_price,
      sale_date: parsed.data.sale_date,
      region_id: profile.region_id ?? null,
      created_by: profile.id,
    });
  } catch (syncError) {
    console.error("[updatePrivateSale] auto invoice/challan resync failed:", syncError);
  }

  revalidatePath("/private-sales");
  revalidatePath("/invoices");
  redirect("/private-sales");
}
