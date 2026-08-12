import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { LETTERHEAD_DATA_URI } from "./assets";
import { COMPANY_INFO } from "./constants";
import { WhatsAppIcon, EmailIcon, MapPinIcon } from "./pdfIcons";
import type { Invoice, InvoiceItem } from "./types";

// Brand palette — mirrors the app theme (Sidebar.tsx / globals.css) so the
// PDF reads as the same product, not a generic template.
const NAVY = "#072F5F";
const CYAN = "#58CCED";
const TINT = "#eef4fb";
const LINE = "#d7dcd6";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "#eef4fb", text: "#0a3d7a" },
  sent: { bg: "#fff6e0", text: "#8a6d00" },
  paid: { bg: "#e6f7fc", text: NAVY },
};

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
    // Fills the printable zone between the letterhead's header and footer
    // graphics (792 page height - 110 top - 92 bottom) so the flexGrow
    // spacer below has room to push the signature block down to the
    // bottom of the page instead of it sitting right under the total —
    // matching how a real signed letter is laid out. Short invoices get
    // pushed to the bottom; long ones just fill the box naturally.
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
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
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
  statusBadge: {
    marginTop: 6,
    alignSelf: "flex-end",
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  billToBox: {
    marginBottom: 12,
  },
  billToLabel: {
    fontSize: 8.5,
    color: "#5b6b82",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  customerName: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 1,
    marginBottom: 1,
  },
  customerAddress: {
    fontSize: 9.5,
    color: "#3a4a5c",
    lineHeight: 1.3,
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
  colDesc: { width: "34%" },
  colUom: { width: "12%", textAlign: "center" },
  colQty: { width: "14%", textAlign: "center" },
  colPrice: { width: "18%", textAlign: "right" },
  colAmount: { width: "22%", textAlign: "right" },
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
  footerLabel: {
    fontSize: 8.5,
    color: "#5b6b82",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  footerValue: {
    fontSize: 10,
    color: "#1a1a1a",
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
  signatureLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 16,
    marginBottom: 4,
  },
  signatureBox: {
    height: 32,
    width: 240,
  },
});

function fmt(n: number) {
  return n.toLocaleString("en-PK");
}

export default function InvoiceDocument({
  invoice,
  items,
}: {
  invoice: Invoice;
  items: InvoiceItem[];
}) {
  const status = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* `fixed` repeats this on every page — without it, if the invoice
            has enough items/notes to spill onto a second page, the
            letterhead only shows on the first page and the overflow page
            renders with no letterhead at all. */}
        <Image src={LETTERHEAD_DATA_URI} style={styles.letterhead} fixed />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.title}>INVOICE</Text>
              <View style={styles.titleAccent} />
            </View>
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No</Text>
                <Text style={styles.metaValue}>{invoice.invoice_no}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>
                  {new Date(invoice.invoice_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusBadge,
                  { backgroundColor: status.bg, color: status.text },
                ]}
              >
                {invoice.status}
              </Text>
            </View>
          </View>

          <View style={styles.billToBox}>
            <Text style={styles.billToLabel}>Invoice To</Text>
            <Text style={styles.footerValue}>To,</Text>
            <Text style={styles.footerValue}>The Management,</Text>
            <Text style={styles.customerName}>{invoice.customer_name}</Text>
            {invoice.customer_address ? (
              <Text style={styles.customerAddress}>{invoice.customer_address}</Text>
            ) : null}
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.headerCell, styles.colDesc]}>Description</Text>
              <Text style={[styles.headerCell, styles.colUom]}>UOM</Text>
              <Text style={[styles.headerCell, styles.colQty]}>Quantity</Text>
              <Text style={[styles.headerCell, styles.colPrice]}>Unit Price (PKR)</Text>
              <Text style={[styles.headerCell, styles.colAmount]}>Amount</Text>
            </View>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, ...(index % 2 === 1 ? [styles.rowAlt] : [])]}
              >
                <Text style={[styles.cell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.cell, styles.colUom]}>{item.uom}</Text>
                <Text style={[styles.cell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.cell, styles.colPrice]}>{fmt(item.unit_price)}</Text>
                <Text style={[styles.cell, styles.colAmount]}>{fmt(item.amount)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>Rs. {fmt(invoice.grand_total)}/-</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.footerLabel}>Payment Method</Text>
            <Text style={styles.footerValue}>{invoice.payment_method}</Text>
          </View>
          {invoice.notes ? (
            <>
              <Text style={[styles.footerLabel, { marginTop: 6 }]}>Notes</Text>
              <Text style={styles.footerValue}>{invoice.notes}</Text>
            </>
          ) : null}

          <View style={styles.spacer} />

          <View style={styles.signerBlock}>
            <Text style={styles.footerValue}>Warm Regards,</Text>
            <Text style={styles.signerName}>{COMPANY_INFO.signerName}</Text>
            <Text style={styles.footerValue}>{COMPANY_INFO.signerTitle}</Text>
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

          <Text style={styles.signatureLabel}>Authorized Signature &amp; Stamp:</Text>
          <View style={styles.signatureBox} />
        </View>
      </Page>
    </Document>
  );
}
