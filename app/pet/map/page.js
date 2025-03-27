"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import CirclesBackground from "@/components/background";
import Map from "@/components/Map";
import Link from "next/link";

export default function PetMapPage() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("all"); // "all", "lost", "found"
  const [windowWidth, setWindowWidth] = useState(0);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(5);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [locationError, setLocationError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

  // Request user location permission
  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = [position.coords.latitude, position.coords.longitude];
        setUserLocation(location);
        setMapCenter(location);
        setMapZoom(14);
        setLocationPermission("granted");
      },
      (error) => {
        setLocationPermission("denied");
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable it in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("The request to get location timed out.");
            break;
          default:
            setLocationError("An unknown error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    // Check existing geolocation permission
    if (navigator.permissions) {
      navigator.permissions.query({name: 'geolocation'}).then((result) => {
        setLocationPermission(result.state);
        if (result.state === "granted") {
          requestLocationPermission();
        }
      });
    }

    const fetchPets = async () => {
      try {
        const endpoint = view === "all" 
          ? `${BACKEND_API_PORT}/api/auth/pets/locations/`
          : `${BACKEND_API_PORT}/api/auth/pets/${view}/locations/`;
          
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${view} pet data`);
        }

        const data = await response.json();
        setPets(data);
        
        // Calculate center based on markers if available
        if (data.length > 0) {
          const validLocations = data.filter(p => p.latitude && p.longitude);
          if (validLocations.length > 0) {
            const avgLat = validLocations.reduce((sum, p) => sum + parseFloat(p.latitude), 0) / validLocations.length;
            const avgLon = validLocations.reduce((sum, p) => sum + parseFloat(p.longitude), 0) / validLocations.length;
            setMapCenter([avgLat, avgLon]);
            setMapZoom(12);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
    setWindowWidth(window.innerHeight);
  }, [view, BACKEND_API_PORT]);

  return (
    <>
      <CirclesBackground height={windowWidth} />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background2)] to-[var(--backgroundColor)] text-white">
        <main className="flex-1 p-6 mt-20">
          <div className="w-full p-6 rounded-lg shadow-lg relative bg-[var(--backgroundColor)] text-[var(--textColor)] z-10">
            <h1 className="text-2xl font-bold mb-4">Pet Location Map</h1>
            
            {/* Location permission banner */}
            {locationPermission === "prompt" && (
              <div className="p-4 mb-6 rounded-lg bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <p className="font-semibold">Enable location services</p>
                  <p className="text-sm">See pets near your current location</p>
                </div>
                <button
                  onClick={requestLocationPermission}
                  className="py-2 px-4 rounded-lg bg-white text-blue-600 font-medium hover:bg-gray-100"
                >
                  Allow Location
                </button>
              </div>
            )}
            
            {locationPermission === "denied" && (
              <div className="p-4 mb-6 rounded-lg bg-yellow-600 text-white">
                <p className="font-semibold">Location access denied</p>
                <p className="text-sm">{locationError || "Please enable location permissions in your browser settings."}</p>
                <button 
                  onClick={requestLocationPermission}
                  className="mt-2 py-1 px-3 rounded bg-yellow-700 text-white text-sm hover:bg-yellow-800"
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setView("all")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${
                  view === "all"
                    ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                    : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                }`}
              >
                All Pets
              </button>
              <button
                onClick={() => setView("lost")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${
                  view === "lost"
                    ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                    : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                }`}
              >
                Lost Pets
              </button>
              <button
                onClick={() => setView("found")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${
                  view === "found"
                    ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                    : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                }`}
              >
                Found Pets
              </button>
              
              {/* Center on user location button */}
              {userLocation && (
                <button
                  onClick={() => {
                    setMapCenter(userLocation);
                    setMapZoom(14);
                  }}
                  className="py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)]"
                >
                  Center on My Location
                </button>
              )}
              
              <Link
                href="/pet/report"
                className="ml-auto py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)] hover:text-[var(--textColor)]"
              >
                Report Pet
              </Link>
              <Link
                href="/user"
                className="py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)] hover:text-[var(--textColor)]"
              >
                Back to Profile
              </Link>
            </div>
            
            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <p>Loading map data...</p>
              </div>
            ) : error ? (
              <div className="h-96 flex items-center justify-center text-red-500">
                <p>{error}</p>
              </div>
            ) : (
              <div className="h-[60vh] bg-[var(--background2)] rounded-lg overflow-hidden">
                <Map 
                  markers={[
                    ...pets.map(pet => ({
                      ...pet,
                      latitude: parseFloat(pet.latitude),
                      longitude: parseFloat(pet.longitude)
                    })),
                    ...(userLocation ? [{
                      id: "user-location",
                      latitude: userLocation[0],
                      longitude: userLocation[1],
                      animal_name: "Your Location",
                      status: "user",
                      isUserLocation: true
                    }] : [])
                  ]}
                  center={mapCenter} 
                  zoom={mapZoom} 
                  height="100%"
                  onMapClick={(e) => {
                    // Optional: Add click handler if needed
                  }}
                />
              </div>
            )}
            
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Location List</h2>
              
              {pets.length === 0 ? (
                <div className="p-4 rounded-lg bg-[var(--background2)]">
                  <p>No {view === "all" ? "pets" : view + " pets"} with location data available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pets.map((pet) => (
                    <div 
                      key={pet.id} 
                      className="p-4 rounded-lg bg-[var(--background2)] cursor-pointer hover:bg-[var(--primary1)] transition-colors"
                      onClick={() => {
                        setMapCenter([parseFloat(pet.latitude), parseFloat(pet.longitude)]);
                        setMapZoom(16);
                      }}
                    >
                      <div className="font-semibold">{pet.animal_name || `Pet #${pet.id}`}</div>
                      <div>{pet.type} {pet.breed}</div>
                      <div className={`font-medium ${
                        pet.status === 'lost' ? 'text-red-400' : 
                        pet.status === 'found' ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        Status: {pet.status || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-400">
                        Location: {parseFloat(pet.latitude).toFixed(4)}, {parseFloat(pet.longitude).toFixed(4)}
                      </div>
                      <div className="text-sm mt-2">
                        Last seen: {pet.last_seen_date || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}