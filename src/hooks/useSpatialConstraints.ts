

import * as turf from "@turf/turf";
import { Feature, Polygon } from "geojson";
import { GeoFeature, ShapeType } from "../context/types";
import { MAX_SHAPES_CONFIG } from "../utils/config";
import booleanIntersects from "@turf/boolean-intersects";
import booleanWithin from "@turf/boolean-within";
import difference from "@turf/difference";

type SpatialConstraintResult = {
  success: boolean;
  finalFeature: GeoFeature | null;
  error: string | null;
};

//  Converts GeoFeature to Turf Polygon
const toTurfPolygon = (feature: GeoFeature): Feature<Polygon> | null => {
  if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
    return turf.polygon(
      (feature.geometry as Polygon).coordinates,
      feature.properties
    );
  }
  return null;
};

export const useSpatialConstraintsLogic = (existingFeatures: GeoFeature[]) => {
  //  Checks if shape count is within limits
  const isFeatureCountWithinLimit = (shapeType: ShapeType) => {
    const count = existingFeatures.filter(
      (f) => f.properties.shapeType === shapeType
    ).length;
    return count < (MAX_SHAPES_CONFIG as any)[shapeType];
  };

  // Handles adding new polygons (with auto-trim + block logic)
  const handlePolygonAddition = (
    newFeature: GeoFeature
  ): SpatialConstraintResult => {
    const shapeType = newFeature.properties.shapeType;

    //  If it's a LineString → skip all overlap logic
    if (shapeType === "LineString") {
      return { success: true, finalFeature: newFeature, error: null };
    }

    const newPoly = toTurfPolygon(newFeature);
    if (!newPoly) {
      return {
        success: false,
        finalFeature: null,
        error: " Invalid geometry for overlap check.",
      };
    }

    //  Collect only polygonal existing features
    const existingPolygons = existingFeatures
      .filter(
        (f) =>
          f.properties.shapeType === "Polygon" ||
          f.properties.shapeType === "Circle" ||
          f.properties.shapeType === "Rectangle"
      )
      .map(toTurfPolygon)
      .filter((p): p is Feature<Polygon> => p !== null);

    let workingFeature: Feature<Polygon> = newPoly;

    //  Block if fully enclosed by an existing polygon
    for (const existingPoly of existingPolygons) {
      if (booleanWithin(workingFeature, existingPoly)) {
        return {
          success: false,
          finalFeature: null,
          error:
            " Blocked: The new polygon is fully enclosed by an existing polygonal feature.",
        };
      }
    }

    //  Auto-trim overlaps with existing polygons
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
              error: " Invalid geometry after difference operation.",
            };
          }
        } else {
          return {
            success: false,
            finalFeature: null,
            error:
              " Blocked: Fully overlaps existing feature(s) and cannot be added.",
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
