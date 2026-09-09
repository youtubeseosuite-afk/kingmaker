"use client";
// Path: app/dashboard/prior/prior-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upgradeBuilding, type PriorBuildingType } from "./actions";
import SkillsPanel from "../skills-panel";

type ResourceRow = { resource_code: string; amount: number };
type BuildingRow = { building_type: PriorBuildingType; level: number };

const resourceLabels: Record<string, string> = {
  food: "Mad",
  wood: "Træ",
  stone: "Sten",
};

const buildingOrder: PriorBuildingType[] = [
  "monastery",
  "cathedral",
  "confessional",
  "pilgrim_route",
];

const buildingLabels: Record<PriorBuildingType, string> = {
  monastery: "Klosteret",
  cathedral: "Katedralen",
  confessional: "Skriftestolen",
  pilgrim_route: "Pilgrimsruten",
};

const buildingDescriptions: Record<PriorBuildingType, string> = {
  monastery: "Priorens base — hæver Legitimitet passivt",
  cathedral: "Rigets store sluteffekt — massiv Prestige og Legitimitet",
  confessional: "Låser flere velsignelses-typer op",
  pilgrim_route: "Passiv tilstrømning til den fælles pulje",
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

function levelFor(buildings: BuildingRow[], type: PriorBuildingType) {
  return buildings.find((b) => b.building_type === type)?.level ?? 1;
}

function costFor(level: number) {
  return { wood: 50 * level, stone: 40 * level };
}

const blessings = [
  { name: "Velsignelse over garnisonen", target: "Kongen", status: "Aktiv" },
  { name: "Produktions-buff", target: "Købmanden", status: "Udløbet" },
];

const events = [
  { time: "13:20", text: "Velsignelse udstedt over garnisonen" },
  { time: "09:05", text: "Klosteret modtog en gave fra en fremmed rejsende" },
];

const quickActions = ["Udsted velsignelse", "Ekskommunikér"];

type Skill = {
  skill_code: string;
  skill_name: string;
  description: string;
  min_level: number;
  cost: Record<string, number>;
  target_type: "tile" | "realm" | "role_profile" | "army_movement";
  offensive: boolean;
};

const tabs = ["Kloster", "Velsignelser", "Evner"] as const;
type Tab = (typeof tabs)[number];

export default function PriorView({
  legitimacy,
  roleProfileId,
  level,
  kingdomResources,
  buildings,
  skills,
  unlockedCodes,
  realmId,
  kingRoleProfileId,
}: {
  legitimacy: number;
  roleProfileId: string | null;
  level: number;
  kingdomResources: ResourceRow[];
  buildings: BuildingRow[];
  skills: Skill[];
  unlockedCodes: string[];
  realmId: string;
  kingRoleProfileId: string | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Kloster");
  const [buildError, setBuildError] = useState<string | null>(null);
  const router = useRouter();
  const [isBuildPending, startBuildTransition] = useTransition();

  const wood = amountFor(kingdomResources, "wood");
  const stone = amountFor(kingdomResources, "stone");

  const resources = [
    { code: "food", value: amountFor(kingdomResources, "food"), gold: true },
    { code: "wood", value: wood },
    { code: "stone", value: stone },
  ];

  function handleUpgrade(buildingType: PriorBuildingType) {
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
        <div className="panel-title">Priorens autoritet</div>
        <div className="stat-row">
          <span className="stat-row__label">Legitimitet</span>
          <span className="stat-row__value">{legitimacy}</span>
        </div>
        <div className="stat-row">
          <span className="stat-row__label">Aktive velsignelser</span>
          <span className="stat-row__value">
            {blessings.filter((b) => b.status === "Aktiv").length}
          </span>
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

        {activeTab === "Kloster" && (
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

        {activeTab === "Velsignelser" && (
          <div>
            {blessings.map((b) => (
              <div className="stat-row" key={b.name}>
                <span className="stat-row__label">
                  {b.name} → {b.target}
                </span>
                <span className="stat-row__value">{b.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Evner" && roleProfileId && (
          <SkillsPanel
            roleProfileId={roleProfileId}
            level={level}
            skills={skills}
            unlockedCodes={unlockedCodes}
            resolveTarget={{ realm: realmId, role_profile: kingRoleProfileId ?? undefined }}
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

      <footer className="panel-bottom">
        <input className="command-input" placeholder="Udsted en befaling..." />
        {quickActions.map((action) => (
          <button className="btn" key={action}>
            {action}
          </button>
        ))}
      </footer>
    </div>
  );
}
