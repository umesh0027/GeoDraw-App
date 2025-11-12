import { FeatureCollection } from 'geojson';
import { GeoFeature } from '../context/types';

export const featuresToGeoJSON = (features: GeoFeature[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features,
});

export const exportGeoJSON = (features: GeoFeature[]) => {
  const geoJson = featuresToGeoJSON(features);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJson, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = `drawn_features_${Date.now()}.geojson`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};
