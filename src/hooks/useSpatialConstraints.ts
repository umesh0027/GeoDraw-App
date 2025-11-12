import { Feature, Polygon } from "geojson";
import { GeoFeature, ShapeType } from "../context/types";
import { MAX_SHAPES_CONFIG } from "../utils/config";


import polygon from "@turf/helpers";
import booleanWithin from "@turf/boolean-within";
import booleanIntersects from "@turf/boolean-intersects";
import difference from "@turf/difference";

type SpatialConstraintResult = {
  success: boolean;
  finalFeature: GeoFeature | null;
  error: string | null;
};


const toTurfPolygon = (feature: GeoFeature): Feature<Polygon> | null => {
  if (feature.geometry.type === "Polygon") {
    return {
      type: "Feature",
      geometry: feature.geometry,
      properties: feature.properties,
    };
  }
  return null;
};


export const useSpatialConstraintsLogic = (existingFeatures: GeoFeature[]) => {

  const isFeatureCountWithinLimit = (shapeType: ShapeType) => {
    const count = existingFeatures.filter(
      (f) => f.properties.shapeType === shapeType
    ).length;
    return count < (MAX_SHAPES_CONFIG as any)[shapeType];
  };


  const handlePolygonAddition = (
    newFeature: GeoFeature
  ): SpatialConstraintResult => {
   
    if (newFeature.properties.shapeType === "LineString") {
      return { success: true, finalFeature: newFeature, error: null };
    }

    const newPoly = toTurfPolygon(newFeature);
    if (!newPoly) {
      return {
        success: false,
        finalFeature: null,
        error: "Invalid geometry for overlap check.",
      };
    }

    let workingFeature: Feature<Polygon> = newPoly;

    
    const existingPolygons = existingFeatures
      .filter((f) => f.properties.shapeType !== "LineString")
      .map(toTurfPolygon)
      .filter((p): p is Feature<Polygon> => p !== null);

   
    for (const existingPoly of existingPolygons) {
      if (booleanWithin(workingFeature, existingPoly)) {
        return {
          success: false,
          finalFeature: null,
          error:
            "Blocked: The new polygon is fully enclosed by an existing polygon.",
        };
      }
    }

    for (const existingPoly of existingPolygons) {
      if (booleanIntersects(workingFeature, existingPoly)) {
        const diff = difference(workingFeature, existingPoly);
        if (diff) {
         
          if (
            diff.geometry.type === "Polygon" ||
            diff.geometry.type === "MultiPolygon"
          ) {
            workingFeature = diff as Feature<Polygon>;
          } else {
            return {
              success: false,
              finalFeature: null,
              error: " Blocked: Invalid difference geometry.",
            };
          }
        } else {
          return {
            success: false,
            finalFeature: null,
            error:
              " Blocked: Feature completely overlaps existing feature(s).",
          };
        }
      }
    }

    const finalGeoJson: GeoFeature = {
      ...newFeature,
      geometry: workingFeature.geometry as any,
    };

    return { success: true, finalFeature: finalGeoJson, error: null };
  };

  return { handlePolygonAddition, isFeatureCountWithinLimit };
};
