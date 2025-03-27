// File: components/Map.js
"use client";

import { useEffect, useRef, useState } from 'react';

const Map = ({ markers = [], center = [0, 0], zoom = 13, height = "500px", onMapClick }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // First check if window is available (client-side only)
    if (typeof window === "undefined") return;
    
    // Dynamically import Leaflet to avoid SSR issues
    const loadLeaflet = async () => {
      try {
        // Import both leaflet and its CSS
        const leafletModule = await import('leaflet');
        const L = leafletModule.default || leafletModule;
        
        // Import CSS manually if needed
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = '';
          document.head.appendChild(link);
        }
        
        // Fix for default marker icon in Leaflet with Next.js
        if (!mapLoaded) {
          delete L.Icon.Default.prototype._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
          setMapLoaded(true);
        }

        if (!mapInstanceRef.current && mapRef.current) {
          // Initialize map
          const map = L.map(mapRef.current).setView(center, zoom);
          
          // Add tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(map);
          
          // Add click handler if provided
          if (onMapClick) {
            map.on('click', onMapClick);
          }
          
          mapInstanceRef.current = map;
        }
        
        // Update map center and zoom if changed
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(center, zoom);
          
          // Clear existing markers
          mapInstanceRef.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
              mapInstanceRef.current.removeLayer(layer);
            }
          });
          
          // Add markers
          markers.forEach((marker) => {
            if (marker.latitude && marker.longitude) {
              const markerInstance = L.marker([marker.latitude, marker.longitude]).addTo(mapInstanceRef.current);
              
              // Create popup content
              const popupContent = `
                <div>
                  <strong>${marker.animal_name || 'Unknown'}</strong><br>
                  ${marker.type || ''} ${marker.breed || ''}<br>
                  Status: ${marker.status || 'Unknown'}<br>
                  ${marker.id ? `ID: ${marker.id}` : ''}
                </div>
              `;
              
              markerInstance.bindPopup(popupContent);
            }
          });
        }
      } catch (err) {
        console.error("Error loading Leaflet:", err);
      }
    };
    
    loadLeaflet();
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers, center, zoom, mapLoaded, onMapClick]);

  return <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.5rem' }} />;
};

export default Map;