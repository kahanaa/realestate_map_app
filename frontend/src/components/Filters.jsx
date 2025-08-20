import React from "react";

const worshipOptions = [
    { value: "synagogue", label: "Synagogues" },
    { value: "church", label: "Churches" },
    { value: "mosque", label: "Mosques" },
    { value: "hindu_temple", label: "Hindu temples" },
    { value: "buddhist_temple", label: "Buddhist temples" },
];

const storeOptions = [
    { value: "grocery", label: "Grocery stores" },
    { value: "home_improvement", label: "Home improvement" },
    { value: "appliance", label: "Appliance stores" },
    { value: "farm_supplies", label: "Farm supplies" },
];

export default function Filters({ value, onChange }) {
    const set = (patch) => onChange({ ...value, ...patch });
    
    return (
        <div>
            <div className="field">
                <label className="label">Sale type</label>
                <select value={value.saleType} onChange={(e) => set({ saleType: e.target.value })}>
                    <option value="any">Any</option>
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                </select>
            </div>

            <div className="field">
                <label className="label">Price range ($)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input type="number" placeholder="Min" value={value.minPrice ?? ""} onChange={(e) => set({ minPrice: e.target.value ? Number(e.target.value) : undefined })} />
                    <input type="number" placeholder="Max" value={value.maxPrice ?? ""} onChange={(e) => set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
            </div>

            <div className="field" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                <div>
                    <label className="label">Min beds</label>
                    <input type="number" min="0" value={value.minBeds ?? ""} onChange={(e) => set({ minBeds: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
                <div>
                    <label className="label">Min baths</label>
                    <input type="number" min="0" value={value.minBaths ?? ""} onChange={(e) => set({ minBaths: e.target.value ? Number(e.target.value) : undefined })} />
                </div>
            </div>

            <div className="field">
                <label className="label">Within (meters) of amenities</label>
                <input type="range" min="100" max="5000" step="50" value={value.radiusM} onChange={(e) => set({ radiusM: Number(e.target.value) })} />
                <div>{value.radiusM} m</div>
            </div>

            <div className="field">
                <label className="label">
                    <input type="checkbox" checked={value.needParks} onChange={(e) => set({ needParks: e.target.checked })} /> Near parks
                </label>
            </div>

            <div className="field">
                <label className="label">Houses of worship</label>
                {worshipOptions.map((o) => (
                    <label key={o.value} className="label">
                        <input
                            type="checkbox"
                            checked={value.worship.includes(o.value)}
                            onChange={(e) => {
                                const next = new Set(value.worship);
                                e.target.checked ? next.add(o.value) : next.delete(o.value);
                                set({ worship: Array.from(next) });
                            }}
                        /> {o.label}
                    </label>
                ))}
            </div>

            <div className="field">
                <label className="label">Stores</label>
                {storeOptions.map((o) => (
                    <label key={o.value} className="label">
                        <input
                            type="checkbox"
                            checked={value.stores.includes(o.value)}
                            onChange={(e) => {
                                const next = new Set(value.stores);
                                e.target.checked ? next.add(o.value) : next.delete(o.value);
                                set({ stores: Array.from(next) });
                            }}
                        /> {o.label}
                    </label>
                ))}
            </div>
        </div>
    );
}