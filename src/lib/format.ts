const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

export function formatBytes(bytes: number, decimals = 1): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const exponent = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        UNITS.length - 1,
    );
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${UNITS[exponent]}`;
}

export function usageColor(percent: number): string {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 75) return "bg-amber-500";
    return "bg-emerald-500";
}

export function formatUptime(seconds: number): string {
    const totalMinutes = Math.floor(Math.max(0, seconds) / 60);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(" ");
}
