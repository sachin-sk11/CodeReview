import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    socialProviders:{
        github:{
            clientId:process.env.GITHUB_CLIENT_ID!,
            clientSecret:process.env.GITHUB_CLIENT_SECRET,
            scope:["repo"]
        }
    },
    trustedOrigins: [
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_BASE_URL!,
  ].filter(Boolean) as string[],
});