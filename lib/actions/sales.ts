"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { syncInvoiceForSale, syncInvoiceAfterSaleEdit } from "@/lib/invoices/auto";

const SaleSchema = z.object({
  institution_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unit_price: z.coerce.number().nonnegative(),
  sale_date: z.string().min(1),
  status: z.enum(["pending", "dispatched", "delivered"]),
});

export async function createSale(_prevState: { error: string | null }, formData: FormData) {
  const profile = await requireProfile();

  const parsed = SaleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form — some fields are missing or invalid." };
  }

  if (!profile.region_id) {
    return { error: "Your account has no assigned region. Ask your Admin to fix this." };
  }

  const { quantity, unit_price } = parsed.data;
  const supabase = await createClient();

  const { data: sale, error } = await supabase
    .from("sales")
    .insert({
      ...parsed.data,
      total_price: quantity * unit_price,
      region_id: profile.region_id,
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
      source: "sale",
      saleId: sale.id,
      customerType: "government_institution",
      customerId: parsed.data.institution_id,
      productId: parsed.data.product_id,
      quantity,
      unit_price,
      sale_date: parsed.data.sale_date,
      region_id: profile.region_id,
      created_by: profile.id,
    });
  } catch (syncError) {
    console.error("[createSale] auto invoice/challan sync failed:", syncError);
  }

  redirect("/sales");
}

export async function updateSale(id: string, _prevState: { error: string | null }, formData: FormData) {
  const profile = await requireProfile();

  const parsed = SaleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form — some fields are missing or invalid." };
  }

  const { quantity, unit_price } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase
    .from("sales")
    .update({
      ...parsed.data,
      total_price: quantity * unit_price,
    })
    .eq("id", id);

  if (error) {
    return { error: "Could not update the sale. " + error.message };
  }

  // Best-effort: the sale is already corrected either way, so a hiccup here
  // shouldn't block the user — it just means the invoice/challan may be
  // left out of date for this one and can be fixed manually.
  try {
    await syncInvoiceAfterSaleEdit({
      source: "sale",
      saleId: id,
      customerType: "government_institution",
      customerId: parsed.data.institution_id,
      productId: parsed.data.product_id,
      quantity,
      unit_price,
      sale_date: parsed.data.sale_date,
      region_id: profile.region_id ?? null,
      created_by: profile.id,
    });
  } catch (syncError) {
    console.error("[updateSale] auto invoice/challan resync failed:", syncError);
  }

  revalidatePath("/sales");
  revalidatePath("/invoices");
  redirect("/sales");
}
