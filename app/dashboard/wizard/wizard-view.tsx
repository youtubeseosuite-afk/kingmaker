"use client";
// Path: app/dashboard/wizard/wizard-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MapGrid from "../map-grid";
import { scoutTile } from "./actions";

type ResourceRow = { resource_code: string; amount: number };
type Tile = { id: string; x: number; y: number; terrain: string };
type VisibilityRow = { tile_id: string; visibility: "unknown" | "scouted" | "visible" };
type OwnershipRow = { tile_id: string; status: string; owner_realm_id: string | null };

const resourceLabels: Record<string, string> = {
  crystal: "Krystal",
  food: "Mad",
  wood: "Træ",
  stone: "Sten",
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

const activeEffects = [
  { name: "Indsigt — Slot", target: "Kongens garnison", expires: "3t 10m" },
];

const events = [
  { time: "11:30", text: "Ny krystalforekomst afsløret ved (41, 9)" },
  { time: "10:12", text: "Tåge løftet over de østlige marker" },
];

const quickActions = ["Send spejder", "Kast forbandelse", "Læs tegn"];

const tabs = ["Synskraft", "Forbandelser", "Indsigt"] as const;
type Tab = (typeof tabs)[number];

export default function WizardView({
  sight,
  kingdomResources,
  roleResources,
  tiles,
  visibility,
  ownership,
  myRealmId,
}: {
  sight: number;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
  tiles: Tile[];
  visibility: VisibilityRow[];
  ownership: OwnershipRow[];
  myRealmId: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Synskraft");
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleTileClick(tileId: string) {
    startTransition(async () => {
      await scoutTile(tileId);
      router.refresh();
    });
  }

  const resources = [
    { code: "crystal", value: amountFor(roleResources, "crystal"), gold: true },
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: amountFor(kingdomResources, "wood") },
    { code: "stone", value: amountFor(kingdomResources, "stone") },
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
                {r.value.toLocaleString("da-DK")}
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
          <MapGrid
            tiles={tiles}
            visibility={visibilityMap}
            ownership={ownershipMap}
            onTileClick={handleTileClick}
          />
        )}

        {activeTab === "Forbandelser" && (
          <div className="placeholder-note">
            Forbandelser og velsignelser forbindes når buff-systemet er koblet på.
          </div>
        )}

        {activeTab === "Indsigt" && (
          <div>
            {activeEffects.map((e) => (
              <div className="stat-row" key={e.name}>
                <span className="stat-row__label">
                  {e.name} → {e.target}
                </span>
                <span className="stat-row__value">{e.expires}</span>
              </div>
            ))}
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
