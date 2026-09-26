import type { FilesystemInfo } from "@/types/storage";
import { formatBytes } from "@/lib/format";
import { UsageBar, bytesLabel } from "@/components/ui";

export function FilesystemList({
  filesystems,
}: {
  filesystems: FilesystemInfo[];
}) {
  if (filesystems.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No mounted filesystems detected.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filesystems.map((fs) => (
        <div
          key={`${fs.filesystem}-${fs.mountpoint}`}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate font-medium text-slate-900 dark:text-slate-50">
                {fs.mountpoint}
              </span>
              <span className="truncate font-mono text-xs text-slate-500 dark:text-slate-400">
                {fs.filesystem}
              </span>
              <span className="text-xs text-slate-400">{fs.fstype}</span>
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {fs.usedPercent}%
            </span>
          </div>
          <UsageBar usedPercent={fs.usedPercent} />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {bytesLabel(fs.usedBytes, fs.sizeBytes)} used ·{" "}
            {formatBytes(fs.availableBytes)} free
          </p>
        </div>
      ))}
    </div>
  );
}
