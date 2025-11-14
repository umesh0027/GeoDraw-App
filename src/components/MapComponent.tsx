
import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { useMapFeatures } from "../context/MapContext";
import { v4 as uuidv4 } from "uuid";
import type { GeoFeature, ShapeType } from "../context/types";
import circle from "@turf/circle";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// ✅ Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

function DrawControlConnector() {
  const map = useMap();
  const { addFeature, deleteFeature, updateFeature, features } = useMapFeatures();
  const drawnItems = useRef(new L.FeatureGroup()).current;

  useEffect(() => {
    // ✅ Keep previously drawn shapes visible
    if (!map.hasLayer(drawnItems)) {
      drawnItems.addTo(map);
    }

    // ✅ Drawing control setup
    const drawControl = new (L.Control as any).Draw({
      position: "topright",
      draw: {
        polyline: {
          shapeOptions: {
            color: "#1a1a1a", // dark black lines
            weight: 4,
            opacity: 1,
          },
        },
        polygon: {
          shapeOptions: {
            color: "#0077ff",
            fillColor: "#66aaff",
            fillOpacity: 0.4,
          },
        },
        rectangle: {
          shapeOptions: {
            color: "#00cc88",
            fillOpacity: 0.3,
          },
        },
        circle: {
          shapeOptions: {
            color: "#ff6600",
            fillOpacity: 0.3,
          },
        },
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
        edit: true,
      },
    });

    map.addControl(drawControl);

    // ✅ When a shape is created
    const onCreated = (e: any) => {
      const layer = e.layer;
      const layerType: string = e.layerType;
      let geoFeature: GeoFeature | null = null;

      if (layerType === "circle") {
        const center = layer.getLatLng();
        const radiusMeters = layer.getRadius();
        const centerArr: [number, number] = [center.lng, center.lat];
        const circlePoly = circle(centerArr, radiusMeters / 1000, {
          steps: 64,
          units: "kilometers",
        });
        geoFeature = {
          type: "Feature",
          properties: { id: uuidv4(), shapeType: "Circle" as ShapeType },
          geometry: circlePoly.geometry as any,
        };
      } else {
        const gj = layer.toGeoJSON();
        let shapeType: ShapeType = "Polygon";
        if (layerType === "polyline") shapeType = "LineString";
        else if (layerType === "rectangle") shapeType = "Rectangle";
        else if (layerType === "polygon") shapeType = "Polygon";

        geoFeature = {
          type: "Feature",
          properties: { id: uuidv4(), shapeType },
          geometry: gj.geometry,
        };
      }

      if (!geoFeature) return;

      const added = addFeature(geoFeature);
      if (!added) {
        if (layer && layer.remove) layer.remove();
      } else {
        (layer as any).__featureId = geoFeature.properties.id;

        // ✅ Add to group — ensures all remain visible
        drawnItems.addLayer(layer);

        if (!map.hasLayer(drawnItems)) {
          map.addLayer(drawnItems);
        }
      }
    };

    // ✅ When shapes are edited
    const onEdited = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        const id = layer.__featureId;
        if (!id) return;

        let updatedGeo: GeoFeature | null = null;
        if (layer instanceof L.Circle) {
          const center = layer.getLatLng();
          const radiusMeters = layer.getRadius();
          const circlePoly = circle([center.lng, center.lat], radiusMeters / 1000, {
            steps: 64,
            units: "kilometers",
          });
          updatedGeo = {
            type: "Feature",
            properties: { id, shapeType: "Circle" },
            geometry: circlePoly.geometry as any,
          };
        } else {
          const gj = layer.toGeoJSON();
          const existing = features.find((f) => f.properties.id === id);
          if (!existing) return;
          updatedGeo = { ...existing, geometry: gj.geometry };
        }
        if (updatedGeo) updateFeature(updatedGeo);
      });
    };

    // ✅ When shapes are deleted
    const onDeleted = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        const id = layer.__featureId;
        if (id) deleteFeature(id);
      });
    };

    // ✅ Attach events
    map.on((L as any).Draw.Event.CREATED, onCreated);
    map.on((L as any).Draw.Event.EDITED, onEdited);
    map.on((L as any).Draw.Event.DELETED, onDeleted);

    // ✅ Cleanup (don’t clear drawn shapes)
    return () => {
      map.off((L as any).Draw.Event.CREATED, onCreated);
      map.off((L as any).Draw.Event.EDITED, onEdited);
      map.off((L as any).Draw.Event.DELETED, onDeleted);
      try {
        map.removeControl(drawControl);
      } catch {}
      // ❌ Don't clear existing shapes
      // drawnItems.clearLayers();
    };
  }, [map, addFeature, deleteFeature, updateFeature, features, drawnItems]);

  return null;
}

const MapComponent: React.FC = () => (
  <MapContainer center={DEFAULT_CENTER} zoom={5} style={{ height: "100%", width: "100%" }}>
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <DrawControlConnector />
  </MapContainer>
);

export default MapComponent;
