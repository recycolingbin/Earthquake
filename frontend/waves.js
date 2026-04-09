/* ═══════════════════════════════════════════════════
   Seismic Wave Visualizer – P, S, and Surface waves
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };
    var canvas, ctx;
    var running = false;
    var elapsed = 0;
    var animId = null;
    var inited = false;

    /* params */
    var magnitude = 6.0;
    var depth = 30;
    var distance = 100;
    var soil = "stiff";

    /* wave speeds (km/s) */
    var VP = 6.5, VS = 3.7, VSURF = 2.8;

    function soilAmp() {
        if (soil === "rock") return 0.7;
        if (soil === "soft") return 1.6;
        return 1.0;
    }

    function arrivalTime(speed) {
        var hypo = Math.sqrt(distance * distance + depth * depth);
        return hypo / speed;
    }

    function waveAmplitude(mag, dist, type) {
        var base = Math.pow(10, (mag - 3) * 0.5) * soilAmp();
        var atten = 1 / Math.max(dist * 0.01, 1);
        if (type === "p") return base * 0.4 * atten;
        if (type === "s") return base * 0.7 * atten;
        return base * 1.0 * atten;
    }

    function drawWaves() {
        if (!canvas || !ctx) return;
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        /* background */
        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, w, h);

        /* ground line */
        var groundY = h * 0.5;
        ctx.strokeStyle = "rgba(148,163,184,0.15)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
        ctx.setLineDash([]);

        /* labels */
        ctx.fillStyle = "#64748b";
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Epicenter", 8, groundY - 5);
        ctx.textAlign = "right";
        ctx.fillText(distance + " km", w - 8, groundY - 5);

        /* time labels */
        ctx.textAlign = "center";
        ctx.fillText("Time: " + elapsed.toFixed(1) + "s", w / 2, 16);

        /* depth indicator */
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(30, groundY + Math.min(depth * 0.8, h * 0.35), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#94a3b8";
        ctx.font = "9px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("Hypo " + depth + "km", 40, groundY + Math.min(depth * 0.8, h * 0.35) + 3);

        if (!running && elapsed === 0) {
            ctx.fillStyle = "#64748b";
            ctx.font = "14px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Press Start to see wave propagation", w / 2, h * 0.3);
            return;
        }

        var tP = arrivalTime(VP);
        var tS = arrivalTime(VS);
        var tSurf = arrivalTime(VSURF);
        var ampP = waveAmplitude(magnitude, distance, "p");
        var ampS = waveAmplitude(magnitude, distance, "s");
        var ampSurf = waveAmplitude(magnitude, distance, "surf");
        var maxAmp = Math.min(h * 0.35, 160);

        /* draw each wave type */
        var waves = [
            { name: "P", color: "#ef4444", arr: tP, amp: ampP, freq: 12, yOff: -h * 0.22 },
            { name: "S", color: "#3b82f6", arr: tS, amp: ampS, freq: 7, yOff: 0 },
            { name: "Surf", color: "#f59e0b", arr: tSurf, amp: ampSurf, freq: 4, yOff: h * 0.22 }
        ];

        for (var wi = 0; wi < waves.length; wi++) {
            var wave = waves[wi];
            var t0 = wave.arr;
            if (elapsed < t0 * 0.3) continue;
            var progress = Math.min((elapsed - t0 * 0.3) / (t0 * 1.5), 1);
            var a = wave.amp * Math.min(progress * 2, 1) * maxAmp;

            /* decay after peak */
            var peakT = t0 + 2;
            if (elapsed > peakT) {
                a *= Math.max(0, 1 - (elapsed - peakT) * 0.08);
            }

            var baseY = groundY + wave.yOff;

            ctx.beginPath();
            ctx.strokeStyle = wave.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.9;
            for (var x = 0; x < w; x++) {
                var xNorm = x / w;
                var wavefront = progress;
                if (xNorm > wavefront) break;
                var env = Math.sin(Math.PI * xNorm / wavefront) * (1 - xNorm * 0.3);
                var y = baseY + Math.sin((xNorm * wave.freq + elapsed * 3) * Math.PI * 2) * a * env;
                x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;

            /* wave label */
            var labelX = Math.min(progress * w + 10, w - 40);
            ctx.fillStyle = wave.color;
            ctx.font = "bold 10px Inter, sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(wave.name + "-wave", labelX, baseY - a * 0.6 - 6);
        }

        /* arrival markers */
        ctx.font = "10px monospace";
        if (elapsed >= tP) {
            ctx.fillStyle = "rgba(239,68,68,0.35)";
            ctx.fillRect(w - 3, groundY - h * 0.35, 3, h * 0.15);
        }
        if (elapsed >= tS) {
            ctx.fillStyle = "rgba(59,130,246,0.35)";
            ctx.fillRect(w - 3, groundY - h * 0.1, 3, h * 0.15);
        }
        if (elapsed >= tSurf) {
            ctx.fillStyle = "rgba(245,158,11,0.35)";
            ctx.fillRect(w - 3, groundY + h * 0.12, 3, h * 0.15);
        }
    }

    function updateReadouts() {
        var tP = arrivalTime(VP);
        var tS = arrivalTime(VS);
        var tSurf = arrivalTime(VSURF);

        var el;
        el = $("wa-p-time"); if (el) el.textContent = tP.toFixed(1);
        el = $("wa-s-time"); if (el) el.textContent = tS.toFixed(1);
        el = $("wa-surf-time"); if (el) el.textContent = tSurf.toFixed(1);
        el = $("wa-s-p-lag"); if (el) el.textContent = (tS - tP).toFixed(1);

        var peakAcc = waveAmplitude(magnitude, distance, "surf") * soilAmp() * 0.25;
        el = $("wa-peak-acc"); if (el) el.textContent = peakAcc.toFixed(2) + "g";

        /* approximate MMI from magnitude and distance */
        var mmi = Math.round(Math.min(12, Math.max(1, magnitude * 1.5 - Math.log10(distance) * 2)));
        var mmiLabels = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
        el = $("wa-intensity"); if (el) el.textContent = mmiLabels[mmi] || mmi;

        el = $("waves-p-amp"); if (el) el.textContent = waveAmplitude(magnitude, distance, "p").toFixed(2);
        el = $("waves-s-amp"); if (el) el.textContent = waveAmplitude(magnitude, distance, "s").toFixed(2);
        el = $("waves-surf-amp"); if (el) el.textContent = waveAmplitude(magnitude, distance, "surf").toFixed(2);
    }

    function step() {
        if (!running) return;
        elapsed += 1 / 60;
        drawWaves();
        updateReadouts();

        var maxT = arrivalTime(VSURF) + 15;
        if (elapsed > maxT) {
            running = false;
            var st = $("waves-status"); if (st) st.textContent = "Complete";
            return;
        }
        animId = requestAnimationFrame(step);
    }

    function start() {
        if (running) return;
        running = true;
        elapsed = 0;
        var st = $("waves-status"); if (st) st.textContent = "Running";
        updateReadouts();
        step();
    }

    function reset() {
        running = false;
        if (animId) cancelAnimationFrame(animId);
        elapsed = 0;
        drawWaves();
        updateReadouts();
        var st = $("waves-status"); if (st) st.textContent = "Ready";
    }

    function wireControls() {
        var magS = $("waves-magnitude");
        var depS = $("waves-depth");
        var disS = $("waves-distance");
        var soilS = $("waves-soil");

        if (magS) magS.addEventListener("input", function () {
            magnitude = parseFloat(magS.value);
            var v = $("waves-mag-val"); if (v) v.textContent = magnitude.toFixed(1);
            updateReadouts();
        });
        if (depS) depS.addEventListener("input", function () {
            depth = parseInt(depS.value, 10);
            var v = $("waves-depth-val"); if (v) v.textContent = depth;
            updateReadouts();
        });
        if (disS) disS.addEventListener("input", function () {
            distance = parseInt(disS.value, 10);
            var v = $("waves-dist-val"); if (v) v.textContent = distance;
            updateReadouts();
        });
        if (soilS) soilS.addEventListener("input", function () {
            soil = soilS.value;
            updateReadouts();
        });
        /* selects fire "change" not "input" on iOS/mobile */
        if (soilS) soilS.addEventListener("change", function () {
            soil = soilS.value;
            updateReadouts();
        });
        var runBtn = $("waves-run-btn");
        var rstBtn = $("waves-reset-btn");
        if (runBtn) runBtn.addEventListener("click", start);
        if (rstBtn) rstBtn.addEventListener("click", reset);
    }

    window.initWavesTab = function () {
        if (inited) return;
        inited = true;
        canvas = $("waves-canvas");
        if (!canvas) return;
        /* Resize canvas to fit container on mobile */
        var container = canvas.parentElement;
        if (container) {
            var cw = container.clientWidth;
            if (cw > 0 && cw < canvas.width) {
                var ratio = canvas.height / canvas.width;
                canvas.width = Math.max(cw * 2, 600);
                canvas.height = Math.round(canvas.width * ratio);
            }
        }
        ctx = canvas.getContext("2d");
        wireControls();
        updateReadouts();
        drawWaves();
    };
})();
