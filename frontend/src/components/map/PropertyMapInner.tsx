"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";

const exactIcon = L.divIcon({
  className: "",
  html: `<span class="sf-pin"></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
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
      zoom={exact ? 15 : 13}
      scrollWheelZoom={false}
      className="h-full w-full"
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {exact ? (
        <Marker position={center} icon={exactIcon} />
      ) : (
        // Public listing: show the general area as a circle, not an exact pin.
        <Circle
          center={center}
          radius={900}
          pathOptions={{ color: "#E8505B", fillColor: "#E8505B", fillOpacity: 0.12, weight: 1.5 }}
        />
      )}
    </MapContainer>
  );
}
