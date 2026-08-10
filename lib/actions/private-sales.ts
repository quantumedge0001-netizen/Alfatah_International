"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  const { error } = await supabase.from("private_sales").insert({
    ...parsed.data,
    region_id: profile.region_id ?? null,
    created_by: profile.id,
  });

  if (error) {
    return { error: "Could not save the sale. " + error.message };
  }

  redirect("/private-sales");
}
