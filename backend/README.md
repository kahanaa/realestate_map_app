# Backend (FastAPI)

## Quick start

# 1) Create a virtual env and install deps
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2) Run the API
uvicorn main:app --reload --port 8000

# 3) API will be at http://localhost:8000
# Interactive docs: http://localhost:8000/docs

## Notes
- This starter uses OpenStreetMap Overpass API for amenities.
- Results are cached per (bbox + selected categories) to keep it snappy.
- Swap the in-memory listings for your DB when ready (e.g. Postgres/PostGIS).