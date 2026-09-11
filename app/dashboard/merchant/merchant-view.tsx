"use client";
// Path: app/dashboard/merchant/merchant-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  sendGoldToKing,
  upgradeBuilding,
  collectProduction,
  sellToMarket,
  buyFromMarket,
  type MerchantBuildingType,
} from "./actions";
import SkillsPanel from "../skills-panel";

type ResourceRow = { resource_code: string; amount: number };
type BuildingRow = { building_type: MerchantBuildingType; level: number };
type MarketRow = { resource_code: string; sellable: boolean; buyable: boolean; price: number };

const resourceLabels: Record<string, string> = {
  gold: "Guld",
  food: "Mad",
  wood: "Træ",
  stone: "Sten",
};

const producedResourceLabels: Record<string, string> = {
  beer: "Øl",
  cloth: "Klæde",
  jewelry: "Smykker",
  incense: "Røgelse",
};

const marketResourceLabels: Record<string, string> = {
  ...producedResourceLabels,
  iron: "Jern",
  crystal: "Krystal",
};

const buildingOrder: MerchantBuildingType[] = [
  "marketplace",
  "brewery",
  "weaver",
  "goldsmith",
  "alchemist",
  "warehouse",
  "caravan_post",
];

const buildingLabels: Record<MerchantBuildingType, string> = {
  marketplace: "Markedspladsen",
  brewery: "Bryggeriet",
  weaver: "Vævestuen",
  goldsmith: "Guldsmedjen",
  alchemist: "Alkymisten",
  warehouse: "Pakhuset",
  caravan_post: "Karavaneposten",
};

const buildingDescriptions: Record<MerchantBuildingType, string> = {
  marketplace: "Handelshusets base — åbner markedet for alvor",
  brewery: "Omsætter Mad og Vand til Øl",
  weaver: "Omsætter Hamp/Uld og Farvestof til Klæde",
  goldsmith: "Omsætter Guld og Krystal til Smykker",
  alchemist: "Omsætter Sjældne Planter og Krystal til Røgelse",
  warehouse: "Hæver lagerkapaciteten for Guld",
  caravan_post: "Åbner og fremskynder handelsruter",
};

const producedResourceByBuilding: Partial<Record<MerchantBuildingType, string>> = {
  brewery: "beer",
  weaver: "cloth",
  goldsmith: "jewelry",
  alchemist: "incense",
};

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

function levelFor(buildings: BuildingRow[], type: MerchantBuildingType) {
  return buildings.find((b) => b.building_type === type)?.level ?? 1;
}

function costFor(level: number) {
  return { wood: 50 * level, stone: 40 * level };
}

const trades = [
  { name: "Guldsmed", output: "Smykker", status: "Aktiv" },
  { name: "Karavane til Østmark", output: "Jern", status: "Undervejs" },
];

const events = [
  { time: "13:47", text: "Vævestuen har afsluttet en omgang klæde" },
  { time: "12:55", text: "Handelskaravane ankommet fra Østmark" },
  { time: "11:30", text: "Troldmanden har afsløret nye ressourcer ved (41, 9)" },
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

const tabs = ["Handel", "Produktion", "Ruter", "Evner"] as const;
type Tab = (typeof tabs)[number];

export default function MerchantView({
  worldId,
  roleProfileId,
  level,
  kingRoleProfileId,
  kingdomResources,
  roleResources,
  buildings,
  skills,
  unlockedCodes,
  realmId,
  marketPrices,
}: {
  worldId: string;
  roleProfileId: string | null;
  level: number;
  kingRoleProfileId: string | null;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
  buildings: BuildingRow[];
  skills: Skill[];
  unlockedCodes: string[];
  realmId: string;
  marketPrices: MarketRow[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Handel");
  const [amount, setAmount] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [collectNote, setCollectNote] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeNote, setTradeNote] = useState<string | null>(null);
  const [tradeQuantities, setTradeQuantities] = useState<Record<string, string>>({});
  const [isTradePending, startTradeTransition] = useTransition();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBuildPending, startBuildTransition] = useTransition();
  const [isCollectPending, startCollectTransition] = useTransition();

  const gold = amountFor(roleResources, "gold");
  const wood = amountFor(kingdomResources, "wood");
  const stone = amountFor(kingdomResources, "stone");
  const parsedAmount = Number(amount);
  const canSend =
    roleProfileId !== null &&
    kingRoleProfileId !== null &&
    parsedAmount > 0 &&
    parsedAmount <= gold;

  const resources = [
    { code: "gold", value: gold, gold: true },
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: wood },
    { code: "stone", value: stone },
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

  function handleUpgrade(buildingType: MerchantBuildingType) {
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

  function handleCollect(buildingType: MerchantBuildingType) {
    if (!roleProfileId) return;
    setBuildError(null);
    setCollectNote(null);
    startCollectTransition(async () => {
      const result = await collectProduction(roleProfileId, buildingType);
      if (result.error) {
        setBuildError(result.error);
      } else if (result.cycles && result.cycles > 0) {
        const label = producedResourceLabels[result.producedResource ?? ""] ?? result.producedResource;
        setCollectNote(`Indsamlet ${result.producedAmount} ${label}`);
        router.refresh();
      } else {
        setCollectNote(result.note ?? "Intet at indsamle endnu");
      }
    });
  }

  function handleSell(resourceCode: string) {
    if (!roleProfileId) return;
    const qty = Number(tradeQuantities[resourceCode] ?? "0");
    if (qty <= 0) return;

    setTradeError(null);
    setTradeNote(null);
    startTradeTransition(async () => {
      const result = await sellToMarket(roleProfileId, resourceCode, qty);
      if (result.error) {
        setTradeError(result.error);
      } else {
        setTradeNote(`Solgt ${qty} ${marketResourceLabels[resourceCode]} for ${Math.floor(result.goldEarned ?? 0)} guld`);
        router.refresh();
      }
    });
  }

  function handleBuy(resourceCode: string) {
    if (!roleProfileId) return;
    const qty = Number(tradeQuantities[resourceCode] ?? "0");
    if (qty <= 0) return;

    setTradeError(null);
    setTradeNote(null);
    startTradeTransition(async () => {
      const result = await buyFromMarket(roleProfileId, resourceCode, qty);
      if (result.error) {
        setTradeError(result.error);
      } else {
        setTradeNote(`Købt ${qty} ${marketResourceLabels[resourceCode]} for ${Math.floor(result.goldSpent ?? 0)} guld`);
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
          <div>
            {tradeError && (
              <p className="auth-message auth-message--error">{tradeError}</p>
            )}
            {tradeNote && (
              <p className="auth-message auth-message--success">{tradeNote}</p>
            )}
            {marketPrices.map((m) => {
              const label = marketResourceLabels[m.resource_code] ?? m.resource_code;
              const owned = amountFor(roleResources, m.resource_code);
              const qty = tradeQuantities[m.resource_code] ?? "";

              return (
                <div className="build-project" key={m.resource_code}>
                  <div className="build-project__head">
                    <span className="build-project__name">{label}</span>
                    <span className="build-project__eta">
                      {Math.round(m.price)} guld/stk
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 0 8px" }}>
                    {m.sellable && `Du har ${Math.floor(owned)}`}
                    {m.buyable && `Guld i kiste: ${Math.floor(gold)}`}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="command-input"
                      type="number"
                      min={1}
                      placeholder="Antal"
                      value={qty}
                      onChange={(e) =>
                        setTradeQuantities({ ...tradeQuantities, [m.resource_code]: e.target.value })
                      }
                    />
                    {m.sellable && (
                      <button
                        className="btn btn--primary"
                        disabled={isTradePending}
                        onClick={() => handleSell(m.resource_code)}
                      >
                        Sælg
                      </button>
                    )}
                    {m.buyable && (
                      <button
                        className="btn btn--primary"
                        disabled={isTradePending}
                        onClick={() => handleBuy(m.resource_code)}
                      >
                        Køb
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "Produktion" && (
          <div>
            {buildError && (
              <p className="auth-message auth-message--error">{buildError}</p>
            )}
            {collectNote && (
              <p className="auth-message auth-message--success">{collectNote}</p>
            )}
            {buildingOrder.map((type) => {
              const level = levelFor(buildings, type);
              const cost = costFor(level);
              const maxed = level >= 30;
              const canAfford = wood >= cost.wood && stone >= cost.stone;
              const outputCode = producedResourceByBuilding[type];
              const stock = outputCode ? amountFor(roleResources, outputCode) : null;

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
                    {stock !== null && outputCode && (
                      <> — beholdning: {Math.floor(stock)} {producedResourceLabels[outputCode]}</>
                    )}
                  </p>
                  <div className="progress">
                    <div
                      className="progress__fill"
                      style={{ width: `${(level / 30) * 100}%` }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    {!maxed && (
                      <button
                        className="btn btn--primary"
                        disabled={isBuildPending || !canAfford}
                        onClick={() => handleUpgrade(type)}
                      >
                        {canAfford ? "Opgrader" : "Ikke råd"}
                      </button>
                    )}
                    {outputCode && (
                      <button
                        className="btn"
                        disabled={isCollectPending}
                        onClick={() => handleCollect(type)}
                      >
                        Indsaml
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
