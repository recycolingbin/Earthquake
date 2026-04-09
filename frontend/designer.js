/* ═══════════════════════════════════════════════════
   Building Designer – parametric design + seismic assessment
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    var $ = function (id) { return document.getElementById(id); };
    var canvas, ctx;
    var inited = false;

    /* Material properties (density kg/m³, base strength 0-1, eco 0-1, cost $/m²) */
    var MATS = {
        rc: { name: "RC", density: 2400, strength: 0.7, eco: 0.4, cost: 1250 },
        steel: { name: "Steel", density: 7850, strength: 0.9, eco: 0.35, cost: 1800 },
        timber: { name: "Timber", density: 600, strength: 0.45, eco: 0.9, cost: 950 },
        masonry: { name: "Masonry", density: 1800, strength: 0.35, eco: 0.5, cost: 700 },
        composite: { name: "Composite", density: 3200, strength: 0.85, eco: 0.45, cost: 2000 }
    };

    var FOUNDATIONS = {
        shallow: { label: "Shallow", bonus: 0, maxFloors: 12 },
        deep: { label: "Deep", bonus: 8, maxFloors: 40 },
        isolated: { label: "Isolated", bonus: 20, maxFloors: 25 },
        damped: { label: "Damped", bonus: 15, maxFloors: 30 }
    };

    function getParams() {
        return {
            name: ($("des-name") || {}).value || "My Building",
            floors: parseInt(($("des-floors") || {}).value, 10) || 8,
            floorH: parseFloat(($("des-floor-h") || {}).value) || 3.2,
            width: parseFloat(($("des-width") || {}).value) || 20,
            depth: parseFloat(($("des-depth") || {}).value) || 15,
            shape: ($("des-shape") || {}).value || "rectangular",
            material: ($("des-material") || {}).value || "rc",
            foundation: ($("des-foundation") || {}).value || "shallow",
            lateral: ($("des-lateral") || {}).value || "moment-frame",
            code: ($("des-code") || {}).value || "ibc"
        };
    }

    function draw3D() {
        if (!canvas || !ctx) return;
        var p = getParams();
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0a0e1a";
        ctx.fillRect(0, 0, w, h);

        var totalH = p.floors * p.floorH;
        var maxDim = Math.max(p.width, p.depth, totalH);
        var scale = Math.min(w * 0.5, h * 0.7) / maxDim;

        var bw = p.width * scale;
        var bd = p.depth * scale * 0.4; /* isometric depth */
        var bh = totalH * scale;

        var cx = w / 2;
        var baseY = h * 0.85;

        /* ground */
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, baseY, w, h - baseY);
        ctx.strokeStyle = "rgba(148,163,184,0.1)";
        ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(w, baseY); ctx.stroke();

        /* building front face */
        var x0 = cx - bw / 2;
        ctx.fillStyle = "rgba(100,140,200,0.3)";
        ctx.strokeStyle = "rgba(100,140,200,0.6)";
        ctx.lineWidth = 1;
        ctx.fillRect(x0, baseY - bh, bw, bh);
        ctx.strokeRect(x0, baseY - bh, bw, bh);

        /* side face (isometric) */
        ctx.fillStyle = "rgba(70,100,160,0.25)";
        ctx.beginPath();
        ctx.moveTo(x0 + bw, baseY);
        ctx.lineTo(x0 + bw + bd, baseY - bd * 0.6);
        ctx.lineTo(x0 + bw + bd, baseY - bh - bd * 0.6);
        ctx.lineTo(x0 + bw, baseY - bh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        /* top face */
        ctx.fillStyle = "rgba(130,170,230,0.2)";
        ctx.beginPath();
        ctx.moveTo(x0, baseY - bh);
        ctx.lineTo(x0 + bd, baseY - bh - bd * 0.6);
        ctx.lineTo(x0 + bw + bd, baseY - bh - bd * 0.6);
        ctx.lineTo(x0 + bw, baseY - bh);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        /* floor lines */
        ctx.strokeStyle = "rgba(148,163,184,0.15)";
        ctx.setLineDash([3, 3]);
        for (var f = 1; f < p.floors; f++) {
            var fy = baseY - (f * p.floorH * scale);
            ctx.beginPath(); ctx.moveTo(x0, fy); ctx.lineTo(x0 + bw, fy); ctx.stroke();
        }
        ctx.setLineDash([]);

        /* shape indicator for non-rectangular */
        if (p.shape !== "rectangular") {
            ctx.fillStyle = "rgba(249,115,22,0.15)";
            ctx.font = "11px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(p.shape.toUpperCase() + " plan", cx, baseY - bh - bd * 0.6 - 10);
        }

        /* foundation indicator */
        var fnd = FOUNDATIONS[p.foundation] || FOUNDATIONS.shallow;
        ctx.fillStyle = "rgba(34,197,94,0.35)";
        ctx.fillRect(x0 - 5, baseY, bw + 10, 6);
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(fnd.label + " Foundation", cx, baseY + 16);

        /* dimensions */
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(p.width + "m", cx, baseY + 30);
        ctx.textAlign = "right";
        ctx.fillText(totalH.toFixed(1) + "m", x0 - 8, baseY - bh / 2);

        /* material label */
        var mat = MATS[p.material] || MATS.rc;
        ctx.fillStyle = "#f97316";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(mat.name + " | " + p.floors + "F", cx, 20);

        /* update label */
        var lbl = $("des-preview-label");
        if (lbl) lbl.textContent = p.floors + "-story " + p.shape;
    }

    function updateReadouts() {
        var p = getParams();
        var mat = MATS[p.material] || MATS.rc;
        var totalH = p.floors * p.floorH;
        var floorArea = p.width * p.depth;

        var el;
        el = $("des-total-area"); if (el) el.textContent = floorArea.toFixed(0);
        el = $("des-total-height"); if (el) el.textContent = totalH.toFixed(1);

        /* rough weight estimate: volume * density * fill factor */
        var fill = 0.15; /* structural volume fraction */
        var weight = floorArea * totalH * mat.density * fill / 1000; /* tonnes */
        el = $("des-weight"); if (el) el.textContent = weight.toFixed(0);

        /* fundamental period (approximate: T ≈ 0.1 * N for RC, 0.08*N for steel) */
        var periodCoeff = p.material === "steel" ? 0.08 : p.material === "timber" ? 0.12 : 0.1;
        var period = periodCoeff * p.floors;
        el = $("des-period"); if (el) el.textContent = period.toFixed(2);
    }

    function assess() {
        var p = getParams();
        var mat = MATS[p.material] || MATS.rc;
        var fnd = FOUNDATIONS[p.foundation] || FOUNDATIONS.shallow;
        var totalH = p.floors * p.floorH;
        var score = 50; /* base */

        /* Material strength contribution */
        score += mat.strength * 15;

        /* Foundation bonus */
        score += fnd.bonus;

        /* Code compliance */
        if (p.code === "none") score -= 20;
        else score += 5;

        /* Lateral system */
        if (p.lateral === "dual") score += 8;
        else if (p.lateral === "shear-wall") score += 5;
        else if (p.lateral === "braced-frame") score += 4;

        /* Penalties */
        /* Irregularity */
        var irreg = "Regular";
        var irregCls = "low";
        if (p.shape === "l-shape" || p.shape === "u-shape") {
            score -= 8;
            irreg = "Irregular";
            irregCls = "moderate";
        }

        /* Soft story */
        var softRisk = "Low";
        var softCls = "low";
        if (p.floors > 4 && p.floorH > 4) {
            score -= 5;
            softRisk = "Moderate";
            softCls = "moderate";
        }

        /* Overturning */
        var aspectRatio = totalH / Math.min(p.width, p.depth);
        var overturn = "OK";
        var overturnCls = "low";
        if (aspectRatio > 4) {
            score -= 12;
            overturn = "High Risk";
            overturnCls = "high";
        } else if (aspectRatio > 3) {
            score -= 5;
            overturn = "Caution";
            overturnCls = "moderate";
        }

        /* Foundation match */
        var foundMatch = "Good";
        var foundCls = "low";
        if (p.floors > fnd.maxFloors) {
            score -= 15;
            foundMatch = "Undersized";
            foundCls = "high";
        }

        /* code compliance */
        var codeLbl = p.code === "none" ? "Non-compliant" : "Compliant";
        var codeCls = p.code === "none" ? "high" : "low";

        score = Math.max(0, Math.min(100, Math.round(score)));

        /* Update DOM */
        var el;
        el = $("des-score-num"); if (el) el.textContent = score;

        /* color the circle */
        var circle = $("des-score-circle");
        if (circle) {
            if (score >= 70) circle.style.borderColor = "#22c55e";
            else if (score >= 45) circle.style.borderColor = "#eab308";
            else circle.style.borderColor = "#ef4444";
        }

        el = $("des-f-irreg"); if (el) { el.textContent = irreg; el.className = "rating-badge " + irregCls; }
        el = $("des-f-soft"); if (el) { el.textContent = softRisk; el.className = "rating-badge " + softCls; }
        el = $("des-f-overturn"); if (el) { el.textContent = overturn; el.className = "rating-badge " + overturnCls; }
        el = $("des-f-found"); if (el) { el.textContent = foundMatch; el.className = "rating-badge " + foundCls; }
        el = $("des-f-code"); if (el) { el.textContent = codeLbl; el.className = "rating-badge " + codeCls; }

        /* store for report */
        window._designerResult = {
            params: p,
            score: score,
            factors: { irregularity: irreg, softStory: softRisk, overturning: overturn, foundation: foundMatch, code: codeLbl }
        };
    }

    function wireControls() {
        var fields = ["des-floors", "des-floor-h", "des-width", "des-depth", "des-shape",
            "des-material", "des-foundation", "des-lateral", "des-code", "des-name"];
        fields.forEach(function (id) {
            var el = $(id);
            if (el) {
                el.addEventListener("input", function () { draw3D(); updateReadouts(); });
                /* selects fire "change" not "input" on mobile */
                if (el.tagName === "SELECT") {
                    el.addEventListener("change", function () { draw3D(); updateReadouts(); });
                }
            }
        });

        /* Validate numeric fields — reject null, 0, or negative */
        var numericFields = ["des-floors", "des-floor-h", "des-width", "des-depth"];
        numericFields.forEach(function (id) {
            var el = $(id);
            if (!el) return;
            el.addEventListener("blur", function () {
                var v = parseFloat(el.value);
                if (!v || v <= 0 || isNaN(v)) {
                    el.style.borderColor = "#ef4444";
                    el.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.15)";
                    /* show inline message */
                    var msg = el.parentNode.querySelector(".field-error");
                    if (!msg) {
                        msg = document.createElement("span");
                        msg.className = "field-error";
                        msg.style.cssText = "color:#ef4444;font-size:0.75rem;display:block;margin-top:2px;";
                        el.parentNode.appendChild(msg);
                    }
                    msg.textContent = "Input should be a valid number greater than 0";
                } else {
                    el.style.borderColor = "";
                    el.style.boxShadow = "";
                    var msg = el.parentNode.querySelector(".field-error");
                    if (msg) msg.remove();
                }
            });
        });

        var assessBtn = $("des-assess-btn");
        if (assessBtn) assessBtn.addEventListener("click", function () { assess(); draw3D(); updateReadouts(); });

        var exportBtn = $("des-export-btn");
        if (exportBtn) exportBtn.addEventListener("click", function () {
            /* jump to collapse tab */
            var link = document.querySelector('[data-tab-target="collapse"]');
            if (link) link.click();
        });
    }

    window.initDesignerTab = function () {
        if (inited) return;
        inited = true;
        canvas = $("designer-canvas");
        if (canvas) ctx = canvas.getContext("2d");
        wireControls();
        draw3D();
        updateReadouts();
    };
})();
