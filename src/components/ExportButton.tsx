import React from 'react';
import { useMapFeatures } from '../context/MapContext';
import { exportGeoJSON } from '../utils/geojsonUtils';

const ExportButton: React.FC = () => {
  const { features } = useMapFeatures();
  return (
    <button onClick={() => exportGeoJSON(features)} disabled={features.length === 0} className='export-btn'>
      Export GeoJSON ({features.length} features)
    </button>
  );
};

export default ExportButton;
