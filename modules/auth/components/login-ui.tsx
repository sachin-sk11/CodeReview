"use client"

import {useState} from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { CloudCog, GithubIcon } from "lucide-react";

const LoginUI= ()=>{

    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const handleGithubLogin=async ()=>{
        setIsLoading(true);
        try {
            await signIn.social({
                provider:"github"
            });
            // after successful OAuth flow the app will reload;
            // if we still end up here push to dashboard just in case
            router.push("/dashboard");
        } catch (error) {
            console.log("Login Error", error);
            setIsLoading(false);
        }
    }
    return(
        <div className="min-h-screen bg-linear-to-br from-black via-black to-zinc-900 text-white dark flex">
            {/* Left Section, Hero Content*/}
            <div className="flex-1 flex flex-col justify-center px-12 py-16">
                <div className="max-w-lg">
                    {/*log*/}
                    <div className="mb-16">
                        <div className="inline-flex items-center gap-2 text-2xl font-bold">
                            <div className="w-8 h-8 bg- rounded-full">
                                <span>CodeReview</span>
                            </div>
                        </div>
                    </div>

                    {/*Main Content */}
                    <h1 className="text-5xl font-bold mb-6 leading-tight text-balance">
                        Cut Code Review Time and Bugs in Half. <span className="block">Instantly.</span>
                    </h1>
                    
                    <p className="text-lg text-grey-400 leading-relaxed">
                        SuperCharge your team to ship faster with the most advanced AI code Reviews.
                    </p>
                </div>
            </div>

            {/* Right Section, Login Form  */}
            <div className="flex-1 flex flex-col justify-center items-center px-12 py-16">
                <div className="w-full max-w-sm">
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-2">Welcom Back</h2>
                        <p className="text-grey-400"> Login using one of the following Providers</p>
                    </div>

                    {/*Github Login Button */}
                    <button
                        onClick={handleGithubLogin}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-white text-black rounded-lg font-semiold
                        hover:bg-grey-100 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors flex items-center justify-center gap-3 mb-8">
                        <GithubIcon size={20}/>
                        {isLoading?"Signing in ... ": "GitHub"}
                    </button>

                    {/*Footer Link */}
                    <div className="space-y-4 text-center text-sm text-gray-400">
                        <div>
                            New To CodeReview?{" "}
                            <a href="#" className="text-orange-500 hover:text-orange-400 font-semibold">Sign Up</a>
                        </div>
                        <div>
                            <a href="#" className="text-orange-500 hover:text-orange-400 font-semibold">
                                Self Hosted Services 
                            </a>
                        </div>
                    </div>
                    {/*Bottom links */}
                    <div className="mt-12 pt-8 border-t border-gray-700 flex justify-center gap-4 text-xs 
                    text-gray-500">
                        <a href="#" className="hover:text-orange-400">Terms of Service</a>
                        <a href="#" className="hover:text-orange-400">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginUI;