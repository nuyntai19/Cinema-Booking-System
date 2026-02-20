import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Cinema {
    id: number;
    name: string;
    address: string;
    lat?: number;
    lng?: number;
}

interface CinemaMapProps {
    cinemas: Cinema[];
    className?: string;
}

const CinemaMap: React.FC<CinemaMapProps> = ({ cinemas, className }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
            center: [106.660172, 10.762622], // Default to TP.HCM
            zoom: 12,
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [maptilerKey]);

    useEffect(() => {
        if (!map.current) return;

        // Clear existing markers if any (a bit complex with maplibre, usually done by keeping refs)
        // For simplicity, we'll just add markers for now.

        cinemas.forEach((cinema) => {
            // If we have coordinates, use them. Otherwise, we'd need a geocoder.
            // Since we don't have coords in the DB yet, we'll use some mock coords if they match known addresses
            // or just center the map if we find one.

            let coords: [number, number] | null = null;

            // Simple geocoding fallback/mock for demo purposes if coordinates are missing
            if (cinema.lat && cinema.lng) {
                coords = [cinema.lng, cinema.lat];
            } else if (cinema.address.includes("Nguyễn Du")) {
                coords = [106.6946, 10.7711];
            } else if (cinema.address.includes("Tân Bình")) {
                coords = [106.6547, 10.7984];
            } else if (cinema.address.includes("Gò Vấp")) {
                coords = [106.6778, 10.8285];
            }

            if (coords) {
                const marker = new maplibregl.Marker({ color: "#e11d48" })
                    .setLngLat(coords)
                    .setPopup(
                        new maplibregl.Popup({ offset: 25 })
                            .setHTML(`<h3>${cinema.name}</h3><p>${cinema.address}</p>`)
                    )
                    .addTo(map.current!);
            }
        });

        // Fit bounds if there are markers
        if (cinemas.length > 0) {
            // basic zoom to first cinema for now
        }
    }, [cinemas]);

    return (
        <div ref={mapContainer} className={`w-full h-full rounded-lg ${className}`} />
    );
};

export default CinemaMap;
