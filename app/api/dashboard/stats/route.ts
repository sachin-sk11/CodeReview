import { NextResponse } from "next/server";
import { getDashboardstats, getContributionStats, getMonthlyActivity } from "@/modules/dashboard/action";

export async function GET(request: Request) {
  try {
    const stats = await getDashboardstats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("/api/dashboard/stats error", err);
    return NextResponse.json({
      totalCommits: 0,
      totalPRs: 0,
      totalReviews: 0,
      totalRepos: 0,
    });
  }
}
