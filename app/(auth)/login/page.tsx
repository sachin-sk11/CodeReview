import LoginUI from "@/modules/auth/components/login-ui";
import { requireUnAuth } from "@/modules/auth/utils/auth-utils";
import React from "react";
import { connection } from "next/server";

export const dynamic = "force-dynamic";

const LoginPage=async ()=>{
    await connection();
    await requireUnAuth();
    return(
        <div>
            <LoginUI />
        </div>
    )
}
export default LoginPage;
