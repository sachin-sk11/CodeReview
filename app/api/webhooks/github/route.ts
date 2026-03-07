import { reviewPullRequest } from "@/modules/ai/actions";
import { NextRequest,NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        const body = await req.json();
        const event = req.headers.get("x-github-event");

        if(event==="ping"){
            return NextResponse.json({message:"Pong"},{status:200})
        }

        if(event==="pull_request"){
            const action = body.action;
            const repo = body.repository.full_name;
            const prNumber = body.number;

            const [owner, repoName] = repo.split("/")

            if(action === "opened" || action === "synchronize"){
                reviewPullRequest(owner, repoName , prNumber)
                .then(()=>console.log(`Review completed for ${repo} #${prNumber}`))
                .catch((e)=>console.log(`Review Failed for ${repo} #${prNumber}`))
            }
        }

        //TODO for pull request

        return NextResponse.json({message:"Event Process"},{status:200})
    } catch (error) {
        console.error("Error processing webhook",error);
        return NextResponse.json({error:"internal server error"},{status:500})
    }
}