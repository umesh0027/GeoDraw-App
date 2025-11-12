import { Feature, GeoJsonProperties, Geometry } from 'geojson';

export type ShapeType = 'Polygon' | 'Rectangle' | 'Circle' | 'LineString';
export type DrawingMode = 'None' | ShapeType;

export interface GeoFeature extends Feature {
  properties: GeoJsonProperties & {
    id: string;
    shapeType: ShapeType;
  };
  geometry: Geometry;
}

export interface MapContextState {
  features: GeoFeature[];
  currentMode: DrawingMode;
  errorMessage: string | null;
}

export interface MapContextActions {
  addFeature: (newFeature: GeoFeature) => boolean;
  updateFeature: (updated: GeoFeature) => void;
  deleteFeature: (id: string) => void;
  setDrawingMode: (mode: DrawingMode) => void;
  clearError: () => void;
}
