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
    .select("id, legitimacy, level, tax_rate")
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

  const { data: kingdomCaps } = await supabase
    .from("kingdom_resources")
    .select("resource_code, storage_cap")
    .eq("realm_id", realm.id);

  const { data: roleCaps } = roleProfile
    ? await supabase
        .from("role_resources")
        .select("resource_code, storage_cap")
        .eq("role_profile_id", roleProfile.id)
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

  const { data: population } = await supabase.rpc("get_realm_population", {
    p_realm_id: realm.id,
  });

  const { data: weaponTemplates } = await supabase
    .from("weapon_templates")
    .select("id, name, tier, unit_type, base_cp, materials, production_seconds, min_forge_level")
    .order("min_forge_level");

  const { data: productionQueue } = roleProfile
    ? await supabase
        .from("production_queue")
        .select("id, weapon_template_id, quantity, started_at, completes_at, collected")
        .eq("role_profile_id", roleProfile.id)
        .eq("collected", false)
    : { data: [] };

  const { data: weaponSets } = roleProfile
    ? await supabase
        .from("weapon_sets")
        .select("id, weapon_template_id, quantity, equipped_quantity")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  const { data: garrison } = await supabase
    .from("realm_units")
    .select("id, unit_type, quantity")
    .eq("realm_id", realm.id)
    .is("tile_id", null);

  const { data: unitTypes } = await supabase
    .from("unit_types")
    .select("code, display_name, base_cp, training_time_seconds, training_cost_food")
    .order("training_cost_food");

  const { data: trainingQueue } = roleProfile
    ? await supabase
        .from("unit_training_queue")
        .select("id, unit_type, quantity, started_at, completes_at, collected")
        .eq("role_profile_id", roleProfile.id)
        .eq("collected", false)
    : { data: [] };

  const { data: armyCp } = await supabase.rpc("calculate_army_cp", {
    p_realm_id: realm.id,
  });

  return (
    <KingView
      legitimacy={roleProfile?.legitimacy ?? 0}
      roleProfileId={roleProfile?.id ?? null}
      level={roleProfile?.level ?? 1}
      taxRate={roleProfile?.tax_rate ?? 10}
      population={population ?? { population: 0, cap: 0, growth_rate: 0 }}
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
      kingdomCaps={kingdomCaps ?? []}
      roleCaps={roleCaps ?? []}
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
      weaponTemplates={weaponTemplates ?? []}
      productionQueue={productionQueue ?? []}
      weaponSets={weaponSets ?? []}
      garrison={garrison ?? []}
      unitTypes={unitTypes ?? []}
      trainingQueue={trainingQueue ?? []}
      armyCp={armyCp ?? 0}
    />
  );
}
