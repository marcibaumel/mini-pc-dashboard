export interface FilesystemInfo {
    filesystem: string;
    mountpoint: string;
    fstype: string;
    sizeBytes: number;
    usedBytes: number;
    availableBytes: number;
    usedPercent: number;
}

export interface BlockDevice {
    name: string;
    path: string;
    sizeBytes: number;
    type: string; // disk, part, rom, lvm...
    model: string | null;
    transport: string | null; // usb, sata, nvme...
    rotational: boolean | null;
    fstype: string | null;
    mountpoint: string | null;
    children: BlockDevice[];
}

export interface StorageSummary {
    totalBytes: number;
    usedBytes: number;
    availableBytes: number;
    usedPercent: number;
}

export interface StorageReport {
    hostname: string;
    platform: string;
    generatedAt: string;
    isMockData: boolean;
    summary: StorageSummary;
    filesystems: FilesystemInfo[];
    disks: BlockDevice[];
}
