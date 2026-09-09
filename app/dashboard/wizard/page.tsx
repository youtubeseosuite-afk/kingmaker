// Path: app/dashboard/wizard/page.tsx | Type: UPDATE
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import WizardView from "./wizard-view";

export default async function WizardPage() {
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
    .select("id, sight, level")
    .eq("realm_id", realm.id)
    .eq("role", "wizard")
    .maybeSingle();

  const { data: kingdomResources } = await supabase.rpc("get_kingdom_resources", {
    p_realm_id: realm.id,
  });

  const { data: roleResources } = roleProfile
    ? await supabase.rpc("get_role_resources", {
        p_role_profile_id: roleProfile.id,
      })
    : { data: [] };

  const { data: tiles } = await supabase
    .from("tiles")
    .select("id, x, y, terrain")
    .eq("world_id", realm.world_id)
    .lt("x", 20)
    .lt("y", 20);

  const { data: visibility } = await supabase
    .from("realm_tile_visibility")
    .select("tile_id, visibility")
    .eq("realm_id", realm.id);

  const tileIds = (tiles ?? []).map((t) => t.id);
  const { data: ownership } =
    tileIds.length > 0
      ? await supabase
          .from("tile_ownership")
          .select("tile_id, status, owner_realm_id")
          .in("tile_id", tileIds)
      : { data: [] };

  const { data: buildings } = roleProfile
    ? await supabase
        .from("buildings")
        .select("building_type, level")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  const { data: skills } = await supabase
    .from("role_skills")
    .select("skill_code, skill_name, description, min_level, cost, target_type, offensive")
    .eq("role", "wizard")
    .order("min_level");

  const { data: unlocks } = roleProfile
    ? await supabase
        .from("role_skill_unlocks")
        .select("skill_code")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  return (
    <WizardView
      sight={roleProfile?.sight ?? 0}
      roleProfileId={roleProfile?.id ?? null}
      level={roleProfile?.level ?? 1}
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
      tiles={tiles ?? []}
      visibility={visibility ?? []}
      ownership={ownership ?? []}
      myRealmId={realm.id}
      buildings={buildings ?? []}
      skills={skills ?? []}
      unlockedCodes={(unlocks ?? []).map((u) => u.skill_code)}
    />
  );
}
