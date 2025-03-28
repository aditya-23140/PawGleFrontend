"use client";

import { useEffect, useRef, useState } from 'react';

const Map = ({ markers = [], center = [0, 0], zoom = 13, height = "500px", onMapClick, onMarkerClick }) => {
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
        
        // Add custom popup styles
        if (!document.getElementById('custom-popup-styles')) {
          const style = document.createElement('style');
          style.id = 'custom-popup-styles';
          style.textContent = `
            .custom-popup .popup-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 5px;
            }
            .custom-popup .popup-image {
              width: 100%;
              margin: 5px 0;
              text-align: center;
            }
            .custom-popup .popup-image img {
              max-width: 150px;
              max-height: 150px;
              border-radius: 4px;
            }
            .custom-popup .popup-status {
              font-weight: 500;
              margin-bottom: 5px;
            }
            .custom-popup .popup-status.lost {
              color: #f87171;
            }
            .custom-popup .popup-status.found {
              color: #4ade80;
            }
            .custom-popup .popup-details {
              font-size: 12px;
              color: #6b7280;
            }
          `;
          document.head.appendChild(style);
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
              // Create custom icon based on status
              let iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
              if (marker.status === 'lost') {
                iconUrl = '/markers/lost-marker.png'; // Use your custom marker image
              } else if (marker.status === 'found') {
                iconUrl = '/markers/found-marker.png'; // Use your custom marker image
              } else if (marker.status === 'user') {
                iconUrl = '/markers/marker.png'; // Use your custom marker image
              }
              
              const customIcon = new L.Icon({
                iconUrl: iconUrl,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                shadowSize: [41, 41]
              });
              
              const markerInstance = L.marker(
                [marker.latitude, marker.longitude], 
                { icon: customIcon }
              ).addTo(mapInstanceRef.current);
              
              // Create popup content with image if available
              const popupContent = document.createElement('div');
              popupContent.className = 'custom-popup';
              
              let content = `<div class="popup-title">${marker.animal_name || 'Unknown'}</div>`;
              
              // Add image if available
              if (marker.image_url) {
                content += `<div class="popup-image">
                  <img src="${marker.image_url}" alt="${marker.animal_name || 'Pet'}" />
                </div>`;
              }
              
              content += `<div class="popup-status ${marker.status}">${marker.status || 'Unknown'}</div>`;
              
              if (marker.type || marker.breed) {
                content += `<div class="popup-details">${marker.type || ''} ${marker.breed || ''}</div>`;
              }
              
              popupContent.innerHTML = content;
              markerInstance.bindPopup(popupContent);
              
              // Add click handler for marker if provided
              if (onMarkerClick && !marker.isUserLocation) {
                markerInstance.on('click', () => {
                  onMarkerClick(marker);
                });
              }
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
  }, [markers, center, zoom, mapLoaded, onMapClick, onMarkerClick]);

  return (
    <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.5rem' }}>
      <div className="text-sm text-gray-400 mb-2">
        Today is: Friday, March 28, 2025, 1:45 PM IST
      </div>
    </div>
  );
};

export default Map;
