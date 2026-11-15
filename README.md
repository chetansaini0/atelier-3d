# Atelier

**Live:** https://atelier-3d-nine.vercel.app

Turn floor plans, CAD drawings, and interior references into a walkable 3D environment.

Upload a **DWG / DXF** (or photos) and Atelier reconstructs walls, rooms, doors, and furniture as real Three.js geometry — not a drawing on a plane. Walk it in first person with collision, inspect objects, measure spaces, and export.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo

Use **View Demo** for a two-storey villa (rooms, furniture, doors, lighting, first-person collision, inspection, measurement, minimap). No API key required.

On **Create**, use **Load sample DXF** to reconstruct a CAD villa from drawing geometry.

## Optional environment

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Vision reconstruction from photos |
| `CAD_CONVERTER_CMD` | Licensed DWG → DXF converter. Without it, upload ASCII DXF. |

Never commit `.env.local`. Keys stay on the server.

## Tests

```bash
npm test
```
