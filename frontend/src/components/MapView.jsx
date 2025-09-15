import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { fetchListings } from "../api.js";

// Default center: NYC
const DEFAULT_CENTER = [40.7128, -74.006];

const houseIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41], // Center horizontally, bottom of icon at coordinate
    popupAnchor: [0, -41], // Popup appears above the marker
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
    iconSize: [25, 25],
    iconAnchor: [0, 0], // Center the emoji on the coordinate
    popupAnchor: [0, 0], // Popup appears above the emoji
    shadowSize: [25, 25],
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
    gym: createEmojiIcon('🏋️'),
    tennis_court: createEmojiIcon('🎾'),
    golf_course: createEmojiIcon('⛳'),
    golf_driving_range: createEmojiIcon('🏌️'),
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
        // Use a small delay to ensure the map is fully initialized
        const timer = setTimeout(() => {
            const b = map.getBounds();
            onChange({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() });
        }, 100);
        return () => clearTimeout(timer);
    }, []);
    return null;
}

export default function MapView({ filters, onLoadingChange }) {
    const [bbox, setBbox] = useState(null);
    const [data, setData] = useState({ listings: [], amenities_used: { parks: [], worship: [], stores: [], gyms: [], sports: [] } });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // Initial load with default bbox
    useEffect(() => {
        let cancelled = false;
        async function run() {
            const defaultBbox = {
                west: -74.1,
                south: 40.6,
                east: -73.8,
                north: 40.9
            };
            setLoading(true);
            setError(null);
            try {
                const payload = await fetchListings({
                    bbox: defaultBbox,
                    saleType: filters.saleType,
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                    minBeds: filters.minBeds,
                    minBaths: filters.minBaths,
                    parksRadius: filters.parksRadius,
                    worshipRadius: filters.worshipRadius,
                    storesRadius: filters.storesRadius,
                    gymsRadius: filters.gymsRadius,
                    sportsRadius: filters.sportsRadius,
                    needParks: filters.needParks,
                    worship: filters.worship,
                    stores: filters.stores,
                    gyms: filters.gyms,
                    sports: filters.sports,
                });
                if (!cancelled) setData(payload);
            } catch (err) {
                if (!cancelled) setError(err.message || String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        run();
        return () => { cancelled = true; };
    }, []); // Run only once on mount

    // Notify parent component when loading state changes
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(loading);
        }
    }, [loading, onLoadingChange]);

    useEffect(() => {
        if (!bbox) return; // Skip if bbox is not set yet (initial load handled above)
        
        let cancelled = false;
        async function run() {
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
                    parksRadius: filters.parksRadius,
                    worshipRadius: filters.worshipRadius,
                    storesRadius: filters.storesRadius,
                    gymsRadius: filters.gymsRadius,
                    sportsRadius: filters.sportsRadius,
                    needParks: filters.needParks,
                    worship: filters.worship,
                    stores: filters.stores,
                    gyms: filters.gyms,
                    sports: filters.sports,
                });
                if (!cancelled) setData(payload);
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
                            <div style={{minWidth:280}}>
                                <strong>{l.title}</strong>
                                <div>{l.address}</div>
                                <div>{l.sale_type.toUpperCase()} • ${l.price.toLocaleString()}</div>
                                <div>{l.beds} bd • {l.baths} ba • {l.sqft} sqft</div>
                                {l.google_maps_link && (
                                    <div style={{marginTop: '8px'}}>
                                        <a 
                                            href={l.google_maps_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#4285f4',
                                                textDecoration: 'none',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                        >
                                            <span>📍</span>
                                            <span>View on Google Maps</span>
                                        </a>
                                    </div>
                                )}
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

                {data.amenities_used.parks.map((l) => (
                    <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.park}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name || 'Park'}</strong>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {data.amenities_used.stores.map((l) => (
                    <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.store}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name || l.tags.shop || 'Store'}</strong>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {data.amenities_used.gyms.map((l) => (
                    <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS.gym}>
                        <Popup>
                            <div style={{minWidth:220}}>
                                <strong>{l.tags.name || l.tags.amenity || 'Gym'}</strong>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {data.amenities_used.sports.map((l) => {
                    // Determine the type of sports facility for icon selection
                    let iconType = 'gym'; // default
                    if (l.tags.leisure === 'tennis_court' || l.tags.sport === 'tennis') {
                        iconType = 'tennis_court';
                    } else if (l.tags.leisure === 'golf_course' || l.tags.sport === 'golf') {
                        iconType = 'golf_course';
                    } else if (l.tags.leisure === 'golf_driving_range') {
                        iconType = 'golf_driving_range';
                    }
                    
                    return (
                        <Marker key={l.id} position={[l.lat, l.lng]} icon={ICONS[iconType]}>
                            <Popup>
                                <div style={{minWidth:220}}>
                                    <strong>{l.tags.name || l.tags.leisure || 'Sports Facility'}</strong>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
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
                        <span>Showing {data.listings.length} listings • amenities fetched: parks {data.amenities_used.parks.length}, worship {data.amenities_used.worship.length}, stores {data.amenities_used.stores.length}, gyms {data.amenities_used.gyms.length}, sports {data.amenities_used.sports.length}</span>
                    )
                )}
            </div>
        </div>
    );
}