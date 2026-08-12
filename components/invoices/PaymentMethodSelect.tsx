import Select from "@/components/ui/Select";
import { PAYMENT_METHODS } from "@/lib/invoices/constants";
import type { PaymentMethod } from "@/lib/invoices/types";

export default function PaymentMethodSelect({
  value,
  onChange,
  className = "input",
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  className?: string;
}) {
  return (
    <Select
      className={className}
      value={value}
      onChange={(v) => onChange(v as PaymentMethod)}
      options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))}
    />
  );
}
