import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import ChallanDocument from "@/lib/challans/pdf";
import type { Challan, ChallanItem } from "@/lib/challans/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;

  const supabase = (await createClient()) as any;
  const { data: challan, error } = await supabase
    .from("challans")
    .select("*, challan_items(*)")
    .eq("id", id)
    .single();

  if (error || !challan) {
    return NextResponse.json({ error: "Challan not found" }, { status: 404 });
  }

  const items = ((challan.challan_items ?? []) as ChallanItem[])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  const buffer = await renderToBuffer(
    ChallanDocument({ challan: challan as Challan, items }) as any
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${challan.challan_no}.pdf"`,
    },
  });
}
