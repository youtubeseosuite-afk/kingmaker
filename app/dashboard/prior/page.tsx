// Path: app/dashboard/prior/page.tsx | Type: UPDATE
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import PriorView from "./prior-view";

export default async function PriorPage() {
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
    .eq("role", "prior")
    .maybeSingle();

  const { data: kingdomResources } = await supabase
    .from("kingdom_resources")
    .select("resource_code, amount")
    .eq("realm_id", realm.id);

  return (
    <PriorView
      legitimacy={roleProfile?.legitimacy ?? 0}
      kingdomResources={kingdomResources ?? []}
    />
  );
}
