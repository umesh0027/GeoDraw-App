import React from 'react';
import { MapProvider } from './context/MapContext';
import MapComponent from './components/MapComponent';
import Toolbar from './components/Toolbar';
import ExportButton from './components/ExportButton';

const App: React.FC = () => {
  return (
    <MapProvider>
      <div style={{ display: 'flex', height: '100vh' }}>
        <aside style={{ width: 320, padding: 16, boxSizing: 'border-box', borderRight: '1px solid #eee' }}>
          <h2>Geo Feature Manager</h2>
          <Toolbar />
          <hr />
          <ExportButton />
        </aside>
        <main style={{ flex: 1 }}>
          <MapComponent />
        </main>
      </div>
    </MapProvider>
  );
};

export default App;
