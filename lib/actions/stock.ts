"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  requireAdminOrAbove,
  requireRegionAccess,
} from "@/lib/authorization";

export async function createStockItem(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const profile = await requireProfile();

  // Stock creation is an Admin-level operation — User role is view-only
  // for Inventory (see lib/auth/authorization.ts).
  try {
    requireAdminOrAbove(profile);
  } catch {
    return { error: "You do not have permission to add stock items." };
  }

  const item_description = String(formData.get("item_description") || "").trim();
  const condition = String(formData.get("condition") || "");
  const origin_make = String(formData.get("origin_make") || "").trim();
  const model_type = String(formData.get("model_type") || "").trim();
  const size_capacity = String(formData.get("size_capacity") || "").trim();
  const quantity = Number(formData.get("quantity"));
  const unit_price = Number(formData.get("unit_price"));

  if (!item_description) {
    return { error: "Item description is required." };
  }
  if (!quantity || quantity <= 0) {
    return { error: "Quantity must be greater than 0." };
  }
  if (!unit_price || unit_price < 0) {
    return { error: "Unit price is required." };
  }

  // Region resolution: Admin always writes into their own region — never
  // trust a region_id from the form for a non-super_admin, since that
  // would let someone tamper with the request to write into another
  // region. super_admin may create in any region; the form must supply
  // which one via a region_id field (add a region selector to the
  // stock/new form for super_admin users — TODO if not already present).
  const formRegionId = formData.get("region_id");
  const targetRegionId =
    profile.role === "super_admin"
      ? (formRegionId ? String(formRegionId) : null)
      : profile.region_id;

  if (profile.role === "super_admin" && !targetRegionId) {
    return { error: "Please select a region for this stock item." };
  }

  try {
    requireRegionAccess(profile, targetRegionId, "create");
  } catch {
    return { error: "You do not have access to create stock items in this region." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("stock_items").insert({
    item_description,
    condition: condition || null,
    origin_make: origin_make || null,
    model_type: model_type || null,
    size_capacity: size_capacity || null,
    quantity,
    unit_price,
    region_id: targetRegionId,
    created_by: profile.id,
  });

  if (error) {
    console.error("[createStockItem] insert error:", error.message);
    return { error: "Failed to save stock item. Please try again." };
  }

  redirect("/stock");
}