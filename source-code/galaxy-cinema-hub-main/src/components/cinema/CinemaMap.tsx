import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface CinemaMapItem {
    id: number;
    name: string;
    address: string;
    lat?: number | string;
    lng?: number | string;
    city?: string;
    hotline?: string;
    total_halls?: number;
    total_seats?: number | string;
}

interface CinemaMapProps {
    cinemas: CinemaMapItem[];
    className?: string;
    selectedCinemaId?: number | null;
    onSelectCinema?: (cinema: CinemaMapItem) => void;
}

const CinemaMap: React.FC<CinemaMapProps> = ({
    cinemas,
    className = '',
    selectedCinemaId,
    onSelectCinema,
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<Map<number, { marker: maplibregl.Marker; popup: maplibregl.Popup; coords: [number, number] }>>(new Map());
    const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const newMap = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
            center: [106.660172, 10.762622], // Center on TP.HCM
            zoom: 12,
            attributionControl: false,
        });

        newMap.addControl(new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');
        newMap.addControl(new maplibregl.FullscreenControl(), 'top-right');

        map.current = newMap;

        return () => {
            newMap.remove();
            map.current = null;
        };
    }, [maptilerKey]);

    // Create & Update Markers strictly using database coords or geocoding API fallback
    useEffect(() => {
        if (!map.current) return;

        // Clean up previous markers
        markersRef.current.forEach(({ marker }) => marker.remove());
        markersRef.current.clear();

        const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
            try {
                const searchAddress = `${address}, Việt Nam`;
                const response = await fetch(
                    `https://api.maptiler.com/geocoding/${encodeURIComponent(searchAddress)}.json?key=${maptilerKey}&limit=1&country=vn`
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

        const renderMarkers = async () => {
            const bounds = new maplibregl.LngLatBounds();
            let validCoordsCount = 0;

            for (const cinema of cinemas) {
                let coords: [number, number] | null = null;

                const lat = parseFloat(String(cinema.lat ?? ''));
                const lng = parseFloat(String(cinema.lng ?? ''));

                // 1. Primary: Use real coordinates from Database API
                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    coords = [lng, lat];
                } else if (cinema.address) {
                    // 2. Fallback: Dynamic Geocoding via MapTiler API
                    coords = await geocodeAddress(cinema.address);
                }

                if (!coords || !map.current) continue;

                validCoordsCount++;
                bounds.extend(coords);

                // Create custom animated pin element
                const el = document.createElement('div');
                el.className = 'galaxy-map-pin-wrapper cursor-pointer';
                el.style.width = '36px';
                el.style.height = '46px';
                el.style.display = 'flex';
                el.style.flexDirection = 'column';
                el.style.alignItems = 'center';
                el.style.position = 'relative';

                el.innerHTML = `
                    <div style="
                        position: absolute;
                        width: 44px;
                        height: 44px;
                        top: -4px;
                        left: -4px;
                        border-radius: 50%;
                        background: rgba(249, 115, 22, 0.25);
                        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                        pointer-events: none;
                    "></div>
                    <div style="
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                        border: 2.5px solid #ffffff;
                        box-shadow: 0 4px 12px rgba(234, 88, 12, 0.45);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #ffffff;
                        font-size: 16px;
                        transition: transform 0.2s ease;
                        position: relative;
                        z-index: 2;
                    ">
                        🎬
                    </div>
                    <div style="
                        width: 0;
                        height: 0;
                        border-left: 6px solid transparent;
                        border-right: 6px solid transparent;
                        border-top: 8px solid #ea580c;
                        margin-top: -1px;
                        position: relative;
                        z-index: 1;
                    "></div>
                `;

                // Hover zoom
                el.addEventListener('mouseenter', () => {
                    const icon = el.querySelector('div:nth-child(2)') as HTMLElement;
                    if (icon) icon.style.transform = 'scale(1.15)';
                });
                el.addEventListener('mouseleave', () => {
                    const icon = el.querySelector('div:nth-child(2)') as HTMLElement;
                    if (icon) icon.style.transform = 'scale(1)';
                });

                // Modern styled popup (strictly address & navigation, NO detail button)
                const popup = new maplibregl.Popup({
                    offset: [0, 95],
                    anchor: 'bottom',
                    closeButton: true,
                    closeOnClick: false,
                    className: 'galaxy-cinema-custom-popup',
                }).setHTML(`
                    <div style="font-family: inherit; padding: 12px 14px; min-width: 220px; max-width: 270px; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <div style="font-weight: 700; font-size: 15px; color: #ffffff; margin-bottom: 6px; line-height: 1.3;">
                            ${cinema.name}
                        </div>
                        <div style="font-size: 12px; color: #94a3b8; line-height: 1.45; margin-bottom: 12px;">
                            ${cinema.address}
                        </div>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(cinema.address)}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; text-align: center; background: #f97316; color: #ffffff; font-size: 12px; font-weight: 600; padding: 8px 12px; border-radius: 8px; text-decoration: none; transition: background 0.2s;">
                            Chỉ đường Google Maps
                        </a>
                    </div>
                `);

                const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                    .setLngLat(coords)
                    .setPopup(popup)
                    .addTo(map.current);

                el.addEventListener('click', () => {
                    if (onSelectCinema) onSelectCinema(cinema);
                });

                markersRef.current.set(cinema.id, { marker, popup, coords });
            }

            // Auto fit bounds if multiple pins exist and no single cinema is selected
            if (!selectedCinemaId && validCoordsCount > 0 && map.current) {
                map.current.fitBounds(bounds, {
                    padding: { top: 60, bottom: 60, left: 60, right: 60 },
                    maxZoom: 13,
                    duration: 800,
                });
            }
        };

        renderMarkers();
    }, [cinemas, maptilerKey, onSelectCinema, selectedCinemaId]);

    // Handle fly to selected cinema
    useEffect(() => {
        if (!map.current || !selectedCinemaId) return;

        const target = markersRef.current.get(selectedCinemaId);
        if (target && map.current) {
            map.current.flyTo({
                center: target.coords,
                zoom: 15.5,
                duration: 1000,
                essential: true,
            });

            // Close all popups
            markersRef.current.forEach(({ popup }) => {
                if (popup.isOpen()) popup.remove();
            });

            // Set coordinates and open popup on the marker
            target.popup.setLngLat(target.coords).addTo(map.current);
        }
    }, [selectedCinemaId]);

    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border shadow-inner">
            <div ref={mapContainer} className={`w-full h-full ${className}`} />
        </div>
    );
};

export default CinemaMap;
