import type { BlockDevice } from "@/types/storage";
import { formatBytes } from "@/lib/format";

function transportLabel(device: BlockDevice): string {
  if (device.transport) return device.transport.toUpperCase();
  if (device.rotational === false) return "SSD";
  if (device.rotational === true) return "HDD";
  return "—";
}

function DeviceRow({ device, depth }: { device: BlockDevice; depth: number }) {
  return (
    <>
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2.5 last:border-b-0 dark:border-slate-700/60"
        style={{ paddingLeft: `${depth * 1.25}rem` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-sm text-slate-800 dark:text-slate-100">
            {device.path}
          </span>
          {device.mountpoint && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {device.mountpoint}
            </span>
          )}
          {device.fstype && (
            <span className="text-xs text-slate-400">{device.fstype}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {device.model && <span className="truncate">{device.model}</span>}
          <span className="rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-600">
            {transportLabel(device)}
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {formatBytes(device.sizeBytes)}
          </span>
        </div>
      </div>
      {device.children.map((child) => (
        <DeviceRow key={child.path} device={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function DiskTree({ disks }: { disks: BlockDevice[] }) {
  if (disks.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No physical disks detected.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {disks.map((disk) => (
        <DeviceRow key={disk.path} device={disk} depth={0} />
      ))}
    </div>
  );
}
