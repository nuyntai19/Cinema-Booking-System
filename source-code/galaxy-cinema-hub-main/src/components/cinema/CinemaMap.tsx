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

    const markersRef = useRef<maplibregl.Marker[]>([]);

    useEffect(() => {
        if (!map.current) return;

        const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
            try {
                const response = await fetch(
                    `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${maptilerKey}&limit=1`
                );
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    return data.features[0].center;
                }
                return null;
            } catch (error) {
                console.error("Geocoding error:", error);
                return null;
            }
        };

        const updateMarkers = async () => {
            // Remove existing markers
            markersRef.current.forEach(marker => marker.remove());
            markersRef.current = [];

            const newMarkers: maplibregl.Marker[] = [];

            for (const cinema of cinemas) {
                let coords: [number, number] | null = null;

                if (cinema.lat && cinema.lng) {
                    coords = [cinema.lng, cinema.lat];
                } else {
                    coords = await geocodeAddress(cinema.address);
                }

                if (coords && map.current) {
                    const marker = new maplibregl.Marker({ color: "#e11d48" })
                        .setLngLat(coords)
                        .setPopup(
                            new maplibregl.Popup({ offset: 25 })
                                .setHTML(`<h3>${cinema.name}</h3><p>${cinema.address}</p>`)
                        )
                        .addTo(map.current);
                    newMarkers.push(marker);
                }
            }
            markersRef.current = newMarkers;
        };

        updateMarkers();

        return () => {
            // Clean up markers on unmount
            markersRef.current.forEach(marker => marker.remove());
        };
    }, [cinemas, maptilerKey]);

    return (
        <div ref={mapContainer} className={`w-full h-full rounded-lg ${className}`} />
    );
};

export default CinemaMap;
