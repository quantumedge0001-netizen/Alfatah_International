"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PrivateCompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  city: z.string().optional(),
  contact_info: z.string().optional(),
});

export async function createPrivateCompany(
  _prevState: { error: string | null },
  formData: FormData
) {
  const profile = await requireProfile();

  if (profile.role === "user") {
    return { error: "Only Admins can add private companies." };
  }

  const parsed = PrivateCompanySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form — company name is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("private_companies").insert({
    name: parsed.data.name,
    city: parsed.data.city || null,
    contact_info: parsed.data.contact_info || null,
    // Left NULL for super_admin (global) unless they want it region-tagged.
    // Admins creating a company are implicitly scoped by RLS to their own
    // region for private_sales later, so region_id here is informational only.
    region_id: profile.region_id ?? null,
  });

  if (error) {
    return { error: "Could not save the company. " + error.message };
  }

  revalidatePath("/admin/private-companies");
  return { error: null };
}
