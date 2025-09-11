import React, { useRef, useCallback, useEffect, useState } from "react";

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

// // Simple increment/decrement functions
// function incrementValue(currentValue, max = 5000) {
//     return Math.min(max, currentValue + 5);
// }

// function decrementValue(currentValue, min = 25) {
//     return Math.max(min, currentValue - 5);
// }

// Custom hook for stable rapid increment
function useRapidIncrement(setValue, getValue, min = 25, max = 5000) {
    const intervalRef = useRef(null);
    const timeoutRef = useRef(null);
    const isActiveRef = useRef(false);

    const startRapidChange = useCallback((direction) => {
        // Clear any existing intervals/timeouts
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        isActiveRef.current = true;

        // Initial change
        const currentValue = getValue();
        const newValue = direction === 'up' 
            ? Math.min(max, currentValue + 5)
            : Math.max(min, currentValue - 5);
        setValue(newValue);

        // Start rapid changes after 500ms delay
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                const currentValue = getValue();
                const newValue = direction === 'up' 
                    ? Math.min(max, currentValue + 10)
                    : Math.max(min, currentValue - 10);
                if (newValue !== currentValue) {
                    setValue(newValue);
                } else {
                    console.log("Value unchanged - at boundary limit");
                }
            }, 100); // Rapid changes every 100ms
        }, 500);
    }, [setValue, getValue, min, max]);

    const stopRapidChange = useCallback(() => {
        console.log("stopRapidChange called");
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        isActiveRef.current = false;
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    return { 
        startRapidChange, 
        stopRapidChange, 
        isActive: () => isActiveRef.current 
    };
}

export default function Filters({ value, onChange }) {
    const set = useCallback((patch) => onChange({ ...value, ...patch }), [value, onChange]);
    
    // Use refs to maintain stable references
    const valueRef = useRef(value);
    valueRef.current = value;
    
    // Stable setter and getter functions
    const setParksRadius = useCallback((newValue) => set({ parksRadius: newValue }), [set]);
    const getParksRadius = useCallback(() => valueRef.current.parksRadius, []);
    
    const setWorshipRadius = useCallback((newValue) => set({ worshipRadius: newValue }), [set]);
    const getWorshipRadius = useCallback(() => valueRef.current.worshipRadius, []);
    
    const setStoresRadius = useCallback((newValue) => set({ storesRadius: newValue }), [set]);
    const getStoresRadius = useCallback(() => valueRef.current.storesRadius, []);
    
    // Parks radius rapid increment
    const parksIncrement = useRapidIncrement(setParksRadius, getParksRadius);
    
    // Worship radius rapid increment
    const worshipIncrement = useRapidIncrement(setWorshipRadius, getWorshipRadius);
    
    // Stores radius rapid increment
    const storesIncrement = useRapidIncrement(setStoresRadius, getStoresRadius);
    
    // Stable event handlers
    const handleParksMouseDown = useCallback((direction) => () => {
        parksIncrement.startRapidChange(direction);
    }, [parksIncrement]);
    
    const handleWorshipMouseDown = useCallback((direction) => () => {
        worshipIncrement.startRapidChange(direction);
    }, [worshipIncrement]);
    
    const handleStoresMouseDown = useCallback((direction) => () => {
        storesIncrement.startRapidChange(direction);
    }, [storesIncrement]);
    
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
                <label className="label">
                    <input type="checkbox" checked={value.needParks} onChange={(e) => set({ needParks: e.target.checked })} /> Near parks
                </label>
                {value.needParks && (
                    <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                        <label className="label" style={{ fontSize: '11px', color: '#6b7280' }}>Within {value.parksRadius} meters</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                                type="button"
                                onMouseDown={handleParksMouseDown('down')}
                                onMouseUp={parksIncrement.stopRapidChange}
                                onMouseLeave={parksIncrement.stopRapidChange}
                                onTouchStart={handleParksMouseDown('down')}
                                onTouchEnd={parksIncrement.stopRapidChange}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    backgroundColor: parksIncrement.isActive() ? '#e5e7eb' : '#f9fafb',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                -
                            </button>
                            <input type="range" min="25" max="5000" step="50" value={value.parksRadius} onChange={(e) => set({ parksRadius: Number(e.target.value) })} style={{ flex: 1 }} />
                            <button 
                                type="button"
                                onMouseDown={handleParksMouseDown('up')}
                                onMouseUp={parksIncrement.stopRapidChange}
                                onMouseLeave={parksIncrement.stopRapidChange}
                                onTouchStart={handleParksMouseDown('up')}
                                onTouchEnd={parksIncrement.stopRapidChange}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    backgroundColor: parksIncrement.isActive() ? '#e5e7eb' : '#f9fafb',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}
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
                {value.worship.length > 0 && (
                    <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                        <label className="label" style={{ fontSize: '11px', color: '#6b7280' }}>Within {value.worshipRadius} meters</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                                type="button"
                                onMouseDown={handleWorshipMouseDown('down')}
                                onMouseUp={worshipIncrement.stopRapidChange}
                                onMouseLeave={worshipIncrement.stopRapidChange}
                                onTouchStart={handleWorshipMouseDown('down')}
                                onTouchEnd={worshipIncrement.stopRapidChange}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    backgroundColor: worshipIncrement.isActive() ? '#e5e7eb' : '#f9fafb',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                -
                            </button>
                            <input type="range" min="25" max="5000" step="50" value={value.worshipRadius} onChange={(e) => set({ worshipRadius: Number(e.target.value) })} style={{ flex: 1 }} />
                            <button 
                                type="button"
                                onMouseDown={handleWorshipMouseDown('up')}
                                onMouseUp={worshipIncrement.stopRapidChange}
                                onMouseLeave={worshipIncrement.stopRapidChange}
                                onTouchStart={handleWorshipMouseDown('up')}
                                onTouchEnd={worshipIncrement.stopRapidChange}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    backgroundColor: worshipIncrement.isActive() ? '#e5e7eb' : '#f9fafb',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}
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
                {value.stores.length > 0 && (
                    <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                        <label className="label" style={{ fontSize: '11px', color: '#6b7280' }}>Within {value.storesRadius} meters</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                                type="button"
                                onMouseDown={handleStoresMouseDown('down')}
                                onMouseUp={storesIncrement.stopRapidChange}
                                onMouseLeave={storesIncrement.stopRapidChange}
                                onTouchStart={handleStoresMouseDown('down')}
                                onTouchEnd={storesIncrement.stopRapidChange}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    backgroundColor: storesIncrement.isActive() ? '#e5e7eb' : '#f9fafb',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                -
                            </button>
                            <input type="range" min="25" max="5000" step="50" value={value.storesRadius} onChange={(e) => set({ storesRadius: Number(e.target.value) })} style={{ flex: 1 }} />
                            <button 
                                type="button"
                                onMouseDown={handleStoresMouseDown('up')}
                                onMouseUp={storesIncrement.stopRapidChange}
                                onMouseLeave={storesIncrement.stopRapidChange}
                                onTouchStart={handleStoresMouseDown('up')}
                                onTouchEnd={storesIncrement.stopRapidChange}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    backgroundColor: storesIncrement.isActive() ? '#e5e7eb' : '#f9fafb',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}