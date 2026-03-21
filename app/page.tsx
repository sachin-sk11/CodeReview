import { Button } from "@/components/ui/button";
import Logout from "@/modules/auth/components/logout";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import Image from "next/image";
import { connection } from "next/server";

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  await connection();
  await requireAuth();
  // send logged-in users straight to the dashboard
  redirect("/dashboard");
}
