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
  const [selectedPet, setSelectedPet] = useState(null);

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
        switch (error.code) {
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
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
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
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${view === "all"
                  ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                  : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                  }`}
              >
                All Pets
              </button>
              <button
                onClick={() => setView("lost")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${view === "lost"
                  ? "bg-[var(--primaryColor)] text-[var(--textColor3)]"
                  : "bg-[var(--background2)] text-[var(--textColor)] hover:bg-[var(--primary1)]"
                  }`}
              >
                Lost Pets
              </button>
              <button
                onClick={() => setView("found")}
                className={`py-2 px-4 rounded-lg shadow-lg transition duration-200 ${view === "found"
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
                      longitude: parseFloat(pet.longitude),
                      // Remove ID from what's displayed in popup
                      image: pet.image_url || null // Add image URL to marker data
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
                  onMarkerClick={(pet) => {
                    // Handle marker click - could set selected pet state
                    setSelectedPet(pet);
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
                          setSelectedPet(pet);
                        }}
                      >
                        <div className="flex space-x-3">
                          {pet.image_url && (
                            <div className="w-20 h-20 flex-shrink-0">
                              <img
                                src={pet.image_url}
                                alt={pet.animal_name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{pet.animal_name}</div>
                            <div>{pet.type} {pet.breed}</div>
                            <div className={`font-medium ${pet.status === 'lost' ? 'text-red-400' :
                                pet.status === 'found' ? 'text-green-400' : 'text-gray-400'
                              }`}>
                              Status: {pet.status || 'Unknown'}
                            </div>
                            <div className="text-sm mt-2">
                              {pet.last_seen_date ? `Last seen: ${pet.last_seen_date}` : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                </div>
              )}
            </div>
          </div>
          {selectedPet && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[var(--backgroundColor)] p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-bold text-black">{selectedPet.animal_name}</h3>
                    <button
                      onClick={() => setSelectedPet(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedPet.image_url && (
                    <div className="mb-4">
                      <img
                        src={selectedPet.image_url}
                        alt={selectedPet.animal_name}
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-black">
                    <p><span className="font-semibold">Type:</span> {selectedPet.type}</p>
                    <p><span className="font-semibold">Breed:</span> {selectedPet.breed}</p>
                    <p><span className="font-semibold">Category:</span> {selectedPet.category}</p>
                    <p className={`font-medium ${selectedPet.status === 'lost' ? 'text-red-400' :
                      selectedPet.status === 'found' ? 'text-green-400' : 'text-gray-400'
                      }`}>
                      <span className="font-semibold">Status:</span> {selectedPet.status}
                    </p>
                    {selectedPet.description && (
                      <p><span className="font-semibold">Description:</span> {selectedPet.description}</p>
                    )}
                    {selectedPet.last_seen_date && (
                      <p><span className="font-semibold">Last seen:</span> {selectedPet.last_seen_date}</p>
                    )}
                    {selectedPet.contact_name && (
                      <p><span className="font-semibold">Contact:</span> {selectedPet.contact_name}</p>
                    )}
                    {selectedPet.contact_phone && (
                      <p><span className="font-semibold">Phone:</span> {selectedPet.contact_phone}</p>
                    )}
                    {selectedPet.contact_email && (
                      <p><span className="font-semibold">Email:</span> {selectedPet.contact_email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
        </main>
        <Footer />
      </div>
    </>
  );
}