let elevationChart = null;

// Haversine formula to calculate distance between two lat/lon points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

document.getElementById('plot-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('sg-url').value;
    const errorDiv = document.getElementById('plot-error');
    errorDiv.textContent = '';

    try {
        // Try to extract ID from URL
        let routeId = null;
        try {
            const url = new URL(urlInput);
            routeId = url.searchParams.get('id');
        } catch (e) { /* invalid url format */ }

        // Fallback regex if it's not a standard search param
        if (!routeId) {
            const match = urlInput.match(/id=(\d+)/) || urlInput.match(/\/(\d+)\/?$/);
            if (match) routeId = match[1];
        }

        if (!routeId) {
            throw new Error("Could not find a valid route ID in the URL. Please ensure it looks like https://www.skitourenguru.com/?id=1234");
        }

        // Skitourenguru GPX files are padded to 6 digits with an Alps_ID prefix
        const paddedId = routeId.padStart(6, '0');
        const gpxUrl = `https://www.skitourenguru.com/calc_data2/gpx/Alps_ID${paddedId}.gpx`;

        const btn = document.getElementById('plot-btn');
        const oldText = btn.textContent;
        btn.textContent = 'Fetching...';
        btn.disabled = true;

        const response = await fetch(gpxUrl);
        if (!response.ok) throw new Error("Could not download GPX. The route ID might be invalid.");

        const xmlText = await response.text();

        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(xmlText, "text/xml");

        const trkpts = gpxDoc.getElementsByTagName("trkpt");
        if (trkpts.length === 0) throw new Error("No track points found in the GPX file.");

        let distances = [0];
        let elevations = [];
        let cumulativeDistance = 0;
        let prevLat = null;
        let prevLon = null;
        let totalGain = 0;
        let totalLoss = 0;

        let maxEle = -Infinity;
        let maxEleLat = null;
        let maxEleLon = null;

        for (let i = 0; i < trkpts.length; i++) {
            const pt = trkpts[i];
            const lat = parseFloat(pt.getAttribute("lat"));
            const lon = parseFloat(pt.getAttribute("lon"));
            const eleNodes = pt.getElementsByTagName("ele");
            const ele = eleNodes.length > 0 ? parseFloat(eleNodes[0].textContent) : null;

            if (lat && lon && ele !== null) {
                if (ele > maxEle) {
                    maxEle = ele;
                    maxEleLat = lat;
                    maxEleLon = lon;
                }

                if (elevations.length > 0) {
                    const diff = ele - elevations[elevations.length - 1];
                    if (diff > 0) totalGain += diff;
                    else if (diff < 0) totalLoss += Math.abs(diff);
                }

                elevations.push(ele);

                if (prevLat !== null && prevLon !== null) {
                    const dist = calculateDistance(prevLat, prevLon, lat, lon);
                    cumulativeDistance += dist;
                    distances.push(cumulativeDistance);
                } else if (i === 0) {
                    // first point already pushed elevation, distance is 0
                }

                prevLat = lat;
                prevLon = lon;
            }
        }

        btn.textContent = oldText;
        btn.disabled = false;

        if (elevations.length === 0) throw new Error("No valid elevation data found.");

        // Calculate AlpineMeteo Coordinates (EPSG:3857) from max elevation point
        const am_x = Math.round(maxEleLon * 20037508.34 / 180);
        const am_y = Math.round(Math.log(Math.tan(Math.PI / 4 + (maxEleLat * Math.PI / 180) / 2)) * 20037508.34 / Math.PI);

        document.getElementById('alpinemeteo-frame').src = `https://www.alpinemeteo.com/hsgam?x=${am_x}&y=${am_y}`;

        // Update stats UI
        document.getElementById('stat-gain').innerHTML = `Gain: <strong>+${Math.round(totalGain)} m</strong>`;
        document.getElementById('stat-loss').innerHTML = `Loss: <strong>-${Math.round(totalLoss)} m</strong>`;
        document.getElementById('route-stats').classList.remove('hidden');
        document.getElementById('chart-wrapper').classList.remove('hidden');
        document.getElementById('alpinemeteo-wrapper').classList.remove('hidden');

        // Plotting
        const ctx = document.getElementById('elevation-chart').getContext('2d');
        if (elevationChart) elevationChart.destroy();

        Chart.defaults.color = '#e0e0e0';
        Chart.defaults.font.family = 'system-ui, -apple-system, sans-serif';

        elevationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: distances.map(d => d.toFixed(1)), // km
                datasets: [{
                    label: 'Elevation (m)',
                    data: elevations,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 2,
                    pointRadius: 0, // hide individual points for clean line
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function (context) { return context[0].label + ' km'; },
                            label: function (context) { return context.raw + ' m'; }
                        }
                    },
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Distance (km)' },
                        ticks: { maxTicksLimit: 10 }
                    },
                    y: {
                        title: { display: true, text: 'Elevation (m)' },
                    }
                }
            }
        });

    } catch (err) {
        errorDiv.textContent = err.message;
        const btn = document.getElementById('plot-btn');
        btn.textContent = 'Plot Route';
        btn.disabled = false;
        document.getElementById('route-stats').classList.add('hidden');
        document.getElementById('chart-wrapper').classList.add('hidden');
        if (document.getElementById('alpinemeteo-wrapper')) document.getElementById('alpinemeteo-wrapper').classList.add('hidden');
    }
});

// Allow pressing Enter in the input field to trigger the plot
document.getElementById('sg-url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('plot-btn').click();
    }
});
