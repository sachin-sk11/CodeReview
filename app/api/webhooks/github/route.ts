import { NextRequest,NextResponse } from "next/server";

export async function POST(req:NextRequest){
    try {
        const body = await req.json();
        const event = req.headers.get("x-github-event");

        if(event==="ping"){
            return NextResponse.json({message:"Pong"},{status:200})
        }

        //TODO for pull request

        return NextResponse.json({message:"Event Process"},{status:200})
    } catch (error) {
        console.error("Error processing webhook",error);
        return NextResponse.json({error:"internal server error"},{status:500})
    }
}