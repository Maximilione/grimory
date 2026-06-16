"use client";

/**
 * Hand-authored pixel-art icons as inline SVG (grids of squares). Fully offline,
 * themeable, tiny. Used as faint background watermarks behind stats/boxes.
 * Each grid: array of rows, "#" = filled pixel, anything else = empty.
 */

const PIX: Record<string, string[]> = {
  // abilities
  str: [ // dumbbell
    "............",
    "..##....##..",
    ".####..####.",
    ".####..####.",
    ".##########.",
    ".##########.",
    ".####..####.",
    ".####..####.",
    "..##....##..",
    "............",
  ],
  dex: [ // arrow up-right
    ".....######",
    ".......####",
    "......#.###",
    ".....#..##.",
    "....#...#..",
    "...#....#..",
    "..#........",
    ".#.........",
    "#..........",
  ],
  con: [ // heart
    "............",
    ".##......##.",
    "####....####",
    "############",
    "############",
    ".##########.",
    "..########..",
    "...######...",
    "....####....",
    ".....##.....",
  ],
  int: [ // book
    ".##########.",
    ".#........#.",
    ".#.######.#.",
    ".#........#.",
    ".#.######.#.",
    ".#........#.",
    ".#.######.#.",
    ".#........#.",
    ".##########.",
  ],
  wis: [ // eye
    "............",
    "...######...",
    "..#......#..",
    ".#..####..#.",
    "#..######..#",
    ".#..####..#.",
    "..#......#..",
    "...######...",
    "............",
  ],
  cha: [ // star
    ".....##.....",
    ".....##.....",
    "....####....",
    "############",
    ".##########.",
    "..########..",
    "...######...",
    "..##....##..",
    ".##......##.",
  ],
  // combat / misc
  hp: [ // heart (alias con)
    "............",
    ".##......##.",
    "####....####",
    "############",
    "############",
    ".##########.",
    "..########..",
    "...######...",
    "....####....",
    ".....##.....",
  ],
  ac: [ // shield
    ".########.",
    "##########",
    "##########",
    "##########",
    ".########.",
    ".########.",
    "..######..",
    "...####...",
    "....##....",
  ],
  speed: [ // boot
    ".###......",
    ".###......",
    ".###......",
    ".###......",
    ".###......",
    ".######...",
    ".########.",
    "##########",
  ],
  init: [ // lightning bolt
    ".....###",
    "....###.",
    "...###..",
    "..#####.",
    "#######.",
    "...###..",
    "..###...",
    ".###....",
  ],
  spell: [ // sparkle
    "...#...",
    ".#.#.#.",
    "..###..",
    "##.#.##",
    "..###..",
    ".#.#.#.",
    "...#...",
  ],
  sword: [
    ".......##",
    "......###",
    ".....###.",
    "....###..",
    "...###...",
    "..###....",
    "####.....",
    "##.#.....",
  ],
  dice: [
    "########",
    "#......#",
    "#.##...#",
    "#.##.#.#",
    "#....#.#",
    "#.#....#",
    "#...##.#",
    "########",
  ],
};

export function PixelIcon({
  name,
  className = "",
  color = "currentColor",
  style,
}: {
  name: keyof typeof PIX | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}) {
  const grid = PIX[name];
  if (!grid) return null;
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));
  const rects: React.ReactNode[] = [];
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "#") rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />);
    }
  });
  return (
    <svg
      viewBox={`0 0 ${cols} ${rows}`}
      className={className}
      style={{ shapeRendering: "crispEdges", ...style }}
      aria-hidden
    >
      {rects}
    </svg>
  );
}

/** Faint watermark, absolutely positioned in a `relative` parent. */
export function PixelWatermark({ name, color = "var(--accent)", opacity = 0.14 }: { name: string; color?: string; opacity?: number }) {
  return (
    <PixelIcon
      name={name}
      color={color}
      style={{
        position: "absolute",
        right: "-2px",
        bottom: "-2px",
        width: "46%",
        maxWidth: 64,
        opacity,
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
}

export const ABILITY_PIX: Record<string, string> = {
  str: "str", dex: "dex", con: "con", int: "int", wis: "wis", cha: "cha",
};
