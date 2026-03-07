import prisma from "@/lib/db";
import { inngest } from "../../inngest/client";
import { github, success } from "better-auth";
import { getRepoFileContent } from "@/modules/github/lib/github";
import { indexCodebase } from "@/modules/ai/lib/rag";

// export const helloWorld = inngest.createFunction(
//   { id: "hello-world" },
//   { event: "test/hello.world" },
//   async ({ event, step }) => {
//     await step.sleep("wait-a-moment", "1s");
//     return { message: `Hello ${event.data.email}!` };
//   },
// );


export const indexRepo = inngest.createFunction(
  {id:"index-repo" },
  {event:"repository.connected"},

  async ({event,step})=>{
    const {owner ,repo, userId} = event.data;

    //files
    const files = await step.run("fetch-files", async()=>{
      const account = await prisma.account.findFirst({
        where:{
          userId:userId,
          providerId:"github"
        }
      })

      if(!account?.accessToken){
        throw new Error("No Github access token found")
      }

      return await getRepoFileContent(account.accessToken,owner,repo)
    })

    await step.run("index-codebase",async()=>{
       await indexCodebase(`${owner}/${repo}`,files)
    })

    return {success:true, indexedFiles:files.length}
  }
)