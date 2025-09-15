import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchListings({ bbox, saleType, minPrice, maxPrice, minBeds, minBaths, parksRadius, worshipRadius, storesRadius, gymsRadius, sportsRadius, needParks, worship, stores, gyms, sports }) {
    const params = new URLSearchParams({
        west: bbox.west,
        south: bbox.south,
        east: bbox.east,
        north: bbox.north,
        sale_type: saleType,
        parks_radius: parksRadius,
        worship_radius: worshipRadius,
        stores_radius: storesRadius,
        gyms_radius: gymsRadius,
        sports_radius: sportsRadius,
        need_parks: needParks,
    });
    if (minPrice != null) params.set("min_price", minPrice);
    if (maxPrice != null) params.set("max_price", maxPrice);
    if (minBeds != null) params.set("min_beds", minBeds);
    if (minBaths != null) params.set("min_baths", minBaths);
    (worship || []).forEach((w) => params.append("worship", w));
    (stores || []).forEach((s) => params.append("stores", s));
    (gyms || []).forEach((g) => params.append("gyms", g));
    (sports || []).forEach((s) => params.append("sports", s));

    const url = `${API_BASE}/api/listings?${params.toString()}`;

    const { data } = await axios.get(url);

    return data;
}