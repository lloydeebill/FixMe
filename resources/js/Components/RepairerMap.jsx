import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- 1. CUSTOM ICON GENERATOR ---
// This creates a marker that has TEXT visibly attached to it
const createLabelIcon = (name, type) => {
    const emoji = type === 'user' ? '📍' : '🛠️'; // Different icons for You vs Repairers
    
    return L.divIcon({
        className: 'custom-marker-label',
        html: `
            <div style="
                display: flex; 
                flex-direction: column; 
                align-items: center;
                transform: translate(-50%, -100%); /* Centers the point */
            ">
                <span style="font-size: 30px; line-height: 1;">${emoji}</span>
                <span style="
                    background-color: white; 
                    color: black; 
                    padding: 2px 6px; 
                    border-radius: 6px; 
                    border: 1px solid #ddd;
                    font-size: 11px; 
                    font-weight: bold; 
                    white-space: nowrap;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    margin-top: -5px;
                ">
                    ${name}
                </span>
            </div>
        `,
        iconSize: [0, 0], // We handle sizing in the HTML above
        iconAnchor: [0, 0], 
    });
};

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
}

export default function RepairerMap({ repairers, userLocation, userName = "You" }) { // Added userName prop
    
    // Ampayon / Butuan Coordinates (Default)
    const defaultCenter = [8.95566805, 125.596964765671]; 
    
    const initialCenter = (userLocation && userLocation.latitude) 
        ? [userLocation.latitude, userLocation.longitude] 
        : defaultCenter;

    const [currentCenter, setCurrentCenter] = useState(initialCenter);
    const [myPosition, setMyPosition] = useState(initialCenter);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const newPos = [lat, lng];
                    setMyPosition(newPos);   
                    setCurrentCenter(newPos); 
                },
                (error) => { console.error("GPS Error:", error); },
                { enableHighAccuracy: true }
            );
        }
    }, []);

    return (
        <div className="h-64 w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0 relative">
            <MapContainer 
                center={initialCenter}
                zoom={13} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
            >
                <MapUpdater center={currentCenter} />

                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 2. YOUR PIN (Using Custom Icon) */}
                <Marker 
                    position={myPosition} 
                    icon={createLabelIcon("You", 'user')} //  Passes "You"
                >
                    <Popup>You are here</Popup>
                </Marker>

                {/* 3. REPAIRER PINS (Using Custom Icons with Business Name) */}
                {repairers.map((repairer) => {
                    const loc = repairer.repairer_profile?.location;
                    const name = repairer.repairer_profile?.business_name || "Repairer"; // Get the Name

                    if (loc && loc.latitude) {
                        return (
                            <Marker 
                                key={repairer.user_id} 
                                position={[loc.latitude, loc.longitude]}
                                icon={createLabelIcon(name, 'repairer')} // Passes Business Name
                            >
                                <Popup>
                                    <strong>{name}</strong><br/>
                                    {loc.address}
                                </Popup>
                            </Marker>
                        );
                    }
                    return null;
                })}
            </MapContainer>
        </div>
    );
}