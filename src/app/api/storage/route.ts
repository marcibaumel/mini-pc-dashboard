import { NextResponse } from "next/server";
import { getStorageReport } from "@/lib/systemStats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
    const report = await getStorageReport();
    return NextResponse.json(report, {
        headers: { "Cache-Control": "no-store" },
    });
}
