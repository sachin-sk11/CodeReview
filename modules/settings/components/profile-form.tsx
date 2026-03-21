"use client";

import { Card,CardHeader,CardContent,CardDescription,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { updateUserProfile,getUserprofile } from "../actions";
import {toast} from "sonner";

export function ProfileForm(){
    const queryClient = useQueryClient();

    const {data:profile,isLoading}= useQuery({
        queryKey:["user-profile"],
        queryFn:async ()=>await getUserprofile(),
        staleTime:1000*60*5,
        refetchOnWindowFocus:false
    });

    const updateMutation = useMutation({
        mutationFn:async (data:{name:string;email:string})=>{
            return await updateUserProfile(data);
        },
        onSuccess:(result)=>{
            if(result?.success){
                queryClient.invalidateQueries({queryKey:["user-profile"]})
                toast.success("Profile updated successfullly");
            }
        },
        onError:()=>toast.error("Failed to update profile")
    })

    const handleSubmit = (e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        updateMutation.mutate({
            name:String(formData.get("name") || ""),
            email:String(formData.get("email") || ""),
        });
    }

    if(isLoading){
        return(
            <Card>
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                </div>
            </CardContent>
        </Card>
        );
    }

    return(
        <Card>
            <CardHeader>
                <CardTitle>Profile Setttings</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ajay A E"
                            defaultValue={profile?.name || ""}
                            disabled={updateMutation.isPending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email"
                            name="email"
                            type="email"
                            placeholder="ajay@example.com"
                            defaultValue={profile?.email || ""}
                            disabled={updateMutation.isPending}
                        />
                    </div>
                    <div>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending? "Savings... ":"Save Changes"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
