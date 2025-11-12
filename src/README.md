# Geo Feature Manager 

## What it does
- Renders OpenStreetMap tiles (Leaflet)
- Lets users draw Polygon, Rectangle, Circle, LineString using leaflet-draw
- Enforces non-overlapping polygonal features (Circle/Rectangle/Polygon) using Turf.js:
  - Fully enclosed polygons are blocked.
  - Overlapping areas are auto-trimmed (difference).
  - LineStrings are excluded from overlap checks.
- Export all features as GeoJSON (geometry + properties).
- Dynamic max limits configurable in `src/utils/config.ts`.
- State management via React Context API.

## Run locally
1. `npm install --legacy-peer-deps`
2. `npm start`
3. Open `http://localhost:3000`

## Polygon overlap logic (short)
Implemented in `src/hooks/useSpatialConstraints.ts`:
- Converts features to Turf polygons.
- If new polygon is `within` any existing → block and show error.
- Otherwise, iteratively `difference` the new polygon with existing polygons to trim overlaps.
- If nothing remains after `difference` → block.

## Sample GeoJSON export
The exported file is a FeatureCollection with features:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type":"Feature",
      "properties": { "id": "uuid", "shapeType": "Polygon" },
      "geometry": { "type": "Polygon", "coordinates": [ ... ] }
    }
  ]
}
