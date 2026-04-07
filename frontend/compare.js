/* ═══════════════════════════════════════════════════
   Comparison Mode – side-by-side earthquake sim
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };
    var inited = false;
    var animA = null, animB = null;

    /* Structural models with seismic characteristics */
    var MODELS = {
        rc: { name: "RC Frame", T0: 0.08, ductility: 4.0, driftCap: 2.5, dampBase: 0.05, color: "#94a3b8" },
        steel: { name: "Steel Frame", T0: 0.10, ductility: 6.0, driftCap: 3.0, dampBase: 0.02, color: "#3b82f6" },
        timber: { name: "Timber Eco", T0: 0.06, ductility: 3.0, driftCap: 2.0, dampBase: 0.05, color: "#22c55e" },
        isolated: { name: "Base Isolated", T0: 0.06, ductility: 5.0, driftCap: 3.5, dampBase: 0.15, color: "#a855f7" },
        hybrid: { name: "Hybrid Damper", T0: 0.07, ductility: 7.0, driftCap: 4.0, dampBase: 0.12, color: "#f97316" }
    };

    function readSim(prefix) {
        return {
            model: ($(prefix + "-model") || {}).value || "rc",
            mag: parseFloat(($(prefix + "-mag") || {}).value) || 7.0,
            stories: parseInt(($(prefix + "-stories") || {}).value, 10) || 8,
            pga: parseFloat(($(prefix + "-pga") || {}).value) || 0.4,
            damp: parseFloat(($(prefix + "-damp") || {}).value) || 0.05
        };
    }

    /* Simulate SDOF response — returns key metrics */
    function simulate(params) {
        var m = MODELS[params.model] || MODELS.rc;
        var T = m.T0 * params.stories;                      /* fundamental period */
        var omega = 2 * Math.PI / T;
        var damp = params.damp + m.dampBase;
        var Sa = params.pga * 2.5 / (1 + 3 * damp);        /* spectral acceleration */
        var Sd = Sa / (omega * omega);                       /* spectral displacement */

        var maxDrift = (Sd / (params.stories * 3.5)) * 100; /* inter-story drift % */
        var dmgRatio = Math.min(1, maxDrift / m.driftCap);
        var damageIndex = Math.min(100, dmgRatio * 100);
        var maxAccel = Sa;

        /* build a shake history (simplified for animation) */
        var duration = 10 + params.mag;  /* seconds */
        var dt = 1 / 30;
        var steps = Math.round(duration / dt);
        var disps = [];
        for (var i = 0; i < steps; i++) {
            var t = i * dt;
            var env = Math.exp(-damp * omega * t) * (1 - Math.exp(-t * 2));
            var excitation = Math.sin(omega * t) + 0.5 * Math.sin(2.3 * omega * t) + 0.3 * Math.sin(0.7 * omega * t + 1.2);
            disps.push(Sd * env * excitation);
        }

        return {
            params: params,
            model: m,
            T: T,
            maxDrift: maxDrift,
            maxAccel: maxAccel,
            damageIndex: damageIndex,
            disps: disps,
            duration: duration
        };
    }

    /* Draw building frame on canvas */
    function drawBuilding(canvas, result, frameIdx) {
        var ctx = canvas.getContext("2d");
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        /* background */
        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, w, h);

        var p = result.params;
        var m = result.model;
        var floors = p.stories;
        var floorH = Math.min(28, (h - 80) / floors);
        var buildW = Math.min(180, w * 0.4);

        var baseX = w / 2;
        var baseY = h - 40;

        /* ground */
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, baseY, w, h - baseY);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(w, baseY); ctx.stroke();

        /* get displacement at current frame */
        var disp = 0;
        if (frameIdx >= 0 && frameIdx < result.disps.length) {
            disp = result.disps[frameIdx];
        }
        var scaleFactor = Math.min(40, buildW * 0.25) / (Math.abs(result.disps[0] || 1) + 0.001);

        /* damage shading */
        var dmg = result.damageIndex / 100;

        for (var f = 0; f < floors; f++) {
            var frac = (f + 1) / floors;
            var dx = disp * frac * scaleFactor;           /* story displacement */
            var y = baseY - (f + 1) * floorH;
            var yPrev = baseY - f * floorH;
            var x = baseX - buildW / 2 + dx;
            var xPrev = baseX - buildW / 2 + (disp * (f / floors) * scaleFactor);

            /* columns */
            ctx.strokeStyle = m.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1 - dmg * 0.3 * frac;

            /* left column */
            ctx.beginPath(); ctx.moveTo(xPrev, yPrev); ctx.lineTo(x, y); ctx.stroke();
            /* right column */
            ctx.beginPath(); ctx.moveTo(xPrev + buildW, yPrev); ctx.lineTo(x + buildW, y); ctx.stroke();

            /* floor slab */
            ctx.fillStyle = m.color;
            ctx.globalAlpha = 0.2 + 0.3 * (1 - dmg);
            ctx.fillRect(x, y, buildW, 3);
            ctx.globalAlpha = 1;

            /* cracks for damaged zones */
            if (dmg > 0.4 && frac > 0.6 && frameIdx > result.disps.length * 0.4) {
                ctx.strokeStyle = "#ef444480";
                ctx.lineWidth = 1;
                var cx = x + buildW * 0.3;
                ctx.beginPath();
                ctx.moveTo(cx, y + 2);
                ctx.lineTo(cx + 8, y + floorH * 0.3);
                ctx.lineTo(cx + 3, y + floorH * 0.5);
                ctx.stroke();
            }
        }

        /* foundation */
        ctx.fillStyle = "#475569";
        ctx.fillRect(baseX - buildW / 2 - 10, baseY - 3, buildW + 20, 6);

        /* label */
        ctx.fillStyle = m.color;
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(m.name, baseX, 20);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px Inter, sans-serif";
        ctx.fillText("T = " + result.T.toFixed(2) + "s · " + floors + "F", baseX, 34);
    }

    function animateSim(canvas, result, prefix) {
        var status = $(prefix + "-status");
        var dmgEl = $(prefix + "-dmg");
        var driftEl = $(prefix + "-drift");
        var accelEl = $(prefix + "-accel");
        var frame = 0;
        var total = result.disps.length;

        function tick() {
            if (frame >= total) {
                if (status) status.textContent = "Complete";
                return null;
            }
            drawBuilding(canvas, result, frame);
            var pct = ((frame / total) * 100).toFixed(0);
            if (status) status.textContent = "Running " + pct + "%";
            if (dmgEl) dmgEl.textContent = result.damageIndex.toFixed(0) + "%";
            if (driftEl) driftEl.textContent = result.maxDrift.toFixed(2) + "%";
            if (accelEl) accelEl.textContent = result.maxAccel.toFixed(2) + "g";
            frame++;
            return requestAnimationFrame(tick);
        }
        return tick();
    }

    function showSummary(rA, rB) {
        var el = $("cmp-summary");
        var grid = $("cmp-summary-grid");
        var verdict = $("cmp-verdict");
        if (!el || !grid || !verdict) return;

        el.style.display = "block";

        var rows = [
            ["Metric", "Sim A", "Sim B", "Better"],
            ["Damage Index", rA.damageIndex.toFixed(0) + " %", rB.damageIndex.toFixed(0) + " %", rA.damageIndex < rB.damageIndex ? "A" : rB.damageIndex < rA.damageIndex ? "B" : "Tie"],
            ["Peak Drift", rA.maxDrift.toFixed(2) + " %", rB.maxDrift.toFixed(2) + " %", rA.maxDrift < rB.maxDrift ? "A" : rB.maxDrift < rA.maxDrift ? "B" : "Tie"],
            ["Max Acceleration", rA.maxAccel.toFixed(2) + " g", rB.maxAccel.toFixed(2) + " g", rA.maxAccel < rB.maxAccel ? "A" : rB.maxAccel < rA.maxAccel ? "B" : "Tie"],
            ["Period", rA.T.toFixed(2) + " s", rB.T.toFixed(2) + " s", "—"],
            ["Ductility", rA.model.ductility.toFixed(1), rB.model.ductility.toFixed(1), rA.model.ductility > rB.model.ductility ? "A" : rB.model.ductility > rA.model.ductility ? "B" : "Tie"]
        ];

        var html = "";
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            var isHeader = i === 0;
            var tag = isHeader ? "strong" : "span";
            var betterStyle = "";
            if (!isHeader) {
                if (r[3] === "A") betterStyle = 'style="color:#3b82f6;font-weight:700;"';
                else if (r[3] === "B") betterStyle = 'style="color:#f97316;font-weight:700;"';
            }
            html += '<div style="display:contents;">';
            html += '<' + tag + ' style="color:#94a3b8;">' + r[0] + '</' + tag + '>';
            html += '<' + tag + ' style="color:#3b82f6;">' + r[1] + '</' + tag + '>';
            html += '<' + tag + ' style="color:#f97316;">' + r[2] + '</' + tag + '>';
            html += '<' + tag + ' ' + betterStyle + '>' + r[3] + '</' + tag + '>';
            html += '</div>';
        }
        grid.innerHTML = html;

        /* verdict */
        var aWins = 0, bWins = 0;
        if (rA.damageIndex < rB.damageIndex) aWins++; else if (rB.damageIndex < rA.damageIndex) bWins++;
        if (rA.maxDrift < rB.maxDrift) aWins++; else if (rB.maxDrift < rA.maxDrift) bWins++;
        if (rA.maxAccel < rB.maxAccel) aWins++; else if (rB.maxAccel < rA.maxAccel) bWins++;

        var vText, vColor;
        if (aWins > bWins) { vText = "Simulation A performs better overall"; vColor = "#3b82f6"; }
        else if (bWins > aWins) { vText = "Simulation B performs better overall"; vColor = "#f97316"; }
        else { vText = "Both simulations perform similarly"; vColor = "#94a3b8"; }

        verdict.innerHTML = '<span style="color:' + vColor + ';font-weight:700;font-size:1rem;">' + vText + '</span>';
    }

    function runBoth() {
        if (animA) cancelAnimationFrame(animA);
        if (animB) cancelAnimationFrame(animB);

        var paramsA = readSim("cmp-a");
        var paramsB = readSim("cmp-b");
        var resA = simulate(paramsA);
        var resB = simulate(paramsB);

        var canvasA = $("cmp-canvas-a");
        var canvasB = $("cmp-canvas-b");

        if (canvasA) animA = animateSim(canvasA, resA, "cmp-a");
        if (canvasB) animB = animateSim(canvasB, resB, "cmp-b");

        showSummary(resA, resB);
    }

    function resetBoth() {
        if (animA) cancelAnimationFrame(animA);
        if (animB) cancelAnimationFrame(animB);
        animA = animB = null;

        ["cmp-a", "cmp-b"].forEach(function (prefix) {
            var s = $(prefix + "-status"); if (s) s.textContent = "Ready";
            var d = $(prefix + "-dmg"); if (d) d.textContent = "—";
            var dr = $(prefix + "-drift"); if (dr) dr.textContent = "—";
            var a = $(prefix + "-accel"); if (a) a.textContent = "—";
            var c = $(prefix.replace("-", "-canvas-"));
            if (c) {
                var ctx = c.getContext("2d");
                ctx.clearRect(0, 0, c.width, c.height);
                ctx.fillStyle = "#0a0e1a";
                ctx.fillRect(0, 0, c.width, c.height);
            }
        });

        var s = $("cmp-summary"); if (s) s.style.display = "none";
    }

    window.initCompareTab = function () {
        if (inited) return;
        inited = true;

        var runBtn = $("cmp-run-btn");
        var resetBtn = $("cmp-reset-btn");

        if (runBtn) runBtn.addEventListener("click", runBoth);
        if (resetBtn) resetBtn.addEventListener("click", resetBoth);
    };
})();
