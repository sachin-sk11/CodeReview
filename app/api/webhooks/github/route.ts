import crypto from "node:crypto";
import { reviewPullRequest } from "@/modules/ai/actions";
import { NextRequest,NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-hub-signature-256");
        const event = req.headers.get("x-github-event");
        const secret = process.env.GITHUB_WEBHOOK_SECRET;

        if(!secret || !signature){
            return NextResponse.json({error:"Missing webhook secret"},{status:401})
        }

        const expectedSignature = `sha256=${crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex")}`;

        const isValidSignature =
            signature.length === expectedSignature.length &&
            crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );

        if(!isValidSignature){
            return NextResponse.json({error:"Invalid signature"},{status:401})
        }

        const body = JSON.parse(rawBody);

        if(event==="ping"){
            return NextResponse.json({message:"Pong"},{status:200})
        }

        if(event==="pull_request"){
            const action = body.action;
            const repo = body.repository.full_name;
            const prNumber = body.number;

            const [owner, repoName] = repo.split("/")

            if(action === "opened" || action === "synchronize"){
                await reviewPullRequest(owner, repoName , prNumber)
                console.log(`Review queued for ${repo} #${prNumber}`)
            }
        }

        //TODO for pull request

        return NextResponse.json({message:"Event Process"},{status:200})
    } catch (error) {
        console.error("Error processing webhook",error);
        return NextResponse.json({error:"internal server error"},{status:500})
    }
}
