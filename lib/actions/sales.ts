"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  const supabase = createClient();

  const { error } = await supabase.from("sales").insert({
    ...parsed.data,
    total_price: quantity * unit_price,
    region_id: profile.region_id,
    created_by: profile.id,
  });

  if (error) {
    return { error: "Could not save the sale. " + error.message };
  }

  redirect("/sales");
}
