"use client";
// Path: app/dashboard/skills-panel.tsx | Type: NEW

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unlockSkill, activateSkill } from "./skills-actions";

type Skill = {
  skill_code: string;
  skill_name: string;
  description: string;
  min_level: number;
  cost: Record<string, number>;
  target_type: "tile" | "realm" | "role_profile" | "army_movement";
  offensive: boolean;
};

type TargetResolver = {
  realm?: string;
  role_profile?: string;
};

const targetNote: Record<string, string> = {
  tile: "Kræver feltvalg på kortet (kommer snart)",
  army_movement: "Kræver en aktiv march (kommer snart)",
  realm_offensive: "Kræver et modstander-mål (kommer snart)",
};

function costLabel(cost: Record<string, number>) {
  const entries = Object.entries(cost);
  if (entries.length === 0) return "Ingen omkostning";
  return entries.map(([code, amt]) => `${amt} ${code}`).join(" · ");
}

export default function SkillsPanel({
  roleProfileId,
  level,
  skills,
  unlockedCodes,
  resolveTarget,
}: {
  roleProfileId: string;
  level: number;
  skills: Skill[];
  unlockedCodes: string[];
  resolveTarget: TargetResolver;
}) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleUnlock(skillCode: string) {
    setError(null);
    startTransition(async () => {
      const result = await unlockSkill(roleProfileId, skillCode);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleActivate(skill: Skill, targetId: string) {
    setError(null);
    startTransition(async () => {
      const result = await activateSkill(
        roleProfileId,
        skill.skill_code,
        skill.target_type,
        targetId
      );
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      {error && <p className="auth-message auth-message--error">{error}</p>}
      {skills.map((skill) => {
        const unlocked = unlockedCodes.includes(skill.skill_code);
        const locked = level < skill.min_level;

        const targetId =
          skill.target_type === "realm" && !skill.offensive
            ? resolveTarget.realm
            : skill.target_type === "role_profile"
              ? resolveTarget.role_profile
              : undefined;

        const noteKey =
          skill.target_type === "realm" && skill.offensive
            ? "realm_offensive"
            : skill.target_type;

        return (
          <div className="build-project" key={skill.skill_code}>
            <div className="build-project__head">
              <span className="build-project__name">
                {skill.skill_name} — niveau {skill.min_level}
              </span>
              <span className="build-project__eta">{costLabel(skill.cost)}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 0 8px" }}>
              {skill.description}
            </p>

            {!unlocked && locked && (
              <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
                Kræver niveau {skill.min_level} (har {level})
              </p>
            )}

            {!unlocked && !locked && (
              <button
                className="btn btn--primary"
                disabled={isPending}
                onClick={() => handleUnlock(skill.skill_code)}
              >
                Lås op
              </button>
            )}

            {unlocked && targetId && (
              <button
                className="btn btn--primary"
                disabled={isPending}
                onClick={() => handleActivate(skill, targetId)}
              >
                Aktivér
              </button>
            )}

            {unlocked && !targetId && (
              <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {targetNote[noteKey] ?? "Mål ikke tilgængeligt endnu"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
