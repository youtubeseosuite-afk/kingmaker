"use server";
// Path: app/actions.ts | Type: NEW

import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
