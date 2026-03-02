import { NextResponse } from "next/server";
import { getContributionStats } from "@/modules/dashboard/action";

export async function GET(request: Request) {
  try {
    const data = await getContributionStats();
    return NextResponse.json(data);
  } catch (err) {
    console.error("/api/dashboard/contributions error", err);
    return NextResponse.json(null);
  }
}
