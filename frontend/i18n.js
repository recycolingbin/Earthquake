/* ═══════════════════════════════════════════════════
   i18n + Collapsible Nav + Language Switcher
   ═══════════════════════════════════════════════════ */
(function () {
    "use strict";

    /* ── Translation dictionaries ── */
    var LANG = {
        en: {
            "nav.home": "Home", "nav.terrain": "Terrain", "nav.building": "Building_Risk",
            "nav.models": "Models", "nav.collapse": "Collapse Lab", "nav.waves": "Waves",
            "nav.designer": "Designer", "nav.history": "History", "nav.report": "Report",
            "nav.compare": "Compare", "nav.instructions": "Instructions", "nav.menu": "Menu",

            /* ── Section titles / subtitles (data-i18n-title / data-i18n-sub) ── */
            "home.title": "SeismoSafe",
            "home.desc": "An interactive education platform for seismic design",
            "terrain.title": "Our Sustainable Seismic Design",
            "terrain.sub": "A crew-designed earthquake-resilient structure — sustainable, culturally respectful, and built with low carbon-footprint materials.",
            "terrain.sustainable": "Sustainable Design",
            "terrain.sustainableDesc": "Our crew\u2019s design prioritises environmental sustainability — minimising waste, optimising energy performance, and integrating passive seismic resilience strategies.",
            "terrain.culture": "Respect for Local Culture",
            "terrain.cultureDesc": "Inspired by Tibetan and Himalayan vernacular architecture — honouring traditional building forms, spatial layouts, and community-centred design while meeting modern seismic codes.",
            "terrain.lowCarbon": "Low Carbon Footprint",
            "terrain.lowCarbonDesc": "Built with locally sourced rammed earth, cross-laminated timber, and recycled steel — reducing embodied carbon by up to 60% compared to conventional reinforced concrete.",
            "models.title": "Model Comparison",
            "models.sub": "Select a building model, inspect its 3D form, review performance metrics, and adjust variables for real-time earthquake simulation.",
            "collapse.title": "Collapse Simulation",
            "collapse.sub": "Watch the cell-fractured building progressively collapse under earthquake forces (M \u2265 8.0).",
            "waves.title": "Seismic Wave Visualizer",
            "waves.sub": "Watch P-wave, S-wave, and Surface wave propagation in real-time with adjustable parameters.",
            "designer.title": "Building Designer",
            "designer.sub": "Customize building parameters, materials, and foundation type; then test your design in the Collapse Lab.",
            "history.title": "Earthquake History",
            "history.sub": "Browse significant historical earthquakes with magnitude, location, casualties, and mapped epicenters.",
            "report.title": "Structural Report",
            "report.sub": "Generate a comprehensive damage assessment report from your latest simulation run.",
            "compare.title": "Side-by-Side Comparison",
            "compare.sub": "Run two simulations simultaneously with different parameters and compare results.",
            "manual.title": "User Manual",

            /* ── Buttons ── */
            "btn.upload": "Upload & compute slope factor",
            "btn.riskScore": "Compute risk score",
            "btn.exportSap": "Export SAP2000 .s2k",
            "btn.runSim": "▶ Run Simulation",
            "btn.reset": "↺ Reset",
            "btn.run": "▶ Run",
            "btn.replay": "⏪ Replay",
            "btn.startWaves": "▶ Start Waves",
            "btn.assessDesign": "📐 Assess Design",
            "btn.sendCollapse": "📤 Send to Collapse Lab",
            "btn.filter": "Filter",
            "btn.genReport": "📋 Generate Report",
            "btn.print": "🖨️ Print / PDF",
            "btn.runBoth": "▶ Run Both",

            /* ── Section pills / eyebrows ── */
            "pill.step1": "Step 1", "pill.step2": "Step 2", "pill.step3": "Step 3",
            "pill.compare": "Compare", "pill.lab": "Lab", "pill.waves": "Waves",
            "pill.design": "Design", "pill.history": "History", "pill.report": "Report",
            "pill.livePreview": "Live preview", "pill.analysis": "Analysis",
            "pill.5models": "5 Models", "pill.interactive": "Interactive",
            "pill.customBuild": "Custom Build", "pill.database": "Database",
            "pill.export": "Export", "pill.dualSim": "Dual Sim", "pill.cheatSheet": "Cheat sheet",

            /* ── Terrain tab ── */
            "terrain.upload": "Upload",
            "terrain.factor": "Terrain factor",
            "terrain.demTitle": "DEM / terrain file",
            "terrain.demDesc": "Drag a GeoTIFF/DEM file (.tif/.tiff) and we'll derive a slope factor.",
            "terrain.dropText": "Drag & drop GeoTIFF here",
            "terrain.dropHint": "or click to browse (.tif / .tiff only)",
            "terrain.slopeHint": "Slope hint (degrees)",
            "terrain.3dMassing": "3D massing",
            "terrain.boxOnSlope": "Box on sloped ground",
            "terrain.howTo": "How-to",
            "terrain.workflow": "Terrain workflow",
            "terrain.readout": "Read-out",
            "terrain.backend": "Backend response",
            "terrain.gentle": "Gentle = 0–10°",
            "terrain.medium": "Medium = 10–20°",
            "terrain.steep": "Steep > 20°",

            /* ── Building tab ── */
            "bldg.massing": "Massing", "bldg.geometry": "Geometry",
            "bldg.name": "Name", "bldg.stories": "Stories", "bldg.storyH": "Story height (m)",
            "bldg.bayW": "Bay width (m)", "bldg.bayD": "Bay depth (m)",
            "bldg.material": "Material", "bldg.importance": "Importance factor",
            "bldg.site": "Site", "bldg.hazard": "Hazard inputs",
            "bldg.siteClass": "Site class", "bldg.slope": "Slope (degrees)",
            "bldg.pga": "PGA (g)", "bldg.zone": "Seismic zone",
            "bldg.actions": "Actions", "bldg.compute": "Compute / export",
            "bldg.riskOutput": "Risk output",

            /* ── Models tab ── */
            "mod.3dSim": "3D Simulation", "mod.perfRadar": "Performance Radar",
            "mod.metrics": "Metrics overview", "mod.simControls": "Simulation Controls",
            "mod.adjustVars": "Adjust variables in real time",
            "mod.magnitude": "🌊 Earthquake Magnitude", "mod.peakAccel": "📈 Peak Ground Accel.",
            "mod.soilAmp": "🏔️ Soil Amplification", "mod.stories": "🏢 Stories",
            "mod.duration": "⏱️ Duration", "mod.damping": "🔧 Damping Ratio",
            "mod.estDamage": "Estimated Damage:",
            "mod.strength": "⚡ Strength", "mod.eco": "🌱 Eco-Friendly",
            "mod.quakeRes": "🛡️ Earthquake Res.", "mod.costEff": "💰 Cost Efficiency",
            "mod.durability": "🔧 Durability",
            "mod.recentSim": "📋 Recent Simulations", "mod.mockHistory": "Mock history",
            "mod.seismograph": "📈 Seismograph", "mod.liveAccel": "Live ground acceleration",
            "mod.drift": "📐 Inter-Story Drift", "mod.perFloor": "Per-floor displacement",
            "mod.quickCompare": "📊 Quick Comparison", "mod.atGlance": "All 5 models at a glance",

            /* ── Collapse tab ── */
            "col.magnitude": "Magnitude", "col.duration": "Duration",
            "col.crackHeight": "Crack Height",
            "col.stats": "📊 Collapse Stats", "col.timeline": "📈 Shake Timeline",
            "col.totalPieces": "Total Pieces", "col.detached": "Detached",
            "col.grounded": "Grounded", "col.peakVel": "Peak Velocity",
            "col.energy": "Energy (kJ)", "col.crackPct": "Crack Height",
            "col.state": "State:",

            /* ── Waves tab ── */
            "wav.propView": "Propagation View",
            "wav.waveInfo": "Wave Info",
            "wav.magnitude": "Magnitude", "wav.depth": "Depth (km)",
            "wav.distance": "Distance (km)", "wav.soilType": "Soil Type",
            "wav.controls": "Controls", "wav.arrivals": "Arrival Times",
            "wav.pWave": "P-Wave (s)", "wav.sWave": "S-Wave (s)",
            "wav.surface": "Surface (s)", "wav.spLag": "S-P Lag (s)",
            "wav.peakAccel": "Peak Accel.", "wav.mmiIntensity": "MMI Intensity",
            "wav.rock": "Rock", "wav.stiffSoil": "Stiff Soil", "wav.softSoil": "Soft Soil",

            /* ── Designer tab ── */
            "des.structure": "Structure", "des.geometry": "Geometry",
            "des.bldgName": "Building Name", "des.floors": "Floors",
            "des.floorH": "Floor Height (m)", "des.width": "Width (m)", "des.depth": "Depth (m)",
            "des.shape": "Shape", "des.matFound": "Material & Foundation",
            "des.structSys": "Structural system",
            "des.primaryMat": "Primary Material", "des.foundType": "Foundation Type",
            "des.lateralSys": "Lateral System", "des.seismicCode": "Seismic Design Code",
            "des.3dPreview": "3D Preview", "des.seismicReady": "Seismic Readiness",
            "des.quickAssess": "Quick assessment",
            "des.floorArea": "Floor Area (m²)", "des.totalH": "Total Height (m)",
            "des.weight": "Est. Weight (t)", "des.period": "Fund. Period (s)",
            "des.irregularity": "Irregularity", "des.softStory": "Soft Story Risk",
            "des.overturn": "Overturning Moment", "des.foundMatch": "Foundation Match",
            "des.codeComply": "Code Compliance",

            /* ── History tab ── */
            "hist.filter": "Filter",
            "hist.minMag": "Min Magnitude", "hist.region": "Region", "hist.yearRange": "Year Range",
            "hist.allRegions": "All Regions", "hist.himalayan": "Himalayan (Tibet/Sichuan/Nepal)",
            "hist.pacific": "Pacific Ring of Fire", "hist.mediterranean": "Mediterranean",
            "hist.asiaOther": "Asia (Other)", "hist.americas": "Americas",
            "hist.allTime": "All Time",
            "hist.epicenter": "Epicenter Map", "hist.eventTable": "Event Table",
            "hist.statistics": "Statistics",
            "hist.year": "Year", "hist.location": "Location", "hist.magnitude": "Magnitude",
            "hist.depthKm": "Depth (km)", "hist.casualties": "Casualties",
            "hist.mmi": "MMI", "hist.tsunami": "Tsunami",
            "hist.totalEvents": "Total Events", "hist.avgMag": "Avg Magnitude",
            "hist.maxMag": "Max Magnitude", "hist.totalCasualties": "Total Casualties",
            "hist.tsunamis": "Tsunamis", "hist.deadliest": "Deadliest",

            /* ── Report tab ── */
            "rpt.dataSource": "Data Source",
            "rpt.collapseData": "Collapse Lab (last run)",
            "rpt.modelsData": "Models Tab (last simulation)",
            "rpt.designerData": "Building Designer (assessment)",

            /* ── Compare tab ── */
            "cmp.simA": "Simulation A", "cmp.simB": "Simulation B",
            "cmp.model": "Model", "cmp.magnitude": "Magnitude",
            "cmp.stories": "Stories", "cmp.pga": "PGA (g)", "cmp.damping": "Damping",
            "cmp.damage": "Damage:", "cmp.peakDrift": "Peak Drift:",
            "cmp.maxAccel": "Max Accel:", "cmp.summary": "Comparison Summary",

            /* ── Terrain extras ── */
            "terrain.derivedSlope": "Derived Slope:",
            "terrain.groundPlane": "Ground plane (slope)",
            "terrain.buildingMass": "Building mass",
            "terrain.microcopy": "Use the Building tab to tweak bays, stories, and story height — preview refreshes live.",
            "terrain.steps": "<li><strong>Drop</strong> your DEM or test file and click <em>Upload</em>.</li><li><strong>Adjust</strong> slope hint if the site is steeper than average.</li><li><strong>Jump</strong> to Building and set stories / bays — 3D updates in this tab.</li><li><strong>Review</strong> read-out below for slope factor + metadata.</li>",
            "terrain.callout": "Tip: keep slope realistic; the risk score uses it directly.",

            /* ── Building extras ── */
            "bldg.callout": "Uses same slope as terrain — keep it in sync.",
            "bldg.microcopy": "Risk / export use both massing and site inputs.",

            /* ── Models extras ── */
            "mod.rcFrame": "RC Frame", "mod.steelFrame": "Steel Frame",
            "mod.timberEco": "Timber Eco", "mod.baseIsolated": "Base Isolated",
            "mod.hybridDamper": "Hybrid Damper",
            "mod.popular": "Popular", "mod.strong": "Strong", "mod.green": "Green",
            "mod.safe": "Safe", "mod.advanced": "Advanced",
            "mod.material": "Material", "mod.co2": "CO₂ / m²",
            "mod.costM2": "Cost / m²", "mod.maxStories": "Max Stories",
            "mod.typicalUse": "Typical Use",
            "mod.clickToBegin": "Click a model tab to begin",
            "mod.structure": "Structure", "mod.groundMotion": "Ground motion",
            "mod.readySim": "Ready — adjust sliders to simulate",

            /* ── Collapse extras ── */
            "col.ready": "Ready", "col.loading": "Loading model…",
            "col.magThreshold": "Magnitude threshold: 8.0",
            "col.damage": "Damage",

            /* ── Waves extras ── */
            "wav.pWaveLegend": "P-Wave (Primary)",
            "wav.sWaveLegend": "S-Wave (Secondary)",
            "wav.surfaceLegend": "Surface Wave",
            "wav.pWaveTitle": "P-Wave", "wav.sWaveTitle": "S-Wave",
            "wav.surfaceTitle": "Surface Wave",
            "wav.pWaveDesc": "Compressional (longitudinal). Fastest wave, arrives first. Travels through solids and liquids. Speed: 5–8 km/s.",
            "wav.sWaveDesc": "Shear (transverse). Slower than P-wave. Only travels through solids. Speed: 3–5 km/s. Causes more damage.",
            "wav.surfaceDesc": "Rayleigh & Love waves. Slowest but most destructive. Travel along Earth's surface. Speed: 2–4 km/s.",
            "wav.amplitude": "Amplitude",

            /* ── Designer extras ── */
            "des.regular": "Regular", "des.low": "Low",
            "des.ok": "OK", "des.good": "Good", "des.compliant": "Compliant",

            /* ── Instructions tab ── */
            "ins.flow": "Flow", "ins.endToEnd": "End-to-end",
            "ins.runLocally": "Run locally", "ins.dev": "Dev",
            "ins.outputs": "Outputs", "ins.whatYouGet": "What you get",
            "ins.callout": "Tip: slope drives both terrain factor and risk score — match it across tabs.",
            "ins.staticPreview": "You can also open index.html directly for a quick static preview.",
            "ins.flowSteps": "<li><strong>Terrain + 3D</strong> — upload DEM / DXF, set slope hint, and check the live massing card.</li><li><strong>Building</strong> — set stories, bay sizes, material, importance; keep slope consistent.</li><li><strong>Analyse</strong> — click \"Compute risk score\" or export SAP2000 <code>.s2k</code>.</li>",
            "ins.devSteps": "<li><strong>Backend:</strong> <code>uvicorn app.main:app --reload --port 8000</code> (from <code>backend</code>).</li><li><strong>Frontend:</strong> <code>python -m http.server 5173</code> (from <code>frontend</code>), then open <code>http://localhost:5173/</code>.</li>",
            "ins.outputList": "<li>Terrain slope factor from the upload endpoint.</li><li>Risk JSON for the current massing + site.</li><li>SAP2000 starter file (<code>.s2k</code>) for concept export.</li>",

            /* ── Home link labels ── */
            "home.terrain": "🏔️ Terrain", "home.building": "🏗️ Building",
            "home.models": "📊 Models", "home.collapse": "💥 Collapse Lab",
            "home.waves": "🌊 Waves", "home.designer": "✏️ Designer",
            "home.history": "📜 History", "home.report": "📋 Report",
            "home.compare": "⚖️ Compare",

            /* ── Table headers ── */
            "th.num": "#", "th.model": "Model", "th.magnitude": "Magnitude",
            "th.pgaG": "PGA (g)", "th.stories": "Stories", "th.damage": "Damage",
            "th.rating": "Rating",

            /* ── Select options ── */
            "opt.rc": "RC", "opt.steel": "Steel",
            "opt.rcFrame": "RC Frame", "opt.steelFrame": "Steel Frame",
            "opt.timberEco": "Timber Eco", "opt.baseIsolated": "Base Isolated",
            "opt.hybridDamper": "Hybrid Damper",
            "opt.rectangular": "Rectangular", "opt.lShape": "L-Shape",
            "opt.uShape": "U-Shape", "opt.tower": "Tower (1:3+ ratio)",
            "opt.reinforcedConcrete": "Reinforced Concrete",
            "opt.timber": "Timber", "opt.masonry": "Masonry",
            "opt.composite": "Composite (Steel+RC)",
            "opt.shallow": "Shallow (Spread/Mat)", "opt.deep": "Deep (Pile)",
            "opt.isolated": "Base Isolated", "opt.damped": "Damped Foundation",
            "opt.momentFrame": "Moment Frame", "opt.shearWall": "Shear Wall",
            "opt.bracedFrame": "Braced Frame", "opt.dual": "Dual System",
            "opt.ibc": "IBC 2021", "opt.eurocode": "Eurocode 8",
            "opt.nscp": "NSCP 2015", "opt.noCode": "No Code (Pre-code)",
            "opt.siteC": "C", "opt.siteD": "D", "opt.siteE": "E"
        },
        "zh-TW": {
            "nav.home": "首頁", "nav.terrain": "地形", "nav.building": "建築風險",
            "nav.models": "結構模型", "nav.collapse": "倒塌實驗室", "nav.waves": "地震波",
            "nav.designer": "建築設計", "nav.history": "歷史紀錄", "nav.report": "結構報告",
            "nav.compare": "比較模式", "nav.instructions": "使用說明", "nav.menu": "選單",
            "manual.title": "使用手冊",

            "home.title": "SeismoSafe 地震模擬平台",
            "home.desc": "互動式抗震設計教育平台",
            "home.sub": "地形上傳、簡易建築模型、SAP2000 匯出及風險評分。",
            "terrain.title": "我們的永續抗震設計",
            "terrain.sub": "團隊設計的抗震結構 — 永續、尊重當地文化，採用低碳足跡材料建造。",
            "terrain.sustainable": "永續設計",
            "terrain.sustainableDesc": "我們的設計優先考量環境永續性 — 減少廢棄物、優化能源效能，並整合被動式抗震策略。",
            "terrain.culture": "尊重當地文化",
            "terrain.cultureDesc": "靈感來自西藏和喜馬拉雅傳統建築 — 尊重傳統建築形式、空間佈局和社區中心設計，同時符合現代抗震規範。",
            "terrain.lowCarbon": "低碳足跡",
            "terrain.lowCarbonDesc": "採用當地夾土、交叉層壓材和回收鋼材建造 — 與傳統鋼筋混凝土相比，隱含碳排放降低達 60%。",
            "building.title": "建築與風險",
            "building.sub": "設定結構參數和場址資料；執行快速風險檢查或匯出 SAP2000。",
            "models.title": "模型比較",
            "models.sub": "選擇建築模型，查看 3D 形態，檢視性能指標，並調整變數進行即時地震模擬。",
            "collapse.title": "倒塌模擬",
            "collapse.sub": "觀看細胞碎裂建築在地震力 (M ≥ 8.0) 下逐步倒塌的過程。",
            "waves.title": "地震波視覺化",
            "waves.sub": "即時觀看 P 波、S 波和表面波的傳播，可調整參數。",
            "designer.title": "建築設計器",
            "designer.sub": "自訂建築參數、材料和基礎類型；然後在倒塌實驗室中測試您的設計。",
            "history.title": "地震歷史",
            "history.sub": "瀏覽重大歷史地震，包含震級、位置、傷亡和震央地圖標記。",
            "report.title": "結構報告",
            "report.sub": "根據最新模擬結果生成綜合損害評估報告。",
            "compare.title": "並排比較",
            "compare.sub": "使用不同參數同時運行兩個模擬並比較結果。",
            "instructions.title": "使用說明",
            "instructions.sub": "按照快速指南，在一分鐘內從地形到風險評估。",

            /* ── 按鈕 ── */
            "btn.upload": "上傳並計算坡度因子",
            "btn.riskScore": "計算風險分數",
            "btn.exportSap": "匯出 SAP2000 .s2k",
            "btn.runSim": "▶ 執行模擬",
            "btn.reset": "↺ 重設",
            "btn.run": "▶ 執行",
            "btn.replay": "⏪ 重播",
            "btn.startWaves": "▶ 啟動波形",
            "btn.assessDesign": "📐 評估設計",
            "btn.sendCollapse": "📤 傳至倒塌實驗室",
            "btn.filter": "篩選",
            "btn.genReport": "📋 生成報告",
            "btn.print": "🖨️ 列印 / PDF",
            "btn.runBoth": "▶ 同時執行",

            /* ── 區段標籤 ── */
            "pill.step1": "步驟 1", "pill.step2": "步驟 2", "pill.step3": "步驟 3",
            "pill.compare": "比較", "pill.lab": "實驗室", "pill.waves": "波形",
            "pill.design": "設計", "pill.history": "歷史", "pill.report": "報告",
            "pill.livePreview": "即時預覽", "pill.analysis": "分析",
            "pill.5models": "5 種模型", "pill.interactive": "互動式",
            "pill.customBuild": "自訂建造", "pill.database": "資料庫",
            "pill.export": "匯出", "pill.dualSim": "雙重模擬", "pill.cheatSheet": "速查表",

            /* ── 地形分頁 ── */
            "terrain.upload": "上傳",
            "terrain.factor": "地形因子",
            "terrain.demTitle": "DEM / 地形檔案",
            "terrain.demDesc": "拖放 GeoTIFF/DEM 檔案（.tif/.tiff），自動計算坡度因子。",
            "terrain.dropText": "將 GeoTIFF 拖放至此",
            "terrain.dropHint": "或點擊瀏覽（僅限 .tif / .tiff）",
            "terrain.slopeHint": "坡度提示（度）",
            "terrain.3dMassing": "3D 量體",
            "terrain.boxOnSlope": "斜坡上的建築",
            "terrain.howTo": "操作說明",
            "terrain.workflow": "地形工作流程",
            "terrain.readout": "讀數",
            "terrain.backend": "後端回應",
            "terrain.gentle": "平緩 = 0–10°",
            "terrain.medium": "中等 = 10–20°",
            "terrain.steep": "陡峭 > 20°",

            /* ── 建築分頁 ── */
            "bldg.massing": "量體", "bldg.geometry": "幾何",
            "bldg.name": "名稱", "bldg.stories": "樓層數", "bldg.storyH": "層高（m）",
            "bldg.bayW": "跨寬（m）", "bldg.bayD": "跨深（m）",
            "bldg.material": "材料", "bldg.importance": "重要性係數",
            "bldg.site": "場址", "bldg.hazard": "危害輸入",
            "bldg.siteClass": "場址類別", "bldg.slope": "坡度（度）",
            "bldg.pga": "PGA（g）", "bldg.zone": "地震帶",
            "bldg.actions": "操作", "bldg.compute": "計算 / 匯出",
            "bldg.riskOutput": "風險輸出",

            /* ── 模型分頁 ── */
            "mod.3dSim": "3D 模擬", "mod.perfRadar": "性能雷達",
            "mod.metrics": "指標概覽", "mod.simControls": "模擬控制",
            "mod.adjustVars": "即時調整變數",
            "mod.magnitude": "🌊 地震規模", "mod.peakAccel": "📈 峰值地表加速度",
            "mod.soilAmp": "🏔️ 土壤放大倍率", "mod.stories": "🏢 樓層數",
            "mod.duration": "⏱️ 持續時間", "mod.damping": "🔧 阻尼比",
            "mod.estDamage": "預估損壞：",
            "mod.strength": "⚡ 強度", "mod.eco": "🌱 環保",
            "mod.quakeRes": "🛡️ 抗震性", "mod.costEff": "💰 成本效益",
            "mod.durability": "🔧 耐久性",
            "mod.recentSim": "📋 近期模擬", "mod.mockHistory": "模擬紀錄",
            "mod.seismograph": "📈 地震儀", "mod.liveAccel": "即時地表加速度",
            "mod.drift": "📐 層間位移", "mod.perFloor": "各樓層位移",
            "mod.quickCompare": "📊 快速比較", "mod.atGlance": "5 種模型一覽",

            /* ── 倒塌分頁 ── */
            "col.magnitude": "規模", "col.duration": "持續時間",
            "col.crackHeight": "裂縫高度",
            "col.stats": "📊 倒塌統計", "col.timeline": "📈 震動時間軸",
            "col.totalPieces": "總碎片數", "col.detached": "脫落",
            "col.grounded": "落地", "col.peakVel": "峰值速度",
            "col.energy": "能量（kJ）", "col.crackPct": "裂縫高度",
            "col.state": "狀態：",

            /* ── 波形分頁 ── */
            "wav.propView": "傳播檢視",
            "wav.waveInfo": "波形資訊",
            "wav.magnitude": "規模", "wav.depth": "深度（km）",
            "wav.distance": "距離（km）", "wav.soilType": "土壤類型",
            "wav.controls": "控制面板", "wav.arrivals": "到達時間",
            "wav.pWave": "P 波（秒）", "wav.sWave": "S 波（秒）",
            "wav.surface": "表面波（秒）", "wav.spLag": "S-P 時差（秒）",
            "wav.peakAccel": "峰值加速度", "wav.mmiIntensity": "MMI 烈度",
            "wav.rock": "岩石", "wav.stiffSoil": "硬質土壤", "wav.softSoil": "軟質土壤",

            /* ── 設計分頁 ── */
            "des.structure": "結構", "des.geometry": "幾何",
            "des.bldgName": "建築名稱", "des.floors": "樓層數",
            "des.floorH": "層高（m）", "des.width": "寬度（m）", "des.depth": "深度（m）",
            "des.shape": "形狀", "des.matFound": "材料與基礎",
            "des.structSys": "結構系統",
            "des.primaryMat": "主要材料", "des.foundType": "基礎類型",
            "des.lateralSys": "側力系統", "des.seismicCode": "抗震設計規範",
            "des.3dPreview": "3D 預覽", "des.seismicReady": "抗震準備度",
            "des.quickAssess": "快速評估",
            "des.floorArea": "樓板面積（m²）", "des.totalH": "總高度（m）",
            "des.weight": "預估重量（t）", "des.period": "基本週期（s）",
            "des.irregularity": "不規則性", "des.softStory": "軟弱層風險",
            "des.overturn": "傾覆力矩", "des.foundMatch": "基礎匹配",
            "des.codeComply": "規範合規",

            /* ── 歷史分頁 ── */
            "hist.filter": "篩選",
            "hist.minMag": "最低震級", "hist.region": "區域", "hist.yearRange": "年份範圍",
            "hist.allRegions": "所有區域", "hist.himalayan": "喜馬拉雅（西藏/四川/尼泊爾）",
            "hist.pacific": "環太平洋火環帶", "hist.mediterranean": "地中海",
            "hist.asiaOther": "亞洲（其他）", "hist.americas": "美洲",
            "hist.allTime": "所有年份",
            "hist.epicenter": "震央地圖", "hist.eventTable": "事件列表",
            "hist.statistics": "統計",
            "hist.year": "年份", "hist.location": "位置", "hist.magnitude": "震級",
            "hist.depthKm": "深度（km）", "hist.casualties": "傷亡",
            "hist.mmi": "MMI", "hist.tsunami": "海嘯",
            "hist.totalEvents": "事件總數", "hist.avgMag": "平均震級",
            "hist.maxMag": "最大震級", "hist.totalCasualties": "總傷亡",
            "hist.tsunamis": "海嘯次數", "hist.deadliest": "最致命事件",

            /* ── 報告分頁 ── */
            "rpt.dataSource": "資料來源",
            "rpt.collapseData": "倒塌實驗室（最近一次）",
            "rpt.modelsData": "模型分頁（最近模擬）",
            "rpt.designerData": "建築設計器（評估）",

            /* ── 比較分頁 ── */
            "cmp.simA": "模擬 A", "cmp.simB": "模擬 B",
            "cmp.model": "模型", "cmp.magnitude": "規模",
            "cmp.stories": "樓層數", "cmp.pga": "PGA（g）", "cmp.damping": "阻尼",
            "cmp.damage": "損壞：", "cmp.peakDrift": "峰值位移：",
            "cmp.maxAccel": "最大加速度：", "cmp.summary": "比較摘要",

            /* ── 說明分頁 ── */
            "ins.flow": "流程", "ins.endToEnd": "端到端",
            "ins.runLocally": "本機執行", "ins.dev": "開發",
            "ins.outputs": "輸出", "ins.whatYouGet": "結果說明",
            "ins.callout": "提示：坡度同時影響地形因子和風險分數——請在各分頁間保持一致。",
            "ins.staticPreview": "您也可以直接開啟 index.html 進行快速靜態預覽。",
            "ins.flowSteps": "<li><strong>地形 + 3D</strong> — 上傳 DEM / DXF，設定坡度提示，查看即時量體卡片。</li><li><strong>建築</strong> — 設定樓層數、跨距、材料、重要性；保持坡度一致。</li><li><strong>分析</strong> — 點擊「計算風險分數」或匯出 SAP2000 <code>.s2k</code>。</li>",
            "ins.devSteps": "<li><strong>後端：</strong> <code>uvicorn app.main:app --reload --port 8000</code>（從 <code>backend</code> 目錄）。</li><li><strong>前端：</strong> <code>python -m http.server 5173</code>（從 <code>frontend</code> 目錄），然後開啟 <code>http://localhost:5173/</code>。</li>",
            "ins.outputList": "<li>上傳端點回傳的地形坡度因子。</li><li>當前量體 + 場址的風險 JSON。</li><li>SAP2000 起始檔案（<code>.s2k</code>）供概念匯出。</li>",

            /* ── 地形額外 ── */
            "terrain.derivedSlope": "衍生坡度：",
            "terrain.groundPlane": "地面（坡度）",
            "terrain.buildingMass": "建築量體",
            "terrain.microcopy": "使用「建築」分頁調整跨距、樓層和層高——預覽即時更新。",
            "terrain.steps": "<li><strong>拖放</strong>您的 DEM 或測試檔案並點擊<em>上傳</em>。</li><li><strong>調整</strong>坡度提示（若場址坡度較大）。</li><li><strong>跳至</strong>「建築」分頁設定樓層/跨距——3D 在此分頁即時更新。</li><li><strong>查看</strong>下方讀數了解坡度因子 + 中繼資料。</li>",
            "terrain.callout": "提示：保持坡度真實；風險分數直接使用此數值。",

            /* ── 建築額外 ── */
            "bldg.callout": "使用與地形相同的坡度——請保持同步。",
            "bldg.microcopy": "風險/匯出同時使用量體和場址輸入。",

            /* ── 模型額外 ── */
            "mod.rcFrame": "鋼筋混凝土構架", "mod.steelFrame": "鋼構架",
            "mod.timberEco": "木構（環保）", "mod.baseIsolated": "隔震結構",
            "mod.hybridDamper": "混合阻尼器",
            "mod.popular": "熱門", "mod.strong": "強健", "mod.green": "綠色",
            "mod.safe": "安全", "mod.advanced": "進階",
            "mod.material": "材料", "mod.co2": "CO₂ / m²",
            "mod.costM2": "造價 / m²", "mod.maxStories": "最大樓層數",
            "mod.typicalUse": "典型用途",
            "mod.clickToBegin": "點擊模型分頁開始",
            "mod.structure": "結構", "mod.groundMotion": "地表運動",
            "mod.readySim": "就緒——調整滑桿進行模擬",

            /* ── 倒塌額外 ── */
            "col.ready": "就緒", "col.loading": "載入模型中…",
            "col.magThreshold": "規模門檻：8.0",
            "col.damage": "損壞",

            /* ── 波形額外 ── */
            "wav.pWaveLegend": "P 波（縱波）",
            "wav.sWaveLegend": "S 波（橫波）",
            "wav.surfaceLegend": "表面波",
            "wav.pWaveTitle": "P 波", "wav.sWaveTitle": "S 波",
            "wav.surfaceTitle": "表面波",
            "wav.pWaveDesc": "壓縮波（縱波）。速度最快，最先到達。可穿越固體與液體。速度：5–8 km/s。",
            "wav.sWaveDesc": "剪切波（橫波）。比 P 波慢。僅穿越固體。速度：3–5 km/s。造成更大損害。",
            "wav.surfaceDesc": "瑞利波與洛夫波。速度最慢但破壞力最大。沿地表傳播。速度：2–4 km/s。",
            "wav.amplitude": "振幅",

            /* ── 設計額外 ── */
            "des.regular": "規則", "des.low": "低",
            "des.ok": "正常", "des.good": "良好", "des.compliant": "合規",

            /* ── 首頁連結 ── */
            "home.terrain": "🏔️ 地形", "home.building": "🏗️ 建築",
            "home.models": "📊 模型", "home.collapse": "💥 倒塌實驗室",
            "home.waves": "🌊 地震波", "home.designer": "✏️ 設計",
            "home.history": "📜 歷史", "home.report": "📋 報告",
            "home.compare": "⚖️ 比較",

            /* ── 表格標題 ── */
            "th.num": "#", "th.model": "模型", "th.magnitude": "震級",
            "th.pgaG": "PGA（g）", "th.stories": "樓層數", "th.damage": "損壞",
            "th.rating": "評級",

            /* ── 選項 ── */
            "opt.rc": "鋼筋混凝土", "opt.steel": "鋼構",
            "opt.rcFrame": "鋼筋混凝土構架", "opt.steelFrame": "鋼構架",
            "opt.timberEco": "木構（環保）", "opt.baseIsolated": "隔震結構",
            "opt.hybridDamper": "混合阻尼",
            "opt.rectangular": "矩形", "opt.lShape": "L 形",
            "opt.uShape": "U 形", "opt.tower": "塔形（1:3+ 比）",
            "opt.reinforcedConcrete": "鋼筋混凝土",
            "opt.timber": "木構", "opt.masonry": "砌體",
            "opt.composite": "複合（鋼+RC）",
            "opt.shallow": "淺基礎（擴展/筏式）", "opt.deep": "深基礎（樁基）",
            "opt.isolated": "隔震基礎", "opt.damped": "阻尼基礎",
            "opt.momentFrame": "彎矩構架", "opt.shearWall": "剪力牆",
            "opt.bracedFrame": "支撐構架", "opt.dual": "雙系統",
            "opt.ibc": "IBC 2021", "opt.eurocode": "歐洲規範 8",
            "opt.nscp": "NSCP 2015", "opt.noCode": "無規範（規範前）",
            "opt.siteC": "C", "opt.siteD": "D", "opt.siteE": "E"
        },
        "zh-CN": {
            "nav.home": "首页", "nav.terrain": "地形", "nav.building": "建筑风险",
            "nav.models": "结构模型", "nav.collapse": "倒塌实验室", "nav.waves": "地震波",
            "nav.designer": "建筑设计", "nav.history": "历史记录", "nav.report": "结构报告",
            "nav.compare": "比较模式", "nav.instructions": "使用说明", "nav.menu": "菜单",
            "manual.title": "使用手册",

            "home.title": "SeismoSafe 地震模拟平台",
            "home.desc": "互动式抗震设计教育平台",
            "home.sub": "地形上传、简易建筑模型、SAP2000 导出及风险评分。",
            "terrain.title": "我们的可持续抗震设计",
            "terrain.sub": "团队设计的抗震结构 — 可持续、尊重当地文化，采用低碳足迹材料建造。",
            "terrain.sustainable": "可持续设计",
            "terrain.sustainableDesc": "我们的设计优先考虑环境可持续性 — 减少废弃物、优化能源效能，并整合被动式抗震策略。",
            "terrain.culture": "尊重当地文化",
            "terrain.cultureDesc": "灵感来自西藏和喜马拉雅传统建筑 — 尊重传统建筑形式、空间布局和社区中心设计，同时符合现代抗震规范。",
            "terrain.lowCarbon": "低碳足迹",
            "terrain.lowCarbonDesc": "采用当地夹土、交叉层压材和回收钢材建造 — 与传统钢筋混凝土相比，隐含碳排放降低达 60%。",
            "building.title": "建筑与风险",
            "building.sub": "设定结构参数和场址资料；执行快速风险检查或导出 SAP2000。",
            "models.title": "模型比较",
            "models.sub": "选择建筑模型，查看 3D 形态，检视性能指标，并调整变量进行实时地震模拟。",
            "collapse.title": "倒塌模拟",
            "collapse.sub": "观看细胞碎裂建筑在地震力 (M ≥ 8.0) 下逐步倒塌的过程。",
            "waves.title": "地震波可视化",
            "waves.sub": "实时观看 P 波、S 波和表面波的传播，可调整参数。",
            "designer.title": "建筑设计器",
            "designer.sub": "自定建筑参数、材料和基础类型；然后在倒塌实验室中测试您的设计。",
            "history.title": "地震历史",
            "history.sub": "浏览重大历史地震，包含震级、位置、伤亡和震中地图标记。",
            "report.title": "结构报告",
            "report.sub": "根据最新模拟结果生成综合损害评估报告。",
            "compare.title": "并排比较",
            "compare.sub": "使用不同参数同时运行两个模拟并比较结果。",
            "instructions.title": "使用说明",
            "instructions.sub": "按照快速指南，在一分钟内从地形到风险评估。",

            /* ── 按钮 ── */
            "btn.upload": "上传并计算坡度因子",
            "btn.riskScore": "计算风险分数",
            "btn.exportSap": "导出 SAP2000 .s2k",
            "btn.runSim": "▶ 执行模拟",
            "btn.reset": "↺ 重置",
            "btn.run": "▶ 执行",
            "btn.replay": "⏪ 重播",
            "btn.startWaves": "▶ 启动波形",
            "btn.assessDesign": "📐 评估设计",
            "btn.sendCollapse": "📤 发送至倒塌实验室",
            "btn.filter": "筛选",
            "btn.genReport": "📋 生成报告",
            "btn.print": "🖨️ 打印 / PDF",
            "btn.runBoth": "▶ 同时执行",

            /* ── 区段标签 ── */
            "pill.step1": "步骤 1", "pill.step2": "步骤 2", "pill.step3": "步骤 3",
            "pill.compare": "比较", "pill.lab": "实验室", "pill.waves": "波形",
            "pill.design": "设计", "pill.history": "历史", "pill.report": "报告",
            "pill.livePreview": "实时预览", "pill.analysis": "分析",
            "pill.5models": "5 种模型", "pill.interactive": "交互式",
            "pill.customBuild": "自定建造", "pill.database": "数据库",
            "pill.export": "导出", "pill.dualSim": "双重模拟", "pill.cheatSheet": "速查表",

            /* ── 地形页签 ── */
            "terrain.upload": "上传",
            "terrain.factor": "地形因子",
            "terrain.demTitle": "DEM / 地形文件",
            "terrain.demDesc": "拖放 GeoTIFF/DEM 文件（.tif/.tiff），自动计算坡度因子。",
            "terrain.dropText": "将 GeoTIFF 拖放至此",
            "terrain.dropHint": "或点击浏览（仅限 .tif / .tiff）",
            "terrain.slopeHint": "坡度提示（度）",
            "terrain.3dMassing": "3D 体量",
            "terrain.boxOnSlope": "斜坡上的建筑",
            "terrain.howTo": "操作说明",
            "terrain.workflow": "地形工作流程",
            "terrain.readout": "读数",
            "terrain.backend": "后端响应",
            "terrain.gentle": "平缓 = 0–10°",
            "terrain.medium": "中等 = 10–20°",
            "terrain.steep": "陡峭 > 20°",

            /* ── 建筑页签 ── */
            "bldg.massing": "体量", "bldg.geometry": "几何",
            "bldg.name": "名称", "bldg.stories": "楼层数", "bldg.storyH": "层高（m）",
            "bldg.bayW": "跨宽（m）", "bldg.bayD": "跨深（m）",
            "bldg.material": "材料", "bldg.importance": "重要性系数",
            "bldg.site": "场址", "bldg.hazard": "危害输入",
            "bldg.siteClass": "场址类别", "bldg.slope": "坡度（度）",
            "bldg.pga": "PGA（g）", "bldg.zone": "地震带",
            "bldg.actions": "操作", "bldg.compute": "计算 / 导出",
            "bldg.riskOutput": "风险输出",

            /* ── 模型页签 ── */
            "mod.3dSim": "3D 模拟", "mod.perfRadar": "性能雷达",
            "mod.metrics": "指标概览", "mod.simControls": "模拟控制",
            "mod.adjustVars": "实时调整变量",
            "mod.magnitude": "🌊 地震震级", "mod.peakAccel": "📈 峰值地表加速度",
            "mod.soilAmp": "🏔️ 土壤放大倍率", "mod.stories": "🏢 楼层数",
            "mod.duration": "⏱️ 持续时间", "mod.damping": "🔧 阻尼比",
            "mod.estDamage": "预估损坏：",
            "mod.strength": "⚡ 强度", "mod.eco": "🌱 环保",
            "mod.quakeRes": "🛡️ 抗震性", "mod.costEff": "💰 成本效益",
            "mod.durability": "🔧 耐久性",
            "mod.recentSim": "📋 近期模拟", "mod.mockHistory": "模拟记录",
            "mod.seismograph": "📈 地震仪", "mod.liveAccel": "实时地表加速度",
            "mod.drift": "📐 层间位移", "mod.perFloor": "各楼层位移",
            "mod.quickCompare": "📊 快速比较", "mod.atGlance": "5 种模型一览",

            /* ── 倒塌页签 ── */
            "col.magnitude": "震级", "col.duration": "持续时间",
            "col.crackHeight": "裂缝高度",
            "col.stats": "📊 倒塌统计", "col.timeline": "📈 震动时间轴",
            "col.totalPieces": "总碎片数", "col.detached": "脱落",
            "col.grounded": "落地", "col.peakVel": "峰值速度",
            "col.energy": "能量（kJ）", "col.crackPct": "裂缝高度",
            "col.state": "状态：",

            /* ── 波形页签 ── */
            "wav.propView": "传播视图",
            "wav.waveInfo": "波形信息",
            "wav.magnitude": "震级", "wav.depth": "深度（km）",
            "wav.distance": "距离（km）", "wav.soilType": "土壤类型",
            "wav.controls": "控制面板", "wav.arrivals": "到达时间",
            "wav.pWave": "P 波（秒）", "wav.sWave": "S 波（秒）",
            "wav.surface": "表面波（秒）", "wav.spLag": "S-P 时差（秒）",
            "wav.peakAccel": "峰值加速度", "wav.mmiIntensity": "MMI 烈度",
            "wav.rock": "岩石", "wav.stiffSoil": "硬质土壤", "wav.softSoil": "软质土壤",

            /* ── 设计页签 ── */
            "des.structure": "结构", "des.geometry": "几何",
            "des.bldgName": "建筑名称", "des.floors": "楼层数",
            "des.floorH": "层高（m）", "des.width": "宽度（m）", "des.depth": "深度（m）",
            "des.shape": "形状", "des.matFound": "材料与基础",
            "des.structSys": "结构系统",
            "des.primaryMat": "主要材料", "des.foundType": "基础类型",
            "des.lateralSys": "侧力系统", "des.seismicCode": "抗震设计规范",
            "des.3dPreview": "3D 预览", "des.seismicReady": "抗震准备度",
            "des.quickAssess": "快速评估",
            "des.floorArea": "楼板面积（m²）", "des.totalH": "总高度（m）",
            "des.weight": "预估重量（t）", "des.period": "基本周期（s）",
            "des.irregularity": "不规则性", "des.softStory": "软弱层风险",
            "des.overturn": "倾覆力矩", "des.foundMatch": "基础匹配",
            "des.codeComply": "规范合规",

            /* ── 历史页签 ── */
            "hist.filter": "筛选",
            "hist.minMag": "最低震级", "hist.region": "区域", "hist.yearRange": "年份范围",
            "hist.allRegions": "所有区域", "hist.himalayan": "喜马拉雅（西藏/四川/尼泊尔）",
            "hist.pacific": "环太平洋火环带", "hist.mediterranean": "地中海",
            "hist.asiaOther": "亚洲（其他）", "hist.americas": "美洲",
            "hist.allTime": "所有年份",
            "hist.epicenter": "震中地图", "hist.eventTable": "事件列表",
            "hist.statistics": "统计",
            "hist.year": "年份", "hist.location": "位置", "hist.magnitude": "震级",
            "hist.depthKm": "深度（km）", "hist.casualties": "伤亡",
            "hist.mmi": "MMI", "hist.tsunami": "海啸",
            "hist.totalEvents": "事件总数", "hist.avgMag": "平均震级",
            "hist.maxMag": "最大震级", "hist.totalCasualties": "总伤亡",
            "hist.tsunamis": "海啸次数", "hist.deadliest": "最致命事件",

            /* ── 报告页签 ── */
            "rpt.dataSource": "数据来源",
            "rpt.collapseData": "倒塌实验室（最近一次）",
            "rpt.modelsData": "模型页签（最近模拟）",
            "rpt.designerData": "建筑设计器（评估）",

            /* ── 比较页签 ── */
            "cmp.simA": "模拟 A", "cmp.simB": "模拟 B",
            "cmp.model": "模型", "cmp.magnitude": "震级",
            "cmp.stories": "楼层数", "cmp.pga": "PGA（g）", "cmp.damping": "阻尼",
            "cmp.damage": "损坏：", "cmp.peakDrift": "峰值位移：",
            "cmp.maxAccel": "最大加速度：", "cmp.summary": "比较摘要",

            /* ── 说明页签 ── */
            "ins.flow": "流程", "ins.endToEnd": "端到端",
            "ins.runLocally": "本机运行", "ins.dev": "开发",
            "ins.outputs": "输出", "ins.whatYouGet": "结果说明",

            /* ── 首页链接 ── */
            "home.terrain": "🏔️ 地形", "home.building": "🏗️ 建筑",
            "home.models": "📊 模型", "home.collapse": "💥 倒塌实验室",
            "home.waves": "🌊 地震波", "home.designer": "✏️ 设计",
            "home.history": "📜 历史", "home.report": "📋 报告",
            "home.compare": "⚖️ 比较",

            /* ── 表格标题 ── */
            "th.num": "#", "th.model": "模型", "th.magnitude": "震级",
            "th.pgaG": "PGA（g）", "th.stories": "楼层数", "th.damage": "损坏",
            "th.rating": "评级",

            /* ── 选项 ── */
            "opt.rc": "钢筋混凝土", "opt.steel": "钢结构",
            "opt.rcFrame": "钢筋混凝土框架", "opt.steelFrame": "钢框架",
            "opt.timberEco": "木结构（环保）", "opt.baseIsolated": "隔震结构",
            "opt.hybridDamper": "混合阻尼",
            "opt.rectangular": "矩形", "opt.lShape": "L 形",
            "opt.uShape": "U 形", "opt.tower": "塔形（1:3+ 比）",
            "opt.reinforcedConcrete": "钢筋混凝土",
            "opt.timber": "木结构", "opt.masonry": "砌体",
            "opt.composite": "组合（钢+RC）",
            "opt.shallow": "浅基础（扩展/筏式）", "opt.deep": "深基础（桩基）",
            "opt.isolated": "隔震基础", "opt.damped": "阻尼基础",
            "opt.momentFrame": "弯矩框架", "opt.shearWall": "剪力墙",
            "opt.bracedFrame": "支撑框架", "opt.dual": "双系统",
            "opt.ibc": "IBC 2021", "opt.eurocode": "欧洲规范 8",
            "opt.nscp": "NSCP 2015", "opt.noCode": "无规范（规范前）",
            "opt.siteC": "C", "opt.siteD": "D", "opt.siteE": "E"
        }
    };

    var currentLang = "en";

    /* ── Translation function ── */
    function t(key) {
        var dict = LANG[currentLang] || LANG.en;
        return dict[key] || (LANG.en[key] || key);
    }

    function applyTranslations() {
        var els = document.querySelectorAll("[data-i18n]");
        for (var i = 0; i < els.length; i++) {
            var key = els[i].getAttribute("data-i18n");
            els[i].textContent = t(key);
        }

        /* data-i18n-html: set innerHTML instead of textContent */
        var htmlEls = document.querySelectorAll("[data-i18n-html]");
        for (var h = 0; h < htmlEls.length; h++) {
            var hk = htmlEls[h].getAttribute("data-i18n-html");
            var hv = t(hk);
            if (hv !== hk) htmlEls[h].innerHTML = hv;
        }

        /* Also translate section headers that have data-i18n-title / data-i18n-sub */
        var titles = document.querySelectorAll("[data-i18n-title]");
        for (var j = 0; j < titles.length; j++) {
            var tk = titles[j].getAttribute("data-i18n-title");
            var val = t(tk);
            titles[j].textContent = val;
        }
        var subs = document.querySelectorAll("[data-i18n-sub]");
        for (var k = 0; k < subs.length; k++) {
            var sk = subs[k].getAttribute("data-i18n-sub");
            var sv = t(sk);
            subs[k].textContent = sv;
        }

        /* Show/hide language-specific content blocks (class="lang-en", "lang-zh-TW", "lang-zh-CN") */
        var langBlocks = document.querySelectorAll(".lang-en, .lang-zh-TW, .lang-zh-CN");
        for (var lb = 0; lb < langBlocks.length; lb++) {
            var el = langBlocks[lb];
            var isMatch = el.classList.contains("lang-" + currentLang);
            el.style.display = isMatch ? "" : "none";
        }
    }

    function setLang(lang) {
        if (!LANG[lang]) return;
        currentLang = lang;
        applyTranslations();

        /* Update active button */
        var btns = document.querySelectorAll(".lang-btn");
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle("active", btns[i].getAttribute("data-lang") === lang);
        }
        try { localStorage.setItem("seismo-lang", lang); } catch (e) { /* ignore */ }
    }

    /* ── Collapsible nav ── */
    function initCollapsibleNav() {
        var btn = document.getElementById("nav-collapse-btn");
        var dropdown = document.getElementById("nav-dropdown");
        var navTop = document.getElementById("primary-nav");
        if (!btn || !dropdown || !navTop) return;

        /* Clone nav links into dropdown */
        var links = navTop.querySelectorAll(".nav-link");
        dropdown.innerHTML = "";
        for (var i = 0; i < links.length; i++) {
            var clone = links[i].cloneNode(true);
            clone.addEventListener("click", function (e) {
                e.preventDefault();
                dropdown.classList.remove("open");
                var target = this.getAttribute("data-tab-target");
                if (target && window.activateTab) {
                    window.activateTab(target);
                    var el = document.getElementById(target);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
            dropdown.appendChild(clone);
        }

        /* Check if too many tabs — auto-collapse when > 8 visible */
        function checkCollapse() {
            var w = window.innerWidth;
            if (links.length > 8 || w < 1100) {
                document.body.classList.add("nav-collapsed");
            } else {
                document.body.classList.remove("nav-collapsed");
                dropdown.classList.remove("open");
            }
        }

        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            dropdown.classList.toggle("open");
        });

        document.addEventListener("click", function (e) {
            if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.classList.remove("open");
            }
        });

        checkCollapse();
        window.addEventListener("resize", checkCollapse);
    }

    /* ── Language switcher ── */
    function initLangSwitcher() {
        var btns = document.querySelectorAll(".lang-btn");
        for (var i = 0; i < btns.length; i++) {
            btns[i].addEventListener("click", function () {
                setLang(this.getAttribute("data-lang"));
            });
        }

        /* Restore saved language */
        try {
            var saved = localStorage.getItem("seismo-lang");
            if (saved && LANG[saved]) setLang(saved);
        } catch (e) { /* ignore */ }
    }

    /* ── Initialize ── */
    window.addEventListener("load", function () {
        initCollapsibleNav();
        initLangSwitcher();
    });

    /* Expose for external use */
    window.setAppLang = setLang;
    window.getAppLang = function () { return currentLang; };
})();
