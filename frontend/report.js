/* ═══════════════════════════════════════════════════
   Structural Report – generate damage assessment PDF
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };
    var inited = false;

    /* Damage grades (EMS-98 based) */
    var GRADES = [
        { grade: 1, label: "Negligible to Slight", color: "#22c55e", desc: "Hair-line cracks in few walls; fall of small plaster pieces." },
        { grade: 2, label: "Moderate", color: "#eab308", desc: "Cracks in many walls; fall of fairly large plaster pieces; partial failure of chimneys." },
        { grade: 3, label: "Substantial to Heavy", color: "#f97316", desc: "Large & extensive cracks; failure of non-structural elements; partial structural failure of roofs / floors." },
        { grade: 4, label: "Very Heavy", color: "#ef4444", desc: "Serious failure of walls; partial structural failure of columns; tilting or sinking." },
        { grade: 5, label: "Destruction", color: "#dc2626", desc: "Total or near-total collapse of the structure." }
    ];

    function getSelectedSource() {
        var radios = document.querySelectorAll('input[name="report-src"]');
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) return radios[i].value;
        }
        return "collapse";
    }

    /* Gather data from various tabs */
    function gatherData(src) {
        var data = {
            source: src,
            timestamp: new Date().toLocaleString(),
            magnitude: 0,
            pga: 0,
            damageIndex: 0,
            maxDrift: 0,
            maxAccel: 0,
            stories: 0,
            material: "Unknown",
            damping: 0.05,
            available: false
        };

        if (src === "collapse") {
            /* Pull from Collapse Lab global state */
            var cs = window._collapseState;
            if (cs) {
                data.magnitude = cs.magnitude || 7.0;
                data.pga = cs.pga || 0.4;
                data.damageIndex = cs.damageIndex || 0;
                data.maxDrift = cs.maxDrift || 0;
                data.maxAccel = cs.maxAccel || 0;
                data.stories = cs.stories || 33;
                data.material = cs.material || "Cell-Fracture (GLB)";
                data.available = true;
            }
        } else if (src === "designer") {
            var dr = window._designerResult;
            if (dr) {
                data.available = true;
                data.stories = dr.floors || 8;
                data.material = dr.material || "RC";
                data.foundation = dr.foundation || "Shallow";
                data.lateral = dr.lateral || "moment-frame";
                data.shape = dr.shape || "rectangular";
                data.width = dr.width || 20;
                data.depth = dr.depth || 15;
                data.totalHeight = dr.totalHeight || 25.6;
                data.score = dr.score || 50;
                /* Use real quake sim data if available, else estimate from score */
                if (dr.quakeRan) {
                    data.magnitude = dr.magnitude;
                    data.pga = dr.pga;
                    data.damageIndex = dr.damageIndex;
                    data.maxDrift = dr.maxDrift;
                    data.maxAccel = dr.maxAccel;
                    data.collapsed = dr.collapsed;
                    data.cracked = dr.cracked;
                } else {
                    /* Estimate from assessment score only */
                    var s = dr.score || 50;
                    data.damageIndex = Math.round(100 - s);
                    data.maxDrift = s > 70 ? 0.8 : s > 40 ? 2.2 : 4.5;
                    data.maxAccel = s > 70 ? 0.3 : s > 40 ? 0.6 : 1.2;
                    data.magnitude = 0;
                    data.pga = 0;
                }
                data.damping = 0.05;
            }
        } else if (src === "models") {
            var ms = window._modelsState;
            if (ms) {
                data.available = true;
                data.magnitude = ms.magnitude || 7.0;
                data.pga = ms.pga || 0.4;
                data.damageIndex = ms.damageIndex || 30;
                data.maxDrift = ms.maxDrift || 1.5;
                data.maxAccel = ms.maxAccel || 0.5;
                data.stories = ms.stories || 10;
                data.material = ms.material || "RC Frame";
            }
        }

        return data;
    }

    function getDamageGrade(damageIdx) {
        if (damageIdx < 15) return GRADES[0];
        if (damageIdx < 35) return GRADES[1];
        if (damageIdx < 60) return GRADES[2];
        if (damageIdx < 80) return GRADES[3];
        return GRADES[4];
    }

    function generateReport() {
        var src = getSelectedSource();
        var data = gatherData(src);
        var output = $("report-output");
        var content = $("report-content");
        var printBtn = $("report-print-btn");

        if (!output || !content) return;

        if (!data.available) {
            content.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:2rem;">No data available from this source. Run a simulation first.</p>';
            output.style.display = "block";
            if (printBtn) printBtn.style.display = "none";
            return;
        }

        var grade = getDamageGrade(data.damageIndex);
        var safeOccupancy = data.damageIndex < 35;
        var repairCostRatio = (data.damageIndex / 100).toFixed(2);

        var srcLabel = src === "collapse" ? "Collapse Lab" : src === "designer" ? "Building Designer" : "Models Tab";

        var html = "";

        /* Header */
        html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;">';
        html += '<div>';
        html += '<h3 style="margin:0 0 0.25rem;">Structural Damage Assessment Report</h3>';
        html += '<p class="subtle" style="margin:0;">Generated: ' + data.timestamp + ' · Source: ' + srcLabel + '</p>';
        html += '</div>';
        html += '<div style="background:' + grade.color + '20;color:' + grade.color + ';padding:0.5rem 1rem;border-radius:0.5rem;font-weight:700;">Grade ' + GRADES.indexOf(grade) + ' — ' + grade.label + '</div>';
        html += '</div>';

        /* key metrics */
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.75rem;margin-bottom:1.5rem;">';
        if (data.magnitude > 0) {
            html += metricCard("Earthquake", "M " + data.magnitude.toFixed(1), "PGA " + data.pga.toFixed(2) + " g");
        } else {
            html += metricCard("Earthquake", "No test run", "Assess-only mode");
        }
        html += metricCard("Damage Index", data.damageIndex.toFixed(0) + " %", grade.label);
        html += metricCard("Peak Drift", data.maxDrift.toFixed(1) + " %", data.maxDrift > 2.5 ? "Exceeds limit" : "Within limit");
        html += metricCard("Max Acceleration", data.maxAccel.toFixed(2) + " g", "At roof level");
        html += metricCard("Building", data.stories + " stories", data.material);
        html += metricCard("Repair Cost Ratio", (repairCostRatio * 100).toFixed(0) + " %", "of replacement cost");
        if (src === "designer") {
            html += metricCard("Foundation", data.foundation || "—", data.lateral ? data.lateral.replace("-", " ") : "—");
            html += metricCard("Dimensions", (data.width || "—") + " × " + (data.depth || "—") + " m", "H " + (data.totalHeight ? data.totalHeight.toFixed(1) : "—") + " m");
            html += metricCard("Seismic Score", (data.score || "—") + " / 100", data.score >= 70 ? "Good" : data.score >= 45 ? "Fair" : "Poor");
        }
        html += '</div>';

        /* damage description */
        html += '<div style="background:rgba(15,23,42,0.5);border-radius:0.5rem;padding:1rem;margin-bottom:1.5rem;">';
        html += '<h4 style="margin:0 0 0.5rem;color:#e2e8f0;">Damage Description</h4>';
        html += '<p style="margin:0;color:#94a3b8;">' + grade.desc + '</p>';
        html += '</div>';

        /* structural assessment */
        html += '<div style="background:rgba(15,23,42,0.5);border-radius:0.5rem;padding:1rem;margin-bottom:1.5rem;">';
        html += '<h4 style="margin:0 0 0.75rem;color:#e2e8f0;">Structural Assessment</h4>';
        html += assessRow("Occupancy Safety", safeOccupancy, safeOccupancy ? "Safe for continued occupancy" : "Evacuate immediately — unsafe");
        html += assessRow("Structural Integrity", data.damageIndex < 50, data.damageIndex < 50 ? "Primary frame intact" : "Significant structural damage detected");
        html += assessRow("Foundation", data.damageIndex < 40, data.damageIndex < 40 ? "No visible settlement or tilt" : "Possible differential settlement");
        html += assessRow("Non-structural", data.damageIndex < 25, data.damageIndex < 25 ? "Minor cosmetic damage" : "Significant non-structural damage");
        html += '</div>';

        /* recommendations */
        html += '<div style="background:rgba(15,23,42,0.5);border-radius:0.5rem;padding:1rem;">';
        html += '<h4 style="margin:0 0 0.75rem;color:#e2e8f0;">Recommendations</h4>';
        html += '<ul style="margin:0;padding-left:1.25rem;color:#94a3b8;">';
        if (data.damageIndex >= 80) {
            html += '<li>Structure should be demolished and rebuilt</li>';
            html += '<li>Establish exclusion zone around the building</li>';
        } else if (data.damageIndex >= 60) {
            html += '<li>Major structural repairs required before re-occupancy</li>';
            html += '<li>Commission detailed engineering assessment</li>';
            html += '<li>Consider seismic retrofitting to current code</li>';
        } else if (data.damageIndex >= 35) {
            html += '<li>Repair structural cracks and restore non-structural elements</li>';
            html += '<li>Inspect all connections and joints</li>';
            html += '<li>Monitor for aftershock damage progression</li>';
        } else {
            html += '<li>Cosmetic repairs only — patch cracks, repaint</li>';
            html += '<li>Standard post-earthquake inspection recommended</li>';
        }
        html += '</ul>';
        html += '</div>';

        content.innerHTML = html;
        output.style.display = "block";
        if (printBtn) printBtn.style.display = "inline-flex";
    }

    function metricCard(title, value, sub) {
        return '<div style="background:rgba(30,41,59,0.5);padding:0.75rem;border-radius:0.5rem;">' +
            '<div style="font-size:0.7rem;text-transform:uppercase;color:#64748b;margin-bottom:0.25rem;">' + title + '</div>' +
            '<div style="font-size:1.1rem;font-weight:700;color:#e2e8f0;">' + value + '</div>' +
            '<div style="font-size:0.75rem;color:#94a3b8;">' + sub + '</div></div>';
    }

    function assessRow(label, ok, detail) {
        var icon = ok ? '✅' : '⚠️';
        var color = ok ? '#22c55e' : '#ef4444';
        return '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;">' +
            '<span>' + icon + '</span>' +
            '<span style="font-weight:600;color:' + color + ';min-width:140px;">' + label + '</span>' +
            '<span style="color:#94a3b8;">' + detail + '</span></div>';
    }

    function handlePrint() {
        var content = $("report-content");
        if (!content) return;
        var w = window.open("", "_blank", "width=800,height=900");
        w.document.write("<!DOCTYPE html><html><head><title>Structural Report</title>");
        w.document.write('<style>body{font-family:Inter,system-ui,sans-serif;padding:2rem;color:#1e293b;max-width:800px;margin:0 auto}h3{margin-bottom:0.5rem}h4{margin-top:1.5rem}.subtle{color:#64748b}div{box-sizing:border-box}</style>');
        w.document.write("</head><body>");
        w.document.write(content.innerHTML.replace(/color:#e2e8f0/g, "color:#1e293b").replace(/color:#94a3b8/g, "color:#475569").replace(/rgba\(15,23,42,0\.5\)/g, "#f1f5f9").replace(/rgba\(30,41,59,0\.5\)/g, "#f8fafc"));
        w.document.write("</body></html>");
        w.document.close();
        w.print();
    }

    window.initReportTab = function () {
        if (inited) return;
        inited = true;

        var genBtn = $("report-gen-btn");
        var printBtn = $("report-print-btn");

        if (genBtn) genBtn.addEventListener("click", generateReport);
        if (printBtn) printBtn.addEventListener("click", handlePrint);
    };
})();
