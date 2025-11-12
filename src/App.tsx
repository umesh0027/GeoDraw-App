import React, { useState } from 'react';
import { MapProvider } from './context/MapContext';
import MapComponent from './components/MapComponent';
import Toolbar from './components/Toolbar';
import ExportButton from './components/ExportButton';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <MapProvider>
      <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
       
        {sidebarOpen && (
          <aside
            style={{
              width: 320,
              padding: 16,
              boxSizing: 'border-box',
              borderRight: '1px solid #eee',
              position: 'relative',
              background: '#fff',
              zIndex: 10,
            }}
          >
          
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                background: 'transparent',
                fontSize: 24,
                cursor: 'pointer',
              }}
            >
              ×
            </button>

            <h2>Geo Feature Manager</h2>
            <Toolbar />
            <hr />
            <ExportButton />
          </aside>
        )}

      
        <main style={{ flex: 1, position: 'relative' }}>
          <MapComponent />

         
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                position: 'absolute',
                top: 10,
                left: 50,
                zIndex: 999, // high z-index to appear over map
                border: 'none',
                background: '#fff',
                padding: '10px 10px',
                fontSize: 18,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                borderRadius: 4,
              }}
            >
              ☰
            </button>
          )}
        </main>
      </div>
    </MapProvider>
  );
};

export default App;
