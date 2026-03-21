"use client"
import React from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {Github,BookOpen,Settings,Moon, Sun} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Logout  from "@/modules/auth/components/logout";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";


export const AppSidebar = () =>{
    const { theme, setTheme } = useTheme();
    const mounted = React.useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );
    const pathname = usePathname();
    const { data:session } = useSession();

const navigationItems =[
        {
            title:"Dashboard",
            url:"/dashboard",
            icon:BookOpen,
        },
        {
            title:"Repository",
            url:"/dashboard/repository",
            icon:Github,
        },
        {
            title:"Reviews",
            url:"/dashboard/reviews",
            icon:BookOpen,
        },
        {
            title:"Subscription",
            url:"/dashboard/subscription",
            icon:BookOpen,
        },
        {
            title:"Settings",
            url:"/dashboard/settings",
            icon:Settings,
        },
    ]

    const isActive = (url: string) => {
        // active when pathname exactly matches or is a child route
        return pathname === url || pathname.startsWith(url + "/");
    };

    if(!mounted) return null;

    const user = session?.user ?? { name: "GUEST", email: "", image: null };
    const userName = user.name || "GUEST";
    const userEmail = user.email || "";
    const userrInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();
    const userAvatar = user.image || "/placeholder.svg";

    return (
       <Sidebar>
            <SidebarHeader className="border-b">
                <div className="flex flex-col gap-4 px-2 py-6">
                    <div className="flex items-center gap-4 px-3 py-4 rounded-lg bg-sidebar-accent/50 
                    hover:bg-sidebar-accent/70 transition-colors">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary
                        text-primary-foreground shrink-0">
                            <Github className="w-6 h-6"/>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-sidebar-foregrounded tracking-wide">
                                Connected Account
                            </p>
                            <p className="text-sm font-medium text-sidebar-foreground/90">
                                @{userName}
                            </p>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-6 flex-col gap-1">
                <div className="mb-2">
                    <p className="text-xs font-semibold text-sidebar-foreground/60 px-3 mb-3 uppercase tracking-widest">Menu</p>
                </div>
                <SidebarMenu className="gap-2">
                    {navigationItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                tooltip={item.title}
                                isActive={isActive(item.url)}
                            >
                                <Link href={item.url} className="flex items-center gap-2 w-full">
                                    <item.icon className="w-5 h-5" />
                                    <span className="truncate">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="border-t px-3 py-4 flex flex-col gap-2">
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground"
                >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span className="text-sm font-medium">{theme === "dark" ? "Light" : "Dark"}</span>
                </button>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="h-12 px-4 rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors">
                                    <Avatar className="h-10 w-10 rounded-lg shrink-0">
                                        <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName}/>
                                        <AvatarFallback className="rounded-lg">
                                            {userrInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-relaxed min-w-0">
                                        <span className="truncate font-semibold text-base">{userName}</span>
                                        <span className="truncate text-xs text-sidebar-foreground/70">{userEmail}</span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent className="w-48" align="end">
                                <DropdownMenuItem asChild>
                                    <Logout className="w-full text-left">
                                        Sign out
                                    </Logout>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
} 

/**
 *  <div className="flex items-center gap-3 px-4 py-4 bg-sidebar-accent/30 rounded-t-lg">
                        <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
                            <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName}/>
                            <AvatarFallback className="rounded-lg">
                                {userrInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{userName}</p>
                            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        </div>
                        </div>
 */
