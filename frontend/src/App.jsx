import React, { useMemo, useState } from "react";
import MapView from "./components/MapView.jsx";
import Filters from "./components/Filters.jsx";

export default function App() {
    const [filters, setFilters] = useState({
        saleType: "any",
        minPrice: undefined,
        maxPrice: undefined,
        minBeds: undefined,
        minBaths: undefined,
        parksRadius: 1000,
        worshipRadius: 1000,
        storesRadius: 1000,
        needParks: false,
        worship: [],
        stores: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);

    // Add a small delay before showing loading to avoid flashing for quick requests
    React.useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => setShowLoading(true), 200);
            return () => clearTimeout(timer);
        } else {
            setShowLoading(false);
        }
    }, [isLoading]);

    return (
        <div className="app">
            <aside className="sidebar">
                <h2 style={{margin:"8px 0"}}>Find a home</h2>
                <Filters value={filters} onChange={setFilters} />
                <div style={{marginTop:12}}>
                    <span className="badge">{filters.saleType.toUpperCase()}</span>
                    {filters.needParks && <span className="badge" style={{marginLeft:6}}>Near Parks</span>}
                </div>
                {showLoading && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#495057'
                    }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #e9ecef',
                            borderTop: '2px solid #007bff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                        Loading...
                    </div>
                )}
            </aside>
            <main>
                <MapView filters={filters} onLoadingChange={setIsLoading} />
            </main>
        </div>
    );
}