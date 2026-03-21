import { NextResponse } from "next/server";
import { getMonthlyActivity } from "@/modules/dashboard/action";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const data = await getMonthlyActivity();
    return NextResponse.json(data);
  } catch (err) {
    console.error("/api/dashboard/activity error", err);
    return NextResponse.json([]);
  }
}
