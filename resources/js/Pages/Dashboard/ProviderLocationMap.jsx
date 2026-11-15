import React from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const marker = L.divIcon({
    className: '',
    html: '<span style="display:block;width:22px;height:22px;border:4px solid white;border-radius:50%;background:#0965e8;box-shadow:0 2px 8px #0005"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

export default function ProviderLocationMap({ location }) {
    if (location?.latitude == null || location?.longitude == null
        || location.latitude === '' || location.longitude === '') return null;
    const latitude = Number(location?.latitude);
    const longitude = Number(location?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
        || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

    const position = [latitude, longitude];
    return <div className="h-48 overflow-hidden rounded-2xl border border-gray-200" aria-label="Saved provider service location map">
        <MapContainer center={position} zoom={14} scrollWheelZoom={false} className="h-full w-full" key={`${latitude},${longitude}`}>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position} icon={marker} />
        </MapContainer>
    </div>;
}
