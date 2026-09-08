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
    .select("id, world_id")
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

  const { data: kingProfile } = await supabase
    .from("role_profiles")
    .select("id")
    .eq("realm_id", realm.id)
    .eq("role", "king")
    .maybeSingle();

  const { data: kingdomResources } = await supabase.rpc("get_kingdom_resources", {
    p_realm_id: realm.id,
  });

  const { data: roleResources } = roleProfile
    ? await supabase.rpc("get_role_resources", {
        p_role_profile_id: roleProfile.id,
      })
    : { data: [] };

  return (
    <MerchantView
      worldId={realm.world_id}
      roleProfileId={roleProfile?.id ?? null}
      kingRoleProfileId={kingProfile?.id ?? null}
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
    />
  );
}
