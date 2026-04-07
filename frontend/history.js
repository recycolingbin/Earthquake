/* ═══════════════════════════════════════════════════
   Earthquake History – Leaflet map + Civil Eng. data
   Focus: Tibet / Sichuan / Nepal (Himalayan region)
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };
    var leafletMap = null;
    var markerLayer = null;
    var faultLayer = null;
    var inited = false;

    /* ── Expanded earthquake database with civil-engineering fields ── */
    var QUAKES = [
        /* ══ HIMALAYAN REGION (Tibet / Sichuan / Nepal) ══ */
        { year: 2008, loc: "Wenchuan, Sichuan", mag: 7.9, depth: 19, dead: 87587, mmi: "XI", tsunami: false, lat: 31.021, lon: 103.367, region: "himalayan",
          soilType: "Soft alluvium", faultType: "Thrust (Longmenshan)", peakPGA: 0.96, liquefaction: true, buildingDmg: "90% RC frames collapsed in Beichuan; pancake failures in non-ductile frames", bridge: "Baihua Bridge collapsed; 12+ highway bridges severely damaged", landslides: 56000, aftershocks: 42719, ceNote: "Prompted revision of GB 50011 seismic code; highlighted need for ductile detailing in RC" },
        { year: 2015, loc: "Gorkha, Nepal", mag: 7.8, depth: 8, dead: 8964, mmi: "IX", tsunami: false, lat: 28.231, lon: 84.731, region: "himalayan",
          soilType: "Lacustrine clay (Kathmandu basin)", faultType: "Thrust (Main Himalayan Thrust)", peakPGA: 0.16, liquefaction: true, buildingDmg: "500k+ bldgs destroyed; unreinforced masonry worst hit; modern RC survived", bridge: "Suspension bridges in rural areas damaged", landslides: 2780, aftershocks: 553, ceNote: "Kathmandu basin amplification 3-5x; proved masonry confinement critical; NBC-105 revision" },
        { year: 2015, loc: "Dolakha, Nepal (aftershock)", mag: 7.3, depth: 15, dead: 218, mmi: "VIII", tsunami: false, lat: 27.819, lon: 86.080, region: "himalayan",
          soilType: "Residual soil on rock", faultType: "Thrust", peakPGA: 0.08, liquefaction: false, buildingDmg: "Cumulative damage to structures weakened in April shock", bridge: "Minor damage", landslides: 340, aftershocks: 0, ceNote: "Demonstrated cumulative damage vulnerability in post-earthquake period" },
        { year: 1934, loc: "Bihar-Nepal", mag: 8.1, depth: 15, dead: 10700, mmi: "X", tsunami: false, lat: 27.55, lon: 87.09, region: "himalayan",
          soilType: "Alluvial / Gangetic plain", faultType: "Thrust (MHT)", peakPGA: 0.45, liquefaction: true, buildingDmg: "Massive destruction in Kathmandu Valley; Dharahara tower collapsed", bridge: "Limited data; timber bridges lost", landslides: 0, aftershocks: 0, ceNote: "First major event to highlight Kathmandu basin effect; return period ~80 yrs" },
        { year: 1950, loc: "Assam-Tibet border", mag: 8.6, depth: 15, dead: 4800, mmi: "XII", tsunami: false, lat: 28.38, lon: 96.45, region: "himalayan",
          soilType: "Alluvium / mountain slopes", faultType: "Strike-slip (Mishmi Thrust)", peakPGA: 0.55, liquefaction: true, buildingDmg: "Mud-brick and stone masonry completely destroyed across upper Assam", bridge: "Subansiri river bridge collapsed", landslides: 10000, aftershocks: 0, ceNote: "Largest continental earthquake recorded; massive landslide dam on Subansiri River" },
        { year: 2010, loc: "Yushu, Qinghai (Tibet)", mag: 6.9, depth: 10, dead: 2698, mmi: "IX", tsunami: false, lat: 33.165, lon: 96.548, region: "himalayan",
          soilType: "Mountain slope deposits", faultType: "Strike-slip (Yushu fault)", peakPGA: 0.30, liquefaction: false, buildingDmg: "95% of adobe/stone buildings collapsed; RC schools outperformed", bridge: "Minor damage to modern bridges", landslides: 2036, aftershocks: 1580, ceNote: "Cold-region engineering challenge; freeze-thaw degradation amplified damage" },
        { year: 2017, loc: "Mainling, Tibet", mag: 6.9, depth: 10, dead: 0, mmi: "VIII", tsunami: false, lat: 29.75, lon: 95.02, region: "himalayan",
          soilType: "Mountain rock", faultType: "Thrust", peakPGA: 0.15, liquefaction: false, buildingDmg: "Sparse population; minor damage to Nyingchi structures", bridge: "No significant damage", landslides: 860, aftershocks: 200, ceNote: "Eastern Himalayan Syntaxis; important for dam planning on Yarlung Tsangpo" },
        { year: 1988, loc: "Nepal-India border", mag: 6.9, depth: 57, dead: 1450, mmi: "VIII", tsunami: false, lat: 26.72, lon: 86.62, region: "himalayan",
          soilType: "Alluvial", faultType: "Thrust", peakPGA: 0.18, liquefaction: true, buildingDmg: "Unreinforced masonry collapsed; damage in Dharan / Biratnagar", bridge: "2 major road bridges damaged", landslides: 120, aftershocks: 0, ceNote: "Depth attenuated shaking; led to IS:1893 revision in India" },
        { year: 2013, loc: "Lushan, Sichuan", mag: 6.6, depth: 12, dead: 196, mmi: "IX", tsunami: false, lat: 30.308, lon: 102.888, region: "himalayan",
          soilType: "Residual clay", faultType: "Thrust (southern Longmenshan)", peakPGA: 0.40, liquefaction: false, buildingDmg: "Post-Wenchuan rebuilt structures performed well; pre-code masonry failed", bridge: "Minor cracking in 3 highway bridges", landslides: 7500, aftershocks: 5265, ceNote: "Post-Wenchuan code improvements validated; Longmenshan reactivation risk" },
        { year: 2022, loc: "Luding, Sichuan", mag: 6.8, depth: 16, dead: 93, mmi: "IX", tsunami: false, lat: 29.59, lon: 102.08, region: "himalayan",
          soilType: "Moraine / alluvial", faultType: "Strike-slip (Xianshuihe)", peakPGA: 0.35, liquefaction: false, buildingDmg: "Stone masonry in Moxi town heavily damaged; newer RC survived", bridge: "Luding Bridge undamaged; 1 highway bridge pier cracked", landslides: 4300, aftershocks: 209, ceNote: "Xianshuihe fault M7+ recurrence ~30yr; critical for Sichuan-Tibet Railway" },
        { year: 1976, loc: "Songpan-Pingwu, Sichuan", mag: 7.2, depth: 17, dead: 41, mmi: "IX", tsunami: false, lat: 32.70, lon: 104.08, region: "himalayan",
          soilType: "Mountain colluvium", faultType: "Thrust", peakPGA: 0.25, liquefaction: false, buildingDmg: "Sparse population; Songpan old town heavily damaged", bridge: "Road cut off by landslides", landslides: 3000, aftershocks: 0, ceNote: "Sequential M7+ events (Aug 16, 22, 23); multisequence hazard" },
        { year: 2005, loc: "Kashmir, Pakistan", mag: 7.6, depth: 26, dead: 86000, mmi: "VIII", tsunami: false, lat: 34.49, lon: 73.63, region: "himalayan",
          soilType: "Residual soil", faultType: "Thrust (Balakot-Bagh)", peakPGA: 0.23, liquefaction: false, buildingDmg: "Balakot, Muzaffarabad leveled; concrete block masonry worst", bridge: "Jhelum River bridges failed", landslides: 2500, aftershocks: 978, ceNote: "Non-ductile RC joint failures; spurred Pak BCP-SP revision" },
        { year: 1505, loc: "Lo Mustang, Nepal", mag: 8.2, depth: 15, dead: 6000, mmi: "XI", tsunami: false, lat: 29.50, lon: 83.50, region: "himalayan",
          soilType: "Rock/moraine", faultType: "Thrust (MHT)", peakPGA: 0.6, liquefaction: false, buildingDmg: "Historical accounts of total village destruction across western Nepal", bridge: "N/A", landslides: 0, aftershocks: 0, ceNote: "Unruptured western Nepal seismic gap M8+ expected; critical for future hazard" },

        /* ══ OTHER REGIONS (global context) ══ */
        { year: 2011, loc: "Tohoku, Japan", mag: 9.1, depth: 29, dead: 19749, mmi: "IX", tsunami: true, lat: 38.30, lon: 142.40, region: "pacific",
          soilType: "Marine sediment", faultType: "Megathrust (Japan Trench)", peakPGA: 2.99, liquefaction: true, buildingDmg: "Modern code buildings survived; tsunami caused 90%+ fatalities", bridge: "Highway bridges displaced by tsunami", landslides: 3500, aftershocks: 11000, ceNote: "Largest PGA recorded (2.99g); seawall design revolution" },
        { year: 2023, loc: "Turkey-Syria", mag: 7.8, depth: 17, dead: 59259, mmi: "XII", tsunami: false, lat: 37.22, lon: 37.02, region: "mediterranean",
          soilType: "Alluvial / fill", faultType: "Strike-slip (East Anatolian)", peakPGA: 0.70, liquefaction: true, buildingDmg: "Massive pancake collapse of RC frames; construction quality blamed", bridge: "Hatay airport bridge failed", landslides: 500, aftershocks: 2500, ceNote: "Enforcement gap in Turkish seismic code; soft-story mechanism" },
        { year: 2010, loc: "Haiti", mag: 7.0, depth: 13, dead: 316000, mmi: "X", tsunami: false, lat: 18.46, lon: -72.53, region: "americas",
          soilType: "Alluvium / fill", faultType: "Strike-slip (Enriquillo)", peakPGA: 0.50, liquefaction: true, buildingDmg: "Non-engineered concrete block catastrophically failed", bridge: "Multiple road bridges collapsed", landslides: 800, aftershocks: 52, ceNote: "Deadliest M7 ever; no code enforcement; developing-world resilience case study" },
        { year: 2004, loc: "Sumatra, Indonesia", mag: 9.1, depth: 30, dead: 227898, mmi: "IX", tsunami: true, lat: 3.30, lon: 95.90, region: "pacific",
          soilType: "Coastal sediment", faultType: "Megathrust (Sunda Trench)", peakPGA: 0.30, liquefaction: true, buildingDmg: "Banda Aceh 60% destroyed by tsunami", bridge: "Coastal bridges washed away", landslides: 1200, aftershocks: 3000, ceNote: "1,200km rupture; Indian Ocean warning system established" },
        { year: 1976, loc: "Tangshan, China", mag: 7.5, depth: 15, dead: 242000, mmi: "XI", tsunami: false, lat: 39.63, lon: 118.18, region: "asia",
          soilType: "Alluvial plain", faultType: "Strike-slip", peakPGA: 0.65, liquefaction: true, buildingDmg: "85% of buildings destroyed; unreinforced brick most vulnerable", bridge: "Rail bridges failed", landslides: 0, aftershocks: 0, ceNote: "Led to creation of China GB 50011 seismic code" },
        { year: 1960, loc: "Valdivia, Chile", mag: 9.5, depth: 33, dead: 5700, mmi: "XII", tsunami: true, lat: -39.50, lon: -74.50, region: "americas",
          soilType: "Volcanic soil", faultType: "Megathrust (Nazca-SA)", peakPGA: 0.60, liquefaction: true, buildingDmg: "Adobe/masonry destroyed; timber survived", bridge: "Pan-American Hwy bridges collapsed", landslides: 0, aftershocks: 0, ceNote: "Largest ever recorded (M9.5); led to Chilean NCh433" },
        { year: 1999, loc: "Izmit, Turkey", mag: 7.6, depth: 17, dead: 17127, mmi: "X", tsunami: false, lat: 40.70, lon: 30.00, region: "mediterranean",
          soilType: "Alluvial / soft clay", faultType: "Strike-slip (North Anatolian)", peakPGA: 0.40, liquefaction: true, buildingDmg: "Mid-rise RC soft-story pancake collapse widespread", bridge: "Bolu Viaduct damaged", landslides: 200, aftershocks: 3000, ceNote: "Mandatory soil investigation in Turkey; liquefaction under buildings" },
        { year: 1556, loc: "Shaanxi, China", mag: 8.0, depth: 20, dead: 830000, mmi: "XII", tsunami: false, lat: 34.50, lon: 109.70, region: "asia",
          soilType: "Loess plateau", faultType: "Normal (Weihe Graben)", peakPGA: 0.70, liquefaction: false, buildingDmg: "Yaodong cave dwellings collapsed; deadliest earthquake in history", bridge: "N/A", landslides: 0, aftershocks: 0, ceNote: "Deadliest quake ever; still informs Chinese cave-dwelling hazard policy" },
        { year: 1923, loc: "Kanto, Japan", mag: 7.9, depth: 23, dead: 142000, mmi: "X", tsunami: true, lat: 35.35, lon: 139.10, region: "pacific",
          soilType: "Soft alluvium", faultType: "Megathrust (Sagami Trough)", peakPGA: 0.40, liquefaction: true, buildingDmg: "Firestorm destroyed Tokyo; Imperial Hotel survived", bridge: "Railway bridges failed", landslides: 0, aftershocks: 0, ceNote: "Origin of Japanese seismic engineering tradition (1924 law)" },
        { year: 1995, loc: "Kobe, Japan", mag: 6.9, depth: 16, dead: 6434, mmi: "XI", tsunami: false, lat: 34.59, lon: 135.07, region: "pacific",
          soilType: "Reclaimed land", faultType: "Strike-slip (Nojima)", peakPGA: 0.82, liquefaction: true, buildingDmg: "Soft-story RC; Hanshin Expressway toppled", bridge: "Hanshin viaduct collapsed 630m", landslides: 700, aftershocks: 0, ceNote: "Revolutionary for bridge seismic design worldwide" },
        { year: 1985, loc: "Mexico City", mag: 8.0, depth: 27, dead: 9500, mmi: "IX", tsunami: true, lat: 18.19, lon: -102.53, region: "americas",
          soilType: "Lake bed clay", faultType: "Subduction (Cocos-NA)", peakPGA: 0.17, liquefaction: false, buildingDmg: "6-15 story RC resonated with basin; 412 buildings collapsed", bridge: "Generally OK", landslides: 0, aftershocks: 0, ceNote: "Classic site-amplification case study; basin 5x amplification" },
        { year: 1906, loc: "San Francisco, USA", mag: 7.9, depth: 8, dead: 3000, mmi: "XI", tsunami: false, lat: 37.75, lon: -122.42, region: "americas",
          soilType: "Fill / bay mud", faultType: "Strike-slip (San Andreas)", peakPGA: 0.95, liquefaction: true, buildingDmg: "Fire caused 80% destruction; URM collapsed", bridge: "N/A", landslides: 0, aftershocks: 0, ceNote: "Birth of modern earthquake engineering; first US seismic codes" },
        { year: 2003, loc: "Bam, Iran", mag: 6.6, depth: 10, dead: 26271, mmi: "IX", tsunami: false, lat: 29.00, lon: 58.35, region: "asia",
          soilType: "Desert alluvium", faultType: "Strike-slip (Bam fault)", peakPGA: 0.70, liquefaction: false, buildingDmg: "Adobe 90% destroyed; Arg-e Bam citadel collapsed", bridge: "Minor", landslides: 0, aftershocks: 400, ceNote: "Adobe fragility; UNESCO heritage loss; Iran Standard 2800 revision" },
        { year: 1964, loc: "Alaska, USA", mag: 9.2, depth: 25, dead: 131, mmi: "X", tsunami: true, lat: 61.04, lon: -147.48, region: "americas",
          soilType: "Glacial till", faultType: "Megathrust (Alaska-Aleutian)", peakPGA: 0.30, liquefaction: true, buildingDmg: "Turnagain Heights landslide; Penney's building collapsed", bridge: "29 bridges destroyed", landslides: 2000, aftershocks: 12000, ceNote: "Led to NEHRP program; first US federal earthquake hazard mitigation" },
        { year: 2010, loc: "Chile (Maule)", mag: 8.8, depth: 22, dead: 525, mmi: "IX", tsunami: true, lat: -35.91, lon: -72.73, region: "americas",
          soilType: "Various", faultType: "Megathrust (Nazca-SA)", peakPGA: 0.65, liquefaction: true, buildingDmg: "Only 4% serious damage; Chilean code validated", bridge: "Highway overpasses collapsed", landslides: 500, aftershocks: 5000, ceNote: "Proof strict codes save lives; similar M to Haiti, 600x fewer deaths" }
    ];

    /* ── Major fault lines for map overlay ── */
    var FAULTS = [
        { name: "Main Himalayan Thrust", pts: [[26.5,80],[27.5,82],[28,84],[27.8,86],[27,88],[27.5,90],[28,92],[27.5,95]] },
        { name: "Main Boundary Thrust", pts: [[27,80],[28,82],[28.5,84],[28.2,86.5],[27.5,88.5],[28,90.5],[28.5,93]] },
        { name: "Longmenshan Fault", pts: [[29,102],[30,103],[31,103.5],[32,104],[33,104.5]] },
        { name: "Xianshuihe Fault", pts: [[29,100.5],[30,101.5],[31,102.5],[32,103.5]] },
        { name: "Sagaing Fault", pts: [[16,96],[19,96.5],[22,97],[25,97.5]] }
    ];

    function filterQuakes() {
        var minMag = parseFloat(($("hist-min-mag") || {}).value) || 1;
        var region = ($("hist-region") || {}).value || "all";
        var yearFilter = ($("hist-year") || {}).value || "all";
        var minYear = yearFilter === "all" ? 0 : parseInt(yearFilter, 10);

        return QUAKES.filter(function (q) {
            if (q.mag < minMag) return false;
            if (region !== "all" && q.region !== region) return false;
            if (q.year < minYear) return false;
            return true;
        });
    }

    function initMap() {
        if (leafletMap) return;
        var mapEl = $("history-map");
        if (!mapEl || typeof L === "undefined") return;

        leafletMap = L.map(mapEl, {
            center: [30, 90],
            zoom: 4,
            minZoom: 2,
            maxZoom: 12,
            scrollWheelZoom: true
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(leafletMap);

        markerLayer = L.layerGroup().addTo(leafletMap);

        faultLayer = L.layerGroup().addTo(leafletMap);
        for (var i = 0; i < FAULTS.length; i++) {
            var f = FAULTS[i];
            L.polyline(f.pts, { color: "#ef4444", weight: 2.5, opacity: 0.6, dashArray: "8,4" })
                .bindTooltip(f.name, { permanent: false, direction: "top" })
                .addTo(faultLayer);
        }
    }

    function updateMap(quakes) {
        if (!markerLayer) return;
        markerLayer.clearLayers();

        for (var i = 0; i < quakes.length; i++) {
            var q = quakes[i];
            var r = 4 + (q.mag - 5) * 4;
            if (r < 3) r = 3; if (r > 22) r = 22;
            var col;
            if (q.mag >= 8.5) col = "#ef4444";
            else if (q.mag >= 7.5) col = "#f97316";
            else if (q.mag >= 6.5) col = "#eab308";
            else col = "#22c55e";

            var popHtml = '<div style="max-width:320px;font-size:12px;line-height:1.5;">' +
                '<strong style="font-size:14px;">' + q.loc + ' (' + q.year + ')</strong><br>' +
                '<b>M ' + q.mag.toFixed(1) + '</b> · Depth: ' + q.depth + ' km · MMI: ' + q.mmi + '<br>' +
                'Casualties: ' + q.dead.toLocaleString() + (q.tsunami ? ' · <span style="color:#3b82f6">Tsunami</span>' : '') + '<br>' +
                '<hr style="margin:4px 0;border-color:#ddd">' +
                '<b>Soil:</b> ' + q.soilType + '<br>' +
                '<b>Fault:</b> ' + q.faultType + '<br>' +
                '<b>Peak PGA:</b> ' + q.peakPGA + ' g' + (q.liquefaction ? ' · <span style="color:#f97316">Liquefaction</span>' : '') + '<br>' +
                '<b>Building Damage:</b> ' + q.buildingDmg + '<br>' +
                (q.bridge && q.bridge !== "N/A" ? '<b>Bridges:</b> ' + q.bridge + '<br>' : '') +
                (q.landslides ? '<b>Landslides:</b> ' + q.landslides.toLocaleString() + '<br>' : '') +
                '<hr style="margin:4px 0;border-color:#ddd">' +
                '<em style="color:#555">' + q.ceNote + '</em></div>';

            L.circleMarker([q.lat, q.lon], {
                radius: r,
                fillColor: col,
                color: q.tsunami ? "#3b82f6" : col,
                weight: q.tsunami ? 3 : 1.5,
                fillOpacity: 0.5,
                opacity: 0.9
            }).bindPopup(popHtml).addTo(markerLayer);
        }

        var region = ($("hist-region") || {}).value || "all";
        if (region === "himalayan") {
            leafletMap.flyTo([30, 90], 5, { duration: 0.8 });
        } else if (region === "all") {
            leafletMap.flyTo([25, 70], 3, { duration: 0.8 });
        }
    }

    function populateTable(quakes) {
        var tbody = $("hist-table-body");
        if (!tbody) return;
        tbody.innerHTML = "";
        quakes.sort(function (a, b) { return b.mag - a.mag; });

        for (var i = 0; i < quakes.length; i++) {
            var q = quakes[i];
            var tr = document.createElement("tr");
            tr.innerHTML =
                "<td>" + q.year + "</td>" +
                "<td>" + q.loc + "</td>" +
                "<td><strong>" + q.mag.toFixed(1) + "</strong></td>" +
                "<td>" + q.depth + "</td>" +
                "<td>" + q.dead.toLocaleString() + "</td>" +
                "<td>" + q.mmi + "</td>" +
                "<td>" + (q.tsunami ? '<span class="rating-badge" style="background:rgba(59,130,246,0.15);color:#3b82f6">Yes</span>' : "No") + "</td>";
            (function (quake) {
                tr.style.cursor = "pointer";
                tr.addEventListener("click", function () {
                    if (leafletMap) leafletMap.flyTo([quake.lat, quake.lon], 8, { duration: 0.6 });
                });
            })(q);
            tbody.appendChild(tr);
        }
    }

    function updateStats(quakes) {
        var total = quakes.length;
        var totalDead = 0, maxMag = 0, sumMag = 0, tsunamis = 0;
        var deadliest = null;

        for (var i = 0; i < quakes.length; i++) {
            var q = quakes[i];
            sumMag += q.mag;
            totalDead += q.dead;
            if (q.mag > maxMag) maxMag = q.mag;
            if (q.tsunami) tsunamis++;
            if (!deadliest || q.dead > deadliest.dead) deadliest = q;
        }

        var el;
        el = $("hist-total"); if (el) el.textContent = total;
        el = $("hist-avg-mag"); if (el) el.textContent = total > 0 ? (sumMag / total).toFixed(1) : "\u2014";
        el = $("hist-max-mag"); if (el) el.textContent = maxMag > 0 ? maxMag.toFixed(1) : "\u2014";
        el = $("hist-casualties"); if (el) el.textContent = totalDead.toLocaleString();
        el = $("hist-tsunamis"); if (el) el.textContent = tsunamis;
        el = $("hist-deadliest"); if (el) el.textContent = deadliest ? deadliest.loc + " " + deadliest.year : "\u2014";
        el = $("hist-count"); if (el) el.textContent = total + " events";
    }

    function refresh() {
        var quakes = filterQuakes();
        updateMap(quakes);
        populateTable(quakes);
        updateStats(quakes);
    }

    window.initHistoryTab = function () {
        if (inited) return;
        inited = true;
        initMap();

        var filterBtn = $("hist-filter-btn");
        if (filterBtn) filterBtn.addEventListener("click", refresh);

        refresh();
    };
})();
