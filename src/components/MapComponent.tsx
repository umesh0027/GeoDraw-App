import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw"; 
import { useMapFeatures } from "../context/MapContext";
import { v4 as uuidv4 } from "uuid";
import type { GeoFeature, ShapeType } from "../context/types";
import { MAX_SHAPES_CONFIG } from "../utils/config";


import booleanIntersects from "@turf/boolean-intersects";
import difference from "@turf/difference";
import circle from "@turf/circle";


import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
    drawnItems.addTo(map);

   
    const drawControl = new (L.Control as any).Draw({
      position: "topright",
      draw: {
        polyline: true,
        polygon: true,
        rectangle: true,
        circle: true,
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
        drawnItems.addLayer(layer);
      }
    };

  
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

  
    const onDeleted = (e: any) => {
      e.layers.eachLayer((layer: any) => {
        const id = layer.__featureId;
        if (id) deleteFeature(id);
      });
    };

 
    map.on((L as any).Draw.Event.CREATED, onCreated);
    map.on((L as any).Draw.Event.EDITED, onEdited);
    map.on((L as any).Draw.Event.DELETED, onDeleted);

   
    return () => {
      map.off((L as any).Draw.Event.CREATED, onCreated);
      map.off((L as any).Draw.Event.EDITED, onEdited);
      map.off((L as any).Draw.Event.DELETED, onDeleted);
      try {
        map.removeControl(drawControl);
      } catch {
       
      }
      drawnItems.clearLayers();
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
