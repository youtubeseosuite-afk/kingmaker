// Path: app/dashboard/wizard/page.tsx | Type: UPDATE
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
    .select("id, sight")
    .eq("realm_id", realm.id)
    .eq("role", "wizard")
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

  return (
    <WizardView
      sight={roleProfile?.sight ?? 0}
      kingdomResources={kingdomResources ?? []}
      roleResources={roleResources ?? []}
      tiles={tiles ?? []}
      visibility={visibility ?? []}
      ownership={ownership ?? []}
      myRealmId={realm.id}
    />
  );
}
