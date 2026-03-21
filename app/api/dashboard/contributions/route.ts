import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getContributionStats } from "@/modules/dashboard/action";

export async function GET(request: Request) {
  await connection();
  try {
    const data = await getContributionStats();
    return NextResponse.json(data);
  } catch (err) {
    console.error("/api/dashboard/contributions error", err);
    return NextResponse.json(null);
  }
}
