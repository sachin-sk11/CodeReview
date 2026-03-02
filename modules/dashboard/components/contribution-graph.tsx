"use client"
import React from "react";
import {ActivityCalendar} from "react-activity-calendar"
import { useTheme } from "next-themes";
import { useQuery } from "@tanstack/react-query";

const ContributionGraph=()=>{
    const {theme} = useTheme();

    type ContributionStats = {
        totalContributions: number;
        contributions: Array<{date:string; count:number; level:number}>;
    };

    const fetchGraph = async (): Promise<ContributionStats | null> => {
        try {
            const res = await fetch("/api/dashboard/contributions", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch contributions");
            return res.json();
        } catch (err) {
            console.error("fetchGraph error", err);
            throw err;
        }
    };

    const { data, isLoading } = useQuery<ContributionStats | null>({
        queryKey:["contribution-graph"],
        queryFn: fetchGraph,
        staleTime:1000*60*5
    });

    if (isLoading) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-8">
                <div className="animate-pulse text-muted-foreground">
                    Loading contribution data...
                </div>
            </div>
        );
    }

    if (!data || data.contributions.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-8">
                <div className="animate-pulse text-muted-foreground">
                    NO contribution data available
                </div>
            </div>
        );
    }

    const total = data.totalContributions;

    return (
        <div className="w-full flex flex-col items-center gap-4 p-4">
            <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                    {total.toLocaleString()}
                </span>
                contributions in the last year
            </div>
            <div className="w-full overflow-x-auto">
                <div className="flex justify-center min-w-max px-4">
                    <ActivityCalendar
                    data={data.contributions}
                    colorScheme={theme === "dark" ? "dark" : "light"}
                    blockSize={11}
                    blockMargin={4}
                    fontSize={14}
                    showWeekdayLabels
                    showMonthLabels
                    theme={
                        {
                            light:['hsl(0,0%,92%)','hsl(142,71%,45%)'],
                            dark:['#161b22','hsl(142,71%,45%)'],
                        }
                    }
                    />
                </div>
            </div>
        </div>
    );
}

export default ContributionGraph;