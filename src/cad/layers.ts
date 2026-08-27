import type { CadLayer, CadLayerCategory } from "@/cad/types";

const RULES: { category: CadLayerCategory; pattern: RegExp }[] = [
  { category: "dimension", pattern: /\b(dim|dims|dimension)\b/i },
  { category: "annotation", pattern: /\b(anno|annot|text|notes?|defpoints|title|stamp)\b/i },
  { category: "hatch", pattern: /\b(hatch|poche|fill|solid)\b/i },
  { category: "electrical", pattern: /\b(elec|power|light|lumin|switch|outlet)\b/i },
  { category: "plumbing", pattern: /\b(plumb|sanit|drain|pipe|p-san)\b/i },
  { category: "landscape", pattern: /\b(tree|plant|land|site|paving)\b/i },
  { category: "stair", pattern: /\b(strs|stair|escada|treppe)\b/i },
  { category: "railing", pattern: /\b(rail|handrail|baluster)\b/i },
  { category: "column", pattern: /\b(col|column|pillar|a-cols)\b/i },
  { category: "beam", pattern: /\b(beam|a-beam)\b/i },
  { category: "door", pattern: /\b(door|porte|porta|tur|a-door)\b/i },
  { category: "window", pattern: /\b(win|window|glaz|fenetre|ventana|a-glaz)\b/i },
  { category: "furniture", pattern: /\b(furn|furniture|ff.?e|mob|equip|fixture)\b/i },
  { category: "ceiling", pattern: /\b(ceil|soffit|a-ceil)\b/i },
  { category: "floor", pattern: /\b(flor|floor|slab|a-flor)\b/i },
  { category: "wall", pattern: /\b(wall|murs?|wand|parede|a-wall|partition)\b/i },
];

const ACI = [
  "#000000",
  "#ff0000",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#0000ff",
  "#ff00ff",
  "#ffffff",
  "#808080",
  "#c0c0c0",
];

export function classifyLayerName(name: string): CadLayerCategory {
  const n = name.replace(/[_-]+/g, " ");
  for (const rule of RULES) {
    if (rule.pattern.test(n) || rule.pattern.test(name)) return rule.category;
  }
  return "unknown";
}

export function aciToHex(code: number): string {
  if (code >= 0 && code < ACI.length) return ACI[code];
  return "#c4a574";
}

export function makeLayer(name: string, colorCode = 7, lineType = "CONTINUOUS"): CadLayer {
  return {
    name,
    category: classifyLayerName(name),
    color: aciToHex(colorCode),
    lineType,
    visible: true,
  };
}

export function applyLayerMap(layers: CadLayer[], map: Record<string, CadLayerCategory>): CadLayer[] {
  return layers.map((layer) => ({
    ...layer,
    category: map[layer.name] ?? layer.category,
  }));
}

export function detectFloorFromLayer(name: string): { name: string; elevation: number } | null {
  const n = name.toLowerCase();
  if (/\b(basement|cellar|b1|level\s*-1)\b/.test(n)) return { name: "Basement", elevation: -3.1 };
  if (/\b(ground|gnd|gf|level\s*0|00)\b/.test(n)) return { name: "Ground Floor", elevation: 0 };
  if (/\b(first|1st|level\s*1|01|1fl)\b/.test(n)) return { name: "First Floor", elevation: 3.1 };
  if (/\b(second|2nd|level\s*2|02|2fl)\b/.test(n)) return { name: "Second Floor", elevation: 6.2 };
  if (/\b(third|3rd|level\s*3)\b/.test(n)) return { name: "Third Floor", elevation: 9.3 };
  if (/\b(terrace|roof)\b/.test(n)) return { name: "Terrace", elevation: 12.4 };
  return null;
}
