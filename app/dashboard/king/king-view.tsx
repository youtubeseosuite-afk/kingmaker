"use client";
// Path: app/dashboard/king/king-view.tsx | Type: UPDATE

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  upgradeBuilding,
  placeFieldStructure,
  setTaxRate,
  queueWeaponProduction,
  collectWeaponProduction,
  trainUnits,
  collectTraining,
  upgradeFieldStructure,
  type FieldStructureType,
} from "./actions";
import SkillsPanel from "../skills-panel";
import { resourceLabels } from "../resource-labels";
import MapGrid from "../map-grid";

type ResourceRow = { resource_code: string; amount: number };
type ResourceCap = { resource_code: string; storage_cap: number };
type TerrainYield = { structure_type: string; terrain: string; yield_multiplier: number };

const terrainLabels: Record<string, string> = {
  plains: "Slette",
  forest: "Skov",
  hills: "Bakker",
  water: "Vand",
  swamp: "Sump",
  mountain: "Bjerg",
};
type BuildingType =
  | "keep"
  | "walls"
  | "storehouse"
  | "barracks"
  | "stable"
  | "kitchen"
  | "housing";
type BuildingRow = { building_type: BuildingType; level: number };
type BuildingTypeInfo = {
  building_type: BuildingType;
  display_name: string;
  description: string;
  wood_cost_per_level: number;
  stone_cost_per_level: number;
  requires_building_type: BuildingType | null;
  requires_level: number | null;
};
type ActiveModifier = {
  id: string;
  modifier_code: string;
  modifier_value: number;
  expires_at: string | null;
  role_skills: { skill_name: string } | null;
};
type Tile = { id: string; x: number; y: number; terrain: string };
type VisibilityRow = { tile_id: string; visibility: "unknown" | "scouted" | "visible" };
type OwnershipRow = { tile_id: string; status: string; owner_realm_id: string | null };
type StructureRow = { id: string; tile_id: string; structure_type: string; level: number };
type Population = { population: number; cap: number; growth_rate: number };
type WeaponTemplate = {
  id: string;
  name: string;
  tier: "tier1" | "tier2" | "tier3";
  unit_type: string;
  base_cp: number;
  materials: Record<string, number>;
  production_seconds: number;
  min_forge_level: number;
};
type QueueRow = {
  id: string;
  weapon_template_id: string;
  quantity: number;
  started_at: string;
  completes_at: string;
  collected: boolean;
};
type WeaponSetRow = {
  id: string;
  weapon_template_id: string;
  quantity: number;
  equipped_quantity: number;
};
type GarrisonRow = { id: string; unit_type: string; quantity: number };
type UnitTypeInfo = {
  code: string;
  display_name: string;
  base_cp: number;
  training_time_seconds: number;
  training_cost_food: number;
};
type TrainingQueueRow = {
  id: string;
  unit_type: string;
  quantity: number;
  started_at: string;
  completes_at: string;
  collected: boolean;
};

const tierLabels: Record<string, string> = {
  tier1: "Tier 1",
  tier2: "Tier 2",
  tier3: "Tier 3",
};

const structureTypeLabels: Record<FieldStructureType, string> = {
  mine: "Mine",
  farm: "Farm",
  forestry_camp: "Skovbrug",
};

const structureResourceMap: Record<FieldStructureType, { code: string; scope: "kingdom" | "role" }> = {
  mine: { code: "iron", scope: "role" },
  farm: { code: "food", scope: "kingdom" },
  forestry_camp: { code: "wood", scope: "kingdom" },
};

const structureBaseYield: Record<string, number> = {
  mine: 5,
  farm: 8,
  forestry_camp: 6,
};

const structureTypePlural: Record<string, string> = {
  mine: "Miner",
  farm: "Farme",
  forestry_camp: "Skovbrug",
};

function utilizationFor(amount: number, caps: ResourceCap[], code: string) {
  const cap = caps.find((c) => c.resource_code === code)?.storage_cap ?? 1000;
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((amount / cap) * 100));
}

function terrainYieldFor(terrainYields: TerrainYield[], structureType: string, terrain: string) {
  const row = terrainYields.find(
    (t) => t.structure_type === structureType && t.terrain === terrain
  );
  return row ? Math.round(row.yield_multiplier * 100) : 100;
}

function neighborBonusFor(
  structures: StructureRow[],
  tiles: Tile[],
  selectedTileId: string,
  structureType: string
) {
  const tile = tiles.find((t) => t.id === selectedTileId);
  if (!tile) return { count: 0, pct: 0 };

  let count = 0;
  for (const s of structures) {
    if (s.structure_type !== structureType || s.tile_id === selectedTileId) continue;
    const st = tiles.find((t) => t.id === s.tile_id);
    if (!st) continue;
    if (Math.abs(st.x - tile.x) <= 1 && Math.abs(st.y - tile.y) <= 1) count++;
  }

  const capped = Math.min(4, count);
  return { count: capped, pct: capped * 10 };
}

function amountFor(rows: ResourceRow[], code: string) {
  return rows.find((r) => r.resource_code === code)?.amount ?? 0;
}

function levelFor(buildings: BuildingRow[], type: BuildingType) {
  return buildings.find((b) => b.building_type === type)?.level ?? 0;
}

function labelFor(buildingTypes: BuildingTypeInfo[], type: BuildingType) {
  return buildingTypes.find((b) => b.building_type === type)?.display_name ?? type;
}

function costFor(buildingTypes: BuildingTypeInfo[], type: BuildingType, level: number) {
  const info = buildingTypes.find((b) => b.building_type === type);
  return {
    wood: (info?.wood_cost_per_level ?? 50) * level,
    stone: (info?.stone_cost_per_level ?? 40) * level,
  };
}

function prereqStatus(
  buildingTypes: BuildingTypeInfo[],
  buildings: BuildingRow[],
  type: BuildingType
): { met: boolean; label: string | null } {
  const info = buildingTypes.find((b) => b.building_type === type);
  if (!info?.requires_building_type || !info.requires_level) {
    return { met: true, label: null };
  }
  const prereqLevel = levelFor(buildings, info.requires_building_type);
  const prereqLabel = labelFor(buildingTypes, info.requires_building_type);
  return {
    met: prereqLevel >= info.requires_level,
    label: `${prereqLabel} niveau ${info.requires_level}`,
  };
}

function buildingStats(
  type: BuildingType,
  displayLevel: number,
  taxRate: number,
  population: Population
): { label: string; value: string }[] {
  switch (type) {
    case "keep":
      return [
        { label: "Skattetryk", value: `${taxRate}%` },
        {
          label: "Indbyggere",
          value: `${Math.floor(population.population)} / ${Math.floor(population.cap)}`,
        },
      ];
    case "housing":
      return [{ label: "Befolkningsloft", value: `${150 + displayLevel * 50}` }];
    case "storehouse":
      return [{ label: "Lagerkapacitet (Mad/Træ/Sten)", value: `${1000 + displayLevel * 300}` }];
    case "walls":
      return [{ label: "Forsvarsbonus — venter på kampsystemet", value: `+${displayLevel * 3}%` }];
    case "barracks":
      return [
        { label: "Garnisonskapacitet — venter på hær-systemet", value: `${displayLevel * 50}` },
      ];
    case "stable":
      return [
        { label: "Marchbonus — venter på hær-systemet", value: `+${displayLevel * 5}%` },
      ];
    case "kitchen":
      return [
        { label: "Madforbrug — venter på hær-systemet", value: `−${displayLevel * 2}%` },
      ];
    default:
      return [];
  }
}

function timeRemaining(expiresAt: string | null) {
  if (!expiresAt) return "Permanent";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Udløbet";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}t ${minutes}m`;
}

const events = [
  { time: "14:02", text: "Spejder rapporterer ukendt hær ved (34, 12)" },
  { time: "13:20", text: "Prioren har udstedt en velsignelse over garnisonen" },
  { time: "12:10", text: "Muren er styrket til niveau 4" },
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

const tabs = ["Slot", "Hær", "Land", "Produktion", "Smedje", "Indstillinger", "Evner"] as const;
type Tab = (typeof tabs)[number];

export default function KingView({
  legitimacy,
  roleProfileId,
  level,
  kingdomResources,
  roleResources,
  kingdomCaps,
  roleCaps,
  terrainYields,
  buildings,
  buildingTypes,
  skills,
  unlockedCodes,
  realmId,
  activeModifiers,
  tiles,
  visibility,
  ownership,
  structures,
  taxRate,
  population,
  weaponTemplates,
  productionQueue,
  weaponSets,
  garrison,
  unitTypes,
  trainingQueue,
  armyCp,
}: {
  legitimacy: number;
  roleProfileId: string | null;
  level: number;
  kingdomResources: ResourceRow[];
  roleResources: ResourceRow[];
  kingdomCaps: ResourceCap[];
  roleCaps: ResourceCap[];
  terrainYields: TerrainYield[];
  buildings: BuildingRow[];
  buildingTypes: BuildingTypeInfo[];
  skills: Skill[];
  unlockedCodes: string[];
  realmId: string;
  activeModifiers: ActiveModifier[];
  tiles: Tile[];
  visibility: VisibilityRow[];
  ownership: OwnershipRow[];
  structures: StructureRow[];
  taxRate: number;
  population: Population;
  weaponTemplates: WeaponTemplate[];
  productionQueue: QueueRow[];
  weaponSets: WeaponSetRow[];
  garrison: GarrisonRow[];
  unitTypes: UnitTypeInfo[];
  trainingQueue: TrainingQueueRow[];
  armyCp: number;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Slot");
  const [error, setError] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [taxSlider, setTaxSlider] = useState(taxRate);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [settingsBuilding, setSettingsBuilding] = useState<BuildingType>("keep");
  const [weaponError, setWeaponError] = useState<string | null>(null);
  const [queueQuantities, setQueueQuantities] = useState<Record<string, string>>({});
  const [trainError, setTrainError] = useState<string | null>(null);
  const [trainQuantities, setTrainQuantities] = useState<Record<string, string>>({});
  const [structureUpgradeError, setStructureUpgradeError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isPlacePending, startPlaceTransition] = useTransition();
  const [isTaxPending, startTaxTransition] = useTransition();
  const [isQueuePending, startQueueTransition] = useTransition();
  const [isCollectWeaponPending, startCollectWeaponTransition] = useTransition();
  const [isTrainPending, startTrainTransition] = useTransition();
  const [isCollectTrainingPending, startCollectTrainingTransition] = useTransition();
  const [isStructureUpgradePending, startStructureUpgradeTransition] = useTransition();

  const wood = amountFor(kingdomResources, "wood");
  const stone = amountFor(kingdomResources, "stone");

  const ownResources = [
    { code: "gold", value: amountFor(roleResources, "gold"), accent: true },
    { code: "iron", value: amountFor(roleResources, "iron") },
  ];
  const sharedResources = [
    { code: "food", value: amountFor(kingdomResources, "food") },
    { code: "wood", value: wood },
    { code: "stone", value: stone },
  ];

  function handleUpgrade(buildingType: BuildingType) {
    if (!roleProfileId) return;
    setError(null);
    startTransition(async () => {
      const result = await upgradeBuilding(roleProfileId, buildingType);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const visibilityMap: Record<string, "unknown" | "scouted" | "visible"> = {};
  visibility.forEach((v) => {
    visibilityMap[v.tile_id] = v.visibility;
  });

  const ownershipMap: Record<string, { status: string; isMine: boolean }> = {};
  ownership.forEach((o) => {
    if (o.status !== "unclaimed") {
      ownershipMap[o.tile_id] = { status: o.status, isMine: o.owner_realm_id === realmId };
    }
  });

  const structureMap: Record<string, { type: string; level: number }> = {};
  structures.forEach((s) => {
    structureMap[s.tile_id] = { type: s.structure_type, level: s.level };
  });

  const selectedStructure = selectedTile ? structureMap[selectedTile] : undefined;
  const selectedTerrain = selectedTile ? tiles.find((t) => t.id === selectedTile)?.terrain : undefined;

  function handleTileClick(tileId: string) {
    setSelectedTile(tileId);
    setPlaceError(null);
  }

  function handlePlaceStructure(type: FieldStructureType) {
    if (!roleProfileId || !selectedTile) return;
    setPlaceError(null);
    startPlaceTransition(async () => {
      const result = await placeFieldStructure(roleProfileId, selectedTile, type);
      if (result.error) {
        setPlaceError(result.error);
      } else {
        setSelectedTile(null);
        router.refresh();
      }
    });
  }

  function handleUpgradeStructure(structureId: string) {
    if (!roleProfileId) return;
    setStructureUpgradeError(null);
    startStructureUpgradeTransition(async () => {
      const result = await upgradeFieldStructure(roleProfileId, structureId);
      if (result.error) {
        setStructureUpgradeError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleSetTaxRate(value: number) {
    if (!roleProfileId) return;
    setTaxSlider(value);
    setTaxError(null);
    startTaxTransition(async () => {
      const result = await setTaxRate(roleProfileId, value);
      if (result.error) {
        setTaxError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const forgeLevel = levelFor(buildings, "forge" as BuildingType);

  function handleQueueProduction(templateId: string) {
    if (!roleProfileId) return;
    const qty = Number(queueQuantities[templateId] ?? "1");
    if (qty <= 0) return;
    setWeaponError(null);
    startQueueTransition(async () => {
      const result = await queueWeaponProduction(roleProfileId, templateId, qty);
      if (result.error) {
        setWeaponError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleCollectWeapon(queueId: string) {
    setWeaponError(null);
    startCollectWeaponTransition(async () => {
      const result = await collectWeaponProduction(queueId);
      if (result.error) {
        setWeaponError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleTrain(unitType: string) {
    if (!roleProfileId) return;
    const qty = Number(trainQuantities[unitType] ?? "1");
    if (qty <= 0) return;
    setTrainError(null);
    startTrainTransition(async () => {
      const result = await trainUnits(roleProfileId, unitType, qty);
      if (result.error) {
        setTrainError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleCollectTraining(queueId: string) {
    setTrainError(null);
    startCollectTrainingTransition(async () => {
      const result = await collectTraining(queueId);
      if (result.error) {
        setTrainError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="dashboard">
      <aside className="panel-left">
        <div className="sidebar-section">
          <div className="panel-title">Kongens styrke</div>
          <div className="stat-row">
            <span className="stat-row__label">Legitimitet</span>
            <span className="stat-row__value">{legitimacy}</span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Garnison, i alt</span>
            <span className="stat-row__value">
              {garrison.reduce((sum, u) => sum + u.quantity, 0)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Hærens samlede CP</span>
            <span className="stat-row__value stat-row__value--accent">
              {Math.floor(armyCp)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Indbyggere</span>
            <span className="stat-row__value">
              {Math.floor(population.population).toLocaleString("da-DK")} / {Math.floor(population.cap)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-row__label">Skattetryk</span>
            <span className="stat-row__value">{taxSlider}%</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
            Justeres under Indstillinger
          </p>
        </div>

        <div className="sidebar-section">
          <div className="panel-title">Lager</div>
          {ownResources.map((r) => (
            <div className="stat-row" key={r.code}>
              <span className="stat-row__label">{resourceLabels[r.code] ?? r.code}</span>
              <span className={`stat-row__value${r.accent ? " stat-row__value--accent" : ""}`}>
                {Math.floor(r.value).toLocaleString("da-DK")}
              </span>
            </div>
          ))}
          {sharedResources.map((r) => (
            <div className="stat-row" key={r.code}>
              <span className="stat-row__label">{resourceLabels[r.code] ?? r.code}</span>
              <span className="stat-row__value">
                {Math.floor(r.value).toLocaleString("da-DK")}
              </span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="panel-title">Aktive bonusser</div>
          {activeModifiers.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-faint)" }}>Ingen aktive bonusser</p>
          )}
          {activeModifiers.map((m) => (
            <div className="stat-row" key={m.id}>
              <span className="stat-row__label">{m.role_skills?.skill_name ?? m.modifier_code}</span>
              <span className="stat-row__value">{timeRemaining(m.expires_at)}</span>
            </div>
          ))}
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
            {buildingTypes.map((info) => {
              const type = info.building_type;
              const builtLevel = levelFor(buildings, type);
              const displayLevel = Math.max(builtLevel, 1);
              const cost = costFor(buildingTypes, type, displayLevel);
              const maxed = builtLevel >= 30;
              const canAfford = wood >= cost.wood && stone >= cost.stone;
              const prereq = prereqStatus(buildingTypes, buildings, type);
              const locked = builtLevel === 0 && !prereq.met;

              return (
                <div className="build-project" key={type}>
                  <div className="build-project__head">
                    <span className="build-project__name">
                      {info.display_name}
                      {builtLevel > 0 ? ` — niveau ${builtLevel}` : " — ikke bygget"}
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
                    {info.description}
                  </p>
                  {buildingStats(type, displayLevel, taxSlider, population).map((s) => (
                    <div className="stat-row" key={s.label} style={{ padding: "4px 0" }}>
                      <span className="stat-row__label">{s.label}</span>
                      <span className="stat-row__value">{s.value}</span>
                    </div>
                  ))}
                  <div className="progress" style={{ marginTop: 6 }}>
                    <div
                      className="progress__fill"
                      style={{ width: `${(builtLevel / 30) * 100}%` }}
                    />
                  </div>
                  {locked && (
                    <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>
                      Kræver {prereq.label}
                    </p>
                  )}
                  {!locked && !maxed && (
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
            {trainError && (
              <p className="auth-message auth-message--error">{trainError}</p>
            )}

            {garrison.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="panel-title">Garnison</div>
                {garrison.map((unit) => {
                  const info = unitTypes.find((u) => u.code === unit.unit_type);
                  return (
                    <div className="stat-row" key={unit.id}>
                      <span className="stat-row__label">{info?.display_name ?? unit.unit_type}</span>
                      <span className="stat-row__value">{unit.quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {trainingQueue.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="panel-title">Under træning</div>
                {trainingQueue.map((q) => {
                  const info = unitTypes.find((u) => u.code === q.unit_type);
                  const done = new Date(q.completes_at).getTime() <= Date.now();
                  return (
                    <div className="stat-row" key={q.id}>
                      <span className="stat-row__label">
                        {q.quantity}x {info?.display_name ?? q.unit_type}
                      </span>
                      <span className="stat-row__value">
                        {done ? (
                          <button
                            className="btn btn--primary"
                            disabled={isCollectTrainingPending}
                            onClick={() => handleCollectTraining(q.id)}
                          >
                            Hent
                          </button>
                        ) : (
                          timeRemaining(q.completes_at)
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="panel-title">Træn tropper</div>
            {unitTypes.map((u) => {
              const qty = trainQuantities[u.code] ?? "10";
              const requiresStable = u.code === "cavalry";
              return (
                <div className="build-project" key={u.code}>
                  <div className="build-project__head">
                    <span className="build-project__name">{u.display_name}</span>
                    <span className="build-project__eta">CP {u.base_cp}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 0" }}>
                    {u.training_cost_food} mad pr. stk · {Math.round(u.training_time_seconds / 60)} min pr. stk
                    {requiresStable && " · kræver Stalden"}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="command-input"
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) =>
                        setTrainQuantities({ ...trainQuantities, [u.code]: e.target.value })
                      }
                    />
                    <button
                      className="btn btn--primary"
                      disabled={isTrainPending}
                      onClick={() => handleTrain(u.code)}
                    >
                      Træn
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "Land" && (
          <div>
            <MapGrid
              tiles={tiles}
              visibility={visibilityMap}
              ownership={ownershipMap}
              structures={structureMap}
              onTileClick={handleTileClick}
            />
            <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8 }}>
              M = Mine · F = Farm · S = Skovbrug · K = Kloster (Prioren)
            </p>

            {selectedTile && (
              <div className="modal-backdrop" onClick={() => setSelectedTile(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="modal-close"
                    onClick={() => setSelectedTile(null)}
                    aria-label="Luk"
                  >
                    ×
                  </button>

                  {placeError && (
                    <p className="auth-message auth-message--error">{placeError}</p>
                  )}

                  {selectedStructure ? (
                    <div className="modal-title">
                      {structureTypeLabels[selectedStructure.type as FieldStructureType] ??
                        selectedStructure.type}{" "}
                      — niveau {selectedStructure.level}
                    </div>
                  ) : (
                    <>
                      <div className="modal-title">
                        Byg struktur — {terrainLabels[selectedTerrain ?? ""] ?? "Ukendt terræn"}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: -8, marginBottom: 10 }}>
                        80 træ · 60 sten
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(["mine", "farm", "forestry_camp"] as FieldStructureType[]).map((t) => {
                          const res = structureResourceMap[t];
                          const amount =
                            res.scope === "kingdom"
                              ? amountFor(kingdomResources, res.code)
                              : amountFor(roleResources, res.code);
                          const caps = res.scope === "kingdom" ? kingdomCaps : roleCaps;
                          const pct = utilizationFor(amount, caps, res.code);
                          const terrainPct = terrainYieldFor(terrainYields, t, selectedTerrain ?? "");
                          const neighbor = neighborBonusFor(structures, tiles, selectedTile, t);

                          return (
                            <button
                              key={t}
                              className="btn btn--primary modal-option"
                              disabled={isPlacePending || terrainPct === 0}
                              onClick={() => handlePlaceStructure(t)}
                            >
                              <span>{structureTypeLabels[t]}</span>
                              <span className="modal-option__hint">
                                {terrainPct}% terræn
                                {neighbor.count > 0 &&
                                  ` · +${neighbor.pct}% fra ${neighbor.count} nabo${neighbor.count > 1 ? "er" : ""}`}
                                {" · "}
                                {pct}% udnyttelse
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10 }}>
                        Udnyttelse = hvor fyldt dit lager af den ressource er lige nu — lavt tal
                        betyder mere plads til vækst.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Produktion" && (
          <div>
            {structureUpgradeError && (
              <p className="auth-message auth-message--error">{structureUpgradeError}</p>
            )}
            {structures.length === 0 && (
              <div className="placeholder-note">
                Ingen strukturer bygget endnu — placér en Mine, Farm eller Skovbrug under Land.
              </div>
            )}
            {(["mine", "farm", "forestry_camp"] as FieldStructureType[]).map((type) => {
              const ofType = structures.filter((s) => s.structure_type === type);
              if (ofType.length === 0) return null;

              return (
                <div key={type} style={{ marginBottom: 20 }}>
                  <div className="panel-title">{structureTypePlural[type]}</div>
                  {ofType.map((s) => {
                    const tile = tiles.find((t) => t.id === s.tile_id);
                    const terrain = tile?.terrain ?? "";
                    const terrainPct = terrainYieldFor(terrainYields, type, terrain);
                    const neighbor = neighborBonusFor(structures, tiles, s.tile_id, type);
                    const output =
                      s.level *
                      (structureBaseYield[type] ?? 0) *
                      (terrainPct / 100) *
                      (1 + neighbor.pct / 100);
                    const woodCost = 80 * s.level;
                    const stoneCost = 60 * s.level;
                    const maxed = s.level >= 30;
                    const canAfford = wood >= woodCost && stone >= stoneCost;

                    return (
                      <div className="build-project" key={s.id}>
                        <div className="build-project__head">
                          <span className="build-project__name">
                            {tile ? `(${tile.x}, ${tile.y})` : "Ukendt felt"} —{" "}
                            {terrainLabels[terrain] ?? terrain} — niveau {s.level}
                          </span>
                          <span className="build-project__eta">
                            {maxed ? "Maks niveau" : `${woodCost} træ · ${stoneCost} sten`}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 0 6px" }}>
                          {Math.round(output * 10) / 10} {resourceLabels[structureResourceMap[type]]}/time
                          {" · "}
                          {terrainPct}% terræn
                          {neighbor.count > 0 &&
                            ` · +${neighbor.pct}% fra ${neighbor.count} nabo${neighbor.count > 1 ? "er" : ""}`}
                        </p>
                        <div className="progress">
                          <div
                            className="progress__fill"
                            style={{ width: `${(s.level / 30) * 100}%` }}
                          />
                        </div>
                        {!maxed && (
                          <button
                            className="btn btn--primary"
                            style={{ marginTop: 8 }}
                            disabled={isStructureUpgradePending || !canAfford}
                            onClick={() => handleUpgradeStructure(s.id)}
                          >
                            {canAfford ? "Opgrader" : "Ikke råd"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "Smedje" && (
          <div>
            {weaponError && (
              <p className="auth-message auth-message--error">{weaponError}</p>
            )}

            {productionQueue.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="panel-title">I gang</div>
                {productionQueue.map((q) => {
                  const template = weaponTemplates.find((t) => t.id === q.weapon_template_id);
                  const done = new Date(q.completes_at).getTime() <= Date.now();
                  return (
                    <div className="stat-row" key={q.id}>
                      <span className="stat-row__label">
                        {q.quantity}x {template?.name ?? "Ukendt våben"}
                      </span>
                      <span className="stat-row__value">
                        {done ? (
                          <button
                            className="btn btn--primary"
                            disabled={isCollectWeaponPending}
                            onClick={() => handleCollectWeapon(q.id)}
                          >
                            Hent
                          </button>
                        ) : (
                          timeRemaining(q.completes_at)
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {weaponSets.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="panel-title">Våbenlager</div>
                {weaponSets.map((ws) => {
                  const template = weaponTemplates.find((t) => t.id === ws.weapon_template_id);
                  return (
                    <div className="stat-row" key={ws.id}>
                      <span className="stat-row__label">{template?.name ?? "Ukendt våben"}</span>
                      <span className="stat-row__value">
                        {ws.quantity - ws.equipped_quantity} klar · {ws.equipped_quantity} udrustet
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="panel-title">Producér</div>
            {weaponTemplates.map((t) => {
              const locked = forgeLevel < t.min_forge_level;
              const qty = queueQuantities[t.id] ?? "1";

              return (
                <div className="build-project" key={t.id}>
                  <div className="build-project__head">
                    <span className="build-project__name">
                      {t.name} ({tierLabels[t.tier]})
                    </span>
                    <span className="build-project__eta">CP {t.base_cp}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-faint)", margin: "4px 0" }}>
                    {Object.entries(t.materials)
                      .map(([k, v]) => `${v} ${resourceLabels[k] ?? k}`)
                      .join(" · ")}{" "}
                    pr. stk · {Math.round(t.production_seconds / 60)} min pr. stk
                  </p>
                  {locked ? (
                    <p style={{ fontSize: 12, color: "var(--text-faint)" }}>
                      Kræver Smedjen niveau {t.min_forge_level} (har {forgeLevel})
                    </p>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        className="command-input"
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) =>
                          setQueueQuantities({ ...queueQuantities, [t.id]: e.target.value })
                        }
                      />
                      <button
                        className="btn btn--primary"
                        disabled={isQueuePending}
                        onClick={() => handleQueueProduction(t.id)}
                      >
                        Producér
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "Indstillinger" && (
          <div>
            <label className="auth-form__label" htmlFor="settings-building">
              Vælg bygning
            </label>
            <select
              className="command-input"
              id="settings-building"
              value={settingsBuilding}
              onChange={(e) => setSettingsBuilding(e.target.value as BuildingType)}
              style={{ marginBottom: 16, marginTop: 6 }}
            >
              {buildingTypes.map((bt) => (
                <option key={bt.building_type} value={bt.building_type}>
                  {bt.display_name}
                </option>
              ))}
            </select>

            {settingsBuilding === "keep" ? (
              <div className="build-project">
                <div className="panel-title" style={{ marginBottom: 12 }}>
                  The Keep — Indstillinger
                </div>

                <div style={{ marginBottom: 22 }}>
                  <div className="stat-row__label" style={{ marginBottom: 6 }}>
                    Skattetryk — {taxSlider}%
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={taxSlider}
                    disabled={isTaxPending || !roleProfileId}
                    onChange={(e) => setTaxSlider(Number(e.target.value))}
                    onMouseUp={(e) => handleSetTaxRate(Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => handleSetTaxRate(Number((e.target as HTMLInputElement).value))}
                    style={{ width: "100%" }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                    Højere skat giver mere Guld, men sænker befolkningsvæksten.
                  </p>
                  {taxError && (
                    <p className="auth-message auth-message--error" style={{ marginTop: 6 }}>
                      {taxError}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: 22, opacity: 0.5 }}>
                  <div className="stat-row__label" style={{ marginBottom: 6 }}>
                    Soldater i byens forsvar
                  </div>
                  <input type="range" min={0} max={100} disabled style={{ width: "100%" }} />
                  <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                    Kræver hær-systemet — kommer senere.
                  </p>
                </div>

                <div style={{ opacity: 0.5 }}>
                  <div className="stat-row__label" style={{ marginBottom: 6 }}>
                    General
                  </div>
                  <button className="btn" disabled>
                    Ansæt general
                  </button>
                  <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
                    Kræver kommandør-systemet — kommer senere.
                  </p>
                </div>
              </div>
            ) : (
              <div className="placeholder-note">
                Ingen indstillinger tilgængelige for denne bygning endnu.
              </div>
            )}
          </div>
        )}

        {activeTab === "Evner" && roleProfileId && (
          <SkillsPanel
            roleProfileId={roleProfileId}
            level={level}
            skills={skills}
            unlockedCodes={unlockedCodes}
            resolveTarget={{ realm: realmId }}
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
