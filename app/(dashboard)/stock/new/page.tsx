import StockForm from "@/components/StockForm";

export default function NewStockPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-[#072F5F]">New Stock Item</h1>
        <p className="mt-0.5 text-[13px] text-muted">Manually add a stock item to the record</p>
      </div>
      <StockForm />
    </div>
  );
}