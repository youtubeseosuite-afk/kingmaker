// Path: app/page.tsx | Type: UPDATE
import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";
import DashboardView from "./dashboard-view";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardView email={user.email ?? ""} />;
}
