"use client";

import { useEffect, useState } from "react";
import type { StorageReport } from "@/types/storage";
import { formatBytes } from "@/lib/format";
import { SummaryCard, UsageBar } from "@/components/ui";
import { FilesystemList } from "@/components/FilesystemList";
import { DiskTree } from "@/components/DiskTree";

const REFRESH_INTERVAL_MS = 15_000;

export function StorageDashboard() {
  const [report, setReport] = useState<StorageReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReport() {
      try {
        const res = await fetch("/api/storage", { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        const data = (await res.json()) as StorageReport;
        if (cancelled) return;
        setReport(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load storage data");
      }
    }

    fetchReport();
    const id = setInterval(fetchReport, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!report && !error) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Loading storage data…
      </p>
    );
  }

  if (!report) {
    return (
      <p className="text-sm text-red-500">
        {error ?? "Unable to load storage data."}
      </p>
    );
  }

  const { summary } = report;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {report.hostname}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Updated {new Date(report.generatedAt).toLocaleTimeString()}
            {error && (
              <span className="ml-2 text-amber-600">
                (showing last known data — {error})
              </span>
            )}
          </p>
        </div>
        {report.isMockData && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Sample data — run on Linux for live stats
          </span>
        )}
      </div>

      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total capacity" value={formatBytes(summary.totalBytes)} />
          <SummaryCard label="Used" value={formatBytes(summary.usedBytes)} />
          <SummaryCard label="Free" value={formatBytes(summary.availableBytes)} />
          <SummaryCard label="Usage" value={`${summary.usedPercent}%`} />
        </div>
        <UsageBar usedPercent={summary.usedPercent} className="mt-4 h-3" />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Mounted filesystems
        </h2>
        <FilesystemList filesystems={report.filesystems} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Physical disks
        </h2>
        <DiskTree disks={report.disks} />
      </section>
    </div>
  );
}
