"use client";
// Path: app/dashboard/prior/page.tsx | Type: NEW

import { useState } from "react";

const resources = [
  { code: "food", label: "Mad", value: 1240, gold: true },
  { code: "wood", label: "Træ", value: 980 },
  { code: "stone", label: "Sten", value: 640 },
];

const clergyProjects = [
  { name: "Katedral — fundament", progress: 22, eta: "18t 0m" },
  { name: "Kloster — niveau 2", progress: 71, eta: "1t 40m" },
];

const blessings = [
  { name: "Velsignelse over garnisonen", target: "Kongen", status: "Aktiv" },
  { name: "Produktions-buff", target: "Købmanden", status: "Udløbet" },
];

const events = [
  { time: "13:20", text: "Velsignelse udstedt over garnisonen" },
  { time: "09:05", text: "Klosteret modtog en gave fra en fremmed rejsende" },
];

const quickActions = ["Udsted velsignelse", "Ekskommunikér", "Byg kloster"];

const tabs = ["Kloster", "Velsignelser"] as const;
type Tab = (typeof tabs)[number];

export default function PriorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("Kloster");

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
        <div className="panel-title">Priorens autoritet</div>
        <div className="stat-row">
          <span className="stat-row__label">Legitimitet</span>
          <span className="stat-row__value">44</span>
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
            {clergyProjects.map((project) => (
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
