"use client";
// Path: app/dashboard/king/king-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upgradeBuilding } from "./actions";
import SkillsPanel from "../skills-panel";
import { resourceLabels } from "../resource-labels";

type ResourceRow = { resource_code: string; amount: number };
type BuildingType =
  | "keep"
  | "walls"
  | "storehouse"
  | "barracks"
  | "stable"
  | "kitchen"
  | "housing";
type BuildingRow = { building_type: BuildingType; level: number };
type BuildingTypeInfo = {
  building_type: BuildingType;
  display_name: string;
  description: string;
  wood_cost_per_level: number;
  stone_cost_per_level: number;
  requires_building_type: BuildingType | null;
  requires_level: number | null;
};
type ActiveModifier = {
  id: string;
  modifier_code: string;
  modifier_value: number;
  expires_at: string | null;
  role_skills: { skill_name: string } | null;
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

function levelFor(buildings: BuildingRow[], type: BuildingType) {
  return buildings.find((b) => b.building_type === type)?.level ?? 0;
}

function labelFor(buildingTypes: BuildingTypeInfo[], type: BuildingType) {
  return buildingTypes.find((b) => b.building_type === type)?.display_name ?? type;
}

function costFor(buildingTypes: BuildingTypeInfo[], type: BuildingType, level: number) {
  const info = buildingTypes.find((b) => b.building_type === type);
  return {
    wood: (info?.wood_cost_per_level ?? 50) * level,
    stone: (info?.stone_cost_per_level ?? 40) * level,
  };
}

function prereqStatus(
  buildingTypes: BuildingTypeInfo[],
  buildings: BuildingRow[],
  type: BuildingType
): { met: boolean; label: string | null } {
  const info = buildingTypes.find((b) => b.building_type === type);
  if (!info?.requires_building_type || !info.requires_level) {
    return { met: true, label: null };
  }
  const prereqLevel = levelFor(buildings, info.requires_building_type);
  const prereqLabel = labelFor(buildingTypes, info.requires_building_type);
  return {
    met: prereqLevel >= info.requires_level,
    label: `${prereqLabel} niveau ${info.requires_level}`,
  };
}

function timeRemaining(expiresAt: string | null) {
  if (!expiresAt) return "Permanent";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Udløbet";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}t ${minutes}m`;
}

const garrison = [
  { name: "Fodfolk", count: 240 },
  { name: "Kavaleri", count: 60 },
  { name: "Bueskytter", count: 90 },
];

const events = [
  { time: "14:02", text: "Spejder rapporterer ukendt hær ved (34, 12)" },
  { time: "13:20", text: "Prioren har udstedt en velsignelse over garnisonen" },
  { time: "12:10", text: "Muren er styrket til niveau 4" },
];

type Skill = {
  skill_code: string;
  skill_name: string;
  description: string;
  min_level: number;
  cost: Record<string, number>;
  target_type: "tile" | "realm" | "role_profile" | "army_movement";
  offensive: boolean;
};

const tabs = ["Slot", "Hær", "Land", "Evner"] as const;
type Tab = (typeof tabs)[number];

export default function KingView({
  legitimacy,
  roleProfileId,
  level,
  kingdomResources,
  roleResources,
  buildings,
  buildingTypes,
  skills,
  unlockedCodes,
  realmId,
  activeModifiers,
}: {
  legitimacy: number;
  roleProfileId: string | null;
  level: number;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
  buildings: BuildingRow[];
  buildingTypes: BuildingTypeInfo[];
  skills: Skill[];
  unlockedCodes: string[];
  realmId: string;
  activeModifiers: ActiveModifier[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Slot");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const wood = amountFor(kingdomResources, "wood");
  const stone = amountFor(kingdomResources, "stone");

  const ownResources = [
    { code: "gold", value: amountFor(roleResources, "gold"), accent: true },
    { code: "iron", value: amountFor(roleResources, "iron") },
  ];
  const sharedResources = [
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: wood },
    { code: "stone", value: stone },
  ];

  function handleUpgrade(buildingType: BuildingType) {
    if (!roleProfileId) return;
    setError(null);
    startTransition(async () => {
      const result = await upgradeBuilding(roleProfileId, buildingType);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="dashboard">
      <aside className="panel-left">
        <div className="sidebar-section">
          <div className="panel-title">Kongens styrke</div>
          <div className="stat-row">
            <span className="stat-row__label">Legitimitet</span>
            <span className="stat-row__value">{legitimacy}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Garnison, i alt</span>
            <span className="stat-row__value">
              {garrison.reduce((sum, u) => sum + u.count, 0)}
            </span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="panel-title">Lager</div>
          {ownResources.map((r) => (
            <div className="stat-row" key={r.code}>
              <span className="stat-row__label">{resourceLabels[r.code] ?? r.code}</span>
              <span className={`stat-row__value${r.accent ? " stat-row__value--accent" : ""}`}>
                {Math.floor(r.value).toLocaleString("da-DK")}
              </span>
            </div>
          ))}
          {sharedResources.map((r) => (
            <div className="stat-row" key={r.code}>
              <span className="stat-row__label">{resourceLabels[r.code] ?? r.code}</span>
              <span className="stat-row__value">
                {Math.floor(r.value).toLocaleString("da-DK")}
              </span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="panel-title">Aktive bonusser</div>
          {activeModifiers.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-faint)" }}>Ingen aktive bonusser</p>
          )}
          {activeModifiers.map((m) => (
            <div className="stat-row" key={m.id}>
              <span className="stat-row__label">{m.role_skills?.skill_name ?? m.modifier_code}</span>
              <span className="stat-row__value">{timeRemaining(m.expires_at)}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="panel-center">
        <nav className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`tab${activeTab === tab ? " tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === "Slot" && (
          <div>
            {error && <p className="auth-message auth-message--error">{error}</p>}
            {buildingTypes.map((info) => {
              const type = info.building_type;
              const builtLevel = levelFor(buildings, type);
              const displayLevel = Math.max(builtLevel, 1);
              const cost = costFor(buildingTypes, type, displayLevel);
              const maxed = builtLevel >= 30;
              const canAfford = wood >= cost.wood && stone >= cost.stone;
              const prereq = prereqStatus(buildingTypes, buildings, type);
              const locked = builtLevel === 0 && !prereq.met;

              return (
                <div className="build-project" key={type}>
                  <div className="build-project__head">
                    <span className="build-project__name">
                      {info.display_name}
                      {builtLevel > 0 ? ` — niveau ${builtLevel}` : " — ikke bygget"}
                    </span>
                    <span className="build-project__eta">
                      {maxed ? "Maks niveau" : `${cost.wood} træ · ${cost.stone} sten`}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-faint)",
                      margin: "4px 0 6px",
                    }}
                  >
                    {info.description}
                  </p>
                  <div className="progress">
                    <div
                      className="progress__fill"
                      style={{ width: `${(builtLevel / 30) * 100}%` }}
                    />
                  </div>
                  {locked && (
                    <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>
                      Kræver {prereq.label}
                    </p>
                  )}
                  {!locked && !maxed && (
                    <button
                      className="btn btn--primary"
                      style={{ marginTop: 8 }}
                      disabled={isPending || !canAfford}
                      onClick={() => handleUpgrade(type)}
                    >
                      {canAfford ? "Opgrader" : "Ikke råd"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "Hær" && (
          <div>
            {garrison.map((unit) => (
              <div className="stat-row" key={unit.name}>
                <span className="stat-row__label">{unit.name}</span>
                <span className="stat-row__value">{unit.count}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Land" && (
          <div className="placeholder-note">
            Kortet forbindes når koordinat-gridet er hentet fra Supabase.
          </div>
        )}

        {activeTab === "Evner" && roleProfileId && (
          <SkillsPanel
            roleProfileId={roleProfileId}
            level={level}
            skills={skills}
            unlockedCodes={unlockedCodes}
            resolveTarget={{ realm: realmId }}
          />
        )}
      </main>

      <aside className="panel-right">
        <div className="panel-title">Hændelser</div>
        <div className="feed-list">
          {events.map((event, i) => (
            <div className="feed-item" key={i}>
              <span className="feed-item__time">{event.time}</span>
              <span className="feed-item__text">{event.text}</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
