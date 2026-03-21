import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import {polarClient} from "@/modules/payment/config/polar"
import {polar, checkout,portal,usage,webhooks} from "@polar-sh/better-auth"
import { type SubscriptionTier, updatePolarCustomerId, updateUserTier } from "@/modules/payment/lib/subscription";

const normalizeSubscriptionTier = (tier: string | null | undefined): SubscriptionTier =>
    tier === "PRO" ? "PRO" : "FREE";


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

    plugins:[
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "e7b6af75-7ff0-4f51-a422-98a452aca44c",
                            slug: "code45" // Custom slug for easy reference in Checkout URL, e.g. /checkout/code45
                        }
                    ],
                    successUrl: process.env.POLAR_SUCCESS_URL || "/dashboard/subscription?success=true",
                    authenticatedUsersOnly: true
                }),
                portal({
                    returnUrl:process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000/dashboard",
                }),
                usage(),
                webhooks({
                    secret:process.env.POLAR_WEBHOOK_SECRET!,
                    onSubscriptionActive:async (payload)=>{
                        const customerId = payload.data.customerId;

                        const user = await prisma.user.findUnique({
                            where:{
                                polarCustomerId:customerId
                            }
                        });
                        
                        if(user){
                            await updateUserTier(user.id, "PRO","ACTIVE", payload.data.id)
                        }
                    },
                    onSubscriptionCanceled:async(payload)=>{
                        const customerId = payload.data.customerId;

                        const user = await prisma.user.findUnique({
                            where:{
                                polarCustomerId:customerId
                            }
                        });
                        
                        if(user){
                            await updateUserTier(
                                user.id,
                                normalizeSubscriptionTier(user.subscriptionTier),
                                "CANCELED"
                            )
                        }
                    },
                    onSubscriptionRevoked:async(payload)=>{
                        const customerId = payload.data.customerId;

                        const user = await prisma.user.findUnique({
                            where:{
                                polarCustomerId:customerId
                            }
                        });
                        
                        if(user){
                            await updateUserTier(user.id, "FREE","EXPIRED")
                        }
                    },
                    onOrderPaid:async()=>{},
                    onCustomerCreated:async(payload)=>{
                        const user = await prisma.user.findUnique({
                            where:{
                                email:payload.data.email
                            }
                        });

                        if(user){
                            await updatePolarCustomerId(user.id, payload.data.id)
                        }
                    }
                })
            ],
        })
    ]
});
