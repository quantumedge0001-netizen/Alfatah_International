"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DISTRICTS } from "@/lib/constants";

const InstitutionSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  district: z.enum(DISTRICTS),
  contact_info: z.string().optional(),
});

export async function createInstitution(_prevState: { error: string | null }, formData: FormData) {
  const profile = await requireProfile();

  if (profile.role === "user") {
    return { error: "Only Admins can add government institutions." };
  }

  const parsed = InstitutionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  // Cast: the generated Database type still only lists the original three
  // districts (Jamshoro/Tharparkar/Umerkot) — see supabase/migrations/0006.
  const supabase = (await createClient()) as any;
  const { error } = await supabase.from("government_institutions").insert({
    name: parsed.data.name,
    district: parsed.data.district,
    contact_info: parsed.data.contact_info || null,
  });

  if (error) {
    return { error: "Could not save the institution. " + error.message };
  }

  revalidatePath("/admin/institutions");
  return { error: null };
}
