"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function createStockItem(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const profile = await requireProfile();

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

  const supabase = await createClient();

  const { error } = await supabase.from("stock_items").insert({
    item_description,
    condition: condition || null,
    origin_make: origin_make || null,
    model_type: model_type || null,
    size_capacity: size_capacity || null,
    quantity,
    unit_price,
    created_by: profile.id,
  });

  if (error) {
    console.error("[createStockItem] insert error:", error.message);
    return { error: "Failed to save stock item. Please try again." };
  }

  redirect("/stock");
}