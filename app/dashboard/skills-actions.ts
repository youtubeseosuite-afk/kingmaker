"use server";
// Path: app/dashboard/skills-actions.ts | Type: NEW

import { createClient } from "../../lib/supabase/server";

export async function unlockSkill(
  roleProfileId: string,
  skillCode: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("unlock_skill", {
    p_role_profile_id: roleProfileId,
    p_skill_code: skillCode,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function activateSkill(
  roleProfileId: string,
  skillCode: string,
  targetType: string,
  targetId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_skill", {
    p_role_profile_id: roleProfileId,
    p_skill_code: skillCode,
    p_target_type: targetType,
    p_target_id: targetId,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}
