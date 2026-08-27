import type { CadUnits } from "@/cad/types";

const INSUNITS: Record<number, CadUnits> = {
  0: "unitless",
  1: "inches",
  2: "feet",
  4: "millimeters",
  5: "centimeters",
  6: "meters",
  10: "yards",
};

export function unitsFromInsunits(value: number): CadUnits {
  return INSUNITS[value] ?? "unitless";
}

export function metersPerCadUnit(units: CadUnits): number {
  switch (units) {
    case "millimeters":
      return 0.001;
    case "centimeters":
      return 0.01;
    case "meters":
      return 1;
    case "inches":
      return 0.0254;
    case "feet":
      return 0.3048;
    case "yards":
      return 0.9144;
    default:
      return 1;
  }
}

export function inferUnitsFromExtents(maxAbs: number): CadUnits {
  if (maxAbs > 400) return "millimeters";
  if (maxAbs > 80) return "centimeters";
  if (maxAbs > 3 && maxAbs < 80) return "meters";
  if (maxAbs <= 3) return "meters";
  return "millimeters";
}

export function formatCadUnits(units: CadUnits): string {
  return units[0].toUpperCase() + units.slice(1);
}

export function nextUnitGuess(current: CadUnits): CadUnits {
  const order: CadUnits[] = ["millimeters", "centimeters", "meters", "inches", "feet"];
  const i = order.indexOf(current);
  return order[(i + 1) % order.length];
}
