from __future__ import annotations
import math
import os
from typing import List, Literal, Optional, Dict, Any, Tuple, Set

import httpx
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from cachetools import TTLCache
import orjson

# -----------------
# Config
# -----------------
OVERPASS_URL = os.getenv("OVERPASS_URL", "https://overpass-api.de/api/interpreter")
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "300")) # 5 minutes
MAX_LISTINGS = 500

# Cache amenities per key: (bbox_key, tuple(sorted(categories))) -> list of amenities
amenities_cache: TTLCache = TTLCache(maxsize=256, ttl=CACHE_TTL_SECONDS)

# -----------------
# Data models
# -----------------
SaleType = Literal["sale", "rent"]

class Listing(BaseModel):
    id: str
    title: str
    address: str
    lat: float
    lng: float
    price: int
    sale_type: SaleType
    beds: int
    baths: int
    sqft: int
    google_maps_link: str = ""

class SearchResponse(BaseModel):
    listings: List[Listing]
    amenities_used: Dict[str, list]

# -----------------
# Utilities
# -----------------

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in meters between two WGS84 points."""
    R = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def expand_bbox_by_radius(bbox: Tuple[float, float, float, float], radius_m: int) -> Tuple[float, float, float, float]:
    west, south, east, north = bbox
    lat_center = (south + north) / 2.0
    # approx deg per meter
    dlat = radius_m / 111_000.0
    dlng = radius_m / (111_000.0 * max(math.cos(math.radians(lat_center)), 0.01))
    return (west - dlng, south - dlat, east + dlng, north + dlat)

# Map UI strings to OSM tags
WORSHIP_RELIGION_MAP = {
    "synagogue": "jewish",
    "church": "christian",
    "mosque": "muslim",
    "hindu_temple": "hindu",
    "buddhist_temple": "buddhist",
}

STORE_TAGS = {
    # UI key -> list of OSM shop values
    "grocery": ["supermarket", "convenience", "greengrocer"],
    "home_improvement": ["doityourself", "hardware"],
    "appliance": ["appliance", "electronics"],
    "farm_supplies": ["agrarian", "farm"]
}

# -----------------
# Load seed listings
# -----------------
_seed_path = os.path.join(os.path.dirname(__file__), "listings_seed.json")
with open(_seed_path, "r", encoding="utf-8") as f:
    LISTINGS: List[Listing] = [Listing(**x) for x in orjson.loads(f.read())]

# -----------------
# FastAPI app
# -----------------
app = FastAPI(title="RealEstate Map API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Overpass helpers
# -----------------

def bbox_key(bbox: Tuple[float, float, float, float]) -> str:
    return ",".join(f"{x:.5f}" for x in bbox)

def build_overpass_query(
    bbox: Tuple[float, float, float, float],
    need_parks: bool,
    worship_types: List[str],
    store_types: List[str]
) -> Tuple[str, List[str]]:
    """Build a single Overpass query that returns centers for all requested categories.
    Returns (query, labels) where labels are the category labels in the same order of blocks added.
    """
    south, west, north, east = bbox[1], bbox[0], bbox[3], bbox[2] # Overpass wants (S,W,N,E)
    blocks = []
    labels = []

    if need_parks:
        block = f"(node[\"leisure\"=\"park\"]({south},{west},{north},{east});way[\"leisure\"=\"park\"]({south},{west},{north},{east});relation[\"leisure\"=\"park\"]({south},{west},{north},{east}););"
        blocks.append(block)
        labels.append("parks")

    if worship_types:
        religions = [WORSHIP_RELIGION_MAP.get(w, w) for w in worship_types]
        regex = "|".join(sorted(set(religions)))
        block = f"(node[\"amenity\"=\"place_of_worship\"][\"religion\"~\"^({regex})$\"]({south},{west},{north},{east});" \
        f"way[\"amenity\"=\"place_of_worship\"][\"religion\"~\"^({regex})$\"]({south},{west},{north},{east});" \
        f"relation[\"amenity\"=\"place_of_worship\"][\"religion\"~\"^({regex})$\"]({south},{west},{north},{east}););"
        blocks.append(block)
        labels.append("worship")

    if store_types:
        shops: Set[str] = set()
        for key in store_types:
            shops.update(STORE_TAGS.get(key, []))
        if shops:
            regex = "|".join(sorted(shops))
            block = f"(node[\"shop\"~\"^({regex})$\"]({south},{west},{north},{east});" \
                    f"way[\"shop\"~\"^({regex})$\"]({south},{west},{north},{east});" \
                    f"relation[\"shop\"~\"^({regex})$\"]({south},{west},{north},{east}););"
            blocks.append(block)
            labels.append("stores")

    if not blocks:
        return "", []
    
    query = "[out:json][timeout:25];" + "".join(blocks) + "out center;"
    return query, labels

async def fetch_amenities(
    bbox: Tuple[float, float, float, float],
    need_parks: bool,
    worship_types: List[str],
    store_types: List[str]
) -> Dict[str, List[Dict[str, Any]]]:
    """Fetch amenities for the expanded bbox. Returns dict with keys in {parks,worship,stores}."""
    query, labels = build_overpass_query(bbox, need_parks, worship_types, store_types)
    result: Dict[str, List[Dict[str, Any]]] = {"parks": [], "worship": [], "stores": []}
    if not query:
        return result
    
    # Include specific worship and store types in cache key to avoid stale data
    cache_key = (bbox_key(bbox), tuple(sorted(labels)), tuple(sorted(worship_types)), tuple(sorted(store_types)))
    if cache_key in amenities_cache:
        return amenities_cache[cache_key]
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(OVERPASS_URL, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    for el in data.get("elements", []):
        tags = el.get("tags", {}) or {}
        # Prefer 'center' for ways/relations; nodes have 'lat','lon'
        if "center" in el:
            lat, lon = el["center"]["lat"], el["center"]["lon"]
        else:
            lat, lon = el.get("lat"), el.get("lon")
        if lat is None or lon is None:
            continue

        rec = {"id": el.get("id", f"osm-{lat}-{lon}"), "lat": lat, "lng": lon, "tags": tags}
        if tags.get("leisure") == "park":
            result["parks"].append(rec)
        elif tags.get("amenity") == "place_of_worship":
            result["worship"].append(rec)
        elif "shop" in tags:
            result["stores"].append(rec)

    amenities_cache[cache_key] = result
    return result

# -----------------
# API endpoints
# -----------------

@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.get("/api/listings", response_model=SearchResponse)
async def search_listings(
    # Map viewport bbox (west,south,east,north)
    west: float = Query(..., description="BBox west (lng)"),
    south: float = Query(..., description="BBox south (lat)"),
    east: float = Query(..., description="BBox east (lng)"),
    north: float = Query(..., description="BBox north (lat)"),
    sale_type: Optional[Literal["sale", "rent", "any"]] = "any",
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_beds: Optional[int] = None,
    min_baths: Optional[int] = None,

    # Proximity filters
    radius_m: int = Query(1000, ge=50, le=10000, description="Amenity proximity radius in meters"),
    need_parks: bool = Query(False, description="Require proximity to a park"),
    worship: Optional[List[str]] = Query(None, description="List of worship types: synagogue,church,mosque,hindu_temple,buddhist_temple"),
    stores: Optional[List[str]] = Query(None, description="List of store groups: grocery,home_improvement,appliance,farm_supplies"),
):
    bbox = (west, south, east, north)

    # Filter by bbox & basic fields first (in-memory for demo)
    def in_bbox(lst: Listing) -> bool:
        return (west <= lst.lng <= east) and (south <= lst.lat <= north)
    
    candidates: List[Listing] = [l for l in LISTINGS if in_bbox(l)]

    if sale_type and sale_type != "any":
        candidates = [l for l in candidates if l.sale_type == sale_type]
    if min_price is not None:
        candidates = [l for l in candidates if l.price >= min_price]
    if max_price is not None:
        candidates = [l for l in candidates if l.price <= max_price]
    if min_beds is not None:
        candidates = [l for l in candidates if l.beds >= min_beds]
    if min_baths is not None:
        candidates = [l for l in candidates if l.baths >= min_baths]

    # If no proximity constraints, return basics
    worship_types = worship or []
    store_types = stores or []
    if not need_parks and not worship_types and not store_types:
        return SearchResponse(listings=candidates[:MAX_LISTINGS], amenities_used={"parks": [], "worship": [], "stores": []})
    
    # Expand bbox by radius and fetch amenities once
    expanded = expand_bbox_by_radius(bbox, radius_m)
    amenities = await fetch_amenities(expanded, need_parks, worship_types, store_types)

    def passes_proximity(lst: Listing) -> bool:
        ok = True
        if need_parks:
            ok = ok and any(haversine_m(lst.lat, lst.lng, a["lat"], a["lng"]) <= radius_m for a in amenities["parks"]) \
                    if amenities["parks"] else False
        if worship_types:
            ok = ok and any(haversine_m(lst.lat, lst.lng, a["lat"], a["lng"]) <= radius_m and \
                    (a["tags"].get("religion") in {WORSHIP_RELIGION_MAP.get(w, w) for w in worship_types})
                    for a in amenities["worship"]) if amenities["worship"] else False
        if store_types:
            allowed_shops = set()
            for k in store_types:
                allowed_shops.update(STORE_TAGS.get(k, []))
            ok = ok and any(haversine_m(lst.lat, lst.lng, a["lat"], a["lng"]) <= radius_m and \
                    (a["tags"].get("shop") in allowed_shops)
                    for a in amenities["stores"]) if amenities["stores"] else False
        
        return ok
    
    filtered = [l for l in candidates if passes_proximity(l)]

    return SearchResponse(
        listings=filtered[:MAX_LISTINGS],
        amenities_used={k: v for k, v in amenities.items()},
    )