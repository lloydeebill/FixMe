import React, { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const savedPosition = location => {
    if (location?.latitude == null || location?.longitude == null || location.latitude === '' || location.longitude === '') return null;
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return [latitude, longitude];
};

const icon = color => L.divIcon({
    className: '',
    html: `<span style="display:block;width:20px;height:20px;border:3px solid white;border-radius:50%;background:${color};box-shadow:0 2px 8px #0005"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
});

function FitLocations({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 1) map.fitBounds(positions, { padding: [55, 55], maxZoom: 14 });
        else if (positions.length === 1) map.setView(positions[0], 14);
    }, [map, positions[0]?.join(','), positions[1]?.join(',')]);
    return null;
}

export default function BookingLocationsMap({ serviceLocation, providerLocation }) {
    const service = savedPosition(serviceLocation);
    const provider = savedPosition(providerLocation);
    const positions = [service, provider].filter(Boolean);

    if (!positions.length) return <p className="rounded-xl bg-[#f4f6f8] p-4 text-sm text-[#647084]">No saved coordinates are available for this booking. See the saved address or area above.</p>;

    return <div className="h-48 overflow-hidden rounded-xl border border-[#e3e8ef] sm:h-64" role="img" aria-label="Map of booked job pin and provider saved pin">
        <MapContainer center={positions[0]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {service && <Marker position={service} icon={icon('#0965e8')}><Tooltip permanent direction="top">Booked job pin</Tooltip></Marker>}
            {provider && <Marker position={provider} icon={icon('#257a57')}><Tooltip permanent direction="top">Provider saved pin</Tooltip></Marker>}
            <FitLocations positions={positions} />
        </MapContainer>
    </div>;
}
