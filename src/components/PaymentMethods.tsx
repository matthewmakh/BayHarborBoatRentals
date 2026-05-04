export function PaymentMethods({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-600">Payments</h3>
      <p className="mt-2 text-navy-800">{text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {["Visa", "Mastercard", "Amex", "Discover", "Apple Pay"].map((m) => (
          <span key={m} className="rounded-md bg-navy-50 px-3 py-1 text-xs font-medium text-navy-700 border border-navy-200">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
