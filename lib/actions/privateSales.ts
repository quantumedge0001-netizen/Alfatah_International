"use server";

import { createClient } from "@/lib/supabase/server"; // ⚠️ adjust if your path differs
import { revalidatePath } from "next/cache";

export async function createPrivateSale(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("region_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.region_id) {
    return { error: "Your account has no region assigned. Contact an admin." };
  }

  const region_id = profile.region_id; // now guaranteed to be a string

  const company_id = formData.get("company_id") as string;
  const product_id = formData.get("product_id") as string;
  const quantity_sold = Number(formData.get("quantity_sold"));
  const unit_price = Number(formData.get("unit_price"));
  const sale_date = formData.get("sale_date") as string;
  const delivery_status = formData.get("delivery_status") as string;

  // 1) Check there's enough stock before saving the sale
  const { data: inv, error: invError } = await supabase
    .from("inventory")
    .select("id, quantity_available")
    .eq("product_id", product_id)
    .eq("region_id", region_id)
    .single();

  if (invError || !inv) {
    return { error: "Inventory record not found for this product/region." };
  }

  if (inv.quantity_available < quantity_sold) {
    return {
      error: `Not enough stock. Available: ${inv.quantity_available}`,
    };
  }

  // 2) Insert the sale
  const { error: saleError } = await supabase.from("private_sales").insert({
    company_id,
    product_id,
    quantity_sold,
    unit_price,
    sale_date,
    delivery_status,
    region_id,
    created_by: user.id,
  });

  if (saleError) {
    return { error: saleError.message };
  }

  // 3) Deduct inventory (same pattern your Government Sales flow uses)
  const { error: updateError } = await supabase
    .from("inventory")
    .update({ quantity_available: inv.quantity_available - quantity_sold })
    .eq("id", inv.id);

  if (updateError) {
    return {
      error:
        "Sale was saved, but inventory update failed: " + updateError.message,
    };
  }

  revalidatePath("/private-sales");
  return { error: null };
}

export async function getPrivateCompanies() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("private_companies")
    .select("id, name, city")
    .order("name");
  return data ?? [];
}

export async function createPrivateCompany(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("region_id")
    .eq("id", user.id)
    .single();

  if (!profile?.region_id) {
    return { error: "Your account has no region assigned. Contact an admin." };
  }

  const { error } = await supabase.from("private_companies").insert({
    name: formData.get("name") as string,
    city: formData.get("city") as string,
    contact_info: formData.get("contact_info") as string,
    region_id: profile.region_id,
  });

  if (error) return { error: error.message };

  revalidatePath("/private-sales");
  return { error: null };
}