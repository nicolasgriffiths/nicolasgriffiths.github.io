// Three variations of the cockpit-style Winter Conditions page.
// Each is a compact preview fitted to an artboard.

// ═════════════════════════════════════════════════════════════
// Shared bits
// ═════════════════════════════════════════════════════════════
const cockpitTheme = {
  bg: '#0b1012',
  panel: '#10171a',
  panelHi: '#141d21',
  rule: '#1f2a2f',
  ruleHi: '#2a3a41',
  ink: '#c9d3d6',
  inkDim: '#6a7a80',
  inkFaint: '#3f4d52',
  phos: '#7de2a7',     // phosphor green, used sparingly
  amber: '#e8b86b',    // warning amber
  ice: '#8ec5d6',      // cold cyan
  red: '#e86b6b',
  mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
  serif: '"Instrument Serif", "Times New Roman", serif',
};

const PEAKS = [
  { name: 'Uetliberg', m: 870 },
  { name: 'Rigi', m: 1659 },
  { name: 'Titlis', m: 1764 },
  { name: 'Lenzerheide', m: 2543 },
  { name: 'San Bernardino', m: 2322 },
  { name: 'Gemsstock', m: 2961 },
];

const RESOURCES = [
  { key: 'STG', name: 'Skitourenguru', tag: 'Risk ratings per tour', href: 'https://www.skitourenguru.com/' },
  { key: 'SAC', name: 'SAC Route Portal', tag: 'Official tour database', href: 'https://www.sac-cas.ch/en/huts-and-tours/sac-route-portal/' },
  { key: 'MCH', name: 'MeteoSwiss', tag: 'Forecast + radar', href: 'https://www.meteoswiss.admin.ch/#tab=forecast-map' },
  { key: 'WRK', name: 'White Risk', tag: 'Avalanche bulletin', href: 'https://whiterisk.ch/en/conditions' },
  { key: 'STR', name: 'Strava', tag: 'Route planning', href: 'https://www.strava.com/maps/create' },
];

// Deterministic pseudo-random elevation profile
function profilePoints(n = 80, seed = 1, base = 1200, amp = 900) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const a = Math.sin(t * 6.0 + seed) * 0.5;
    const b = Math.sin(t * 2.1 + seed * 1.7) * 0.9;
    const c = Math.sin(t * 13.3 + seed * 0.4) * 0.08;
    const v = base + amp * (0.55 + 0.45 * (a * 0.3 + b * 0.7 + c));
    pts.push({ t, v });
  }
  return pts;
}

function toPath(pts, w, h, minV, maxV) {
  return pts.map((p, i) => {
    const x = p.t * w;
    const y = h - ((p.v - minV) / (maxV - minV)) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

// ═════════════════════════════════════════════════════════════
// VARIATION A — "Cockpit": grid of modules, full dark
// ═════════════════════════════════════════════════════════════
function VariationA({ scale = 1 }) {
  const t = cockpitTheme;
  const pts = profilePoints(80, 1);
  const minV = 800, maxV = 2600;
  return (
    <div style={{
      width: 1280, height: 820, background: t.bg, color: t.ink,
      fontFamily: t.mono, fontSize: 12, lineHeight: 1.4,
      transform: `scale(${scale})`, transformOrigin: '0 0',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Top strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px', borderBottom: `1px solid ${t.rule}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <svg width="22" height="22" viewBox="0 0 22 22"><polyline points="1,20 7,10 11,14 14,6 21,20" fill="none" stroke={t.phos} strokeWidth="1.5" /></svg>
          <div style={{ fontSize: 11, letterSpacing: 2, color: t.inkDim }}>WINTER CONDITIONS CHECK / v4.26</div>
        </div>
        <div style={{ fontSize: 11, color: t.inkDim, letterSpacing: 1 }}>ZRH · 47.3769°N  8.5417°E · <span style={{ color: t.phos }}>● LIVE</span></div>
      </div>

      {/* Hero band: big title + contour */}
      <div style={{ position: 'relative', height: 240, borderBottom: `1px solid ${t.rule}` }}>
        <ContourBackdrop color={t.ruleHi} />
        <div style={{ position: 'absolute', left: 28, top: 34 }}>
          <div style={{ fontFamily: t.serif, fontSize: 84, lineHeight: 0.95, letterSpacing: -2 }}>
            Snow, wind,<br />& the line<br /><span style={{ color: t.phos, fontStyle: 'italic' }}>up.</span>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 28, top: 30, width: 300, fontSize: 11, color: t.inkDim, textAlign: 'right' }}>
          A pre-flight for Swiss ski touring. Pulls the five instruments I open before any weekend in the Alps, plots an uploaded GPX, and cross-references the reference peaks I know by heart.
        </div>
      </div>

      {/* Resource rail */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${t.rule}` }}>
        {RESOURCES.map((r, i) => (
          <div key={r.key} style={{
            padding: '18px 20px',
            borderRight: i < 4 ? `1px solid ${t.rule}` : 'none',
          }}>
            <div style={{ fontSize: 10, color: t.phos, letterSpacing: 2, marginBottom: 10 }}>{r.key} · 0{i + 1}</div>
            <div style={{ fontSize: 16, marginBottom: 4, color: t.ink }}>{r.name}</div>
            <div style={{ fontSize: 11, color: t.inkDim }}>{r.tag}</div>
          </div>
        ))}
      </div>

      {/* Main grid: profiler + peaks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', height: 430 }}>
        {/* Profiler */}
        <div style={{ padding: 24, borderRight: `1px solid ${t.rule}`, position: 'relative' }}>
          <PanelHeader label="GPX PROFILER" sub="skitourenguru · upload route" />
          <div style={{ height: 240, position: 'relative', marginTop: 16 }}>
            <GridBox color={t.rule} />
            <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <linearGradient id="fillA" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={t.phos} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={t.phos} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${toPath(pts, 600, 240, minV, maxV)} L600,240 L0,240 Z`} fill="url(#fillA)" />
              <path d={toPath(pts, 600, 240, minV, maxV)} fill="none" stroke={t.phos} strokeWidth="1.5" />
            </svg>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 18 }}>
            <Stat label="GAIN" value="1 342" unit="m" color={t.phos} />
            <Stat label="LOSS" value="1 341" unit="m" color={t.amber} />
            <Stat label="DISTANCE" value="14.8" unit="km" />
            <Stat label="MAX" value="2 548" unit="m" />
          </div>
        </div>

        {/* Peaks silhouette */}
        <div style={{ padding: 24, position: 'relative' }}>
          <PanelHeader label="REFERENCE PEAKS" sub="my altitude ladder" />
          <PeakSilhouette peaks={PEAKS} theme={t} height={320} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 28px', fontSize: 10, color: t.inkFaint, letterSpacing: 1,
        borderTop: `1px solid ${t.rule}`, display: 'flex', justifyContent: 'space-between'
      }}>
        <div>← BACK TO DIRECTORY</div>
        <div>ASCENT · DESCENT · DOUBT</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// VARIATION B — "Contour": horizontal band, the whole page is terrain
// ═════════════════════════════════════════════════════════════
function VariationB({ scale = 1 }) {
  const t = cockpitTheme;
  const pts = profilePoints(140, 3, 1000, 1800);
  const minV = 400, maxV = 3100;
  return (
    <div style={{
      width: 1280, height: 820, background: t.bg, color: t.ink,
      fontFamily: t.mono, fontSize: 12, lineHeight: 1.4,
      transform: `scale(${scale})`, transformOrigin: '0 0',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: t.inkDim, letterSpacing: 2, marginBottom: 18 }}>01 · CHECK BEFORE YOU GO</div>
          <div style={{ fontFamily: t.serif, fontSize: 120, lineHeight: 0.9, letterSpacing: -4 }}>
            Winter<br /><span style={{ color: t.ice, fontStyle: 'italic' }}>conditions.</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: t.inkDim, maxWidth: 280, lineHeight: 1.6 }}>
          <div style={{ color: t.phos, marginBottom: 10 }}>● SYS OK · last pull 00:02:14 ago</div>
          Five instruments. One GPX profiler. Six peaks I know the feel of in my legs.
        </div>
      </div>

      {/* The big terrain band */}
      <div style={{ position: 'relative', height: 380, marginTop: 20 }}>
        <svg width="100%" height="100%" viewBox="0 0 1280 380" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="fillB" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={t.ice} stopOpacity="0.28" />
              <stop offset="100%" stopColor={t.ice} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* horizontal elevation rules */}
          {[1000, 1500, 2000, 2500, 3000].map(e => {
            const y = 380 - ((e - minV) / (maxV - minV)) * 380;
            return (
              <g key={e}>
                <line x1="0" x2="1280" y1={y} y2={y} stroke={t.rule} strokeDasharray="2 6" />
                <text x="12" y={y - 4} fill={t.inkFaint} fontSize="10" fontFamily={t.mono}>{e} m</text>
              </g>
            );
          })}
          <path d={`${toPath(pts, 1280, 380, minV, maxV)} L1280,380 L0,380 Z`} fill="url(#fillB)" />
          <path d={toPath(pts, 1280, 380, minV, maxV)} fill="none" stroke={t.ice} strokeWidth="1.5" />
          {/* peak markers */}
          {PEAKS.map((p, i) => {
            const x = ((i + 0.5) / PEAKS.length) * 1280;
            const y = 380 - ((p.m - minV) / (maxV - minV)) * 380;
            return (
              <g key={p.name}>
                <line x1={x} x2={x} y1={y} y2="380" stroke={t.ruleHi} strokeDasharray="1 3" />
                <circle cx={x} cy={y} r="3" fill={t.amber} />
                <text x={x} y={y - 10} fill={t.ink} fontSize="10" fontFamily={t.mono} textAnchor="middle">{p.name.toUpperCase()}</text>
                <text x={x} y={y - 22} fill={t.inkDim} fontSize="9" fontFamily={t.mono} textAnchor="middle">{p.m} m</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Resources + profiler hint at bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 0, borderTop: `1px solid ${t.rule}`, marginTop: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {RESOURCES.map((r, i) => (
            <div key={r.key} style={{ padding: '18px 16px', borderRight: i < 4 ? `1px solid ${t.rule}` : 'none' }}>
              <div style={{ fontSize: 10, color: t.amber, letterSpacing: 2, marginBottom: 8 }}>0{i + 1}</div>
              <div style={{ fontSize: 13, marginBottom: 2 }}>{r.name}</div>
              <div style={{ fontSize: 10, color: t.inkDim }}>{r.tag}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '18px 24px', borderLeft: `1px solid ${t.rule}`, background: t.panel }}>
          <div style={{ fontSize: 10, color: t.inkDim, letterSpacing: 2, marginBottom: 8 }}>GPX PROFILER →</div>
          <div style={{ fontSize: 14, color: t.ink }}>Drop a route file to plot gain, loss, and the shape of the climb.</div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// VARIATION C — "Bulletin": tall, text-forward, terminal log feel
// ═════════════════════════════════════════════════════════════
function VariationC({ scale = 1 }) {
  const t = cockpitTheme;
  const pts = profilePoints(60, 7);
  const minV = 900, maxV = 2700;
  return (
    <div style={{
      width: 1280, height: 820, background: t.bg, color: t.ink,
      fontFamily: t.mono, fontSize: 13, lineHeight: 1.5,
      transform: `scale(${scale})`, transformOrigin: '0 0',
      position: 'relative', overflow: 'hidden',
      display: 'grid', gridTemplateColumns: '380px 1fr',
    }}>
      {/* Left sidebar */}
      <div style={{ padding: '28px 24px', borderRight: `1px solid ${t.rule}`, background: t.panel }}>
        <div style={{ fontSize: 11, color: t.phos, letterSpacing: 2, marginBottom: 14 }}>● BULLETIN</div>
        <div style={{ fontFamily: t.serif, fontSize: 46, lineHeight: 1, letterSpacing: -1, marginBottom: 16 }}>
          Winter conditions, <span style={{ color: t.phos, fontStyle: 'italic' }}>checked.</span>
        </div>
        <div style={{ fontSize: 12, color: t.inkDim, marginBottom: 28 }}>
          A personal pre-flight for Swiss ski touring — the five sources I consult, the peaks I calibrate against, and a GPX profiler for routes I've never done.
        </div>

        <div style={{ fontSize: 10, color: t.inkFaint, letterSpacing: 2, marginBottom: 10 }}>— RESOURCES</div>
        {RESOURCES.map((r, i) => (
          <div key={r.key} style={{
            padding: '12px 0', borderTop: `1px dashed ${t.rule}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <div>
              <div style={{ fontSize: 13, color: t.ink }}>{r.name}</div>
              <div style={{ fontSize: 10, color: t.inkDim }}>{r.tag}</div>
            </div>
            <div style={{ fontSize: 10, color: t.phos }}>↗</div>
          </div>
        ))}
      </div>

      {/* Right: log + chart */}
      <div style={{ padding: 0 }}>
        <div style={{ padding: '18px 28px', borderBottom: `1px solid ${t.rule}`, fontSize: 10, color: t.inkDim, letterSpacing: 1 }}>
          <span style={{ color: t.phos }}>[00:00]</span> SYSTEM READY. paste GPX or use peak references below.
        </div>

        <div style={{ padding: 28 }}>
          <PanelHeader label="PEAK LADDER" sub="known elevations, asc." />
          <div style={{ marginTop: 14 }}>
            {PEAKS.sort((a, b) => a.m - b.m).map((p, i) => {
              const pct = (p.m / 3000) * 100;
              return (
                <div key={p.name} style={{
                  display: 'grid', gridTemplateColumns: '150px 1fr 80px',
                  alignItems: 'center', gap: 14, padding: '9px 0', borderBottom: `1px dashed ${t.rule}`
                }}>
                  <div style={{ fontSize: 13 }}>{p.name}</div>
                  <div style={{ position: 'relative', height: 4, background: t.rule }}>
                    <div style={{
                      position: 'absolute', inset: 0, width: `${pct}%`,
                      background: i === PEAKS.length - 1 ? t.amber : t.ice
                    }} />
                  </div>
                  <div style={{ fontSize: 13, color: t.inkDim, textAlign: 'right' }}>{p.m} <span style={{ color: t.inkFaint }}>m</span></div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 28 }}>
            <PanelHeader label="GPX PROFILER" sub="sample · drop your own" />
            <div style={{ height: 190, marginTop: 12, position: 'relative', border: `1px solid ${t.rule}` }}>
              <svg width="100%" height="100%" viewBox="0 0 800 190" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
                <path d={toPath(pts, 800, 190, minV, maxV)} fill="none" stroke={t.phos} strokeWidth="1.5" />
              </svg>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 14, fontSize: 11 }}>
              <LogRow k="GAIN" v="+ 1 180 m" color={t.phos} />
              <LogRow k="LOSS" v="− 1 180 m" color={t.amber} />
              <LogRow k="DIST" v="12.4 km" color={t.ink} />
              <LogRow k="TIME" v="~ 5h 40m" color={t.ink} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════
function PanelHeader({ label, sub }) {
  const t = cockpitTheme;
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      borderBottom: `1px solid ${t.rule}`, paddingBottom: 8
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: t.ink }}>▸ {label}</div>
      <div style={{ fontSize: 10, color: t.inkDim, letterSpacing: 1 }}>{sub}</div>
    </div>
  );
}

function Stat({ label, value, unit, color }) {
  const t = cockpitTheme;
  return (
    <div>
      <div style={{ fontSize: 9, color: t.inkDim, letterSpacing: 2 }}>{label}</div>
      <div style={{ fontSize: 22, color: color || t.ink, marginTop: 2 }}>
        {value}<span style={{ fontSize: 12, color: t.inkDim, marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

function LogRow({ k, v, color }) {
  const t = cockpitTheme;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${t.rule}`, padding: '6px 0' }}>
      <span style={{ color: t.inkDim }}>{k}</span>
      <span style={{ color: color || t.ink }}>{v}</span>
    </div>
  );
}

function GridBox({ color }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id="gbx" width="40" height="24" patternUnits="userSpaceOnUse">
          <path d="M40 0 L0 0 0 24" fill="none" stroke={color} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#gbx)" />
    </svg>
  );
}

function ContourBackdrop({ color }) {
  // A couple of stylized contour arcs
  return (
    <svg width="100%" height="100%" viewBox="0 0 1280 240" preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
      {[0, 20, 40, 60, 80, 100, 120, 140, 160].map((o, i) => (
        <path key={i}
          d={`M0,${200 - o * 0.6} C200,${120 - o * 0.4} 400,${240 - o * 0.5} 640,${160 - o * 0.3} C880,${80 - o * 0.3} 1080,${220 - o * 0.6} 1280,${140 - o * 0.4}`}
          fill="none" stroke={color} strokeWidth={i === 0 ? 1.2 : 0.7} />
      ))}
    </svg>
  );
}

function PeakSilhouette({ peaks, theme, height = 300 }) {
  const maxM = Math.max(...peaks.map(p => p.m));
  const sorted = [...peaks].sort((a, b) => a.m - b.m);
  return (
    <div style={{ position: 'relative', marginTop: 16, height }}>
      <svg width="100%" height={height} viewBox={`0 0 500 ${height}`} preserveAspectRatio="none">
        {/* elevation grid lines */}
        {[1000, 1500, 2000, 2500, 3000].map(e => {
          const y = height - (e / 3200) * (height - 30) - 20;
          return (
            <g key={e}>
              <line x1="0" x2="500" y1={y} y2={y} stroke={theme.rule} strokeDasharray="1 4" />
              <text x="2" y={y - 3} fill={theme.inkFaint} fontSize="9" fontFamily={theme.mono}>{e}m</text>
            </g>
          );
        })}
        {/* bars-as-peaks */}
        {sorted.map((p, i) => {
          const x = 40 + (i / (sorted.length - 1)) * 440;
          const peakH = (p.m / 3200) * (height - 30);
          const y = height - peakH - 20;
          return (
            <g key={p.name}>
              <polygon
                points={`${x - 28},${height - 20} ${x},${y} ${x + 28},${height - 20}`}
                fill={theme.panelHi} stroke={theme.ruleHi} strokeWidth="1"
              />
              <circle cx={x} cy={y} r="3" fill={theme.phos} />
              <text x={x} y={height - 6} fill={theme.inkDim} fontSize="9"
                fontFamily={theme.mono} textAnchor="middle">{p.name.toUpperCase().slice(0, 4)}</text>
              <text x={x} y={y - 8} fill={theme.ink} fontSize="9"
                fontFamily={theme.mono} textAnchor="middle">{p.m}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

Object.assign(window, { VariationA, VariationB, VariationC, cockpitTheme, PEAKS, RESOURCES, profilePoints, toPath, PanelHeader, Stat, LogRow, GridBox, ContourBackdrop, PeakSilhouette });
