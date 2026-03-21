"use server"

import{
    fetchUserContribution,  getGithubToken
} from "@/modules/github/lib/github"

import {auth} from "@/lib/auth"
import { headers } from "next/headers"
import { Octokit } from "octokit"
import prisma from "@/lib/db"

type ContributionDay = {
    date: string;
    contributionCount: number;
};

type ContributionWeek = {
    contributionDays: ContributionDay[];
};

type PullRequestSearchItem = {
    created_at: string;
};

export  async function getContributionStats(){
    try {
        const session = await auth.api.getSession({
            headers:await headers()
        })
        if(!session?.user){
            console.warn("getContributionStats: no session found");
            throw new Error("UNauthorized");
        }

        const token = await getGithubToken();
        const octokit = new Octokit({auth:token});
         const {data:user} = await octokit.rest.users.getAuthenticated()
        const username = user.login;

        const calendar = await fetchUserContribution(token, username);

        if (!calendar) {
            return null;
        }

        // weeks and days are returned by the GitHub query using the
        // exact field names from the GraphQL schema (note the lowercase
        // "contributiondays" and the "data" property for the date).
        const contribution = calendar.weeks.flatMap((week: ContributionWeek) =>
            week.contributionDays.map((day: ContributionDay) => ({
                date: day.date,
                count: day.contributionCount,
                level: Math.min(4, Math.floor(day.contributionCount / 3)),
            }))
        );
        

        // include total contributions so the UI can display a summary
        return {
            totalContributions: calendar.totalContributions,
            contributions: contribution,
        };
    } catch (error) {
        console.error("Error fetching contribution stats", error);
        return null;
    }
}



export async function getDashboardstats(){
    try {
        const session = await auth.api.getSession({
            headers:await headers()
        })
        if(!session?.user){
            console.warn("getDashboardstats: no session found");
            throw new Error("UNauthorized");
        }

        const token = await getGithubToken()
        const octokit = new Octokit({auth:token})

        //getusers github username

        const {data:user} = await octokit.rest.users.getAuthenticated()

        const totalRepos = await prisma.repository.count({
            where:{
                userId:session.user.id
            }
        })
        const calendar = await fetchUserContribution(token, user.login);
        const totalCommits = calendar?.totalContributions || 0;

        const {data:prs} = await octokit.rest.search.issuesAndPullRequests({
            q:`author:${user.login} type:pr`,
            per_page:1
        })

        const totalPRs = prs.total_count

        const totalReviews = await prisma.review.count({
            where:{
                repository:{
                    userId:session.user.id
                }
            }
        })

        return {
            totalCommits,
            totalPRs,
            totalReviews,
            totalRepos
        }
    } catch (error) {
        console.log("Error fetching dashboard stats", error);
        return {
            totalCommits:0,
            totalPRs:0,
            totalReviews:0,
            totalRepos:0
        }
    }
}

export async function getMonthlyActivity(){
    try {
        const session = await auth.api.getSession({
            headers:await headers()
        })
        if(!session?.user){
            throw new Error("UNauthorized");
        }
        const token = await getGithubToken()
        const octokit = new Octokit({auth:token})

        const {data:user} = await octokit.rest.users.getAuthenticated()

        const calendar = await fetchUserContribution(token, user.login)
        if(!calendar){
            return [];
        }

        const monthlydata:{
            [key:string]:{commits:number, prs:number, reviews:number}
        }={}

        const monthNames =[
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const now = new Date();
        for(let i=5;i>=0;i--){
            const date = new Date(now.getFullYear(),now.getMonth()-i,1);
            const monthKey = monthNames[date.getMonth()];
            monthlydata[monthKey] = {commits:0,prs:0,reviews:0};
        }

        calendar.weeks.forEach((week:ContributionWeek)=>{
            week.contributionDays.forEach((day:ContributionDay)=>{
                const date = new Date(day.date);
                const monthKey = monthNames[date.getMonth()];
                if(monthlydata[monthKey]){
                    monthlydata[monthKey].commits += day.contributionCount;
                }
            })  
        })

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6);

    const repositories = await prisma.repository.findMany({
        where:{
            userId:session.user.id
        },
        select:{
            id:true
        }
    })

    const reviews = await prisma.review.findMany({
        where:{
            repositoryId:{
                in:repositories.map((repo)=>repo.id)
            },
            createdAt:{
                gte:sixMonthsAgo
            }
        },
        select:{
            createdAt:true
        }
    });

    reviews.forEach((review)=>{
        const monthKey = monthNames[review.createdAt.getMonth()];
        if(monthlydata[monthKey]){
            monthlydata[monthKey].reviews +=1;
        }
    })

    const {data:prs} = await octokit.rest.search.issuesAndPullRequests({
        q:`author:${user.login} type:pr created:>=${ 
            sixMonthsAgo.toISOString().split("T")[0]
        }`,
        per_page:100,
    });

    prs.items.forEach((pr:PullRequestSearchItem)=>{
        const date = new Date(pr.created_at);
        const monthKey = monthNames[date.getMonth()];
        if(monthlydata[monthKey]){
            monthlydata[monthKey].prs+=1;
        }
    });

    return Object.keys(monthlydata).map((name)=>({
        name,
        ...monthlydata[name],
    }))

    }
    catch (error) {
        console.log("Error fetching monthly activity", error);
        return []
    }
}


