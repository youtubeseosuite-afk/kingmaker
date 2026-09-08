"use client";
// Path: app/dashboard/king/king-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upgradeBuilding } from "./actions";

type ResourceRow = { resource_code: string; amount: number };
type BuildingRow = { building_type: "keep" | "walls"; level: number };

const resourceLabels: Record<string, string> = {
  gold: "Guld",
  iron: "Jern",
  food: "Mad",
  wood: "Træ",
  stone: "Sten",
};

const buildingLabels: Record<string, string> = {
  keep: "The Keep",
  walls: "Murene",
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

function levelFor(buildings: BuildingRow[], type: "keep" | "walls") {
  return buildings.find((b) => b.building_type === type)?.level ?? 1;
}

function costFor(level: number) {
  return { wood: 50 * level, stone: 40 * level };
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

const quickActions = ["Træn tropper", "Kald til våben"];

const tabs = ["Slot", "Hær", "Land"] as const;
type Tab = (typeof tabs)[number];

export default function KingView({
  legitimacy,
  roleProfileId,
  kingdomResources,
  roleResources,
  buildings,
}: {
  legitimacy: number;
  roleProfileId: string | null;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
  buildings: BuildingRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Slot");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const wood = amountFor(kingdomResources, "wood");
  const stone = amountFor(kingdomResources, "stone");

  const resources = [
    { code: "gold", value: amountFor(roleResources, "gold"), gold: true },
    { code: "iron", value: amountFor(roleResources, "iron") },
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: wood },
    { code: "stone", value: stone },
  ];

  function handleUpgrade(buildingType: "keep" | "walls") {
    if (!roleProfileId) return;
    setError(null);
    startTransition(async () => {
      try {
        await upgradeBuilding(roleProfileId, buildingType);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Opgradering fejlede");
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
            {(["keep", "walls"] as const).map((type) => {
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
