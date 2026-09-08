"use server";
// Path: app/new-realm/actions.ts | Type: NEW

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export async function createRealm(formData: FormData) {
  const supabase = await createClient();

  const username = formData.get("username") as string;
  const worldId = formData.get("world_id") as string;
  const role = formData.get("role") as string;
  const name = formData.get("name") as string;

  const { error } = await supabase.rpc("create_realm", {
    p_world_id: worldId,
    p_role: role,
    p_name: name,
    p_username: username,
  });

  if (error) {
    redirect(`/new-realm?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}
