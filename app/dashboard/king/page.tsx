// Path: app/dashboard/king/page.tsx | Type: UPDATE
export const dynamic = "force-dynamic";

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
    .select("id, world_id")
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

  const { data: buildings } = roleProfile
    ? await supabase
        .from("buildings")
        .select("building_type, level")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  const { data: buildingTypes } = await supabase
    .from("building_types")
    .select(
      "building_type, display_name, description, wood_cost_per_level, stone_cost_per_level, requires_building_type, requires_level"
    )
    .eq("role", "king")
    .order("building_type");

  const { data: skills } = await supabase
    .from("role_skills")
    .select("skill_code, skill_name, description, min_level, cost, target_type, offensive")
    .eq("role", "king")
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

  const { data: structures } = await supabase
    .from("field_structures")
    .select("tile_id, structure_type, level")
    .eq("realm_id", realm.id);

  return (
    <KingView
      legitimacy={roleProfile?.legitimacy ?? 0}
      roleProfileId={roleProfile?.id ?? null}
      level={roleProfile?.level ?? 1}
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
      buildings={buildings ?? []}
      buildingTypes={buildingTypes ?? []}
      skills={skills ?? []}
      unlockedCodes={(unlocks ?? []).map((u) => u.skill_code)}
      realmId={realm.id}
      activeModifiers={activeModifiers ?? []}
      tiles={tiles ?? []}
      visibility={visibility ?? []}
      ownership={ownership ?? []}
      structures={structures ?? []}
    />
  );
}
