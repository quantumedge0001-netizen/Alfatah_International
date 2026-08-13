import { createClient } from "@/lib/supabase/server";

// Shared by both the "sale just created" and "sale just edited" flows below.
interface SaleContext {
  source: "sale" | "private_sale";
  saleId: string;
  customerType: "government_institution" | "private_company";
  customerId: string;
  productId: string;
  quantity: number;
  unit_price: number;
  sale_date: string;
  region_id: string | null;
  created_by: string;
}

async function loadDescriptionAndCustomerName(supabase: any, ctx: SaleContext) {
  const [{ data: product }, { data: customer }] = await Promise.all([
    supabase.from("products").select("name, unit").eq("id", ctx.productId).single(),
    ctx.customerType === "government_institution"
      ? supabase.from("government_institutions").select("name").eq("id", ctx.customerId).single()
      : supabase.from("private_companies").select("name").eq("id", ctx.customerId).single(),
  ]);
  return {
    description: product?.name ?? "Product",
    uom: product?.unit ?? "Units",
    customer_name:
      customer?.name ??
      (ctx.customerType === "government_institution" ? "Government Institution" : "Private Company"),
  };
}

// The source of truth is always invoice_items — never a running total —
// so this is re-derived after every insert/update/delete instead of nudged.
async function recomputeInvoiceTotal(supabase: any, invoiceId: string) {
  const { data: items } = await supabase.from("invoice_items").select("amount").eq("invoice_id", invoiceId);
  const total = (items ?? []).reduce((sum: number, it: any) => sum + Number(it.amount), 0);
  await supabase.from("invoices").update({ subtotal: total, grand_total: total }).eq("id", invoiceId);
}

// Challan line items are a snapshot of the invoice at generation time
// (see 0007_challans.sql) — this re-takes that snapshot so a corrected sale
// shows up on the delivery challan too, instead of leaving it silently
// wrong. Applies to every challan already generated off this invoice.
async function resyncChallansForInvoice(supabase: any, invoiceId: string) {
  const { data: items } = await supabase
    .from("invoice_items")
    .select("description, uom, quantity, unit_price, amount, sort_order")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  const { data: challans } = await supabase.from("challans").select("id").eq("invoice_id", invoiceId);
  const total = (items ?? []).reduce((sum: number, it: any) => sum + Number(it.amount), 0);

  for (const challan of challans ?? []) {
    await supabase.from("challan_items").delete().eq("challan_id", challan.id);
    if (items && items.length > 0) {
      await supabase.from("challan_items").insert(
        items.map((it: any) => ({
          challan_id: challan.id,
          description: it.description,
          uom: it.uom,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount,
          sort_order: it.sort_order,
        }))
      );
    }
    await supabase.from("challans").update({ subtotal: total }).eq("id", challan.id);
  }
}

// Finds this customer's existing sale-linked invoice for the given date, or
// creates a fresh invoice (+ its challan) if none exists yet. Never matches
// a hand-typed invoice — only ones that already contain a sale-linked item.
async function findOrCreateInvoice(supabase: any, ctx: SaleContext, customer_name: string): Promise<string | null> {
  const customerColumn = ctx.customerType === "government_institution" ? "institution_id" : "private_company_id";

  const { data: candidateInvoices } = await supabase
    .from("invoices")
    .select("id, invoice_items(sale_id, private_sale_id)")
    .eq(customerColumn, ctx.customerId)
    .eq("invoice_date", ctx.sale_date);

  const existing = (candidateInvoices ?? []).find((inv: any) =>
    (inv.invoice_items ?? []).some((it: any) => it.sale_id || it.private_sale_id)
  );
  if (existing) return existing.id;

  const { data: invoice } = await supabase
    .from("invoices")
    .insert({
      customer_type: ctx.customerType,
      private_company_id: ctx.customerType === "private_company" ? ctx.customerId : null,
      institution_id: ctx.customerType === "government_institution" ? ctx.customerId : null,
      customer_name,
      customer_address: null,
      invoice_date: ctx.sale_date,
      payment_method: "Cash",
      notes: null,
      subtotal: 0,
      grand_total: 0,
      region_id: ctx.region_id,
      created_by: ctx.created_by,
    })
    .select("id")
    .single();

  if (!invoice) return null;

  await supabase.from("challans").insert({
    invoice_id: invoice.id,
    customer_name,
    customer_address: null,
    payment_method: "Cash",
    subtotal: 0,
    region_id: ctx.region_id,
    created_by: ctx.created_by,
  });

  return invoice.id;
}

async function appendItemToInvoice(supabase: any, ctx: SaleContext, invoiceId: string, description: string, uom: string) {
  const { count } = await supabase
    .from("invoice_items")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", invoiceId);

  await supabase.from("invoice_items").insert({
    invoice_id: invoiceId,
    description,
    uom,
    quantity: ctx.quantity,
    unit_price: ctx.unit_price,
    amount: ctx.quantity * ctx.unit_price,
    sale_id: ctx.source === "sale" ? ctx.saleId : null,
    private_sale_id: ctx.source === "private_sale" ? ctx.saleId : null,
    sort_order: count ?? 0,
  });

  await recomputeInvoiceTotal(supabase, invoiceId);
  await resyncChallansForInvoice(supabase, invoiceId);
}

// Called right after a government or private sale row is inserted. Groups
// by (customer, sale_date): appends to that customer's existing sale-linked
// invoice for the day, or creates a fresh invoice + challan.
export async function syncInvoiceForSale(ctx: SaleContext) {
  const supabase = (await createClient()) as any;
  const { description, uom, customer_name } = await loadDescriptionAndCustomerName(supabase, ctx);

  const invoiceId = await findOrCreateInvoice(supabase, ctx, customer_name);
  if (!invoiceId) return;

  await appendItemToInvoice(supabase, ctx, invoiceId, description, uom);
}

// Called right after an existing sale row is corrected (edit form). Keeps
// its invoice line item — and the invoice + challan totals — in sync. If
// the customer or date changed, the item is moved out of its old invoice
// (deleting that invoice, and its challans, if it's now empty) and into
// whichever invoice the new customer/date belongs to.
export async function syncInvoiceAfterSaleEdit(ctx: SaleContext) {
  const supabase = (await createClient()) as any;
  const saleColumn = ctx.source === "sale" ? "sale_id" : "private_sale_id";

  const { data: existingItem } = await supabase
    .from("invoice_items")
    .select("id, invoice_id, invoices(invoice_date, institution_id, private_company_id)")
    .eq(saleColumn, ctx.saleId)
    .maybeSingle();

  // Not linked to any invoice (e.g. it predates this automatic system) —
  // nothing to resync, the corrected sale value just stands on its own.
  if (!existingItem) return;

  const { description, uom, customer_name } = await loadDescriptionAndCustomerName(supabase, ctx);
  const amount = ctx.quantity * ctx.unit_price;

  const oldInvoice = existingItem.invoices;
  const oldCustomerId =
    ctx.customerType === "government_institution" ? oldInvoice?.institution_id : oldInvoice?.private_company_id;
  const sameGroup = oldInvoice?.invoice_date === ctx.sale_date && oldCustomerId === ctx.customerId;

  if (sameGroup) {
    await supabase
      .from("invoice_items")
      .update({ description, uom, quantity: ctx.quantity, unit_price: ctx.unit_price, amount })
      .eq("id", existingItem.id);

    await recomputeInvoiceTotal(supabase, existingItem.invoice_id);
    await resyncChallansForInvoice(supabase, existingItem.invoice_id);
    return;
  }

  // Customer or date changed — move the item out of the old invoice first.
  const oldInvoiceId = existingItem.invoice_id;
  await supabase.from("invoice_items").delete().eq("id", existingItem.id);

  const { count: remaining } = await supabase
    .from("invoice_items")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", oldInvoiceId);

  if ((remaining ?? 0) === 0) {
    // Cascades to delete its (now-empty) challans/challan_items too.
    await supabase.from("invoices").delete().eq("id", oldInvoiceId);
  } else {
    await recomputeInvoiceTotal(supabase, oldInvoiceId);
    await resyncChallansForInvoice(supabase, oldInvoiceId);
  }

  const invoiceId = await findOrCreateInvoice(supabase, ctx, customer_name);
  if (!invoiceId) return;

  await appendItemToInvoice(supabase, ctx, invoiceId, description, uom);
}
