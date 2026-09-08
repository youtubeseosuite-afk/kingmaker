// Path: app/page.tsx | Type: NEW
"use client";

import { useState } from "react";

const resources = [
  { code: "gold", label: "Guld", value: 4820, gold: true },
  { code: "food", label: "Mad", value: 1240 },
  { code: "wood", label: "Træ", value: 980 },
  { code: "stone", label: "Sten", value: 640 },
  { code: "iron", label: "Jern", value: 120 },
  { code: "crystal", label: "Krystal", value: 8 },
];

const realm = {
  name: "Ravnsborg",
  role: "Kongen",
  legitimacy: 62,
  prestige: 18,
  morale: 74,
  world: "Verden #4",
};

const buildProjects = [
  { name: "Voldgrav — niveau 3", progress: 68, eta: "2t 14m" },
  { name: "Kornlade — niveau 2", progress: 32, eta: "6t 40m" },
];

const events = [
  { time: "14:02", text: "Spejder rapporterer ukendt hær ved (34, 12)" },
  { time: "13:47", text: "Vævestuen har afsluttet en omgang klæde" },
  { time: "13:20", text: "Prioren i Sortmark har udstedt en velsignelse" },
  { time: "12:55", text: "Handelskaravane ankommet fra Østmark" },
  { time: "12:10", text: "Muren ved Ravnsborg er styrket til niveau 4" },
];

const quickActions = ["Send spejder", "Kald til våben", "Åbn markedet"];

const tabs = ["Slot", "Kort", "Hær"] as const;
type Tab = (typeof tabs)[number];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Slot");

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
        <div className="realm-badge">
          <div>
            <div className="realm-badge__role">{realm.role} · {realm.world}</div>
            <div className="realm-badge__name">{realm.name}</div>
          </div>
        </div>
      </header>

      <aside className="panel-left">
        <div className="panel-title">Rigets tilstand</div>
        <div className="stat-row">
          <span className="stat-row__label">Legitimitet</span>
          <span className="stat-row__value">{realm.legitimacy}</span>
        </div>
        <div className="stat-row">
          <span className="stat-row__label">Prestige</span>
          <span className="stat-row__value">{realm.prestige}</span>
        </div>
        <div className="stat-row">
          <span className="stat-row__label">Moral</span>
          <span className="stat-row__value">{realm.morale}</span>
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

        {activeTab === "Kort" && (
          <div className="placeholder-note">Kort-visningen kobles på, når verdens koordinat-grid er trukket fra Supabase.</div>
        )}

        {activeTab === "Hær" && (
          <div className="placeholder-note">Hær-oversigten kobles på, når garnisonsdata er trukket fra Supabase.</div>
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
