"use client";
// Path: app/dashboard/merchant/merchant-view.tsx | Type: NEW

import { useState } from "react";

type ResourceRow = { resource_code: string; amount: number };

const resourceLabels: Record<string, string> = {
  gold: "Guld",
  food: "Mad",
  wood: "Træ",
  stone: "Sten",
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

const producers = [
  { name: "Bryggeri — niveau 2", progress: 44, eta: "1t 50m" },
  { name: "Vævestue — niveau 1", progress: 80, eta: "0t 20m" },
];

const trades = [
  { name: "Guldsmed", output: "Smykker", status: "Aktiv" },
  { name: "Karavane til Østmark", output: "Jern", status: "Undervejs" },
];

const events = [
  { time: "13:47", text: "Vævestuen har afsluttet en omgang klæde" },
  { time: "12:55", text: "Handelskaravane ankommet fra Østmark" },
  { time: "11:30", text: "Troldmanden har afsløret nye ressourcer ved (41, 9)" },
];

const quickActions = ["Send karavane", "Åbn markedet", "Overfør guld til Kongen"];

const tabs = ["Handel", "Produktion", "Ruter"] as const;
type Tab = (typeof tabs)[number];

export default function MerchantView({
  kingdomResources,
  roleResources,
}: {
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Handel");

  const gold = amountFor(roleResources, "gold");

  const resources = [
    { code: "gold", value: gold, gold: true },
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
        <div className="panel-title">Handelshusets stilling</div>
        <div className="stat-row">
          <span className="stat-row__label">Guld i kiste</span>
          <span className="stat-row__value">{gold.toLocaleString("da-DK")}</span>
        </div>
        <div className="stat-row">
          <span className="stat-row__label">Aktive ruter</span>
          <span className="stat-row__value">{trades.length}</span>
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

        {activeTab === "Handel" && (
          <div className="placeholder-note">
            Markedet forbindes når handelspriser er trukket fra Supabase.
          </div>
        )}

        {activeTab === "Produktion" && (
          <div>
            {producers.map((p) => (
              <div className="build-project" key={p.name}>
                <div className="build-project__head">
                  <span className="build-project__name">{p.name}</span>
                  <span className="build-project__eta">{p.eta}</span>
                </div>
                <div className="progress">
                  <div className="progress__fill" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Ruter" && (
          <div>
            {trades.map((t) => (
              <div className="stat-row" key={t.name}>
                <span className="stat-row__label">
                  {t.name} → {t.output}
                </span>
                <span className="stat-row__value">{t.status}</span>
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
