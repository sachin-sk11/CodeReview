import { polarClient } from "@polar-sh/better-auth"
import {createAuthClient} from "better-auth/react"

export const {signIn,signOut,useSession,signUp,customer,checkout}=createAuthClient({
    baseURL:process.env.NEXT_PUBLIC_APP_BASE_URL,
    plugins:[polarClient()]
})
