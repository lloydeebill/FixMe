import React, { useState } from 'react';
import JobPinPicker from './JobPinPicker';

const hours = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`);

export default function JobContextFields({ value, onChange, pilotAreas = {}, accountLocation }) {
    const [showMap, setShowMap] = useState(false);
    const update = patch => onChange(current => ({ ...current, ...patch }));
    const hasSavedPin = accountLocation?.latitude != null && accountLocation?.longitude != null;

    return <section aria-label="Job location and time" className="rounded-2xl border border-[#d7e6fb] bg-white p-4 text-sm text-[#172335]">
        <h3 className="font-semibold">Where is this job?</h3>
        <p className="mt-1 text-xs text-[#647084]">Choose the area where the work will happen. Providers choose the areas they serve.</p>
        <label className="mt-3 block text-xs font-semibold" htmlFor="job-area">Job area</label>
        <select id="job-area" value={value.area} onChange={event => update({ area: event.target.value })} className="mt-1 w-full rounded-xl border border-[#dce3ed] bg-white p-2.5 text-sm">
            <option value="">Choose a pilot area</option>
            {Object.entries(pilotAreas).map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
        </select>
        {value.area && <>
            <label className="mt-3 block text-xs font-semibold" htmlFor="job-address">Job address or landmark</label>
            <input id="job-address" value={value.address} onChange={event => update({ address: event.target.value, latitude: null, longitude: null })} placeholder="Enter the service address for booking" className="mt-1 w-full rounded-xl border border-[#dce3ed] p-2.5 text-sm" />
            <div className="mt-3 flex flex-wrap gap-2">
                {hasSavedPin && <button type="button" onClick={() => { update({ address: accountLocation.address || value.address, latitude: Number(accountLocation.latitude), longitude: Number(accountLocation.longitude) }); setShowMap(true); }} className="rounded-lg border border-[#cbdcf6] px-3 py-2 text-xs font-semibold text-[#0965e8]">Start from saved account pin (edit on map)</button>}
                <button type="button" onClick={() => setShowMap(open => !open)} className="rounded-lg border border-[#cbdcf6] px-3 py-2 text-xs font-semibold text-[#0965e8]">{showMap ? 'Hide map' : 'Set job pin on map'}</button>
                {value.latitude != null && value.longitude != null && <button type="button" onClick={() => update({ latitude: null, longitude: null })} className="rounded-lg border border-[#e3e8ef] px-3 py-2 text-xs">Clear pin</button>}
            </div>
            {showMap && <div className="mt-3"><JobPinPicker latitude={value.latitude} longitude={value.longitude} accountLocation={accountLocation} onChange={(latitude, longitude) => update({ latitude, longitude })} /></div>}
            <p className="mt-2 text-xs text-[#647084]">{value.latitude != null && value.longitude != null ? 'Job pin selected. Distance is approximate straight-line distance.' : 'Distance unavailable until you select a job pin.'}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold">Requested date (optional)<input type="date" value={value.date} onChange={event => update({ date: event.target.value })} className="mt-1 w-full rounded-xl border border-[#dce3ed] p-2 text-sm" /></label>
                <label className="text-xs font-semibold">Time (Philippine time)<select value={value.time} onChange={event => update({ time: event.target.value })} className="mt-1 w-full rounded-xl border border-[#dce3ed] bg-white p-2 text-sm"><option value="">Not selected</option>{hours.map(hour => <option key={hour} value={hour}>{hour}</option>)}</select></label>
            </div>
            <p className="mt-2 text-xs text-[#647084]">Availability is assessed only when both date and time are selected.</p>
        </>}
    </section>;
}
