// Winter Conditions Check — Main cockpit prototype
// One big component. Reads TWEAKS from window; exposes edit-mode messaging.

const T_COCKPIT = {
  id: 'cockpit',
  label: 'Cockpit Green',
  bg: '#0b1012', panel: '#10171a', panelHi: '#141d21',
  rule: '#1f2a2f', ruleHi: '#2a3a41',
  ink: '#c9d3d6', inkDim: '#6a7a80', inkFaint: '#3f4d52',
  accent: '#7de2a7', accent2: '#e8b86b', warn: '#e86b6b', ice: '#8ec5d6',
};
const T_ICE = {
  id: 'ice',
  label: 'Glacier Blue',
  bg: '#07101a', panel: '#0c1726', panelHi: '#11213a',
  rule: '#1a2b44', ruleHi: '#26405f',
  ink: '#cfdbe8', inkDim: '#6b8197', inkFaint: '#3d506a',
  accent: '#8ec5d6', accent2: '#e8b86b', warn: '#e86b6b', ice: '#8ec5d6',
};
const T_AMBER = {
  id: 'amber',
  label: 'Amber CRT',
  bg: '#0d0a06', panel: '#141009', panelHi: '#1a150c',
  rule: '#2a2215', ruleHi: '#3d331f',
  ink: '#e3c79a', inkDim: '#8a7654', inkFaint: '#4d4230',
  accent: '#e8b86b', accent2: '#7de2a7', warn: '#e86b6b', ice: '#b99c68',
};
const T_SWISS = {
  id: 'swiss',
  label: 'Swiss Paper',
  bg: '#efece6', panel: '#f5f3ed', panelHi: '#ffffff',
  rule: '#d8d3c7', ruleHi: '#b8b0a0',
  ink: '#1a1a1a', inkDim: '#6a6659', inkFaint: '#a09a8b',
  accent: '#c4302b', accent2: '#1a1a1a', warn: '#c4302b', ice: '#3a5a6a',
};
const THEMES = { cockpit: T_COCKPIT, ice: T_ICE, amber: T_AMBER, swiss: T_SWISS };

const FONTS = {
  mono_display: {
    id: 'mono_display', label: 'Mono + Instrument Serif display',
    mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
    display: '"Instrument Serif", "Times New Roman", serif',
    displayItalic: true,
  },
  mono_only: {
    id: 'mono_only', label: 'All mono',
    mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
    display: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
    displayItalic: false,
  },
  neue: {
    id: 'neue', label: 'Swiss — Helvetica Neue + IBM Plex Mono',
    mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
    display: '"Helvetica Neue", "Helvetica", "Inter", sans-serif',
    displayItalic: false,
  },
};

// Peaks with a bit more metadata
const MAIN_PEAKS = [
  { name: 'Uetliberg', m: 870, region: 'ZH', note: 'Local legs · bluebird hike', ref: 'the home hill', cam: 'https://uetliberg.roundshot.com/#/', camLabel: 'roundshot · uetliberg' },
  { name: 'Rigi', m: 1659, region: 'SZ', note: 'Queen of the mountains', ref: 'fog line check', cam: 'https://avisec.com/feed/rigi-rotstock', camLabel: 'avisec · rigi rotstock' },
  { name: 'Titlis', m: 1764, region: 'OW', note: 'Engelberg shoulder', ref: 'reliable snow', cam: 'https://titlis.roundshot.com/alpstubli-truebsee/', camLabel: 'roundshot · alpstübli trübsee' },
  { name: 'San Bernardino', m: 2322, region: 'GR', note: 'Pass + playground', ref: 'spring corn', cam: 'https://sanbernardino.roundshot.com/pan-de-zucher/#/', camLabel: 'roundshot · pan de zucher' },
  { name: 'Lenzerheide', m: 2543, region: 'GR', note: 'Rothorn ridge', ref: 'wide open bowls', cam: 'https://lenzerheide.roundshot.com/urdenfuerggli', camLabel: 'roundshot · urdenfürggli' },
  { name: 'Gemsstock', m: 2961, region: 'UR', note: 'Andermatt, steeps', ref: 'when it\'s on', cam: 'https://andermatt-sedrun-disentis.roundshot.com/gemsstock/', camLabel: 'roundshot · gemsstock' },
];

const MAIN_RESOURCES = [
  { key: 'STG', name: 'Skitourenguru', tag: 'Risk rating per tour', sub: 'Algorithmic avalanche score by route', href: 'https://www.skitourenguru.com/' },
  { key: 'SAC', name: 'SAC Route Portal', tag: 'Route database', sub: 'Swiss Alpine Club · difficulty, time, maps', href: 'https://www.sac-cas.ch/en/huts-and-tours/sac-route-portal/' },
  { key: 'MCH', name: 'MeteoSwiss', tag: 'Forecast & radar', sub: 'Federal office · wind, snowfall, cloud', href: 'https://www.meteoswiss.admin.ch/#tab=forecast-map' },
  { key: 'WRK', name: 'White Risk', tag: 'Avalanche bulletin', sub: 'SLF · danger level + exposed aspects', href: 'https://whiterisk.ch/en/conditions' },
  { key: 'STR', name: 'Strava', tag: 'Route planning', sub: 'Draw, export GPX, drop into profiler', href: 'https://www.strava.com/maps/create' },
];

// —— Sample GPX profile: a plausible Swiss tour ——
function sampleProfile(n = 140) {
  // ascent to a false summit, short dip, main summit, steady descent
  const pts = [];
  const base = 1200, top = 2480;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let v;
    if (t < 0.55) {
      // ascent with undulations
      const e = Math.pow(t / 0.55, 0.85);
      v = base + (top - base - 120) * e
        + Math.sin(t * 18) * 18
        + Math.sin(t * 6) * 40;
    } else if (t < 0.62) {
      // little dip
      const e = (t - 0.55) / 0.07;
      v = top - 120 - 60 * Math.sin(e * Math.PI);
    } else if (t < 0.72) {
      // push to summit
      const e = (t - 0.62) / 0.10;
      v = top - 120 + 120 * e;
    } else {
      // descent
      const e = (t - 0.72) / 0.28;
      v = top - (top - base - 80) * Math.pow(e, 1.15)
        + Math.sin(t * 25) * 16;
    }
    pts.push({ t, v });
  }
  return pts;
}

function computeStats(pts, distKm = 14.8) {
  let gain = 0, loss = 0, min = Infinity, max = -Infinity;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].v - pts[i - 1].v;
    if (d > 0) gain += d; else loss -= d;
  }
  for (const p of pts) { if (p.v < min) min = p.v; if (p.v > max) max = p.v; }
  return { gain: Math.round(gain), loss: Math.round(loss), min: Math.round(min), max: Math.round(max), distKm };
}

// —— Layout helpers ——
function pathFrom(pts, w, h, minV, maxV) {
  return pts.map((p, i) => {
    const x = p.t * w;
    const y = h - ((p.v - minV) / (maxV - minV)) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
}

// ════════════════════════════════════════════════════════════════════
// Root component
// ════════════════════════════════════════════════════════════════════
function WinterConditionsApp() {
  const [tweaks, setTweaks] = React.useState(() => window.TWEAK_DEFAULTS || {});
  const [editMode, setEditMode] = React.useState(false);
  const [clock, setClock] = React.useState(() => new Date());
  const [uptime, setUptime] = React.useState(0);
  const [activePeak, setActivePeak] = React.useState(null);
  const [hoveredRes, setHoveredRes] = React.useState(null);
  const [heroMode, setHeroMode] = React.useState(() => (window.TWEAK_DEFAULTS?.heroMode) || 'contour');
  const [peakMode, setPeakMode] = React.useState(() => (window.TWEAK_DEFAULTS?.peakMode) || 'silhouette');
  const [units, setUnits] = React.useState('m');

  // edit mode wiring
  React.useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setEditMode(true);
      if (d.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // persist tweaks
  function updateTweaks(patch) {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    if ('heroMode' in patch) setHeroMode(patch.heroMode);
    if ('peakMode' in patch) setPeakMode(patch.peakMode);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  }

  // clock + uptime
  React.useEffect(() => {
    const start = Date.now();
    const tId = setInterval(() => {
      setClock(new Date());
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(tId);
  }, []);

  const theme = THEMES[tweaks.theme] || T_COCKPIT;
  const font = FONTS[tweaks.font] || FONTS.mono_display;
  const isLight = theme.id === 'swiss';

  const profile = React.useMemo(() => sampleProfile(140), []);
  const stats = React.useMemo(() => computeStats(profile, 14.8), [profile]);

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      color: theme.ink,
      fontFamily: font.mono,
      fontSize: 13,
      lineHeight: 1.5,
    }}>
      <TopBar theme={theme} font={font} clock={clock} uptime={uptime} />
      <Hero theme={theme} font={font} heroMode={heroMode} peaks={MAIN_PEAKS} />
      <ResourceRail theme={theme} resources={MAIN_RESOURCES} hovered={hoveredRes} setHovered={setHoveredRes} />
      <ProfilerPanel theme={theme} profile={profile} stats={stats} font={font} />
      <WebcamGrid theme={theme} font={font} peaks={MAIN_PEAKS}
        activePeak={activePeak} setActivePeak={setActivePeak} />
      <Footer theme={theme} />

      {editMode && (
        <TweaksPanel
          theme={theme}
          tweaks={tweaks}
          updateTweaks={updateTweaks}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Top bar
// ════════════════════════════════════════════════════════════════════
function TopBar({ theme, font, clock, uptime }) {
  const hh = String(clock.getHours()).padStart(2, '0');
  const mm = String(clock.getMinutes()).padStart(2, '0');
  const ss = String(clock.getSeconds()).padStart(2, '0');
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 36px', borderBottom: `1px solid ${theme.rule}`,
      position: 'sticky', top: 0, background: theme.bg, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width="20" height="20" viewBox="0 0 22 22">
          <polyline points="1,20 7,10 11,14 14,6 21,20" fill="none" stroke={theme.accent} strokeWidth="1.5" />
        </svg>
        <div style={{ fontSize: 11, letterSpacing: 2, color: theme.inkDim }}>
          WINTER&nbsp;CONDITIONS&nbsp;CHECK
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 11, letterSpacing: 1, color: theme.inkDim }}>
        <span>{hh}:{mm}:{ss}&nbsp;CET</span>
        <span style={{ color: theme.inkFaint }}>·</span>
        <span>
          <Dot color={theme.accent} pulse /> LIVE · up {formatUptime(uptime)}
        </span>
      </div>
    </div>
  );
}

function formatUptime(s) {
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function Dot({ color, pulse }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: 7,
      background: color, marginRight: 6,
      animation: pulse ? 'wc-pulse 1.6s ease-in-out infinite' : undefined,
    }} />
  );
}

// ════════════════════════════════════════════════════════════════════
// Hero
// ════════════════════════════════════════════════════════════════════
function Hero({ theme, font, heroMode, peaks }) {
  const lines = [
    { t: 'Snow,', italic: false, color: theme.ink },
    { t: 'wind,', italic: false, color: theme.ink },
    { t: ['& the line ', { italic: true, color: theme.accent, text: 'up.' }], italic: false, color: theme.ink },
  ];
  return (
    <div style={{
      position: 'relative', borderBottom: `1px solid ${theme.rule}`, overflow: 'hidden',
      minHeight: 180,
    }}>
      <ContourBackground theme={theme} mode={heroMode} peaks={peaks} />
      <div style={{
        position: 'relative', zIndex: 2, padding: '28px 36px',
        display: 'grid', gridTemplateColumns: '1fr 520px', gap: 40, alignItems: 'start',
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: theme.inkDim, marginBottom: 10 }}>
            01 · CHECK BEFORE YOU GO
          </div>
          <h1 style={{
            fontFamily: font.display, fontSize: 44, lineHeight: 1.0,
            letterSpacing: -1, margin: 0, fontWeight: 400,
            textWrap: 'balance',
          }}>
            Snow, wind,{' '}
            <span style={{
              color: theme.accent,
              fontStyle: font.displayItalic ? 'italic' : 'normal',
            }}>&amp; the line up.</span>
          </h1>
        </div>
        <div style={{ padding: '8px 0 0', fontSize: 12, color: theme.inkDim, lineHeight: 1.65 }}>
          <div style={{ color: theme.ink, marginBottom: 14, fontSize: 13 }}>
            <Dot color={theme.accent} pulse /> SYS OK · last pull 00:02:14 ago
          </div>
          A personal pre-flight for Swiss ski touring. The five instruments I open before any weekend in the Alps, a GPX profiler for routes I haven't done, and a ladder of peaks I calibrate against.
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${theme.rule}`, color: theme.inkFaint, fontSize: 11 }}>
            Built for one person. Shared because you might want the same kit.
          </div>
        </div>
      </div>
    </div>
  );
}

function ContourBackground({ theme, mode, peaks }) {
  if (mode === 'none') return null;
  if (mode === 'grid') {
    return (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke={theme.rule} strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    );
  }
  if (mode === 'peaks') {
    // A mini labeled terrain strip as backdrop
    const maxM = 3100, minM = 0;
    return (
      <svg width="100%" height="100%" viewBox="0 0 1280 340" preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, opacity: 0.75 }}>
        <defs>
          <linearGradient id="hero-fill-p" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={theme.accent} stopOpacity="0.18" />
            <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {peaks.map((p, i) => {
          const x = 30 + ((i + 0.5) / peaks.length) * 1220;
          const h = (p.m / maxM) * 230;
          const y = 340 - h - 30;
          return (
            <g key={p.name}>
              <polygon points={`${x - 80},340 ${x},${y} ${x + 80},340`} fill="url(#hero-fill-p)" />
              <polygon points={`${x - 80},340 ${x},${y} ${x + 80},340`} fill="none" stroke={theme.ruleHi} strokeWidth="0.7" />
            </g>
          );
        })}
      </svg>
    );
  }
  // default: layered contours
  return (
    <svg width="100%" height="100%" viewBox="0 0 1280 340" preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0 }}>
      <g opacity="0.7">
        {Array.from({ length: 12 }).map((_, i) => {
          const o = i * 14;
          const color = i === 0 ? theme.ruleHi : theme.rule;
          return (
            <path key={i}
              d={`M0,${260 - o * 0.4}
                  C200,${180 - o * 0.35} 400,${300 - o * 0.45} 640,${210 - o * 0.3}
                  C880,${140 - o * 0.25} 1080,${290 - o * 0.45} 1280,${200 - o * 0.35}`}
              fill="none" stroke={color}
              strokeWidth={i === 0 ? 1.3 : 0.7} />
          );
        })}
      </g>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════
// Resources (hover reveals a detail panel below the row)
// ════════════════════════════════════════════════════════════════════
function ResourceRail({ theme, resources, hovered, setHovered }) {
  const active = resources.find(r => r.key === hovered);
  return (
    <div style={{ borderBottom: `1px solid ${theme.rule}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {resources.map((r, i) => (
          <ResourceCard key={r.key} r={r} i={i} theme={theme}
            isHovered={hovered === r.key}
            onEnter={() => setHovered(r.key)}
            onLeave={() => setHovered(null)}
          />
        ))}
      </div>
      <div style={{
        height: active ? 64 : 0,
        overflow: 'hidden', transition: 'height 220ms ease',
        background: theme.panel, borderTop: active ? `1px solid ${theme.rule}` : 'none',
      }}>
        {active && (
          <div style={{
            padding: '16px 36px', fontSize: 12, color: theme.inkDim,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <span style={{ color: theme.accent }}>▸ {active.key}</span>
              <span style={{ color: theme.inkFaint, margin: '0 12px' }}>·</span>
              <span style={{ color: theme.ink }}>{active.sub}</span>
            </div>
            <a href={active.href} target="_blank" rel="noopener" style={{
              color: theme.ink, textDecoration: 'none', fontSize: 11, letterSpacing: 1,
              padding: '6px 12px', border: `1px solid ${theme.ruleHi}`,
            }}>
              OPEN ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceCard({ r, i, theme, isHovered, onEnter, onLeave }) {
  return (
    <a
      href={r.href} target="_blank" rel="noopener"
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      style={{
        display: 'block', padding: '22px 22px 24px',
        borderRight: i < 4 ? `1px solid ${theme.rule}` : 'none',
        textDecoration: 'none', color: 'inherit',
        background: isHovered ? theme.panelHi : 'transparent',
        transition: 'background 150ms ease',
        position: 'relative',
      }}>
      <div style={{
        fontSize: 10, color: isHovered ? theme.accent : theme.inkDim,
        letterSpacing: 2, marginBottom: 12,
        transition: 'color 150ms',
      }}>
        {r.key} · 0{i + 1}
      </div>
      <div style={{ fontSize: 17, marginBottom: 4, color: theme.ink }}>{r.name}</div>
      <div style={{ fontSize: 11, color: theme.inkDim }}>{r.tag}</div>
      <div style={{
        position: 'absolute', top: 22, right: 22,
        fontSize: 14, color: isHovered ? theme.accent : theme.inkFaint,
        transform: isHovered ? 'translate(2px,-2px)' : 'none',
        transition: 'all 150ms ease',
      }}>↗</div>
      {/* bottom rule highlight */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: -1, height: 2,
        background: theme.accent,
        transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left', transition: 'transform 220ms ease',
      }} />
    </a>
  );
}

// ════════════════════════════════════════════════════════════════════
// Main grid: profiler + peaks
// ════════════════════════════════════════════════════════════════════
function MainGrid({ theme, font, profile, stats, peaks, activePeak, setActivePeak, peakMode, units, setUnits }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr' }}>
      <ProfilerPanel theme={theme} profile={profile} stats={stats} />
      <PeaksPanel theme={theme} font={font} peaks={peaks} active={activePeak}
        setActive={setActivePeak} mode={peakMode} units={units} setUnits={setUnits} />
    </div>
  );
}

function ProfilerPanel({ theme, profile, stats, font }) {
  const canvasRef = React.useRef(null);
  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [routeStats, setRouteStats] = React.useState(null);
  const [alpineSrc, setAlpineSrc] = React.useState(null);
  const loaded = !!routeStats;

  async function loadRoute(u) {
    setErr(''); setLoading(true);
    try {
      await window.plotRoute(u, {
        canvas: canvasRef.current,
        ink: theme.ink,
        font: font ? font.mono : 'monospace',
        onStats: (s) => { setRouteStats(s); setAlpineSrc(s.alpineMeteoSrc); },
      });
    } catch (e) {
      setErr(e.message || String(e));
      setRouteStats(null);
    } finally {
      setLoading(false);
    }
  }

  // auto-load ONLY if ?route=NNNN is in the page URL — otherwise start empty
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('route');
    if (r) {
      const initial = `https://www.skitourenguru.com/?id=${r}`;
      setUrl(initial);
      loadRoute(initial);
    }
    // eslint-disable-next-line
  }, []);

  const submit = (e) => {
    e && e.preventDefault();
    loadRoute(url);
  };

  return (
    <div style={{ padding: 28, position: 'relative', borderBottom: `1px solid ${theme.rule}` }}>
      <PanelHead theme={theme}
        label="GPX PROFILER"
        sub={loaded ? `${routeStats.title || 'route ' + routeStats.routeId} · skitourenguru` : 'skitourenguru · paste a route URL'}
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            <a href="https://www.skitourenguru.com/" target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
              <PillBtn theme={theme} ghost>BROWSE</PillBtn>
            </a>
          </div>
        }
      />

      {/* URL input */}
      <form onSubmit={submit} style={{
        marginTop: 18, display: 'flex', gap: 10, alignItems: 'stretch',
      }}>
        <input
          value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://www.skitourenguru.com/?id=4221"
          style={{
            flex: 1, fontFamily: 'inherit', fontSize: 12, letterSpacing: 0.3,
            padding: '10px 12px', background: theme.panel, color: theme.ink,
            border: `1px solid ${theme.rule}`, outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = theme.accent}
          onBlur={(e) => e.target.style.borderColor = theme.rule}
        />
        <button type="submit" disabled={loading} style={{
          fontFamily: 'inherit', fontSize: 11, letterSpacing: 2,
          padding: '0 18px', background: theme.accent, color: theme.bg,
          border: 'none', cursor: loading ? 'wait' : 'pointer',
          minWidth: 110,
        }}>
          {loading ? 'FETCHING…' : 'PLOT ROUTE'}
        </button>
      </form>

      {err && (
        <div style={{
          marginTop: 12, padding: '8px 12px', fontSize: 11, letterSpacing: 1,
          background: theme.panel, border: `1px solid ${theme.warn}`,
          color: theme.warn,
        }}>
          ⚠ {err}
        </div>
      )}

      {/* Chart — canvas always mounted so the ref is ready; container only shown when loaded/loading */}
      <div style={{
        position: 'relative', marginTop: (loaded || loading) ? 18 : 0,
        height: (loaded || loading) ? 320 : 0,
        border: (loaded || loading) ? `1px solid ${theme.rule}` : 'none',
        background: theme.panel,
        padding: (loaded || loading) ? 12 : 0,
        overflow: 'hidden',
        transition: 'height 180ms ease',
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, letterSpacing: 2, color: theme.inkDim,
            background: theme.panel + 'cc',
          }}>
            ◴ FETCHING GPX…
          </div>
        )}
      </div>
      {loaded && (
        <>
          {/* Slope legend */}
          <div style={{
            marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 14,
            fontSize: 10, letterSpacing: 1, color: theme.inkDim,
          }}>
            <span style={{ color: theme.ink }}>SLOPE ·</span>
            {(window.GPX_SLOPE_COLORS || []).map(sc => (
              <span key={sc.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 14, height: 8, background: sc.color }} />
                {sc.label}
              </span>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginTop: 22 }}>
            <StatCell theme={theme} label="GAIN" value={`+${routeStats.gain}`} unit="m" color={theme.accent} />
            <StatCell theme={theme} label="LOSS" value={`−${routeStats.loss}`} unit="m" color={theme.accent2} />
            <StatCell theme={theme} label="DISTANCE" value={routeStats.distKm.toFixed(1)} unit="km" />
            <StatCell theme={theme} label="MAX ELEV" value={routeStats.maxElev} unit="m" />
            <StatCell theme={theme} label="SLOPE KEY" value="7" unit="bands" />
          </div>
        </>
      )}

      {/* AlpineMeteo iframe (only after a route is loaded) */}
      {alpineSrc && (
        <div style={{ marginTop: 22 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontSize: 10, letterSpacing: 2, color: theme.inkDim, marginBottom: 10,
          }}>
            <span>▸ ALPINEMETEO · SUMMIT FORECAST</span>
            <a href={alpineSrc} target="_blank" rel="noopener" style={{ color: theme.inkDim, textDecoration: 'none' }}>
              OPEN ↗
            </a>
          </div>
          <iframe
            src={alpineSrc}
            style={{
              width: '100%', height: 420, border: `1px solid ${theme.rule}`,
              background: theme.panel,
            }}
          />
        </div>
      )}

      <div style={{
        marginTop: 22, paddingTop: 16, borderTop: `1px dashed ${theme.rule}`,
        display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.inkDim,
      }}>
        <div>▸ <span style={{ color: theme.ink }}>SOURCE:</span> skitourenguru.com GPX · slope colored per 50m segment</div>
        <div><span style={{ color: loaded ? theme.accent : theme.inkDim }}>●</span> {loaded ? 'ready · hover chart to scrub' : 'paste URL + plot'}</div>
      </div>
    </div>
  );
}

function SummitMarker({ theme, profile, minV, maxV, visible }) {
  const peak = profile.reduce((a, p) => (p.v > a.v ? p : a), profile[0]);
  const xPct = peak.t * 100;
  const yPct = (1 - (peak.v - minV) / (maxV - minV)) * 100;
  return (
    <div style={{
      position: 'absolute', left: `${xPct}%`, top: `${yPct}%`,
      transform: 'translate(-50%, -100%)', pointerEvents: 'none',
      opacity: visible ? 1 : 0, transition: 'opacity 300ms',
    }}>
      <div style={{
        fontSize: 10, color: theme.accent, letterSpacing: 1,
        whiteSpace: 'nowrap', paddingBottom: 4, textAlign: 'center',
      }}>
        SUMMIT · {Math.round(peak.v)} m
      </div>
      <div style={{ width: 1, height: 10, background: theme.accent, margin: '0 auto' }} />
    </div>
  );
}

function StatCell({ theme, label, value, unit, color }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 2, color: theme.inkDim }}>{label}</div>
      <div style={{ fontSize: 24, color: color || theme.ink, marginTop: 4, letterSpacing: -0.5 }}>
        {value}
        <span style={{ fontSize: 11, color: theme.inkDim, marginLeft: 5, letterSpacing: 0 }}>{unit}</span>
      </div>
    </div>
  );
}

function PillBtn({ children, theme, ghost }) {
  return (
    <button style={{
      fontFamily: 'inherit', fontSize: 10, letterSpacing: 1.5,
      padding: '5px 10px', background: ghost ? 'transparent' : theme.panelHi,
      color: ghost ? theme.inkDim : theme.ink, border: `1px solid ${theme.rule}`,
      cursor: 'pointer',
    }}>{children}</button>
  );
}

function PanelHead({ theme, label, sub, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      borderBottom: `1px solid ${theme.rule}`, paddingBottom: 10,
    }}>
      <div style={{ fontSize: 11, letterSpacing: 2, color: theme.ink }}>▸ {label}</div>
      <div style={{ fontSize: 10, color: theme.inkDim, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{sub}</span>
        {right}
      </div>
    </div>
  );
}

// —— Peaks panel ——
function PeaksPanel({ theme, font, peaks, active, setActive, mode, units, setUnits }) {
  const activeObj = peaks.find(p => p.name === active) || null;
  return (
    <div style={{ padding: 28, position: 'relative' }}>
      <PanelHead theme={theme} label="REFERENCE PEAKS" sub={`${peaks.length} · calibrated by leg`}
        right={
          <div style={{ display: 'flex', gap: 0, border: `1px solid ${theme.rule}` }}>
            {['m', 'ft'].map(u => (
              <button key={u} onClick={() => setUnits(u)} style={{
                fontFamily: 'inherit', fontSize: 10, padding: '4px 9px',
                background: units === u ? theme.panelHi : 'transparent',
                color: units === u ? theme.ink : theme.inkDim,
                border: 'none', cursor: 'pointer', letterSpacing: 1.5,
              }}>{u.toUpperCase()}</button>
            ))}
          </div>
        }
      />

      {mode === 'silhouette' ? (
        <SilhouettePeaks peaks={peaks} theme={theme} active={active} setActive={setActive} units={units} />
      ) : mode === 'ladder' ? (
        <LadderPeaks peaks={peaks} theme={theme} active={active} setActive={setActive} units={units} />
      ) : (
        <ListPeaks peaks={peaks} theme={theme} active={active} setActive={setActive} units={units} />
      )}

      <div style={{
        marginTop: 20, padding: 14, background: theme.panel,
        border: `1px solid ${theme.rule}`, minHeight: 96,
      }}>
        {activeObj ? (
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2, color: theme.accent, marginBottom: 6 }}>
              ▸ {activeObj.region} · {displayElev(activeObj.m, units)}
            </div>
            <div style={{ fontFamily: font.display, fontSize: 28, lineHeight: 1, marginBottom: 8, color: theme.ink }}>
              {activeObj.name}
            </div>
            <div style={{ fontSize: 12, color: theme.inkDim, marginBottom: 6 }}>{activeObj.note}</div>
            <div style={{ fontSize: 11, color: theme.inkFaint, fontStyle: 'italic', marginBottom: 12 }}>“{activeObj.ref}”</div>
            {activeObj.cam && (
              <a href={`#cam-${activeObj.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('webcam-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  display: 'inline-block', fontSize: 10, letterSpacing: 1.5,
                  padding: '5px 10px', color: theme.accent,
                  border: `1px solid ${theme.accent}`,
                  textDecoration: 'none',
                }}>
                ▸ VIEW CAM ↓
              </a>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: theme.inkFaint }}>
            ▸ click a peak for notes
          </div>
        )}
      </div>
    </div>
  );
}

function displayElev(m, units) {
  if (units === 'ft') return `${Math.round(m * 3.28084).toLocaleString()} ft`;
  return `${m.toLocaleString()} m`;
}

function SilhouettePeaks({ peaks, theme, active, setActive, units }) {
  const H = 280;
  const maxM = 3200;
  const sorted = [...peaks].sort((a, b) => a.m - b.m);
  return (
    <svg width="100%" height={H} viewBox={`0 0 500 ${H}`} preserveAspectRatio="none" style={{ marginTop: 16 }}>
      {/* elevation guides */}
      {[1000, 1500, 2000, 2500, 3000].map(e => {
        const y = H - (e / maxM) * (H - 40) - 24;
        return (
          <g key={e}>
            <line x1="0" x2="500" y1={y} y2={y} stroke={theme.rule} strokeDasharray="1 5" />
            <text x="4" y={y - 4} fill={theme.inkFaint} fontSize="9" fontFamily="inherit">{e}m</text>
          </g>
        );
      })}
      {sorted.map((p, i) => {
        const x = 55 + (i / (sorted.length - 1)) * 410;
        const peakH = (p.m / maxM) * (H - 40);
        const y = H - peakH - 24;
        const isActive = active === p.name;
        return (
          <g key={p.name}
            onClick={() => setActive(isActive ? null : p.name)}
            style={{ cursor: 'pointer' }}
          >
            {/* wider invisible hit-target */}
            <rect x={x - 34} y={y - 6} width="68" height={peakH + 30} fill="transparent" />
            <polygon
              points={`${x - 30},${H - 24} ${x},${y} ${x + 30},${H - 24}`}
              fill={isActive ? theme.panelHi : theme.panel}
              stroke={isActive ? theme.accent : theme.ruleHi}
              strokeWidth={isActive ? 1.4 : 1}
            />
            <circle cx={x} cy={y} r={isActive ? 4.5 : 3}
              fill={isActive ? theme.accent2 : theme.accent} />
            <text x={x} y={H - 8} fill={isActive ? theme.ink : theme.inkDim}
              fontSize="9" fontFamily="inherit" textAnchor="middle" letterSpacing="1">
              {p.name.toUpperCase().slice(0, 5)}
            </text>
            <text x={x} y={y - 8} fill={isActive ? theme.ink : theme.inkDim}
              fontSize="9" fontFamily="inherit" textAnchor="middle">
              {units === 'ft' ? Math.round(p.m * 3.28084) : p.m}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LadderPeaks({ peaks, theme, active, setActive, units }) {
  const sorted = [...peaks].sort((a, b) => a.m - b.m);
  const max = 3200;
  return (
    <div style={{ marginTop: 14 }}>
      {sorted.map(p => {
        const pct = (p.m / max) * 100;
        const isActive = active === p.name;
        return (
          <button key={p.name}
            onClick={() => setActive(isActive ? null : p.name)}
            style={{
              display: 'grid', gridTemplateColumns: '120px 1fr 90px',
              alignItems: 'center', gap: 14, padding: '10px 6px',
              borderBottom: `1px dashed ${theme.rule}`,
              background: isActive ? theme.panelHi : 'transparent',
              border: 'none', borderRadius: 0, width: '100%',
              color: 'inherit', cursor: 'pointer', fontFamily: 'inherit',
              textAlign: 'left',
            }}>
            <div style={{ fontSize: 13, color: theme.ink }}>{p.name}</div>
            <div style={{ position: 'relative', height: 6, background: theme.rule }}>
              <div style={{
                position: 'absolute', inset: 0, width: `${pct}%`,
                background: isActive ? theme.accent : theme.ice,
              }} />
              <div style={{
                position: 'absolute', left: `${pct}%`, top: -3, bottom: -3, width: 2,
                background: isActive ? theme.accent2 : 'transparent',
              }} />
            </div>
            <div style={{ fontSize: 12, color: theme.inkDim, textAlign: 'right' }}>
              {displayElev(p.m, units)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ListPeaks({ peaks, theme, active, setActive, units }) {
  return (
    <div style={{ marginTop: 14 }}>
      {peaks.map(p => {
        const isActive = active === p.name;
        return (
          <button key={p.name}
            onClick={() => setActive(isActive ? null : p.name)}
            style={{
              display: 'flex', justifyContent: 'space-between', width: '100%',
              padding: '10px 8px', borderBottom: `1px dashed ${theme.rule}`,
              background: isActive ? theme.panelHi : 'transparent',
              border: 'none', color: 'inherit', cursor: 'pointer',
              fontFamily: 'inherit', alignItems: 'baseline',
            }}>
            <div>
              <span style={{ fontSize: 10, color: theme.inkFaint, letterSpacing: 1, marginRight: 8 }}>{p.region}</span>
              <span style={{ fontSize: 14, color: theme.ink }}>{p.name}</span>
            </div>
            <div style={{
              fontSize: 12, color: isActive ? theme.accent : theme.inkDim,
              padding: '2px 8px', border: `1px solid ${isActive ? theme.accent : theme.rule}`,
            }}>
              {displayElev(p.m, units)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Webcam grid — live iframes per peak
// ════════════════════════════════════════════════════════════════════
function WebcamGrid({ theme, font, peaks, activePeak, setActivePeak }) {
  const [focus, setFocus] = React.useState(null); // peak name for large view
  const [tick, setTick] = React.useState(0);
  const [autoRefresh, setAutoRefresh] = React.useState(false);

  // Pulse the loaded state briefly on mount
  const [loaded, setLoaded] = React.useState(() => new Set());
  function markLoaded(name) {
    setLoaded(prev => { const n = new Set(prev); n.add(name); return n; });
  }

  // optional 5-min auto-refresh (reloads iframes by bumping a cache-buster query)
  React.useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setTick(t => t + 1), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  // sync focus with activePeak so clicking a peak up top opens its cam big
  React.useEffect(() => {
    if (activePeak && peaks.find(p => p.name === activePeak)?.cam) {
      setFocus(activePeak);
    }
  }, [activePeak, peaks]);

  const focused = peaks.find(p => p.name === focus) || null;

  return (
    <div id="webcam-section" style={{ borderTop: `1px solid ${theme.rule}` }}>
      <div style={{
        padding: '18px 36px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        borderBottom: `1px solid ${theme.rule}`,
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: theme.ink }}>
            ▸ LIVE WEBCAMS
          </div>
          <div style={{ fontSize: 10, color: theme.inkDim, letterSpacing: 1, marginTop: 3 }}>
            {peaks.length} feeds · roundshot + avisec · click a tile to focus
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setTick(t => t + 1)}
            style={btnStyle(theme, false)}>
            ↻ REFRESH
          </button>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            style={btnStyle(theme, autoRefresh)}>
            {autoRefresh ? '● AUTO 5m' : '○ AUTO OFF'}
          </button>
        </div>
      </div>

      {/* Large focused cam, if any */}
      {focused && focused.cam && (
        <div style={{
          borderBottom: `1px solid ${theme.rule}`,
          background: theme.panel,
          padding: 0,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 36px', borderBottom: `1px dashed ${theme.rule}`,
          }}>
            <div style={{ fontSize: 11, color: theme.inkDim, letterSpacing: 1 }}>
              <span style={{ color: theme.accent }}>● LIVE</span>
              <span style={{ color: theme.inkFaint, margin: '0 10px' }}>·</span>
              <span style={{ color: theme.ink, fontSize: 13 }}>{focused.name}</span>
              <span style={{ color: theme.inkFaint, margin: '0 8px' }}>·</span>
              {displayElevSimple(focused.m)}
              <span style={{ color: theme.inkFaint, margin: '0 8px' }}>·</span>
              <span style={{ color: theme.inkDim }}>{focused.camLabel}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <a href={focused.cam} target="_blank" rel="noopener" style={{
                ...btnStyle(theme, false), textDecoration: 'none',
              }}>OPEN ↗</a>
              <button onClick={() => { setFocus(null); setActivePeak(null); }}
                style={btnStyle(theme, false)}>CLOSE ✕</button>
            </div>
          </div>
          <div style={{ position: 'relative', height: 520, background: '#000' }}>
            <iframe
              key={`${focused.name}-big-${tick}`}
              src={focused.cam}
              title={`${focused.name} Webcam`}
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* Tile grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
      }}>
        {peaks.map((p, i) => {
          const col = i % 3, row = Math.floor(i / 3);
          const isFocused = focus === p.name;
          return (
            <WebcamTile
              key={p.name}
              peak={p}
              theme={theme} font={font}
              tick={tick}
              isFocused={isFocused}
              onClick={() => setFocus(isFocused ? null : p.name)}
              borderRight={col < 2}
              borderBottom={row < Math.ceil(peaks.length / 3) - 1}
            />
          );
        })}
      </div>
    </div>
  );
}

function WebcamTile({ peak, theme, font, tick, isFocused, onClick, borderRight, borderBottom }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRight: borderRight ? `1px solid ${theme.rule}` : 'none',
        borderBottom: borderBottom ? `1px solid ${theme.rule}` : 'none',
        cursor: 'pointer',
        background: '#000',
        aspectRatio: '4 / 3',
        overflow: 'hidden',
      }}>
      {/* iframe under the click shield */}
      <iframe
        key={`${peak.name}-${tick}`}
        src={peak.cam}
        title={`${peak.name} Webcam`}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', border: 0,
          pointerEvents: 'none', // tile click wins
        }}
      />
      {/* scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)',
        opacity: hovered ? 0 : 0.6,
        transition: 'opacity 200ms',
      }} />
      {/* tile chrome */}
      <div style={{
        position: 'absolute', top: 10, left: 12,
        fontSize: 10, letterSpacing: 1.5,
        color: theme.accent,
        background: 'rgba(0,0,0,0.55)',
        padding: '3px 7px',
        fontFamily: font.mono,
      }}>● LIVE</div>
      <div style={{
        position: 'absolute', top: 10, right: 12,
        fontSize: 10, letterSpacing: 1,
        color: theme.ink,
        background: 'rgba(0,0,0,0.55)',
        padding: '3px 7px',
        fontFamily: font.mono,
      }}>{displayElevSimple(peak.m)}</div>
      {/* bottom bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '10px 12px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.9) 100%)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        color: '#fff', fontFamily: font.mono,
      }}>
        <div style={{ fontSize: 13, letterSpacing: 0.5 }}>{peak.name}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: 1 }}>
          {peak.camLabel}
        </div>
      </div>
      {/* focus ring */}
      {(isFocused || hovered) && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          border: `1px solid ${isFocused ? theme.accent : theme.ruleHi}`,
          boxShadow: isFocused ? `inset 0 0 0 1px ${theme.accent}` : 'none',
        }} />
      )}
    </div>
  );
}

function displayElevSimple(m) {
  return `${m.toLocaleString()} m`;
}

function btnStyle(theme, active) {
  return {
    fontFamily: 'inherit', fontSize: 10, letterSpacing: 1.5,
    padding: '5px 10px',
    background: active ? theme.panelHi : 'transparent',
    color: active ? theme.accent : theme.inkDim,
    border: `1px solid ${active ? theme.accent : theme.rule}`,
    cursor: 'pointer',
  };
}

// ════════════════════════════════════════════════════════════════════
// Footer
// ════════════════════════════════════════════════════════════════════
function Footer({ theme }) {
  return (
    <div style={{
      padding: '16px 36px',
      borderTop: `1px solid ${theme.rule}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 10, letterSpacing: 1.5, color: theme.inkFaint,
    }}>
      <a href="https://nicolasgriffiths.github.io/index.html" style={{ color: theme.inkDim, textDecoration: 'none' }}>
        ← BACK TO DIRECTORY
      </a>
      <div>ASCENT · DESCENT · DOUBT</div>
      <div>NG · ZRH</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Tweaks panel
// ════════════════════════════════════════════════════════════════════
function TweaksPanel({ theme, tweaks, updateTweaks }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{
      position: 'fixed', right: 20, bottom: 20, zIndex: 100,
      width: open ? 280 : 'auto',
      background: theme.bg, color: theme.ink,
      border: `1px solid ${theme.ruleHi}`,
      fontFamily: 'inherit', fontSize: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 12px', borderBottom: open ? `1px solid ${theme.rule}` : 'none',
        cursor: 'pointer', userSelect: 'none',
      }} onClick={() => setOpen(!open)}>
        <div style={{ fontSize: 10, letterSpacing: 2, color: theme.accent }}>▸ TWEAKS</div>
        <div style={{ fontSize: 10, color: theme.inkDim }}>{open ? '—' : '+'}</div>
      </div>
      {open && (
        <div style={{ padding: 14, display: 'grid', gap: 14 }}>
          <TweakGroup label="Palette" theme={theme}>
            {Object.values(THEMES).map(t => (
              <TweakChip key={t.id} theme={theme} active={(tweaks.theme || 'cockpit') === t.id}
                onClick={() => updateTweaks({ theme: t.id })}>
                {t.label}
              </TweakChip>
            ))}
          </TweakGroup>
          <TweakGroup label="Typography" theme={theme}>
            {Object.values(FONTS).map(f => (
              <TweakChip key={f.id} theme={theme} active={(tweaks.font || 'mono_display') === f.id}
                onClick={() => updateTweaks({ font: f.id })}>
                {f.label}
              </TweakChip>
            ))}
          </TweakGroup>
          <TweakGroup label="Hero backdrop" theme={theme}>
            {[
              { id: 'contour', label: 'Contour lines' },
              { id: 'peaks', label: 'Peak silhouettes' },
              { id: 'grid', label: 'Instrument grid' },
              { id: 'none', label: 'None (flat)' },
            ].map(o => (
              <TweakChip key={o.id} theme={theme} active={(tweaks.heroMode || 'contour') === o.id}
                onClick={() => updateTweaks({ heroMode: o.id })}>
                {o.label}
              </TweakChip>
            ))}
          </TweakGroup>
        </div>
      )}
    </div>
  );
}

function TweakGroup({ label, theme, children }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 2, color: theme.inkDim, marginBottom: 6 }}>{label.toUpperCase()}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{children}</div>
    </div>
  );
}

function TweakChip({ children, active, onClick, theme }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: 'inherit', fontSize: 10, letterSpacing: 1,
      padding: '5px 9px', cursor: 'pointer',
      background: active ? theme.accent : 'transparent',
      color: active ? theme.bg : theme.ink,
      border: `1px solid ${active ? theme.accent : theme.rule}`,
    }}>{children}</button>
  );
}

Object.assign(window, { WinterConditionsApp });
