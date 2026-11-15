import React from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const icon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

function PinClick({ onChange }) {
    useMapEvents({ click: event => onChange(event.latlng.lat, event.latlng.lng) });
    return null;
}

function MapCenter({ center }) {
    const map = useMap();
    React.useEffect(() => { map.setView(center); }, [map, center[0], center[1]]);
    return null;
}

export default function JobPinPicker({ latitude, longitude, accountLocation, onChange }) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const hasPin = latitude !== null && latitude !== '' && longitude !== null && longitude !== '' && Number.isFinite(lat) && Number.isFinite(lng);
    const center = hasPin ? [lat, lng] : accountLocation?.latitude != null && accountLocation?.longitude != null
        ? [Number(accountLocation.latitude), Number(accountLocation.longitude)] : [8.96, 125.45];

    return <div>
        <p className="mb-2 text-xs text-[#647084]">{hasPin ? 'Drag the pin or tap the map to adjust this job location.' : accountLocation?.latitude != null && accountLocation?.longitude != null ? 'Map centered on your saved account location. Tap to choose the job pin; it is not selected automatically.' : 'Tap the map to choose this job’s pin.'}</p>
        <div className="h-48 overflow-hidden rounded-xl border border-[#e3e8ef]">
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                <PinClick onChange={onChange} />
                <MapCenter center={center} />
                {hasPin && <Marker position={[lat, lng]} icon={icon} draggable eventHandlers={{ dragend: event => { const point = event.target.getLatLng(); onChange(point.lat, point.lng); } }} />}
            </MapContainer>
        </div>
    </div>;
}
