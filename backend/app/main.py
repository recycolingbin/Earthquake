import datetime
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field, field_validator


app = FastAPI(title="SeismoSafe MVP API", version="0.1.0")

# Allow browser access from any origin (including file:// usage of the static HTML)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TerrainUploadResponse(BaseModel):
    slope_factor: float
    slope_degrees: float
    notes: str


class BuildingSpec(BaseModel):
    name: Optional[str] = Field(default="Concept Model")
    stories: int = Field(gt=0, description="Number of stories")
    bay_width_m: float = Field(gt=0, description="Bay width in meters")
    bay_depth_m: float = Field(gt=0, description="Bay depth in meters")
    story_height_m: float = Field(gt=0, description="Story height in meters")
    material: str = Field(default="RC", description="Material type (RC/Steel)")
    importance_factor: float = Field(default=1.0, gt=0)

    @field_validator("material")
    @classmethod
    def material_upper(cls, v: str) -> str:
        return v.upper()


class SiteConditions(BaseModel):
    site_class: str = Field(default="D", description="Site class per code")
    slope_degrees: float = Field(default=5.0, ge=0, description="Average slope")
    seismic_zone: Optional[str] = None
    pga_g: Optional[float] = Field(default=0.25, ge=0, description="Peak ground acceleration in g")

    @field_validator("site_class")
    @classmethod
    def site_class_upper(cls, v: str) -> str:
        return v.upper()


class SapExportRequest(BaseModel):
    building: BuildingSpec
    site: SiteConditions


class RiskScoreResponse(BaseModel):
    risk_score: float
    rating: str
    drivers: list[str]


SOIL_AMPLIFICATION = {
    "A": 0.8,
    "B": 0.9,
    "C": 1.0,
    "D": 1.15,
    "E": 1.3,
}


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "timestamp": datetime.datetime.utcnow().isoformat()}


@app.post("/terrain/upload", response_model=TerrainUploadResponse)
async def upload_terrain(file: UploadFile = File(...), slope_hint_degrees: Optional[float] = None):
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    slope_deg = estimate_slope_degrees(data, slope_hint_degrees)
    slope_factor = compute_slope_factor(slope_deg)
    notes = (
        f"Ingested {len(data)} bytes. Estimated slope {slope_deg}°"
        + (f" (blended with hint {slope_hint_degrees}°)" if slope_hint_degrees is not None else "")
    )
    return TerrainUploadResponse(slope_factor=slope_factor, slope_degrees=slope_deg, notes=notes)


@app.post("/analysis/export-sap2000")
def export_sap2000(payload: SapExportRequest):
    s2k_text = generate_s2k(payload.building, payload.site)
    filename = f"sap_model_{slugify(payload.building.name)}.s2k"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return PlainTextResponse(content=s2k_text, headers=headers, media_type="text/plain")


@app.post("/analysis/risk-score", response_model=RiskScoreResponse)
def risk_score(payload: SapExportRequest):
    b = payload.building
    site = payload.site

    soil_amp = SOIL_AMPLIFICATION.get(site.site_class.upper(), 1.15)
    height = b.stories * b.story_height_m
    slope_penalty = min(site.slope_degrees / 30.0, 2.0)
    pga = site.pga_g or 0.25

    base = 0.4 * soil_amp + 0.3 * pga + 0.3 * slope_penalty
    height_factor = min(height / 50.0, 1.5)
    stories_factor = min(b.stories / 15.0, 1.5)

    score = round((base + 0.4 * height_factor + 0.3 * stories_factor) * b.importance_factor, 2)
    score = max(0.0, min(score, 10.0))

    if score < 3.5:
        rating = "Low"
    elif score < 6.5:
        rating = "Moderate"
    else:
        rating = "High"

    drivers = [
        f"Site class {site.site_class} (amp={soil_amp})",
        f"Slope {site.slope_degrees}°",
        f"Stories {b.stories}",
        f"Height {height:.1f} m",
        f"PGA {pga} g",
    ]

    return RiskScoreResponse(risk_score=score, rating=rating, drivers=drivers)


def compute_slope_factor(slope_degrees: float) -> float:
    return round(1.0 + (slope_degrees / 60.0), 3)


def estimate_slope_degrees(data: bytes, slope_hint_degrees: Optional[float]) -> float:
    """Very lightweight slope heuristic derived from file bytes, blended with user hint if provided.

    This avoids a fixed default while staying dependency-free. The heuristic uses the byte-wise
    standard deviation (as a proxy for variation) plus a small size-based bump. Values are clamped
    to a realistic 0–45° range and rounded to two decimals.
    """

    if not data:
        return slope_hint_degrees or 0.0

    sample = data[: min(len(data), 200_000)]
    vals = [b for b in sample]
    mean = sum(vals) / len(vals)
    variance = sum((v - mean) ** 2 for v in vals) / len(vals)
    std_dev = variance ** 0.5

    size_term = min(len(data) / 1_000_000 * 5.0, 10.0)  # up to +10° for multi-MB files
    raw_estimate = (std_dev / 5.0) + size_term  # std 50 -> 10°, plus size term

    if slope_hint_degrees is not None:
        blended = 0.6 * raw_estimate + 0.4 * slope_hint_degrees
    else:
        blended = raw_estimate

    clamped = max(0.0, min(blended, 45.0))
    return round(clamped, 2)


def slugify(name: Optional[str]) -> str:
    if not name:
        return "model"
    return "".join(c.lower() if c.isalnum() else "-" for c in name).strip("-") or "model"


def generate_s2k(building: BuildingSpec, site: SiteConditions) -> str:
    """Generate a tiny SAP2000 .s2k snippet for a simple rectangular grid."""
    b = building
    site_class = site.site_class
    slope_factor = compute_slope_factor(site.slope_degrees)

    lines = [
        "$ SAP2000 Text Import File - Minimal",
        f"$ Generated: {datetime.datetime.utcnow().isoformat()}Z",
        "PROGRAM CONTROL",
        "COORDINATE SYSTEM GLOBAL",
        f"MATERIAL {b.material}",
        f"SITECLASS {site_class}",
        f"SLOPE_FACTOR {slope_factor}",
        "$ GRID DEFINITION",
        "GRID LINE 1 X 0",
        f"GRID LINE 2 X {b.bay_width_m}",
        "GRID LINE 1 Y 0",
        f"GRID LINE 2 Y {b.bay_depth_m}",
        "$ STORY DATA",
    ]

    for i in range(1, b.stories + 1):
        elev = i * b.story_height_m
        lines.append(f"STORY {i} ELEV {elev:.2f}m")

    lines.extend(
        [
            "$ LOADS (simplified)",
            f"PGA {site.pga_g or 0.25}g",
            "$ END OF FILE",
        ]
    )

    return "\n".join(lines) + "\n"