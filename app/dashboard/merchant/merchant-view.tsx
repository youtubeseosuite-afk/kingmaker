"use client";
// Path: app/dashboard/merchant/merchant-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendGoldToKing } from "./actions";

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

const quickActions = ["Send karavane", "Åbn markedet"];

const tabs = ["Handel", "Produktion", "Ruter"] as const;
type Tab = (typeof tabs)[number];

export default function MerchantView({
  worldId,
  roleProfileId,
  kingRoleProfileId,
  kingdomResources,
  roleResources,
}: {
  worldId: string;
  roleProfileId: string | null;
  kingRoleProfileId: string | null;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Handel");
  const [amount, setAmount] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const gold = amountFor(roleResources, "gold");
  const parsedAmount = Number(amount);
  const canSend =
    roleProfileId !== null &&
    kingRoleProfileId !== null &&
    parsedAmount > 0 &&
    parsedAmount <= gold;

  const resources = [
    { code: "gold", value: gold, gold: true },
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: amountFor(kingdomResources, "wood") },
    { code: "stone", value: amountFor(kingdomResources, "stone") },
  ];

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!roleProfileId || !kingRoleProfileId || !canSend) return;

    setError(null);
    setSent(false);
    startTransition(async () => {
      const result = await sendGoldToKing(
        worldId,
        roleProfileId,
        kingRoleProfileId,
        parsedAmount
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
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
        <div className="panel-title">Handelshusets stilling</div>
        <div className="stat-row">
          <span className="stat-row__label">Guld i kiste</span>
          <span className="stat-row__value">{Math.floor(gold).toLocaleString("da-DK")}</span>
        </div>
        <div className="stat-row">
          <span className="stat-row__label">Aktive ruter</span>
          <span className="stat-row__value">{trades.length}</span>
        </div>

        <form
          onSubmit={handleSend}
          style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}
        >
          <label className="auth-form__label" htmlFor="gold-amount">
            Overfør guld til Kongen
          </label>
          <input
            className="command-input"
            id="gold-amount"
            type="number"
            min={1}
            max={Math.floor(gold)}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setSent(false);
            }}
          />
          <button className="btn btn--primary" type="submit" disabled={isPending || !canSend}>
            {isPending ? "Sender..." : "Send"}
          </button>
          {error && <p className="auth-message auth-message--error">{error}</p>}
          {sent && !error && (
            <p className="auth-message auth-message--success">Guld overført til Kongen.</p>
          )}
        </form>
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
