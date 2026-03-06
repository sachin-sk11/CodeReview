import {Octokit} from 'octokit';
import {auth} from "@/lib/auth";
import prisma from "@/lib/db"
import { headers } from 'next/headers';


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
                    contributionCalendar: any
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
            content_type:"json"
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