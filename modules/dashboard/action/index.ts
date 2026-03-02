"use server"

import{
    fetchUserContribution,  getGithubToken
} from "@/modules/github/lib/github"

import {auth} from "@/lib/auth"
import { headers } from "next/headers"
import { Octokit } from "octokit"
import prisma from "@/lib/db"

export async function getDashboardstats(){
    try {
        const session = await auth.api.getSession({
            headers:await headers()
        })
        if(!session?.user){
            throw new Error("UNauthorized");
        }

        const token = await getGithubToken()
        const octokit = new Octokit({auth:token})

        //getusers github username

        const {data:user} = await octokit.rest.users.getAuthenticated()

        //todo:fetch total conected repos 
        const totalRepos = 30
        const calender = await fetchUserContribution(token, user.login);
        const totalCommits = calender?.totalContributions ||0

        const {data:prs} = await octokit.rest.search.issuesAndPullRequests({
            q:`author:${user.login} type:pr`,
            per_page:1
        })

        const totalPRs = prs.total_count

        //TODo count AI reviews from database

        const totalReviews = 44

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

        const calender = await fetchUserContribution(token,user.login)
        if(!calender){
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

        calender.weeks.forEach((week:any)=>{
            week.contributiondays.forEach((day:any)=>{
                const date = new Date(day.data);
                const monthKey = monthNames[date.getMonth()];
                if(monthlydata[monthKey]){
                    monthlydata[monthKey].commits += day.contributionCount;
                }
            })  
        })

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6);

    //TODO real time review 

    const generateSampleReviews = () =>{
        const sampleReviews=[];
        const now = new Date();

        for(let i=0;i<45;i++){
            const randomDaysAgo = Math.floor(Math.random()*100);
            const reviewdate = new Date(now);
            reviewdate.setDate(reviewdate.getDate()-randomDaysAgo);

            sampleReviews.push({
                createdAt:reviewdate,
            });
        }
        return sampleReviews;
    }

    const reviews = generateSampleReviews();

    reviews.forEach((review)=>{
        const monthKey = monthNames[review.createdAt.getMonth()];
        if(monthlydata[monthKey]){
            monthlydata[monthKey].reviews +=1;
        }
    })

    const {data:prs} = await octokit.rest.search.issuesAndPullRequests({
        q:`author:${user.login} type:pr created ${
            sixMonthsAgo.toISOString().split("T")[0]
        }`,
        per_page:100,
    });

    prs.items.forEach((pr:any)=>{
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