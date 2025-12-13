import React, { useEffect, useState } from 'react'; // 👈 Import hooks
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// ... icon imports ...

// --- HELPER TO MOVE THE MAP ---
// Leaflet maps can't be moved by just changing the 'center' prop variable.
// You need a component inside the map to talk to it.
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13); // ✈️ ANIMATE to the new spot
        }
    }, [center, map]);
    return null;
}

export default function RepairerMap({ repairers, userLocation }) {
    
    // 1. DEFAULT: Start with DB location (or School if DB is empty)
    // Ampayon / Butuan Coordinates
    const defaultCenter = [8.95566805, 125.596964765671]; 
    
    const initialCenter = (userLocation && userLocation.latitude) 
        ? [userLocation.latitude, userLocation.longitude] 
        : defaultCenter;

    // 2. STATE: This tracks the "Real" center
    const [currentCenter, setCurrentCenter] = useState(initialCenter);
    const [myPosition, setMyPosition] = useState(initialCenter);

    // 3. UBER EFFECT: Get Live GPS on Mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const newPos = [lat, lng];
                    
                    console.log("Found you at:", newPos); // Check console to see if it works
                    
                    setMyPosition(newPos);   // Move the "You" pin
                    setCurrentCenter(newPos); // Move the Camera
                },
                (error) => {
                    console.error("GPS Error:", error);
                },
                { enableHighAccuracy: true } // Force GPS
            );
        }
    }, []);

    return (
        <div className="h-64 w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0 relative">
            <MapContainer 
                center={initialCenter} // Start here
                zoom={13} 
                scrollWheelZoom={false} 
                style={{ height: '100%', width: '100%' }}
            >
                {/* 👇 THIS MOVES THE CAMERA WHEN GPS UPDATES */}
                <MapUpdater center={currentCenter} />

                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* YOUR PIN (Updates with Live GPS) */}
                <Marker position={myPosition}>
                    <Popup>You are here (Live)</Popup>
                </Marker>

                {/* REPAIRER PINS */}
                {repairers.map((repairer) => {
                    const loc = repairer.repairer_profile?.location;
                    if (loc && loc.latitude) {
                        return (
                            <Marker 
                                key={repairer.user_id} 
                                position={[loc.latitude, loc.longitude]}
                            >
                                <Popup>
                                    <strong>{repairer.repairer_profile.business_name}</strong>
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