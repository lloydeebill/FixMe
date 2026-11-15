import '../skilllink.css';
import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import JobPinPicker from '../Pages/Dashboard/JobPinPicker';

const createEmojiIcon = (type) => {
    const emoji = type === 'user' ? '📍' : '🛠️';

    return L.divIcon({
        className: 'custom-emoji-marker',
        html: `
            <div style="
                font-size: 30px;
                line-height: 1;
                filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
                transform: translate(-50%, -50%); /* Centers the emoji on the location */
            ">
                ${emoji}
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
    });
};

// --- HELPER: AUTO-FIT BOUNDS ---
function FitBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const validMarkers = markers.filter(m => m.position[0] !== 0);
            if (validMarkers.length > 0) {
                const bounds = L.latLngBounds(validMarkers.map(m => m.position));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [markers, map]);
    return null;
}

// --- HELPER: MAP RESIZER ---
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

function manilaNow() {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

export default function BookingModal({ repairer, user, onClose, onConfirm, jobContext = {}, pilotAreas = {} }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [jobArea, setJobArea] = useState('');
    const [jobAddress, setJobAddress] = useState('');
    const [jobLatitude, setJobLatitude] = useState(null);
    const [jobLongitude, setJobLongitude] = useState(null);
    const [showJobMap, setShowJobMap] = useState(false);

    useEffect(() => {
        if (!repairer) return;
        setJobArea((repairer.repairer_profile?.service_areas || []).includes(jobContext.area) ? jobContext.area : '');
        setJobAddress(jobContext.address || '');
        setJobLatitude(jobContext.latitude ?? null);
        setJobLongitude(jobContext.longitude ?? null);
        setShowJobMap(false);
        setDate(jobContext.date || '');
        setTime(jobContext.time || '');
    }, [repairer?.repairer_profile?.id]);

    const providerLocation = repairer?.repairer_profile?.location;
    const hasProviderPin = providerLocation?.latitude != null && providerLocation?.longitude != null;
    const hasJobPin = jobLatitude != null && jobLongitude != null;
    const repairerLat = hasProviderPin ? Number(providerLocation.latitude) : null;
    const repairerLng = hasProviderPin ? Number(providerLocation.longitude) : null;
    const repairerAddress = providerLocation?.address || "Location unavailable";

    const distance = hasJobPin && hasProviderPin ? getDistance(Number(jobLatitude), Number(jobLongitude), repairerLat, repairerLng) : null;
    const availabilities = repairer?.repairer_profile?.availabilities || [];

    // HANDLERS
    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setError('');
        setTime('');
        if (!selectedDate) { setDate(''); return; }

        const dateObj = new Date(selectedDate);
        if (selectedDate < manilaNow().date) {
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

        const startTime = dayRule.start_time.slice(0, 5);
        const endTime = dayRule.end_time.slice(0, 5);
        const now = manilaNow();
        const isToday = date === now.date;

        const slots = [];
        for (let h = 0; h < 24; h++) {
            if (isToday && h <= now.hour) continue;
            const hourString = h.toString().padStart(2, '0') + ':00';
            if (hourString < startTime || hourString >= endTime) continue;
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
        if (error || submitting) return;
        if (jobLatitude == null || jobLongitude == null) { setSubmitError('Choose the job pin before sending the request.'); return; }
        setSubmitting(true);
        setSubmitError('');
        onConfirm({ date, time, notes, jobArea, jobAddress, jobLatitude, jobLongitude }, {
            onError: message => setSubmitError(message),
            onFinish: () => setSubmitting(false),
        });
    };

    if (!repairer) return null;

    return (
        <div className="skilllink-dialog fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden">
            <div className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up my-auto transition-all duration-500 ease-in-out flex flex-col ${isMapExpanded ? 'h-[90vh]' : 'max-h-[90vh]'}`}>

                {/* --- HEADER WITH MAP --- */}
                <div className={`relative w-full bg-gray-100 border-b border-gray-200 transition-all duration-500 flex-shrink-0 ${isMapExpanded ? 'h-full flex-grow' : 'h-48'}`}>

                    {hasJobPin && hasProviderPin ? <MapContainer
                        center={[Number(jobLatitude), Number(jobLongitude)]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        dragging={isMapExpanded}
                        scrollWheelZoom={isMapExpanded}
                        doubleClickZoom={isMapExpanded}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {/* SER MARKER */}
                        <Marker
                            position={[Number(jobLatitude), Number(jobLongitude)]}
                            icon={createEmojiIcon('user')}
                        >
                            <Popup>Chosen job location</Popup>
                        </Marker>

                        {/* 3. REPAIRER MARKER*/}
                        <Marker
                            position={[repairerLat, repairerLng]}
                            icon={createEmojiIcon('repairer')}
                        >
                            <Popup>
                                <div className="text-center">
                                    <strong className="text-sm">{repairer.repairer_profile.business_name}</strong>
                                    <hr className="my-1 border-gray-200"/>
                                    <span className="text-xs text-gray-500">{repairerAddress}</span>
                                </div>
                            </Popup>
                        </Marker>

                        <FitBounds markers={[{ position: [Number(jobLatitude), Number(jobLongitude)] }, { position: [repairerLat, repairerLng] }]} />
                        <MapInvalidator isExpanded={isMapExpanded} />
                    </MapContainer> : <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#647084]">Map distance is unavailable until this job and the provider have saved pins.</div>}

                    {/* Gradient Overlay */}
                    {!isMapExpanded && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent z-[400] pointer-events-none"></div>}

                    {/* Title & Controls */}
                    <div className="absolute bottom-4 left-6 z-[400] text-white w-full pr-12">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-bold text-shadow transition-all ${isMapExpanded ? 'text-black text-2xl bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg' : 'text-xl text-white'}`}>
                                {isMapExpanded ? 'Saved location map' : 'Request Service'}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isMapExpanded ? 'bg-[#0965e8] text-white border-black' : 'bg-white/20 backdrop-blur-md text-white border-white/30'}`}>
                                {distance === null ? 'Distance unavailable' : `About ${distance} km straight-line`}
                            </span>
                        </div>
                        {!isMapExpanded && (
                            <p className="text-gray-200 text-sm flex items-center gap-1">
                                with <span className="font-semibold text-white">{repairer.repairer_profile.business_name}</span>
                            </p>
                        )}
                    </div>

                    {/* MAP CONTROLS */}
                    <div className="absolute top-4 right-16 z-[400] flex gap-2">
                        {hasJobPin && hasProviderPin && <button onClick={(e) => { e.preventDefault(); setIsMapExpanded(!isMapExpanded); }} className="bg-white/90 p-2 rounded-full hover:bg-[#0965e8] hover:text-white text-black shadow-sm transition">
                            {isMapExpanded ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            )}
                        </button>}
                    </div>

                    <button onClick={onClose} className="absolute top-4 right-4 z-[400] bg-white/90 p-2 rounded-full hover:bg-red-500 hover:text-white text-black shadow-sm transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* --- FORM BODY --- */}
                {!isMapExpanded && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="booking-job-area">Job area</label>
                            <select id="booking-job-area" required value={jobArea} onChange={event => setJobArea(event.target.value)} className="w-full rounded-xl border-gray-200 text-sm">
                                <option value="">Choose a pilot area</option>
                                {Object.entries(pilotAreas).filter(([slug]) => (repairer.repairer_profile?.service_areas || []).includes(slug)).map(([slug, label]) => <option key={slug} value={slug}>{label}</option>)}
                            </select>
                            <label className="mt-3 block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="booking-job-address">Job address or landmark</label>
                            <input id="booking-job-address" required maxLength={255} value={jobAddress} onChange={event => { setJobAddress(event.target.value); setJobLatitude(null); setJobLongitude(null); }} className="w-full rounded-xl border-gray-200 text-sm" placeholder="Where should the provider go?" />
                            <p className="mt-1 text-xs text-gray-500">The saved job address is shared with this provider after confirmation.</p>
                            {user?.location?.latitude != null && user?.location?.longitude != null && <button type="button" onClick={() => { setJobAddress(user.location.address || ''); setJobLatitude(Number(user.location.latitude)); setJobLongitude(Number(user.location.longitude)); setShowJobMap(true); }} className="mt-2 rounded-lg border border-[#cbdcf6] px-3 py-2 text-xs font-semibold text-[#0965e8]">Start from saved account location (edit pin)</button>}
                            <button type="button" onClick={() => setShowJobMap(open => !open)} className="mt-2 ml-2 rounded-lg border border-[#cbdcf6] px-3 py-2 text-xs font-semibold text-[#0965e8]">{showJobMap ? 'Hide pin editor' : 'Edit job pin'}</button>
                            {(!hasJobPin || showJobMap) && <div className="mt-3"><JobPinPicker latitude={jobLatitude} longitude={jobLongitude} accountLocation={user?.location} onChange={(lat, lng) => { setJobLatitude(lat); setJobLongitude(lng); setShowJobMap(true); }} /></div>}
                            {!hasJobPin && <p role="status" className="mt-2 text-xs text-amber-800">Choose an exact job pin to send a booking request.</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Date</label>
                            <input type="date" required min={new Date().toISOString().split('T')[0]} className={`w-full rounded-xl font-medium border-2 ${error ? 'border-red-500 text-red-600' : 'border-gray-200 focus:border-black'}`} value={date} onChange={handleDateChange} />
                            {error && <p role="alert" className="text-red-500 text-xs mt-2 font-bold">{error}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Available Times</label>
                            {!date ? (<p className="text-sm text-gray-400 italic">Please select a date first.</p>) : availableSlots.length === 0 ? (error ? null : <p className="text-sm text-red-500 italic">No available slots.</p>) : (<div className="grid grid-cols-4 gap-2">{availableSlots.map(slot => (<button key={slot} type="button" onClick={() => setTime(slot)} className={`py-2 rounded-lg text-xs font-bold border transition-all ${time === slot ? 'bg-[#0965e8] text-white border-black transform scale-105' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}>{formatTime(slot)}</button>))}</div>)}
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Problem Description</label>
                            <textarea className="w-full rounded-xl border-gray-200 focus:border-black focus:ring-black text-sm" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the issue... (e.g. leaking pipe under sink)"></textarea>
                        </div>
                        <div className="pt-2">
                            {submitError && <p role="alert" className="text-sm text-red-700">{submitError}</p>}
                            <button type="submit" disabled={!jobArea || !jobAddress.trim() || !hasJobPin || !date || !availableSlots.includes(time) || !!error || submitting} className="w-full py-4 bg-[#0965e8] text-white font-bold text-lg rounded-xl shadow-sm hover:bg-[#0753be] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"><span>{submitting ? 'Sending request…' : 'Send Request'}</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
