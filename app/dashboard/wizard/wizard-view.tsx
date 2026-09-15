"use client";
// Path: app/dashboard/wizard/wizard-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MapGrid from "../map-grid";
import { scoutTile, upgradeBuilding, type WizardBuildingType } from "./actions";
import SkillsPanel from "../skills-panel";
import { resourceLabels } from "../resource-labels";

type ResourceRow = { resource_code: string; amount: number };
type Tile = { id: string; x: number; y: number; terrain: string };
type VisibilityRow = { tile_id: string; visibility: "unknown" | "scouted" | "visible" };
type OwnershipRow = { tile_id: string; status: string; owner_realm_id: string | null };
type BuildingRow = { building_type: WizardBuildingType; level: number };
type ActiveModifier = {
  id: string;
  modifier_code: string;
  modifier_value: number;
  expires_at: string | null;
  role_skills: { skill_name: string } | null;
};

const buildingOrder: WizardBuildingType[] = [
  "tower",
  "crystal_cave",
  "rune_circle",
  "arcane_library",
];

const buildingLabels: Record<WizardBuildingType, string> = {
  tower: "Tårnet",
  crystal_cave: "Krystalgrotten",
  rune_circle: "Runekredsen",
  arcane_library: "Det Arkane Bibliotek",
};

const buildingDescriptions: Record<WizardBuildingType, string> = {
  tower: "Troldmandens base — hæver Synskraft passivt",
  crystal_cave: "Passiv Krystal-produktion",
  rune_circle: "Låser Forbandelser og Velsignelser op",
  arcane_library: "Øger spejdingens radius",
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

function levelFor(buildings: BuildingRow[], type: WizardBuildingType) {
  return buildings.find((b) => b.building_type === type)?.level ?? 1;
}

function costFor(level: number) {
  return { wood: 50 * level, stone: 40 * level };
}

function timeRemaining(expiresAt: string | null) {
  if (!expiresAt) return "Permanent";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Udløbet";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}t ${minutes}m`;
}

const events = [
  { time: "11:30", text: "Ny krystalforekomst afsløret ved (41, 9)" },
  { time: "10:12", text: "Tåge løftet over de østlige marker" },
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

const tabs = ["Synskraft", "Forbandelser", "Indsigt", "Evner"] as const;
type Tab = (typeof tabs)[number];

export default function WizardView({
  sight,
  roleProfileId,
  level,
  kingdomResources,
  roleResources,
  tiles,
  visibility,
  ownership,
  myRealmId,
  buildings,
  skills,
  unlockedCodes,
  activeModifiers,
}: {
  sight: number;
  roleProfileId: string | null;
  level: number;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
  tiles: Tile[];
  visibility: VisibilityRow[];
  ownership: OwnershipRow[];
  myRealmId: string;
  buildings: BuildingRow[];
  skills: Skill[];
  unlockedCodes: string[];
  activeModifiers: ActiveModifier[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Synskraft");
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isBuildPending, startBuildTransition] = useTransition();

  const wood = amountFor(kingdomResources, "wood");
  const stone = amountFor(kingdomResources, "stone");
  const crystal = amountFor(roleResources, "crystal");

  const visibilityMap: Record<string, "unknown" | "scouted" | "visible"> = {};
  visibility.forEach((v) => {
    visibilityMap[v.tile_id] = v.visibility;
  });

  const scoutedCount = visibility.filter((v) => v.visibility !== "unknown").length;

  const ownershipMap: Record<string, { status: string; isMine: boolean }> = {};
  ownership.forEach((o) => {
    if (o.status !== "unclaimed") {
      ownershipMap[o.tile_id] = {
        status: o.status,
        isMine: o.owner_realm_id === myRealmId,
      };
    }
  });

  function handleTileClick(tileId: string) {
    setScoutError(null);
    startTransition(async () => {
      const result = await scoutTile(tileId);
      if (result.error) {
        setScoutError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleUpgrade(buildingType: WizardBuildingType) {
    if (!roleProfileId) return;
    setBuildError(null);
    startBuildTransition(async () => {
      const result = await upgradeBuilding(roleProfileId, buildingType);
      if (result.error) {
        setBuildError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="dashboard">
      <aside className="panel-left">
        <div className="sidebar-section">
          <div className="panel-title">Troldmandens indsigt</div>
          <div className="stat-row">
            <span className="stat-row__label">Synskraft</span>
            <span className="stat-row__value">{sight}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Scoutede felter</span>
            <span className="stat-row__value">{scoutedCount}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="panel-title">Lager</div>
          <div className="stat-row">
            <span className="stat-row__label">{resourceLabels.crystal}</span>
            <span className="stat-row__value stat-row__value--accent">
              {Math.floor(crystal).toLocaleString("da-DK")}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">{resourceLabels.food}</span>
            <span className="stat-row__value">
              {Math.floor(amountFor(kingdomResources, "food")).toLocaleString("da-DK")}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">{resourceLabels.wood}</span>
            <span className="stat-row__value">{Math.floor(wood).toLocaleString("da-DK")}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">{resourceLabels.stone}</span>
            <span className="stat-row__value">{Math.floor(stone).toLocaleString("da-DK")}</span>
          </div>
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

        {activeTab === "Synskraft" && (
          <div>
            {scoutError && (
              <p className="auth-message auth-message--error">{scoutError}</p>
            )}
            <MapGrid tiles={tiles} visibility={visibilityMap} ownership={ownershipMap} onTileClick={handleTileClick} />
          </div>
        )}

        {activeTab === "Forbandelser" && (
          <div className="placeholder-note">
            Forbandelser og velsignelser forbindes når buff-systemet er koblet på.
          </div>
        )}

        {activeTab === "Indsigt" && (
          <div>
            {buildError && (
              <p className="auth-message auth-message--error">{buildError}</p>
            )}
            {buildingOrder.map((type) => {
              const level = levelFor(buildings, type);
              const cost = costFor(level);
              const maxed = level >= 30;
              const canAfford = wood >= cost.wood && stone >= cost.stone;

              return (
                <div className="build-project" key={type}>
                  <div className="build-project__head">
                    <span className="build-project__name">
                      {buildingLabels[type]} — niveau {level}
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
                    {buildingDescriptions[type]}
                  </p>
                  <div className="progress">
                    <div
                      className="progress__fill"
                      style={{ width: `${(level / 30) * 100}%` }}
                    />
                  </div>
                  {!maxed && (
                    <button
                      className="btn btn--primary"
                      style={{ marginTop: 8 }}
                      disabled={isBuildPending || !canAfford}
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

        {activeTab === "Evner" && roleProfileId && (
          <SkillsPanel
            roleProfileId={roleProfileId}
            level={level}
            skills={skills}
            unlockedCodes={unlockedCodes}
            resolveTarget={{ realm: myRealmId }}
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
