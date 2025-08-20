import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { fetchListings } from "../api.js";

// Default center: NYC
const DEFAULT_CENTER = [40.7128, -74.006];

const houseIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
});

// --- Simple emoji markers (no external assets) ---
const createEmojiIcon = (emoji) =>
  L.divIcon({
    className: 'poi-emoji',
    html: `<div style="
      font-size:18px;line-height:18px;
      transform: translate(-50%, -50%);
      filter: drop-shadow(0 1px 2px rgba(0,0,0,.35));
    ">${emoji}</div>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Category icons
const ICONS = {
    store: createEmojiIcon('🛍️'),
    synagogue: createEmojiIcon('✡️'),
    church: createEmojiIcon('✝️'),
    mosque: createEmojiIcon('☪️'),
    hindu_temple: createEmojiIcon('🕉️'),
    buddhist_temple: createEmojiIcon('☸️'),
    park: createEmojiIcon('🌳'),
};

function BoundsWatcher({ onChange }) {
    const map = useMapEvents({
        moveend: () => {
            const b = map.getBounds();
            onChange({
                west: b.getWest(),
                south: b.getSouth(),
                east: b.getEast(),
                north: b.getNorth(),
            });
        },
    });
    useEffect(() => {
        const b = map.getBounds();
        onChange({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
    }, []);
    return null;
}

export default function MapView({ filters }) {
    const [bbox, setBbox] = useState(null);
    const [data, setData] = useState({ listings: [], amenities_used: { parks: [], worship: [], stores: [] } });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function run() {
            if (!bbox) return;
            setLoading(true);
            setError(null);
            try {
                const payload = await fetchListings({
                    bbox,
                    saleType: filters.saleType,
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                    minBeds: filters.minBeds,
                    minBaths: filters.minBaths,
                    radiusM: filters.radiusM,
                    needParks: filters.needParks,
                    worship: filters.worship,
                    stores: filters.stores,
                });
                if (!cancelled) setData(payload);
                // // test
                // console.log(payload);
            } catch (err) {
                if (!cancelled) setError(err.message || String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, [bbox, JSON.stringify(filters)]);

    return (
        <div className="map">
            <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <BoundsWatcher onChange={setBbox} />

                {data.listings.map((l) => (
                    <Marker key={l.id} position={[l.lat, l.lng]} icon={houseIcon}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.title}</strong>
                                <div>{l.address}</div>
                                <div>{l.sale_type.toUpperCase()} • ${l.price.toLocaleString()}</div>
                                <div>{l.beds} bd • {l.baths} ba • {l.sqft} sqft</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {data.amenities_used.worship.map((l) => (
                    l.tags.religion === "jewish" ? (
                        <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.synagogue}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name}</strong>
                            </div>
                        </Popup>
                        </Marker>
                    ) : l.tags.religion === "christian" ? (
                        <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.church}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name}</strong>
                            </div>
                        </Popup>
                        </Marker>
                    ) : l.tags.religion === "muslim" ? (
                        <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.mosque}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name}</strong>
                            </div>
                        </Popup>
                        </Marker>
                    ) : l.tags.religion === "hindu" ? (
                        <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.hindu_temple}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name}</strong>
                            </div>
                        </Popup>
                        </Marker>
                    ) : l.tags.religion === "buddhist" ? (
                        <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.buddhist_temple}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name}</strong>
                            </div>
                        </Popup>
                        </Marker>
                    ) : null
                ))}
            </MapContainer>

            <div style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                background: '#fff',
                border: '1px solid #e5e7eb',
                padding: '8px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 10px rgba(0,0,0,.08)',
            }}>
                {loading ? "Loading…" : (
                    error ? <span style={{color:'#b91c1c'}}>Error: {error}</span> : (
                        <span>Showing {data.listings.length} listings • amenities fetched: parks {data.amenities_used.parks.length}, worship {data.amenities_used.worship.length}, stores {data.amenities_used.stores.length}</span>
                    )
                )}
            </div>
        </div>
    );
}