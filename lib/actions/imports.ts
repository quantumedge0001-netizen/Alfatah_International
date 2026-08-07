"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const ImportSchema = z.object({
  product_id: z.string().uuid(),
  supplier: z.string().min(1),
  country: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unit_cost: z.coerce.number().nonnegative(),
  currency: z.string().min(1),
  invoice_no: z.string().optional(),
  import_date: z.string().min(1),
  expected_arrival: z.string().optional(),
});

export async function createImport(_prevState: { error: string | null }, formData: FormData) {
  const profile = await requireProfile();

  const parsed = ImportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form — some fields are missing or invalid." };
  }

  if (!profile.region_id) {
    return { error: "Your account has no assigned region. Ask your Admin to fix this." };
  }

  const { quantity, unit_cost } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("imports").insert({
    ...parsed.data,
    total_cost: quantity * unit_cost,
    region_id: profile.region_id,
    created_by: profile.id,
  });

  if (error) {
    return { error: "Could not save the import record. " + error.message };
  }

  redirect("/imports");
}
