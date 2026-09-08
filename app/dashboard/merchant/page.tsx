// Path: app/dashboard/merchant/page.tsx | Type: UPDATE
import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import MerchantView from "./merchant-view";

export default async function MerchantPage() {
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
    .select("id")
    .eq("realm_id", realm.id)
    .eq("role", "merchant")
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
    <MerchantView
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
    />
  );
}
