"use server";
// Path: app/dashboard/merchant/actions.ts | Type: NEW

import { createClient } from "../../../lib/supabase/server";

export async function sendGoldToKing(
  worldId: string,
  fromRoleProfileId: string,
  toRoleProfileId: string,
  amount: number
) {
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
    throw new Error(error.message);
  }
}
