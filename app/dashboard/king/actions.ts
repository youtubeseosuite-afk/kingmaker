"use server";
// Path: app/dashboard/king/actions.ts | Type: UPDATE

import { createClient } from "../../../lib/supabase/server";

export async function upgradeBuilding(
  roleProfileId: string,
  buildingType: "keep" | "walls"
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
