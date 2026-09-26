import { execFile } from "node:child_process";
import { hostname, networkInterfaces, platform } from "node:os";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import type {
    BlockDevice,
    FilesystemInfo,
    NetworkAddress,
    RunningService,
    StorageReport,
    StorageSummary,
    SystemInfo,
} from "@/types/storage";

const execFileAsync = promisify(execFile);

// Pseudo/virtual filesystems that don't represent real storage capacity.
const IGNORED_FSTYPES = new Set([
    "tmpfs",
    "devtmpfs",
    "squashfs",
    "overlay",
    "proc",
    "sysfs",
    "cgroup",
    "cgroup2",
    "devpts",
    "mqueue",
    "debugfs",
    "tracefs",
    "configfs",
    "pstore",
    "securityfs",
    "efivarfs",
    "fusectl",
    "binfmt_misc",
    "autofs",
    "hugetlbfs",
    "rpc_pipefs",
]);

interface LsblkDevice {
    name: string;
    path: string | null;
    size: string | number | null;
    type: string | null;
    model: string | null;
    tran: string | null;
    rota: string | number | boolean | null;
    fstype: string | null;
    mountpoint: string | null;
    children?: LsblkDevice[];
}

function toBoolean(value: LsblkDevice["rota"]): boolean | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "boolean") return value;
    return String(value) === "1" || String(value).toLowerCase() === "true";
}

function toBytes(value: string | number | null): number {
    if (value === null || value === undefined) return 0;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function mapDevice(device: LsblkDevice): BlockDevice {
    return {
        name: device.name,
        path: device.path ?? `/dev/${device.name}`,
        sizeBytes: toBytes(device.size),
        type: device.type ?? "unknown",
        model: device.model?.trim() || null,
        transport: device.tran ?? null,
        rotational: toBoolean(device.rota),
        fstype: device.fstype ?? null,
        mountpoint: device.mountpoint ?? null,
        children: (device.children ?? []).map(mapDevice),
    };
}

async function collectDisks(): Promise<BlockDevice[]> {
    const { stdout } = await execFileAsync("lsblk", [
        "-J",
        "-b",
        "-o",
        "NAME,PATH,SIZE,TYPE,MODEL,TRAN,ROTA,FSTYPE,MOUNTPOINT",
    ]);
    const parsed = JSON.parse(stdout) as { blockdevices: LsblkDevice[] };
    return parsed.blockdevices.filter((d) => d.type === "disk").map(mapDevice);
}

async function collectFilesystems(): Promise<FilesystemInfo[]> {
    // -P: POSIX output (one line per fs), -k: 1024-byte blocks, -T: include fs type
    const { stdout } = await execFileAsync("df", ["-kPT"]);
    const lines = stdout.trim().split("\n").slice(1); // drop header
    const filesystems: FilesystemInfo[] = [];

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 7) continue;
        const [
            filesystem,
            fstype,
            sizeStr,
            usedStr,
            availStr,
            ,
            ...mountParts
        ] = parts;
        const mountpoint = mountParts.join(" ");

        if (IGNORED_FSTYPES.has(fstype)) continue;
        if (!filesystem.startsWith("/dev/") && fstype !== "zfs") continue;

        const sizeBytes = Number(sizeStr) * 1024;
        const usedBytes = Number(usedStr) * 1024;
        const availableBytes = Number(availStr) * 1024;
        if (sizeBytes <= 0) continue;

        filesystems.push({
            filesystem,
            mountpoint,
            fstype,
            sizeBytes,
            usedBytes,
            availableBytes,
            usedPercent: Math.round((usedBytes / sizeBytes) * 1000) / 10,
        });
    }

    return filesystems;
}

async function collectUptime(): Promise<number> {
    const contents = await readFile("/proc/uptime", "utf8");
    const uptimeSeconds = Number(contents.trim().split(/\s+/)[0]);
    return Number.isFinite(uptimeSeconds) ? uptimeSeconds : 0;
}

function collectNetworkAddresses(): NetworkAddress[] {
    return Object.entries(networkInterfaces()).flatMap(
        ([interfaceName, addresses]) =>
            (addresses ?? [])
                .filter((address) => !address.internal)
                .map((address) => ({
                    interface: interfaceName,
                    address: address.address,
                    family: address.family as "IPv4" | "IPv6",
                })),
    );
}

async function collectServices(): Promise<{
    services: RunningService[];
    available: boolean;
}> {
    try {
        const { stdout } = await execFileAsync("systemctl", [
            "list-units",
            "--type=service",
            "--state=running",
            "--no-legend",
            "--no-pager",
        ]);
        const services = stdout
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) =>
                line.trim().match(/^(\S+)\s+\S+\s+\S+\s+\S+\s+(.*)$/),
            )
            .filter((match): match is RegExpMatchArray => match !== null)
            .map((match) => ({
                name: match[1].replace(/\.service$/, ""),
                description: match[2],
            }));
        return { services, available: true };
    } catch {
        return { services: [], available: false };
    }
}

async function collectSystemInfo(): Promise<SystemInfo> {
    const [uptimeSeconds, servicesResult] = await Promise.all([
        collectUptime(),
        collectServices(),
    ]);
    return {
        uptimeSeconds,
        networkAddresses: collectNetworkAddresses(),
        services: servicesResult.services,
        servicesAvailable: servicesResult.available,
    };
}

function summarize(filesystems: FilesystemInfo[]): StorageSummary {
    // Avoid double-counting the same device mounted more than once (e.g. bind mounts).
    const seen = new Set<string>();
    let totalBytes = 0;
    let usedBytes = 0;
    let availableBytes = 0;

    for (const fs of filesystems) {
        if (seen.has(fs.filesystem)) continue;
        seen.add(fs.filesystem);
        totalBytes += fs.sizeBytes;
        usedBytes += fs.usedBytes;
        availableBytes += fs.availableBytes;
    }

    return {
        totalBytes,
        usedBytes,
        availableBytes,
        usedPercent:
            totalBytes > 0
                ? Math.round((usedBytes / totalBytes) * 1000) / 10
                : 0,
    };
}

function buildMockReport(): StorageReport {
    const filesystems: FilesystemInfo[] = [
        {
            filesystem: "/dev/nvme0n1p2",
            mountpoint: "/",
            fstype: "ext4",
            sizeBytes: 500_000_000_000,
            usedBytes: 210_000_000_000,
            availableBytes: 290_000_000_000,
            usedPercent: 42,
        },
        {
            filesystem: "/dev/sda1",
            mountpoint: "/mnt/storage",
            fstype: "ext4",
            sizeBytes: 4_000_000_000_000,
            usedBytes: 3_100_000_000_000,
            availableBytes: 900_000_000_000,
            usedPercent: 77.5,
        },
    ];

    const disks: BlockDevice[] = [
        {
            name: "nvme0n1",
            path: "/dev/nvme0n1",
            sizeBytes: 500_000_000_000,
            type: "disk",
            model: "Sample NVMe SSD 500GB",
            transport: "nvme",
            rotational: false,
            fstype: null,
            mountpoint: null,
            children: [
                {
                    name: "nvme0n1p1",
                    path: "/dev/nvme0n1p1",
                    sizeBytes: 500_000_000,
                    type: "part",
                    model: null,
                    transport: null,
                    rotational: false,
                    fstype: "vfat",
                    mountpoint: "/boot/efi",
                    children: [],
                },
                {
                    name: "nvme0n1p2",
                    path: "/dev/nvme0n1p2",
                    sizeBytes: 499_500_000_000,
                    type: "part",
                    model: null,
                    transport: null,
                    rotational: false,
                    fstype: "ext4",
                    mountpoint: "/",
                    children: [],
                },
            ],
        },
        {
            name: "sda",
            path: "/dev/sda",
            sizeBytes: 4_000_000_000_000,
            type: "disk",
            model: "Sample USB HDD 4TB",
            transport: "usb",
            rotational: true,
            fstype: null,
            mountpoint: null,
            children: [
                {
                    name: "sda1",
                    path: "/dev/sda1",
                    sizeBytes: 4_000_000_000_000,
                    type: "part",
                    model: null,
                    transport: null,
                    rotational: true,
                    fstype: "ext4",
                    mountpoint: "/mnt/storage",
                    children: [],
                },
            ],
        },
    ];

    return {
        hostname: hostname(),
        platform: platform(),
        generatedAt: new Date().toISOString(),
        isMockData: true,
        summary: summarize(filesystems),
        filesystems,
        disks,
        system: {
            uptimeSeconds: 3 * 24 * 60 * 60 + 7 * 60 * 60 + 24 * 60 + 18,
            networkAddresses: [
                { interface: "eth0", address: "192.168.1.42", family: "IPv4" },
            ],
            services: [
                { name: "ssh", description: "OpenBSD Secure Shell server" },
                {
                    name: "docker",
                    description: "Docker Application Container Engine",
                },
                { name: "nginx", description: "A high performance web server" },
            ],
            servicesAvailable: true,
        },
    };
}

export async function getStorageReport(): Promise<StorageReport> {
    if (platform() !== "linux") {
        return buildMockReport();
    }

    try {
        const [disks, filesystems, system] = await Promise.all([
            collectDisks(),
            collectFilesystems(),
            collectSystemInfo(),
        ]);

        return {
            hostname: hostname(),
            platform: platform(),
            generatedAt: new Date().toISOString(),
            isMockData: false,
            summary: summarize(filesystems),
            filesystems,
            disks,
            system,
        };
    } catch (error) {
        console.error(
            "Failed to collect real storage data, falling back to mock data:",
            error,
        );
        return buildMockReport();
    }
}
