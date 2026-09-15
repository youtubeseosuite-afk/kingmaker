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
    .select("id, legitimacy, level")
    .eq("realm_id", realm.id)
    .eq("role", "prior")
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

  const { data: buildings } = roleProfile
    ? await supabase
        .from("buildings")
        .select("building_type, level")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  const { data: skills } = await supabase
    .from("role_skills")
    .select("skill_code, skill_name, description, min_level, cost, target_type, offensive")
    .eq("role", "prior")
    .order("min_level");

  const { data: unlocks } = roleProfile
    ? await supabase
        .from("role_skill_unlocks")
        .select("skill_code")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  const nowIso = new Date().toISOString();
  const { data: activeModifiers } = roleProfile
    ? await supabase
        .from("active_modifiers")
        .select("id, modifier_code, modifier_value, expires_at, role_skills(skill_name)")
        .or(
          `and(target_type.eq.role_profile,target_id.eq.${roleProfile.id}),and(target_type.eq.realm,target_id.eq.${realm.id})`
        )
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    : { data: [] };

  return (
    <PriorView
      legitimacy={roleProfile?.legitimacy ?? 0}
      roleProfileId={roleProfile?.id ?? null}
      level={roleProfile?.level ?? 1}
      kingdomResources={kingdomResources ?? []}
      buildings={buildings ?? []}
      skills={skills ?? []}
      unlockedCodes={(unlocks ?? []).map((u) => u.skill_code)}
      realmId={realm.id}
      kingRoleProfileId={kingProfile?.id ?? null}
      activeModifiers={activeModifiers ?? []}
    />
  );
}
