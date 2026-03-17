"use server"

import prisma from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { createWebhook, getRepository } from "@/modules/github/lib/github"
import { inngest } from "@/inngest/client"
import { canConnectRepository,decrementRepositoryCount,incrementRepositoryCount } from "@/modules/payment/lib/subscription"


export const fetchRepositories = async (page:number=1 ,perPage:number =10)=>{
    const session = await auth.api.getSession({
        headers:await headers()
    })

    if(!session){
        throw new Error("Unauthorized");
    }

    const githubRepos = await getRepository(page,perPage);

    const dbRepos = await prisma.repository.findMany({
        where:{
            userId:session.user.id,
        }
    });

    const connectedRepoIds = new Set(dbRepos.map((repo=>repo.githubId)));

    return githubRepos.map((repo:any)=>({
        ...repo,
        isConnected:connectedRepoIds.has(BigInt(repo.id)),
    }))
}

export const connectRepository = async(owner:string, repo:string, githubId:number)=>{
    const session = await auth.api.getSession({
        headers:await headers()
    })

    if(!session){
        throw new Error("Unauthorized")
    }

    //TODO :check if user can connect repo
    const canConnect = await canConnectRepository(session.user.id);

    if(!canConnect){
        throw new Error("Repository limit reached .Please upgrade to Pro for unlimited repository")
    }

    const webhook = await createWebhook(owner,repo)

    if(webhook){
        await prisma.repository.create({
            data:{
                githubId:BigInt(githubId),
                name:repo,
                owner,
                fullname:`${owner}/${repo}`,
                url:`https://github.com/${owner}/${repo}`,
                userId:session.user.id
            }
        })
    

    //TODO: increment repository count for usage tracking
    await incrementRepositoryCount(session.user.id)

    // trigger repository indexing for RAG
    try {
        await inngest.send({
            name:"repository.connected",
            data:{
                owner,
                repo,
                userId:session.user.id
            }
        })
    } catch (error) {
        console.error("Failed to trigger repository indexing",error);
    }
}

    return webhook;
}

 