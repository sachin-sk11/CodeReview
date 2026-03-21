import {Octokit} from 'octokit';
import {auth} from "@/lib/auth";
import prisma from "@/lib/db"
import { headers } from 'next/headers';

type ContributionDay = {
    contributionCount: number;
    date: string;
    color: string;
};

type ContributionWeek = {
    contributionDays: ContributionDay[];
};

type ContributionCalendar = {
    totalContributions: number;
    weeks: ContributionWeek[];
};


/** getting the github access token */

export const getGithubToken = async ()=>{
    const session = await auth.api.getSession({
        headers:await headers()
    })
    if(!session){
        throw new Error("Unauthorized")
    }

    const account = await prisma.account.findFirst({
        where:{
            userId:session.user.id,
            providerId:"github"
        }
    })
    if(!account?.accessToken){
        throw new Error ("no Github access token found")
    }
    return account.accessToken;
}
export async function fetchUserContribution(token: string, username: string) {
    const octokit = new Octokit({ auth: token });

    const query = `
    query($username:String!){
        user(login:$username){
            contributionsCollection{
                contributionCalendar{
                    totalContributions
                    weeks{
                        contributionDays{
                            contributionCount
                            date
                            color
                        }
                    }
                }
            }
        }
    }
    `;

    try {
        const response = await octokit.graphql<{
            user: {
                contributionsCollection: {
                    contributionCalendar: ContributionCalendar
                }
            }
        }>(query, { username });

        return response.user.contributionsCollection.contributionCalendar;

    } catch (error) {
        console.error("GitHub GraphQL ERROR:", error);
        throw error; // 🔥 IMPORTANT
    }
}
        

export const getRepository = async (page:number=1 , perPage:number=10)=>{
    const token = await getGithubToken();
    const octokit = new Octokit({auth:token});

    const {data} = await octokit.rest.repos.listForAuthenticatedUser({
        sort:"updated",
        direction:"desc",
        visibility:"all",
        per_page:perPage,
        page:page
    })

    return data;
}

export const createWebhook = async(owner:string,repo:string)=>{
    const token = await getGithubToken();
    const octokit = new Octokit({auth:token});

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if(!webhookSecret){
        throw new Error("GITHUB_WEBHOOK_SECRET is not configured");
    }

    const {data:hooks} = await octokit.rest.repos.listWebhooks({
        owner,
        repo
    })

    const existinghook = hooks.find(hook=>hook.config.url === webhookUrl);
    if(existinghook){
        return existinghook;
    }

    const {data} = await octokit.rest.repos.createWebhook({
        owner,
        repo,
        config:{
            url:webhookUrl,
            content_type:"json",
            secret:webhookSecret
        },
        events:["pull_request"]
    });
    return data; 
}


export const deleteWebhook = async (owner:string, repo:string)=>{
    const token = await getGithubToken();
    const octokit = new Octokit({auth:token});
    const webhookurl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`;

    try {
        const {data:hooks} = await octokit.rest.repos.listWebhooks({
            owner,
            repo
        });

        const hookToDelete = hooks.find(hook =>hook.config.url === webhookurl);

        if(hookToDelete){
            await octokit.rest.repos.deleteWebhook({
                owner,
                repo,
                hook_id:hookToDelete.id
            })
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error deleting webhooks",error);
        return false;
    }
}

export async function getRepoFileContent(
    token:string,
    owner:string,
    repo:string,
    path:string=""
):Promise<{path:string,content:string}[]>{
    const octokit = new Octokit({auth:token});

    const {data} = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
    });

    if(!Array.isArray(data)){
        if(data.type === "file" && data.content){
            return[{
                path:data.path,
                content:Buffer.from(data.content, "base64").toString("utf-8"),
            }];
        }
        return [];
    }

    let files:{path:string, content:string}[]=[];
    for(const item of data){
        if(item.type === "file"){
            const {data:fileData} = await octokit.rest.repos.getContent({
                owner,
                repo,
                path:item.path
            })

            if(!Array.isArray(fileData) && fileData.type === "file" && fileData.content){
                //filter out non-code files if needed
                //for now lets include everything that looks text
                if(!item.path.match(/\.(png|jpg|jpeg|gif|svg|ico|pdf|zip|tar|qz)$/i)){
                    files.push({
                        path:item.path,
                        content:Buffer.from(fileData.content, "base64").toString("utf-8"),
                    });
                }
            }
           
        }
        else if(item.type === "dir"){
            const subFiles = await getRepoFileContent(token,owner,repo,item.path)

            files = files.concat(subFiles);
        }
    }
    return files;
}

export async function getPullRequestDiff(
    token:string,
    owner:string,
    repo:string,
    prNumber:number
){
    const octokit = new Octokit({auth:token})

    const {data:pr} = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number:prNumber
    })

    const {data:diff} = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number:prNumber,
        mediaType:{
            format:"diff"
        }
    })
    return{
        diff:diff as unknown as string,
        title:pr.title,
        description:pr.body || "",
    }
}

export async function postReviewComment(
    token:string,
    owner:string,
    repo:string,
    prNumber:number,
    review:string
){
    const octokit  = new Octokit({auth:token});

    await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number:prNumber,
        body:`## AI Code Review\n\n ${review}\n\n---\n*Powered by CodeReview`
    })
}
