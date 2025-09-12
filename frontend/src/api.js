import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchListings({ bbox, saleType, minPrice, maxPrice, minBeds, minBaths, parksRadius, worshipRadius, storesRadius, gymsRadius, needParks, worship, stores, gyms }) {
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
        need_parks: needParks,
    });
    if (minPrice != null) params.set("min_price", minPrice);
    if (maxPrice != null) params.set("max_price", maxPrice);
    if (minBeds != null) params.set("min_beds", minBeds);
    if (minBaths != null) params.set("min_baths", minBaths);
    (worship || []).forEach((w) => params.append("worship", w));
    (stores || []).forEach((s) => params.append("stores", s));
    (gyms || []).forEach((g) => params.append("gyms", g));

    const url = `${API_BASE}/api/listings?${params.toString()}`;

    const { data } = await axios.get(url);

    return data;
}