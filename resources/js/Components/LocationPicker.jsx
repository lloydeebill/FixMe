import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- FIX LEAFLET ICONS ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 1. DRAGGABLE MARKER COMPONENT
function DraggableMarker({ position, onLocationSelect }) {
    const [markerPos, setMarkerPos] = useState(position);
    const markerRef = useRef(null);

    const eventHandlers = useMemo(
        () => ({
            dragend(e) {
                // 🛑 FIX IS HERE: Use 'e.target' to get the marker directly
                const marker = e.target;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setMarkerPos(newPos);
                    // Send the new Lat/Lng back to the parent immediately
                    onLocationSelect(newPos.lat, newPos.lng); 
                }
            },
        }),
        [onLocationSelect],
    );

    // If the parent updates the position (e.g. GPS button), update the pin
    useEffect(() => {
        setMarkerPos(position);
    }, [position]);

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={markerPos}
            ref={markerRef}
        >
            <Popup>You are here! Drag to adjust.</Popup>
        </Marker>
    );
}

// 2. CAMERA MOVER
function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if(center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
}

// --- MAIN EXPORT ---
export default function LocationPicker({ initialLat, initialLng, onLocationChange }) {
    
    // 📍 DEFAULT: BUENAVISTA / BUTUAN AREA
    const defaultCenter = [8.9767, 125.4089]; 

    // Determine starting position
    const startPos = (initialLat && initialLng) 
        ? { lat: initialLat, lng: initialLng } 
        : { lat: defaultCenter[0], lng: defaultCenter[1] };

    const [position, setPosition] = useState(startPos);
    const [loading, setLoading] = useState(false);

    // HELPER: Handle GPS Button
    const handleGPS = () => {
        setLoading(true);
        if (!navigator.geolocation) {
            alert("Geolocation not supported");
            setLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                updatePosition(lat, lng); // Move pin and update parent
                setLoading(false);
            },
            (err) => {
                console.error(err);
                alert("Could not get GPS. Please drag the pin manually.");
                setLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // HELPER: Update State & Notify Parent
    const updatePosition = (lat, lng) => {
        // 1. Update Local Map State
        setPosition({ lat, lng });
        
        // 2. Reverse Geocode (Get Address Text)
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
                // 3. Update Parent Form Data
                onLocationChange({
                    lat: lat,
                    lng: lng,
                    address: data.display_name // "Buenavista, Agusan..."
                });
            })
            .catch(() => {
                // Even if address text fails, send the coordinates!
                onLocationChange({
                    lat: lat,
                    lng: lng,
                    address: "Pinned Location"
                });
            });
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Pinpoint Location</label>
                <button 
                    type="button" 
                    onClick={handleGPS}
                    className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-black flex items-center gap-1"
                >
                    {loading ? 'Locating...' : '📍 Use Current Location'}
                </button>
            </div>

            <div className="h-64 w-full rounded-lg border border-gray-300 overflow-hidden z-0">
                <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                    
                    <MapUpdater center={[position.lat, position.lng]} />
                    
                    <DraggableMarker 
                        position={[position.lat, position.lng]} 
                        onLocationSelect={updatePosition} // 👈 Link the drag event to the update function
                    />
                </MapContainer>
            </div>
            <p className="text-xs text-gray-500">Drag the marker to adjust your exact location.</p>
        </div>
    );
}