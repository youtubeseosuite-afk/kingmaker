"use client";
// Path: app/dashboard/map-grid.tsx | Type: NEW

type Tile = { id: string; x: number; y: number; terrain: string };
type VisibilityState = "unknown" | "scouted" | "visible";

const terrainColors: Record<string, string> = {
  plains: "#6b6a4a",
  forest: "#2d4a2d",
  hills: "#6b5842",
  water: "#1e3a4a",
  swamp: "#3a3a28",
  mountain: "#5a5a5a",
};

const terrainLabels: Record<string, string> = {
  plains: "Slette",
  forest: "Skov",
  hills: "Bakker",
  water: "Vand",
  swamp: "Sump",
  mountain: "Bjerg",
};

const CELL = 22;
const GAP = 2;

export default function MapGrid({
  tiles,
  visibility,
  ownership,
}: {
  tiles: Tile[];
  visibility: Record<string, VisibilityState>;
  ownership: Record<string, { status: string; isMine: boolean }>;
}) {
  const maxX = tiles.reduce((m, t) => Math.max(m, t.x), 0);
  const maxY = tiles.reduce((m, t) => Math.max(m, t.y), 0);
  const width = (maxX + 1) * (CELL + GAP);
  const height = (maxY + 1) * (CELL + GAP);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", height: "auto", display: "block", maxHeight: 480 }}
      role="img"
      aria-label="Kort over kendt territorium"
    >
      {tiles.map((tile) => {
        const state = visibility[tile.id] ?? "unknown";
        const own = ownership[tile.id];
        const fill =
          state === "unknown" ? "#0d0d14" : terrainColors[tile.terrain] ?? "#333333";
        const opacity = state === "scouted" ? 0.55 : 1;

        return (
          <rect
            key={tile.id}
            x={tile.x * (CELL + GAP)}
            y={tile.y * (CELL + GAP)}
            width={CELL}
            height={CELL}
            rx={2}
            fill={fill}
            opacity={opacity}
            stroke={own ? (own.isMine ? "#c5a059" : "#8b2f3b") : "transparent"}
            strokeWidth={own ? 2 : 0}
          >
            <title>
              ({tile.x}, {tile.y}) —{" "}
              {state === "unknown" ? "Ukendt" : terrainLabels[tile.terrain] ?? tile.terrain}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
