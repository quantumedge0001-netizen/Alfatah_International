"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  requireAdminOrAbove,
  requireRegionAccess,
} from "@/lib/authorization";

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
  // Only meaningful for super_admin — see region resolution below.
  region_id: z.string().uuid().optional(),
});

export async function createImport(_prevState: { error: string | null }, formData: FormData) {
  const profile = await requireProfile();

  // Import creation is an Admin-level operation — User role is view-only
  // for Inventory (see lib/auth/authorization.ts).
  try {
    requireAdminOrAbove(profile);
  } catch {
    return { error: "You do not have permission to record imports." };
  }

  const parsed = ImportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please check the form — some fields are missing or invalid." };
  }

  // Region resolution, same rule as stock.ts: Admin/User always write
  // into their own assigned region (never trust a region_id from the
  // form for them). super_admin must supply which region via the form
  // (add a region selector to the imports/new form for super_admin —
  // TODO if not already present).
  const targetRegionId =
    profile.role === "super_admin"
      ? (parsed.data.region_id ?? null)
      : profile.region_id;

  if (profile.role === "super_admin" && !targetRegionId) {
    return { error: "Please select a region for this import." };
  }

  try {
    requireRegionAccess(profile, targetRegionId, "create");
  } catch {
    return { error: "You do not have access to record imports for this region." };
  }

  // imports.region_id is NOT NULL in the database — an admin/user with no
  // region assigned on their profile can't record an import at all. This
  // also narrows targetRegionId from `string | null` to `string` for
  // TypeScript below.
  if (!targetRegionId) {
    return { error: "Your account has no assigned region. Ask your Admin to fix this." };
  }

  const { quantity, unit_cost, region_id: _formRegionId, ...rest } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("imports").insert({
    ...rest,
    quantity,
    unit_cost,
    total_cost: quantity * unit_cost,
    region_id: targetRegionId,
    created_by: profile.id,
  });

  if (error) {
    return { error: "Could not save the import record. " + error.message };
  }

  redirect("/imports");
}