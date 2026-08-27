function dxf(lines: (string | number)[]) {
  return lines.map(String).join("\n") + "\n";
}

function line(layer: string, x1: number, y1: number, x2: number, y2: number) {
  return dxf(["0", "LINE", "8", layer, "10", x1, "20", y1, "30", 0, "11", x2, "21", y2, "31", 0]);
}

function hPair(layer: string, x1: number, x2: number, y: number, t = 200) {
  return line(layer, x1, y - t / 2, x2, y - t / 2) + line(layer, x1, y + t / 2, x2, y + t / 2);
}

function vPair(layer: string, y1: number, y2: number, x: number, t = 200) {
  return line(layer, x - t / 2, y1, x - t / 2, y2) + line(layer, x + t / 2, y1, x + t / 2, y2);
}

function lwpoly(layer: string, pts: [number, number][]) {
  const head = dxf(["0", "LWPOLYLINE", "8", layer, "90", pts.length, "70", 1]);
  const verts = pts.map(([x, y]) => dxf(["10", x, "20", y])).join("");
  return head + verts;
}

function text(layer: string, x: number, y: number, value: string, height = 300) {
  return dxf(["0", "TEXT", "8", layer, "10", x, "20", y, "30", 0, "40", height, "1", value]);
}

function insert(layer: string, block: string, x: number, y: number, scaleX = 1, rot = 0) {
  return dxf(["0", "INSERT", "8", layer, "2", block, "10", x, "20", y, "30", 0, "41", scaleX, "42", 1, "43", 1, "50", rot]);
}

function layer(name: string, color: number) {
  return dxf(["0", "LAYER", "2", name, "70", 0, "62", color, "6", "CONTINUOUS"]);
}

function block(name: string) {
  return dxf(["0", "BLOCK", "2", name, "10", 0, "20", 0, "30", 0, "0", "ENDBLK"]);
}

/** Two-storey villa plan in millimeters — used when no CAD file is uploaded. */
export function sampleVillaDxf(): string {
  const layers = ["A-WALL", "A-WALL-1ST", "A-DOOR", "A-WINDOW", "A-FURN", "A-FURN-1ST", "A-FLOR", "A-FLOR-1ST", "A-STRS", "A-ANNO", "A-ANNO-1ST", "A-DIMS"]
    .map((name, i) => layer(name, i + 1))
    .join("");

  const groundWalls =
    vPair("A-WALL", 0, 11400, 0) +
    vPair("A-WALL", 0, 11400, 12600) +
    hPair("A-WALL", 0, 12600, 0) +
    hPair("A-WALL", 0, 12600, 11400) +
    vPair("A-WALL", 200, 6200, 3200) +
    vPair("A-WALL", 200, 11200, 8400) +
    hPair("A-WALL", 3200, 12400, 6200) +
    vPair("A-WALL", 6300, 9000, 5300) +
    hPair("A-WALL", 5300, 8300, 9000);

  const firstWalls =
    vPair("A-WALL-1ST", 2400, 11400, 0) +
    vPair("A-WALL-1ST", 0, 11400, 8400) +
    hPair("A-WALL-1ST", 0, 8400, 2400) +
    hPair("A-WALL-1ST", 0, 8400, 11400);

  const rooms =
    lwpoly("A-FLOR", [
      [400, 400],
      [3000, 400],
      [3000, 2600],
      [400, 2600],
    ]) +
    lwpoly("A-FLOR", [
      [3500, 400],
      [8200, 400],
      [8200, 6000],
      [3500, 6000],
    ]) +
    lwpoly("A-FLOR", [
      [8600, 400],
      [12200, 400],
      [12200, 6000],
      [8600, 6000],
    ]) +
    lwpoly("A-FLOR", [
      [8600, 6400],
      [12200, 6400],
      [12200, 11100],
      [8600, 11100],
    ]) +
    lwpoly("A-FLOR", [
      [400, 6400],
      [5100, 6400],
      [5100, 11100],
      [400, 11100],
    ]) +
    lwpoly("A-FLOR", [
      [5500, 6400],
      [8200, 6400],
      [8200, 8800],
      [5500, 8800],
    ]) +
    lwpoly("A-FLOR", [
      [400, 2800],
      [3000, 2800],
      [3000, 6000],
      [400, 6000],
    ]) +
    lwpoly("A-FLOR-1ST", [
      [400, 2800],
      [7100, 2800],
      [7100, 7600],
      [400, 7600],
    ]);

  const labels =
    text("A-ANNO", 1400, 1400, "FOYER") +
    text("A-ANNO", 5600, 3000, "LIVING") +
    text("A-ANNO", 10200, 3000, "DINING") +
    text("A-ANNO", 10200, 8600, "KITCHEN") +
    text("A-ANNO", 2400, 8600, "BEDROOM") +
    text("A-ANNO", 6700, 7500, "BATH") +
    text("A-ANNO", 1400, 4200, "STAIR HALL") +
    text("A-ANNO-1ST", 2800, 5000, "MASTER BEDROOM");

  const dims = dxf(["0", "DIMENSION", "8", "A-DIMS", "1", "5200", "42", 5200, "13", 3500, "23", 400, "33", 0, "14", 8700, "24", 400, "34", 0]);

  const blocks = ["DOOR_BLOCK", "SLIDING_DOOR", "WINDOW_BLOCK", "SOFA_BLOCK", "BED_BLOCK", "TABLE_BLOCK", "CHAIR_BLOCK", "WC_BLOCK", "SINK_BLOCK", "STAIR_BLOCK"]
    .map(block)
    .join("");

  const inserts =
    insert("A-DOOR", "DOOR_BLOCK", 1600, 0, 1100) +
    insert("A-DOOR", "DOOR_BLOCK", 3200, 1400, 900, 90) +
    insert("A-DOOR", "DOOR_BLOCK", 8400, 3000, 900, 90) +
    insert("A-DOOR", "SLIDING_DOOR", 10500, 0, 1800) +
    insert("A-WINDOW", "WINDOW_BLOCK", 5800, 0, 1800) +
    insert("A-WINDOW", "WINDOW_BLOCK", 10500, 11400, 1600) +
    insert("A-FURN", "SOFA_BLOCK", 5800, 2200, 1) +
    insert("A-FURN", "TABLE_BLOCK", 10200, 2800, 1) +
    insert("A-FURN", "CHAIR_BLOCK", 9800, 2400, 1) +
    insert("A-FURN", "BED_BLOCK", 2200, 8800, 1) +
    insert("A-FURN", "WC_BLOCK", 6200, 7200, 1) +
    insert("A-FURN", "SINK_BLOCK", 7400, 7200, 1) +
    insert("A-STRS", "STAIR_BLOCK", 1600, 4000, 1) +
    insert("A-FURN-1ST", "BED_BLOCK", 2800, 5000, 1);

  return (
    dxf(["0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1027", "9", "$INSUNITS", "70", 4, "0", "ENDSEC"]) +
    dxf(["0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER"]) +
    layers +
    dxf(["0", "ENDTAB", "0", "ENDSEC"]) +
    dxf(["0", "SECTION", "2", "BLOCKS"]) +
    blocks +
    dxf(["0", "ENDSEC"]) +
    dxf(["0", "SECTION", "2", "ENTITIES"]) +
    groundWalls +
    firstWalls +
    rooms +
    labels +
    dims +
    inserts +
    dxf(["0", "ENDSEC", "0", "EOF"])
  );
}

export const SAMPLE_DXF_FILENAME = "Modern_Villa_Ground_Floor.dxf";
