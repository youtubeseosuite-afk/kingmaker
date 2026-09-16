"use server";
// Path: app/dashboard/king/actions.ts | Type: UPDATE

import { createClient } from "../../../lib/supabase/server";

export async function upgradeBuilding(
  roleProfileId: string,
  buildingType:
    | "keep"
    | "walls"
    | "storehouse"
    | "barracks"
    | "stable"
    | "kitchen"
    | "housing"
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

export type FieldStructureType = "mine" | "farm" | "forestry_camp";

export async function placeFieldStructure(
  roleProfileId: string,
  tileId: string,
  structureType: FieldStructureType
): Promise<{ error?: string; structureId?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_field_structure", {
    p_role_profile_id: roleProfileId,
    p_tile_id: tileId,
    p_structure_type: structureType,
  });

  if (error) {
    return { error: error.message };
  }

  return { structureId: data as string };
}

export async function setTaxRate(
  roleProfileId: string,
  taxRate: number
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_tax_rate", {
    p_role_profile_id: roleProfileId,
    p_tax_rate: taxRate,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
