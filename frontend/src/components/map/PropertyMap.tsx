"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so the map renders client-only.
const PropertyMapInner = dynamic(() => import("@/components/map/PropertyMapInner"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full" />,
});

export function PropertyMap({
  latitude,
  longitude,
  exact = false,
  className = "h-[340px]",
}: {
  latitude: number;
  longitude: number;
  exact?: boolean;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-divider ${className}`}>
      <PropertyMapInner latitude={latitude} longitude={longitude} exact={exact} />
    </div>
  );
}
