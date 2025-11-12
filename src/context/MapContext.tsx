import React, { createContext, useReducer, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MapContextState, GeoFeature, DrawingMode } from './types';
import { useSpatialConstraintsLogic } from '../hooks/useSpatialConstraints';

type MapAction =
  | { type: 'ADD_FEATURE'; payload: GeoFeature }
  | { type: 'UPDATE_FEATURE'; payload: GeoFeature }
  | { type: 'DELETE_FEATURE'; payload: string }
  | { type: 'SET_MODE'; payload: DrawingMode }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FEATURES'; payload: GeoFeature[] };

const initialState: MapContextState = {
  features: [],
  currentMode: 'None',
  errorMessage: null,
};

const mapReducer = (state: MapContextState, action: MapAction): MapContextState => {
  switch (action.type) {
    case 'ADD_FEATURE':
      return { ...state, features: [...state.features, action.payload], errorMessage: null };
    case 'UPDATE_FEATURE':
      return { ...state, features: state.features.map(f => (f.properties.id === action.payload.properties.id ? action.payload : f)), errorMessage: null };
    case 'DELETE_FEATURE':
      return { ...state, features: state.features.filter(f => f.properties.id !== action.payload), errorMessage: null };
    case 'SET_MODE':
      return { ...state, currentMode: action.payload, errorMessage: null };
    case 'SET_ERROR':
      return { ...state, errorMessage: action.payload };
    case 'SET_FEATURES':
      return { ...state, features: action.payload, errorMessage: null };
    default:
      return state;
  }
};

type MapContextValue = MapContextState & {
  addFeature: (f: GeoFeature) => boolean;
  updateFeature: (f: GeoFeature) => void;
  deleteFeature: (id: string) => void;
  setDrawingMode: (m: DrawingMode) => void;
  clearError: () => void;
};

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);
  const { handlePolygonAddition, isFeatureCountWithinLimit } = useSpatialConstraintsLogic(state.features);

  const addFeature = (newFeature: GeoFeature): boolean => {
    const shapeType = newFeature.properties.shapeType;
    if (!isFeatureCountWithinLimit(shapeType)) {
      dispatch({ type: 'SET_ERROR', payload: `Max limit reached for ${shapeType}s.` });
      return false;
    }

    const { success, finalFeature, error } = handlePolygonAddition(newFeature);
    if (success && finalFeature) {
      if (!finalFeature.properties.id) finalFeature.properties.id = uuidv4();
      dispatch({ type: 'ADD_FEATURE', payload: finalFeature });
      return true;
    } else {
      if (error) dispatch({ type: 'SET_ERROR', payload: error });
      return false;
    }
  };

  const updateFeature = (updated: GeoFeature) => {
    dispatch({ type: 'UPDATE_FEATURE', payload: updated });
  };

  const deleteFeature = (id: string) => dispatch({ type: 'DELETE_FEATURE', payload: id });
  const setDrawingMode = (mode: DrawingMode) => dispatch({ type: 'SET_MODE', payload: mode });
  const clearError = () => dispatch({ type: 'SET_ERROR', payload: null });

  const value = useMemo(
    () => ({ ...state, addFeature, updateFeature, deleteFeature, setDrawingMode, clearError }),
    [state]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMapFeatures = () => {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMapFeatures must be used within MapProvider');
  return ctx;
};
