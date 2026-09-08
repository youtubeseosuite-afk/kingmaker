// Path: app/dashboard/king/page.tsx | Type: UPDATE
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import KingView from "./king-view";

export default async function KingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: realm } = await supabase
    .from("realms")
    .select("id")
    .eq("player_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!realm) {
    redirect("/new-realm");
  }

  const { data: roleProfile } = await supabase
    .from("role_profiles")
    .select("id, legitimacy")
    .eq("realm_id", realm.id)
    .eq("role", "king")
    .maybeSingle();

  const { data: kingdomResources } = await supabase
    .from("kingdom_resources")
    .select("resource_code, amount")
    .eq("realm_id", realm.id);

  const { data: roleResources } = roleProfile
    ? await supabase
        .from("role_resources")
        .select("resource_code, amount")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  return (
    <KingView
      legitimacy={roleProfile?.legitimacy ?? 0}
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
    />
  );
}
