// Real GPX plotter, ported from the original site.
// Exposes window.plotRoute(urlInput, ctx) which:
//   - fetches + parses the Skitourenguru GPX,
//   - computes distance, gain, loss, slope,
//   - renders into a Chart.js canvas,
//   - calls ctx.onStats({title, gain, loss, distKm, maxElev, alpineMeteoSrc}) on success.
// The React profiler mounts the canvas and provides the callback.

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const SLOPE_COLORS = [
  { min: 0, max: 5, color: 'rgba(76,175,80,0.9)', fill: 'rgba(76,175,80,0.25)', label: '0–5°' },
  { min: 5, max: 15, color: 'rgba(139,195,74,0.9)', fill: 'rgba(139,195,74,0.25)', label: '5–15°' },
  { min: 15, max: 25, color: 'rgba(255,235,59,0.9)', fill: 'rgba(255,235,59,0.25)', label: '15–25°' },
  { min: 25, max: 30, color: 'rgba(255,152,0,0.9)', fill: 'rgba(255,152,0,0.25)', label: '25–30°' },
  { min: 30, max: 35, color: 'rgba(244,67,54,0.9)', fill: 'rgba(244,67,54,0.25)', label: '30–35°' },
  { min: 35, max: 40, color: 'rgba(183,28,28,0.9)', fill: 'rgba(183,28,28,0.25)', label: '35–40°' },
  { min: 40, max: 90, color: 'rgba(156,39,176,0.9)', fill: 'rgba(156,39,176,0.25)', label: '40°+' },
];

function colorForSlope(angle, type) {
  for (const sc of SLOPE_COLORS) if (angle >= sc.min && angle < sc.max) return sc[type];
  return SLOPE_COLORS[SLOPE_COLORS.length - 1][type];
}

let currentChart = null;

async function plotRoute(urlInput, ctx) {
  let routeId = null;
  try { routeId = new URL(urlInput).searchParams.get('id'); } catch (e) { }
  if (!routeId) {
    const m = urlInput.match(/id=(\d+)/) || urlInput.match(/\/(\d+)\/?$/);
    if (m) routeId = m[1];
  }
  if (!routeId) throw new Error('Could not find a route ID in the URL.');

  const paddedId = routeId.padStart(6, '0');
  const gpxUrl = `https://www.skitourenguru.com/calc_data2/gpx/Alps_ID${paddedId}.gpx`;

  const url = new URL(window.location);
  url.searchParams.set('route', routeId);
  history.replaceState(null, '', url);

  const res = await fetch(gpxUrl);
  if (!res.ok) throw new Error('Could not download GPX — invalid route ID?');
  const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
  const trkpts = xml.getElementsByTagName('trkpt');
  if (!trkpts.length) throw new Error('No track points in GPX.');

  const distances = [0], elevations = [];
  let cum = 0, prevLat = null, prevLon = null;
  let gain = 0, loss = 0;
  let maxEle = -Infinity, maxLat = 0, maxLon = 0;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    const lat = parseFloat(pt.getAttribute('lat'));
    const lon = parseFloat(pt.getAttribute('lon'));
    const n = pt.getElementsByTagName('ele');
    const ele = n.length ? parseFloat(n[0].textContent) : null;
    if (!lat || !lon || ele == null) continue;
    if (ele > maxEle) { maxEle = ele; maxLat = lat; maxLon = lon; }
    if (elevations.length) {
      const d = ele - elevations[elevations.length - 1];
      if (d > 0) gain += d; else loss += -d;
    }
    elevations.push(ele);
    if (prevLat != null) {
      cum += calculateDistance(prevLat, prevLon, lat, lon);
      distances.push(cum);
    }
    prevLat = lat; prevLon = lon;
  }
  if (!elevations.length) throw new Error('No valid elevation data.');

  // slope angles over 50m segments
  const SEG = 0.05;
  const slopes = [0];
  for (let i = 1; i < elevations.length; i++) {
    let j = i - 1;
    while (j > 0 && distances[i] - distances[j] < SEG) j--;
    const dE = Math.abs(elevations[i] - elevations[j]);
    const dD = (distances[i] - distances[j]) * 1000;
    slopes.push(dD > 0 ? Math.atan(dE / dD) * 180 / Math.PI : 0);
  }

  // AlpineMeteo iframe coords (EPSG:3857)
  const amX = Math.round(maxLon * 20037508.34 / 180);
  const amY = Math.round(Math.log(Math.tan(Math.PI / 4 + (maxLat * Math.PI / 180) / 2)) * 20037508.34 / Math.PI);
  const alpineMeteoSrc = `https://www.alpinemeteo.com/hsgam?x=${amX}&y=${amY}`;

  const trkName = xml.querySelector('trk > name');
  const title = trkName ? trkName.textContent.replace(/^\d+\s*-\s*/, '') : '';

  // Chart
  const canvas = ctx.canvas;
  const chartCtx = canvas.getContext('2d');
  if (currentChart) currentChart.destroy();
  Chart.defaults.color = ctx.ink || '#c9d3d6';
  Chart.defaults.font.family = ctx.font || 'monospace';

  currentChart = new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: distances.map(d => d.toFixed(1)),
      datasets: [{
        label: 'Elevation (m)',
        data: elevations,
        borderWidth: 2, pointRadius: 0, fill: true, tension: 0.1,
        segment: {
          borderColor: c => colorForSlope(slopes[c.p1DataIndex], 'color'),
          backgroundColor: c => colorForSlope(slopes[c.p1DataIndex], 'fill'),
        },
        borderColor: SLOPE_COLORS[0].color,
        backgroundColor: SLOPE_COLORS[0].fill,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: c => c[0].label + ' km',
            label: c => {
              const s = slopes[c.dataIndex] ? slopes[c.dataIndex].toFixed(1) : '0.0';
              return `${c.raw} m  (${s}°)`;
            },
          },
        },
      },
      scales: {
        x: { title: { display: true, text: 'Distance (km)' }, ticks: { maxTicksLimit: 10 } },
        y: { title: { display: true, text: 'Elevation (m)' } },
      },
    },
  });

  ctx.onStats && ctx.onStats({
    title, routeId,
    gain: Math.round(gain), loss: Math.round(loss),
    distKm: cum, maxElev: Math.round(maxEle),
    alpineMeteoSrc,
    slopeColors: SLOPE_COLORS,
  });
}

window.plotRoute = plotRoute;
window.GPX_SLOPE_COLORS = SLOPE_COLORS;
