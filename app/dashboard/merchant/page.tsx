// Path: app/dashboard/merchant/page.tsx | Type: UPDATE
export const dynamic = "force-dynamic";

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
    .select("id, level")
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

  const { data: buildings } = roleProfile
    ? await supabase
        .from("buildings")
        .select("building_type, level")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  const { data: skills } = await supabase
    .from("role_skills")
    .select("skill_code, skill_name, description, min_level, cost, target_type, offensive")
    .eq("role", "merchant")
    .order("min_level");

  const { data: unlocks } = roleProfile
    ? await supabase
        .from("role_skill_unlocks")
        .select("skill_code")
        .eq("role_profile_id", roleProfile.id)
    : { data: [] };

  const { data: marketRows } = await supabase
    .from("market_prices")
    .select("resource_code, sellable, buyable")
    .eq("world_id", realm.world_id);

  const marketPrices = await Promise.all(
    (marketRows ?? []).map(async (row) => {
      const { data: price } = await supabase.rpc("calculate_current_market_price", {
        p_world_id: realm.world_id,
        p_resource_code: row.resource_code,
      });
      return {
        resource_code: row.resource_code,
        sellable: row.sellable,
        buyable: row.buyable,
        price: price ?? 0,
      };
    })
  );

  return (
    <MerchantView
      worldId={realm.world_id}
      roleProfileId={roleProfile?.id ?? null}
      level={roleProfile?.level ?? 1}
      kingRoleProfileId={kingProfile?.id ?? null}
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
      buildings={buildings ?? []}
      skills={skills ?? []}
      unlockedCodes={(unlocks ?? []).map((u) => u.skill_code)}
      realmId={realm.id}
      marketPrices={marketPrices}
    />
  );
}
