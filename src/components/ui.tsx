import { formatBytes, usageColor } from "@/lib/format";

export function UsageBar({
  usedPercent,
  className = "",
}: {
  usedPercent: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, usedPercent));
  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${usageColor(clamped)}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

export function bytesLabel(used: number, total: number): string {
  return `${formatBytes(used)} of ${formatBytes(total)}`;
}
