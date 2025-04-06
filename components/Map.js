"use client";

import { useEffect, useRef, useState } from 'react';

const Map = ({ 
  markers = [], 
  center, 
  zoom = 13, 
  height = "500px", 
  onMapClick, 
  onMarkerClick,
  isDark = true // Add this prop with default value
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const prevCenterRef = useRef(center);
  const prevZoomRef = useRef(zoom);

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
            
            /* Dark mode styles for map tiles */
            .map-tiles-dark {
              filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
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
          
          // Add tile layer with appropriate class for dark mode
          const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            className: isDark ? 'map-tiles-dark' : '' // Apply dark mode class if isDark is true
          }).addTo(map);
          
          // Add click handler if provided
          if (onMapClick) {
            map.on('click', onMapClick);
          }
          
          mapInstanceRef.current = map;
        }
        
        // Check if center or zoom has changed and update the map view
        if (mapInstanceRef.current) {
          // Compare current center with previous center
          const centerChanged = 
            !prevCenterRef.current || 
            center[0] !== prevCenterRef.current[0] || 
            center[1] !== prevCenterRef.current[1];
          
          // Compare current zoom with previous zoom
          const zoomChanged = zoom !== prevZoomRef.current;
          
          // If either center or zoom changed, update the map view
          if (centerChanged || zoomChanged) {
            mapInstanceRef.current.setView(center, zoom, {
              animate: true,
              duration: 1
            });
            
            // Update refs to current values
            prevCenterRef.current = center;
            prevZoomRef.current = zoom;
          }
          
          // Update tile layer dark mode if isDark changed
          mapInstanceRef.current.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
              // Remove existing tile layer
              mapInstanceRef.current.removeLayer(layer);
              
              // Add new tile layer with appropriate class
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                className: isDark ? 'map-tiles-dark' : ''
              }).addTo(mapInstanceRef.current);
            }
          });
          
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
                return;
                // iconUrl = '/markers/marker.png'; // Use your custom marker image
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
  }, [markers, center, zoom, mapLoaded, onMapClick, onMarkerClick, isDark]); // Add isDark to dependency array

  return (
    <div ref={mapRef} style={{ height, width: '100%', borderRadius: '0.5rem' }}>
      <div className="text-sm text-gray-400 mb-2">
        Today is: Saturday, April 05, 2025, 11:23 AM IST
      </div>
    </div>
  );
};

export default Map;
