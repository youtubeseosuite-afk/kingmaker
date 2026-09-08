"use server";
// Path: app/dashboard/prior/actions.ts | Type: NEW

import { createClient } from "../../../lib/supabase/server";

export type PriorBuildingType =
  | "monastery"
  | "cathedral"
  | "confessional"
  | "pilgrim_route";

export async function upgradeBuilding(
  roleProfileId: string,
  buildingType: PriorBuildingType
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
