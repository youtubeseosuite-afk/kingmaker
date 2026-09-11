"use client";
// Path: app/dashboard/wizard/wizard-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MapGrid from "../map-grid";
import { scoutTile, upgradeBuilding, type WizardBuildingType } from "./actions";
import SkillsPanel from "../skills-panel";

type ResourceRow = { resource_code: string; amount: number };
type Tile = { id: string; x: number; y: number; terrain: string };
type VisibilityRow = { tile_id: string; visibility: "unknown" | "scouted" | "visible" };
type OwnershipRow = { tile_id: string; status: string; owner_realm_id: string | null };
type BuildingRow = { building_type: WizardBuildingType; level: number };

const resourceLabels: Record<string, string> = {
  crystal: "Krystal",
  food: "Mad",
  wood: "Træ",
  stone: "Sten",
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
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Synskraft");
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isBuildPending, startBuildTransition] = useTransition();

  const wood = amountFor(kingdomResources, "wood");
  const stone = amountFor(kingdomResources, "stone");

  const resources = [
    { code: "crystal", value: amountFor(roleResources, "crystal"), gold: true },
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: wood },
    { code: "stone", value: stone },
  ];

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
      <header className="topbar">
        <div className="resource-row">
          {resources.map((r) => (
            <div
              key={r.code}
              className={`resource-pill${r.gold ? " resource-pill--gold" : ""}`}
            >
              <span className="resource-pill__label">{resourceLabels[r.code]}</span>
              <span className="resource-pill__value">
                {Math.floor(r.value).toLocaleString("da-DK")}
              </span>
            </div>
          ))}
        </div>
      </header>

      <aside className="panel-left">
        <div className="panel-title">Troldmandens indsigt</div>
        <div className="stat-row">
          <span className="stat-row__label">Synskraft</span>
          <span className="stat-row__value">{sight}</span>
        </div>
        <div className="stat-row">
          <span className="stat-row__label">Scoutede felter</span>
          <span className="stat-row__value">{scoutedCount}</span>
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
