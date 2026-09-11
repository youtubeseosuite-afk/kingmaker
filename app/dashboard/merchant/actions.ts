"use server";
// Path: app/dashboard/merchant/actions.ts | Type: UPDATE

import { createClient } from "../../../lib/supabase/server";

export async function sendGoldToKing(
  worldId: string,
  fromRoleProfileId: string,
  toRoleProfileId: string,
  amount: number
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("execute_role_transaction", {
    p_world_id: worldId,
    p_from_role_profile_id: fromRoleProfileId,
    p_to_role_profile_id: toRoleProfileId,
    p_resource_code: "gold",
    p_amount: amount,
    p_type: "role_transfer",
    p_reference_id: null,
    p_note: null,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export type MerchantBuildingType =
  | "marketplace"
  | "brewery"
  | "weaver"
  | "goldsmith"
  | "warehouse"
  | "caravan_post"
  | "alchemist";

export async function upgradeBuilding(
  roleProfileId: string,
  buildingType: MerchantBuildingType
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

export async function collectProduction(
  roleProfileId: string,
  buildingType: MerchantBuildingType
): Promise<{
  error?: string;
  cycles?: number;
  producedResource?: string;
  producedAmount?: number;
  note?: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("collect_production", {
    p_role_profile_id: roleProfileId,
    p_building_type: buildingType,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    cycles: data?.cycles,
    producedResource: data?.produced_resource,
    producedAmount: data?.produced_amount,
    note: data?.note,
  };
}
