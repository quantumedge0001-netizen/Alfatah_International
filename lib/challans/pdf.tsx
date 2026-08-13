import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { LETTERHEAD_DATA_URI } from "@/lib/invoices/assets";
import { COMPANY_INFO } from "@/lib/invoices/constants";
import { WhatsAppIcon, EmailIcon, MapPinIcon } from "@/lib/invoices/pdfIcons";
import { NAVY, CYAN, TINT, LINE } from "@/lib/pdfBrand";
import type { Challan, ChallanItem } from "./types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  letterhead: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  content: {
    marginTop: 110,
    marginBottom: 92,
    paddingHorizontal: 40,
    // Same "signature always near the bottom" trick as the invoice PDF —
    // see lib/invoices/pdf.tsx for the full explanation.
    minHeight: 590,
    flexDirection: "column",
  },
  spacer: {
    flexGrow: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    letterSpacing: 1,
  },
  titleAccent: {
    marginTop: 6,
    width: 42,
    height: 3,
    backgroundColor: CYAN,
    borderRadius: 2,
  },
  metaBox: {
    backgroundColor: TINT,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 190,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 8.5,
    color: "#5b6b82",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
  },
  sectionLabel: {
    fontSize: 8.5,
    color: "#5b6b82",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  fromBlock: {
    marginBottom: 12,
  },
  toBlock: {
    marginBottom: 12,
  },
  bodyLine: {
    fontSize: 9.5,
    color: "#1a1a1a",
  },
  customerName: {
    fontSize: 11.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 1,
    marginBottom: 1,
  },
  subject: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginBottom: 10,
    textDecoration: "underline",
  },
  table: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: NAVY,
  },
  headerCell: {
    padding: 8,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  cell: {
    padding: 8,
    fontSize: 9.5,
    borderTopWidth: 1,
    borderTopColor: LINE,
  },
  rowAlt: {
    backgroundColor: "#f7f9fb",
  },
  colNo: { width: "6%", textAlign: "center" },
  colDesc: { width: "36%" },
  colUom: { width: "10%", textAlign: "center" },
  colQty: { width: "12%", textAlign: "center" },
  colPrice: { width: "16%", textAlign: "right" },
  colAmount: { width: "20%", textAlign: "right" },
  totalBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: NAVY,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 10,
    color: CYAN,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginRight: 12,
  },
  totalValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 220,
  },
  signerBlock: {
    marginTop: 16,
  },
  signerName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: NAVY,
    marginTop: 1,
  },
  signerCompany: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#1a1a1a",
    marginTop: 1,
    marginBottom: 3,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  contactIcon: {
    marginRight: 6,
  },
  contactText: {
    fontSize: 9,
    color: "#3a4a5c",
  },
});

function fmt(n: number) {
  return n.toLocaleString("en-PK");
}

export default function ChallanDocument({
  challan,
  items,
}: {
  challan: Challan;
  items: ChallanItem[];
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Image src={LETTERHEAD_DATA_URI} style={styles.letterhead} fixed />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.title}>DELIVERY CHALLAN</Text>
              <View style={styles.titleAccent} />
            </View>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Challan No</Text>
                <Text style={styles.metaValue}>{challan.challan_no}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>
                  {new Date(challan.challan_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.fromBlock}>
            <Text style={styles.sectionLabel}>From</Text>
            <Text style={[styles.bodyLine, { fontFamily: "Helvetica-Bold" }]}>{COMPANY_INFO.companyName}</Text>
            <Text style={styles.bodyLine}>{COMPANY_INFO.signerName}</Text>
            <Text style={styles.bodyLine}>{COMPANY_INFO.signerTitle}</Text>
            <Text style={styles.bodyLine}>{COMPANY_INFO.phone}</Text>
            <Text style={styles.bodyLine}>{COMPANY_INFO.email}</Text>
          </View>

          <View style={styles.toBlock}>
            <Text style={styles.sectionLabel}>To</Text>
            <Text style={styles.bodyLine}>The Management,</Text>
            <Text style={styles.customerName}>{challan.customer_name}</Text>
            {challan.customer_address ? <Text style={styles.bodyLine}>{challan.customer_address}</Text> : null}
          </View>

          <Text style={styles.subject}>Subject: Delivery Confirmation</Text>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.colNo]}>S.No</Text>
              <Text style={[styles.headerCell, styles.colDesc]}>Item Description</Text>
              <Text style={[styles.headerCell, styles.colUom]}>UOM</Text>
              <Text style={[styles.headerCell, styles.colQty]}>Qty</Text>
              <Text style={[styles.headerCell, styles.colPrice]}>Unit Price (PKR)</Text>
              <Text style={[styles.headerCell, styles.colAmount]}>Amount</Text>
            </View>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, ...(index % 2 === 1 ? [styles.rowAlt] : [])]}
              >
                <Text style={[styles.cell, styles.colNo]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.cell, styles.colUom]}>{item.uom}</Text>
                <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cell, styles.colPrice]}>{fmt(item.unit_price)}</Text>
                <Text style={[styles.cell, styles.colAmount]}>{fmt(item.amount)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>Rs. {fmt(challan.subtotal)}/-</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <Text style={styles.bodyLine}>{challan.payment_method}</Text>
          </View>

          <View style={styles.spacer} />

          <View style={styles.signerBlock}>
            <Text style={styles.bodyLine}>Warm Regards,</Text>
            <Text style={styles.signerName}>{COMPANY_INFO.signerName}</Text>
            <Text style={styles.signerCompany}>{COMPANY_INFO.companyName}</Text>

            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <WhatsAppIcon size={10} />
              </View>
              <Text style={styles.contactText}>{COMPANY_INFO.phone}</Text>
            </View>
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <EmailIcon size={10} />
              </View>
              <Text style={styles.contactText}>{COMPANY_INFO.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <View style={styles.contactIcon}>
                <MapPinIcon size={10} />
              </View>
              <Text style={styles.contactText}>{COMPANY_INFO.address}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
