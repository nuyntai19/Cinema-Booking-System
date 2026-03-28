import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface LocationPickerMapProps {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
    className?: string;
    addressToSearch?: string;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ lat, lng, onChange, className, addressToSearch }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);
    const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;

    // Use HCMC as default center if no lat/lng
    const defaultLng = 106.660172;
    const defaultLat = 10.762622;

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearchAddress = async () => {
        if (!addressToSearch || !maptilerKey) return;
        
        setIsSearching(true);
        try {
            const searchStr = `${addressToSearch}, Việt Nam`;
            const response = await fetch(
                `https://api.maptiler.com/geocoding/${encodeURIComponent(searchStr)}.json?key=${maptilerKey}&limit=1&country=vn`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
                const [newLlng, newLlat] = data.features[0].center;
                onChange(newLlat, newLlng);
            } else {
                alert("Không tìm thấy kết quả tự động từ địa chỉ nhập. Vui lòng chấm tay trên bản đồ.");
            }
        } catch (error) {
            console.error("Geocoding map error:", error);
            alert("Đã có lỗi xảy ra khi tự động tìm địa chỉ.");
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        const initialLng = lng !== null ? lng : defaultLng;
        const initialLat = lat !== null ? lat : defaultLat;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
            center: [initialLng, initialLat],
            zoom: lat !== null ? 15 : 11, // Zoom closer if we already have a location
        });

        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Add a marker if we already have valid lat/lng
        if (lat !== null && lng !== null) {
            markerRef.current = new maplibregl.Marker({ color: "#e11d48", draggable: true })
                .setLngLat([lng, lat])
                .addTo(map.current);
            
            // Listen to marker drag events
            markerRef.current.on('dragend', () => {
                if (markerRef.current) {
                    const newLngLat = markerRef.current.getLngLat();
                    onChange(newLngLat.lat, newLngLat.lng);
                }
            });
        }

        // Add click event to map to set or move the marker
        map.current.on('click', (e) => {
            const { lng: clickLng, lat: clickLat } = e.lngLat;
            
            if (markerRef.current) {
                // Move existing marker
                markerRef.current.setLngLat([clickLng, clickLat]);
            } else if (map.current) {
                // Create new marker
                markerRef.current = new maplibregl.Marker({ color: "#e11d48", draggable: true })
                    .setLngLat([clickLng, clickLat])
                    .addTo(map.current);
                
                // Add drag listener to the new marker
                markerRef.current.on('dragend', () => {
                    if (markerRef.current) {
                        const newLngLat = markerRef.current.getLngLat();
                        onChange(newLngLat.lat, newLngLat.lng);
                    }
                });
            }
            
            onChange(clickLat, clickLng);
        });

        setIsInitialLoad(false);

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [maptilerKey]);

    // Handle prop updates for map center when address might be typed (if implemented)
    // or when the popup re-opens with different lat/lng
    useEffect(() => {
        if (!isInitialLoad && map.current) {
            if (lat !== null && lng !== null) {
                // If there's an existing marker, move it, else create
                if (markerRef.current) {
                    // Only move it if it's actually completely different to avoid snapbacks during drag
                    const currentPos = markerRef.current.getLngLat();
                    if (Math.abs(currentPos.lat - lat) > 0.0001 || Math.abs(currentPos.lng - lng) > 0.0001) {
                        markerRef.current.setLngLat([lng, lat]);
                        map.current.flyTo({ center: [lng, lat], zoom: 15 });
                    }
                } else {
                    markerRef.current = new maplibregl.Marker({ color: "#e11d48", draggable: true })
                        .setLngLat([lng, lat])
                        .addTo(map.current);
                        
                    markerRef.current.on('dragend', () => {
                        if (markerRef.current) {
                            const newLngLat = markerRef.current.getLngLat();
                            onChange(newLngLat.lat, newLngLat.lng);
                        }
                    });
                    map.current.flyTo({ center: [lng, lat], zoom: 15 });
                }
            } else {
                // If lat/lng becomes null (form reset), remove marker
                if (markerRef.current) {
                    markerRef.current.remove();
                    markerRef.current = null;
                }
                map.current.flyTo({ center: [defaultLng, defaultLat], zoom: 11 });
            }
        }
    }, [lat, lng, isInitialLoad]);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                <div className="flex items-center gap-2">
                    <span>Chọn vị trí chính xác trên màn hình:</span>
                    {addressToSearch && (
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs px-2"
                            onClick={handleSearchAddress}
                            disabled={isSearching}
                        >
                            {isSearching ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Search className="w-3 h-3 mr-1" />}
                            Tìm và ghim từ địa chỉ
                        </Button>
                    )}
                </div>
                {(lat !== null && lng !== null) ? (
                    <span className="text-primary font-mono text-xs">Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}</span>
                ) : (
                    <span className="italic">Chưa có tọa độ (Click để chọn)</span>
                )}
            </div>
            <div ref={mapContainer} className="w-full h-[300px] rounded-md border shadow-sm z-0" />
            <p className="text-xs text-muted-foreground mt-1 italic">
                * Click vào vị trí bạn muốn hoặc kéo thả <span className="text-red-500 font-bold">Pin đỏ</span> để thay đổi tọa độ.
            </p>
        </div>
    );
};

export default LocationPickerMap;
