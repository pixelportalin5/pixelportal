import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { PLANETS } from '../data';

export default function UI() {
  const hovered = useStore((s) => s.hovered);
  const focused = useStore((s) => s.focused);
  const setFocused = useStore((s) => s.setFocused);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const hoveredPlanet = hovered != null ? PLANETS[hovered] : null;
  const focusedPlanet = focused != null && focused !== 'sun' ? PLANETS[focused] : null;

  return (
    <>
      {hoveredPlanet && focused === null && (
        <div className="tooltip" style={{ left: mouse.x + 16, top: mouse.y + 16 }}>
          {hoveredPlanet.name}
        </div>
      )}
      <div className={`info-panel ${focusedPlanet ? 'open' : ''}`}>
        {focusedPlanet && (
          <>
            <button className="info-close" onClick={() => setFocused(null)}>×</button>
            <span className="info-eyebrow">Planetary Data</span>
            <h2>{focusedPlanet.name}</h2>
            <ul>
              {Object.entries(focusedPlanet.facts).map(([k, v]) => (
                <li key={k}><span>{k}</span><strong>{v}</strong></li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="dock">
        <button className={focused === null ? 'active' : ''} onClick={() => setFocused(null)}>Overview</button>
        <button className={focused === 'sun' ? 'active' : ''} onClick={() => setFocused('sun')}>Sun</button>
        {PLANETS.map((p) => (
          <button key={p.id} className={focused === p.id ? 'active' : ''} onClick={() => setFocused(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
    </>
  );
}