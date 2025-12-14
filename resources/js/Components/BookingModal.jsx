import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- ICONS CONFIGURATION ---
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const repairerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/markers/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- HELPER: AUTO-FIT BOUNDS ---
function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            // Filter out invalid (0,0) coordinates just in case
            const validMarkers = markers.filter(m => m.position[0] !== 0);
            if (validMarkers.length > 0) {
                const bounds = L.latLngBounds(validMarkers.map(m => m.position));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [markers, map]);
    return null;
}

// --- HELPER: MAP RESIZER (Fixes the gray "cut through" issue) ---
function MapInvalidator({ isExpanded }) {
    const map = useMap();
    useEffect(() => {
        const timers = [
            setTimeout(() => map.invalidateSize(), 100),
            setTimeout(() => map.invalidateSize(), 300),
            setTimeout(() => map.invalidateSize(), 600)
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [isExpanded, map]);
    return null;
}

// --- HELPER: CALCULATE DISTANCE ---
function getDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return "N/A";
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
}

export default function BookingModal({ repairer, user, onClose, onConfirm }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [isMapExpanded, setIsMapExpanded] = useState(false);

    // 🛑 1. INITIALIZE STATE (Safe defaults)
    const [myLocation, setMyLocation] = useState({
        lat: parseFloat(user?.location?.latitude || 7.1907),
        lng: parseFloat(user?.location?.longitude || 125.4553)
    });

    // 🛑 2. THE CRITICAL FIX: SYNC STATE WHEN PROPS ARRIVE
    // This makes the map jump to the correct location instantly
   

    // --- REPAIRER LOCATION LOGIC ---
    const repairerLat = parseFloat(repairer?.location?.latitude || repairer?.repairer_profile?.location?.latitude || 7.1907);
    const repairerLng = parseFloat(repairer?.location?.longitude || repairer?.repairer_profile?.location?.longitude || 125.4553);

    const distance = getDistance(myLocation.lat, myLocation.lng, repairerLat, repairerLng);
    const availabilities = repairer?.repairer_profile?.availabilities || [];

    // --- FEATURE: GET BROWSER LOCATION ---
    const handleUseMyLocation = (e) => {
        e.preventDefault(); 
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setMyLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                alert("📍 Location updated from GPS!");
            }, (err) => {
                alert("Could not get location: " + err.message);
            });
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    // --- HANDLERS ---
    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setError('');
        setTime('');
        if (!selectedDate) { setDate(''); return; }

        const dateObj = new Date(selectedDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const inputDate = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
        
        if (inputDate < today) {
            setError('You cannot select a date in the past.');
            setDate(selectedDate);
            return;
        }

        const dayIndex = dateObj.getUTCDay(); 
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        const dayRule = availabilities.find(a => parseInt(a.day_of_week) === dayIndex);

        if (!dayRule || !dayRule.is_active) {
            setError(`Repairer is not available on ${dayName}s.`);
            setDate(selectedDate);
            return; 
        }
        setDate(selectedDate);
    };

    const availableSlots = useMemo(() => {
        if (!date || error) return [];
        const dateObj = new Date(date);
        const dayIndex = dateObj.getUTCDay();
        const dayRule = availabilities.find(a => parseInt(a.day_of_week) === dayIndex);
        if (!dayRule || !dayRule.is_active) return [];

        const startHour = parseInt(dayRule.start_time.split(':')[0], 10);
        const endHour = parseInt(dayRule.end_time.split(':')[0], 10);
        const now = new Date();
        const isToday = date === now.toISOString().split('T')[0];
        const currentHour = now.getHours();

        const slots = [];
        for (let h = startHour; h < endHour; h++) {
            if (isToday && h <= currentHour) continue; 
            const hourString = h.toString().padStart(2, '0') + ':00';
            slots.push(hourString);
        }
        return slots;
    }, [date, availabilities, error]);

    const formatTime = (time24) => {
        const [hour, minute] = time24.split(':');
        const h = parseInt(hour, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12; 
        return `${h12}:${minute} ${ampm}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (error) return;
        onConfirm({ date, time, notes });
    };

    const openGoogleMaps = (e) => {
        e.preventDefault();
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${myLocation.lat},${myLocation.lng}&destination=${repairerLat},${repairerLng}&travelmode=driving`, '_blank');
    };

    if (!repairer) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
            <div className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up my-auto transition-all duration-500 ease-in-out flex flex-col ${isMapExpanded ? 'h-[90vh]' : 'max-h-[90vh]'}`}>
                
                {/* --- HEADER WITH MAP --- */}
                <div className={`relative w-full bg-gray-100 border-b border-gray-200 transition-all duration-500 flex-shrink-0 ${isMapExpanded ? 'h-full flex-grow' : 'h-48'}`}>
                    
                    <MapContainer 
                        center={[myLocation.lat, myLocation.lng]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false} 
                        dragging={isMapExpanded}
                        scrollWheelZoom={isMapExpanded}
                        doubleClickZoom={isMapExpanded}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        
                        {/* User Marker (Blue) */}
                        <Marker position={[myLocation.lat, myLocation.lng]} icon={userIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                        
                        {/* Repairer Marker (Red) */}
                        <Marker position={[repairerLat, repairerLng]} icon={repairerIcon}>
                            <Popup>{repairer.repairer_profile.business_name}</Popup>
                        </Marker>
                        
                        <FitBounds markers={[{ position: [myLocation.lat, myLocation.lng] }, { position: [repairerLat, repairerLng] }]} />
                        <MapInvalidator isExpanded={isMapExpanded} />
                    </MapContainer>

                    {/* Gradient Overlay */}
                    {!isMapExpanded && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent z-[400] pointer-events-none"></div>}

                    {/* Title & Controls */}
                    <div className="absolute bottom-4 left-6 z-[400] text-white w-full pr-12">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold text-shadow transition-all ${isMapExpanded ? 'text-black text-2xl bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg' : 'text-xl text-white'}`}>
                                {isMapExpanded ? 'Route View' : 'Request Service'}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isMapExpanded ? 'bg-black text-white border-black' : 'bg-white/20 backdrop-blur-md text-white border-white/30'}`}>
                                {distance} km away
                            </span>
                        </div>
                        {!isMapExpanded && (
                            <p className="text-gray-200 text-sm flex items-center gap-1">
                                with <span className="font-semibold text-white">{repairer.repairer_profile.business_name}</span>
                            </p>
                        )}
                    </div>

                    {/* 🛑 MAP CONTROLS */}
                    <div className="absolute top-4 right-16 z-[400] flex gap-2">
                        {/* 1. Use GPS Button */}
                        <button 
                            onClick={handleUseMyLocation}
                            title="Use My Current GPS Location"
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-lg transition animate-pulse"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </button>

                        {/* 2. Open Google Maps */}
                        <button onClick={openGoogleMaps} className="bg-white/90 p-2 rounded-full hover:bg-white text-black shadow-lg transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        </button>

                        {/* 3. Expand */}
                        <button onClick={(e) => { e.preventDefault(); setIsMapExpanded(!isMapExpanded); }} className="bg-white/90 p-2 rounded-full hover:bg-black hover:text-white text-black shadow-lg transition">
                            {isMapExpanded ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            )}
                        </button>
                    </div>

                    <button onClick={onClose} className="absolute top-4 right-4 z-[400] bg-white/90 p-2 rounded-full hover:bg-red-500 hover:text-white text-black shadow-lg transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* --- FORM BODY --- */}
                {!isMapExpanded && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Date</label>
                            <input type="date" required min={new Date().toISOString().split('T')[0]} className={`w-full rounded-xl font-medium border-2 ${error ? 'border-red-500 text-red-600' : 'border-gray-200 focus:border-black'}`} value={date} onChange={handleDateChange} />
                            {error && <p className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Times</label>
                            {!date ? (<p className="text-sm text-gray-400 italic">Please select a date first.</p>) : availableSlots.length === 0 ? (error ? null : <p className="text-sm text-red-500 italic">No available slots.</p>) : (<div className="grid grid-cols-4 gap-2">{availableSlots.map(slot => (<button key={slot} type="button" onClick={() => setTime(slot)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${time === slot ? 'bg-black text-white border-black transform scale-105' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>{formatTime(slot)}</button>))}</div>)}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Problem Description</label>
                            <textarea className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black text-sm" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue... (e.g. leaking pipe under sink)"></textarea>
                        </div>
                        <div className="pt-2">
                            <button type="submit" disabled={!date || !time || !!error} className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"><span>Send Request</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}