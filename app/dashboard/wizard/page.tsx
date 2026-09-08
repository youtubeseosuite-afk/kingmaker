"use client";
// Path: app/dashboard/wizard/page.tsx | Type: NEW

import { useState } from "react";

const resources = [
  { code: "crystal", label: "Krystal", value: 14, gold: true },
  { code: "food", label: "Mad", value: 1240 },
  { code: "wood", label: "Træ", value: 980 },
  { code: "stone", label: "Sten", value: 640 },
];

const scoutedTiles = [
  { coords: "(34, 12)", note: "Ukendt hær observeret" },
  { coords: "(41, 9)", note: "Krystalforekomst fundet" },
];

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

export default function WizardDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("Synskraft");

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="resource-row">
          {resources.map((r) => (
            <div
              key={r.code}
              className={`resource-pill${r.gold ? " resource-pill--gold" : ""}`}
            >
              <span className="resource-pill__label">{r.label}</span>
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
          <span className="stat-row__value">38</span>
        </div>
        <div className="stat-row">
          <span className="stat-row__label">Scoutede felter</span>
          <span className="stat-row__value">{scoutedTiles.length}</span>
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
            {scoutedTiles.map((t) => (
              <div className="stat-row" key={t.coords}>
                <span className="stat-row__label">{t.coords}</span>
                <span className="stat-row__value">{t.note}</span>
              </div>
            ))}
          </div>
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
