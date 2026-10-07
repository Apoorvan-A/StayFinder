"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: `<span class="sf-pin"></span>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

export default function PropertyMapInner({
  latitude,
  longitude,
  exact,
}: {
  latitude: number;
  longitude: number;
  exact: boolean;
}) {
  const center: [number, number] = [latitude, longitude];
  return (
    <MapContainer
      center={center}
      zoom={exact ? 15 : 14}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={center} icon={pinIcon} />
    </MapContainer>
  );
}
