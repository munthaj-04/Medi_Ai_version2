"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

function ChangeView({ center, zoom }: any) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

export default function MapComponent({ hospitals, selectedHospital, onSelect }: any) {
    // Default center to Hyderabad (or the first hospital)
    const defaultCenter = [17.4300, 78.4100]; // Rough coordinates for Apollo Jubilee Hills

    // Add mock coordinates since our mock data doesn't have them
    const hospitalCoords: any = {
        1: [17.4156, 78.4091], // Apollo
        2: [17.4411, 78.4984], // KIMS
        3: [17.4257, 78.4601], // Yashoda
        4: [17.4144, 78.4485], // Care
    };

    const center = selectedHospital ? hospitalCoords[selectedHospital.id] : defaultCenter;

    return (
        <div style={{ height: "100%", width: "100%", borderRadius: "12px", overflow: "hidden", zIndex: 0 }}>
            <MapContainer center={center as any} zoom={selectedHospital ? 14 : 12} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                <ChangeView center={center} zoom={selectedHospital ? 15 : 12} />

                {hospitals.map((h: any) => (
                    <Marker
                        key={h.id}
                        position={hospitalCoords[h.id]}
                        eventHandlers={{
                            click: () => h.open && onSelect(h),
                        }}
                    >
                        <Popup>
                            <div style={{ padding: "4px" }}>
                                <strong style={{ color: "#0f172a", fontSize: "14px" }}>{h.name}</strong><br />
                                <span style={{ color: "#64748b", fontSize: "12px" }}>{h.speciality}</span><br />
                                <span style={{ color: "#10b981", fontSize: "12px", fontWeight: "bold" }}>● {h.distance}</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
