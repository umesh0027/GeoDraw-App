import React from 'react';
import { useMapFeatures } from '../context/MapContext';
import { ShapeType } from '../context/types';
import '../styles.css';

const Toolbar: React.FC = () => {
  const { currentMode, setDrawingMode, errorMessage, clearError } = useMapFeatures();
  const modes: ShapeType[] = ['Polygon', 'Rectangle', 'Circle', 'LineString'];

  return (
    <div>
      {errorMessage && <div className="error">{errorMessage} <button className='Dismiss-btn' onClick={() => clearError()}>Dismiss</button></div>}
      <div>
        <div>Mode : <span className="toolbar-mode">{currentMode}</span></div>
        <div style={{ marginTop: 8 }}>
          {modes.map(m => (
            <button key={m} onClick={() => setDrawingMode(m)}  className="button mode-btn" >
              Set Mode: {m}
            </button>
          ))}
          <button className="stop-drawing-btn" onClick={() => setDrawingMode('None')}>
          Stop Drawing
        </button>

          {/* <button style={{ backgroundColor:"red",color:"white"}} onClick={() => setDrawingMode('None')}>Stop Drawing</button> */}
        </div>
        <p style={{ marginTop: 12, fontSize: 13 ,color:"red"}}>Use the map's draw toolbar (top-right) to draw shapes. Side buttons are informational / for future programmatic control.</p>
      </div>
    </div>
  );
};

export default Toolbar;
