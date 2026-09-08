"use server";
// Path: app/dashboard/wizard/actions.ts | Type: NEW

import { createClient } from "../../../lib/supabase/server";

export async function scoutTile(tileId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("scout_tile", {
    p_tile_id: tileId,
    p_radius: 1,
  });

  if (error) {
    throw new Error(error.message);
  }
}
