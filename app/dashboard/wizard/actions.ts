"use server";
// Path: app/dashboard/wizard/actions.ts | Type: UPDATE

import { createClient } from "../../../lib/supabase/server";

export async function scoutTile(tileId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("scout_tile", {
    p_tile_id: tileId,
    p_radius: 1,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export type WizardBuildingType =
  | "tower"
  | "crystal_cave"
  | "rune_circle"
  | "arcane_library";

export async function upgradeBuilding(
  roleProfileId: string,
  buildingType: WizardBuildingType
): Promise<{ error?: string; level?: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("upgrade_building", {
    p_role_profile_id: roleProfileId,
    p_building_type: buildingType,
  });

  if (error) {
    return { error: error.message };
  }

  return { level: data as number };
}
