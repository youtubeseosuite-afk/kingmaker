"use server";
// Path: app/dashboard/king/actions.ts | Type: NEW

import { createClient } from "../../../lib/supabase/server";

export async function upgradeBuilding(
  roleProfileId: string,
  buildingType: "keep" | "walls"
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("upgrade_building", {
    p_role_profile_id: roleProfileId,
    p_building_type: buildingType,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as number;
}
