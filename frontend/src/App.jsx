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
        radiusM: 1000,
        needParks: false,
        worship: [],
        stores: [],
    });

    return (
        <div className="app">
            <aside className="sidebar">
                <h2 style={{margin:"8px 0"}}>Find a home</h2>
                <Filters value={filters} onChange={setFilters} />
                <div style={{marginTop:12}}>
                    <span className="badge">{filters.saleType.toUpperCase()}</span>
                    {filters.needParks && <span className="badge" style={{marginLeft:6}}>Near Parks</span>}
                </div>
            </aside>
            <main>
                <MapView filters={filters} />
            </main>
        </div>
    );
}