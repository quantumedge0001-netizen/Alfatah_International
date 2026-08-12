import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import InvoiceDocument from "@/lib/invoices/pdf";
import type { Invoice, InvoiceItem } from "@/lib/invoices/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;

  const supabase = (await createClient()) as any;
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const items = ((invoice.invoice_items ?? []) as InvoiceItem[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const buffer = await renderToBuffer(
    InvoiceDocument({ invoice: invoice as Invoice, items }) as any
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_no}.pdf"`,
    },
  });
}
