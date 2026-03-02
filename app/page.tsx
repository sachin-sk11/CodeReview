import { Button } from "@/components/ui/button";
import Logout from "@/modules/auth/components/logout";
import { requireAuth } from "@/modules/auth/utils/auth-utils";
import Image from "next/image";

import { redirect } from "next/navigation";

export default async function Home() {
  await requireAuth();
  // send logged-in users straight to the dashboard
  redirect("/dashboard");
}
