"use client";
// Path: app/dashboard/king/king-view.tsx | Type: NEW

import { useState } from "react";

type ResourceRow = { resource_code: string; amount: number };

const resourceLabels: Record<string, string> = {
  gold: "Guld",
  iron: "Jern",
  food: "Mad",
  wood: "Træ",
  stone: "Sten",
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

const buildProjects = [
  { name: "Voldgrav — niveau 3", progress: 68, eta: "2t 14m" },
  { name: "Mur — niveau 4", progress: 32, eta: "6t 40m" },
];

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

const quickActions = ["Træn tropper", "Byg mur", "Kald til våben"];

const tabs = ["Slot", "Hær", "Land"] as const;
type Tab = (typeof tabs)[number];

export default function KingView({
  legitimacy,
  kingdomResources,
  roleResources,
}: {
  legitimacy: number;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Slot");

  const resources = [
    { code: "gold", value: amountFor(roleResources, "gold"), gold: true },
    { code: "iron", value: amountFor(roleResources, "iron") },
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: amountFor(kingdomResources, "wood") },
    { code: "stone", value: amountFor(kingdomResources, "stone") },
  ];

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
            {buildProjects.map((project) => (
              <div className="build-project" key={project.name}>
                <div className="build-project__head">
                  <span className="build-project__name">{project.name}</span>
                  <span className="build-project__eta">{project.eta}</span>
                </div>
                <div className="progress">
                  <div
                    className="progress__fill"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            ))}
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
