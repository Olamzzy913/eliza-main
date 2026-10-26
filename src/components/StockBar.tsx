/** How many are left, in green, or amber when it's running low. */
export function StockBar({ left, low = 3 }: { left: number; low?: number }) {
  const tone = left <= low ? "text-amber-700" : "text-green-700";
  const dot = left <= low ? "bg-amber-500" : "bg-green-600";
  return (
    <p className={`flex items-center gap-2 text-sm font-medium ${tone}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {left} left in stock
    </p>
  );
}
