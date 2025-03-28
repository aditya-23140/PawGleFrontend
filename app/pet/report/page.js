"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CirclesBackground from "@/components/background";
import Map from "@/components/Map";
import Link from "next/link";
import Footer from "@/components/footer";
import { animalBreeds, animalCategories } from "@/components/AnimalTypes";

export default function ReportPetPage() {
  const router = useRouter();
  const [petData, setPetData] = useState({
    animal_name: "N/A",
    category: "",
    type: "",
    breed: "",
    status: "lost",
    description: "",
    latitude: null,
    longitude: null,
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    last_seen_date: "",
    image: null,
  });
  
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locationPermission, setLocationPermission] = useState("prompt");
  const [locationError, setLocationError] = useState(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");

  const BACKEND_API_PORT = process.env.NEXT_PUBLIC_BACKEND_API_PORT;

  const requestLocationPermission = () => {
    setShowPermissionBanner(false);
    if (!navigator.geolocation) {
      setLocationPermission("denied");
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = [position.coords.latitude, position.coords.longitude];
        setSelectedLocation(userLocation);
        setPetData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        localStorage.setItem("location",userLocation);
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

  const handleMapClick = (e) => {
    setSelectedLocation([e.latlng.lat, e.latlng.lng]);
    setPetData({
      ...petData,
      latitude: e.latlng.lat,
      longitude: e.latlng.lng,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!petData.latitude || !petData.longitude) {
      setError("Please select a location on the map");
      setLoading(false);
      return;
    }

    try {
      // Create FormData object to handle file uploads
      const formData = new FormData();

      // Add all text fields
      Object.keys(petData).forEach(key => {
        if (key !== 'image') {
          formData.append(key, petData[key]);
        }
      });

      // Add the image file if it exists
      if (petData.image) {
        formData.append('image', petData.image);
      }

      const response = await fetch(`${BACKEND_API_PORT}/api/auth/pets/report/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          // Don't set Content-Type header when using FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit report");
      }

      setSuccess(true);
      setPetData({
        animal_name: "",
        category: "",
        type: "",
        breed: "",
        status: "lost",
        description: "",
        latitude: selectedLocation ? selectedLocation[0] : null,
        longitude: selectedLocation ? selectedLocation[1] : null,
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        last_seen_date: "",
        image: null,
      });

      setTimeout(() => {
        router.push('/pet/map');
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for pet data in localStorage
    const storedPetData = localStorage.getItem("petReportData");
    if (storedPetData) {
      try {
        const parsedData = JSON.parse(storedPetData);
        setPetData(prev => ({
          ...prev,
          animal_name: parsedData.name || "N/A",
          type: parsedData.type || "",
          category: parsedData.category || "",
          breed: parsedData.breed || "",
          description: parsedData.additionalInfo?.subNotes?.join(", ") || "",
        }));
        setSelectedCategory(parsedData.category);
        localStorage.removeItem("petReportData");
      } catch (err) {
        console.error("Error parsing stored pet data:", err);
      }
    }

    setWindowWidth(window.innerHeight);

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        if (result.state === "granted") {
          requestLocationPermission();
        }
      });
    }
  }, []);

  return (
    <>
      <CirclesBackground height={windowWidth} />
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[var(--background2)] to-[var(--backgroundColor)] text-white">
        <main className="flex-1 p-6 mt-20">
          <div className="w-full p-6 rounded-lg shadow-lg relative bg-[var(--backgroundColor)] text-[var(--textColor)] z-10">
            <h1 className="text-2xl font-bold mb-4">Report a Pet</h1>

            {showPermissionBanner && locationPermission === "prompt" && (
              <div className="p-4 mb-6 rounded-lg bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <p className="font-semibold">We'd like to use your location</p>
                  <p className="text-sm">This helps us show pets near you and set accurate locations for reports.</p>
                </div>
                <div>
                  <button
                    onClick={requestLocationPermission}
                    className="ml-4 py-2 px-4 rounded-lg bg-white text-blue-600 font-medium hover:bg-gray-100"
                  >
                    Allow Location
                  </button>
                  <button
                    onClick={() => setShowPermissionBanner(false)}
                    className="ml-2 py-2 px-4 rounded-lg bg-transparent border border-white text-white font-medium hover:bg-blue-700"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            )}

            {locationPermission === "denied" && (
              <div className="p-4 mb-6 rounded-lg bg-yellow-600 text-white">
                <p className="font-semibold">Location access denied</p>
                <p className="text-sm">{locationError || "Please enable location permissions in your browser settings to get accurate location data."}</p>
                <button
                  onClick={requestLocationPermission}
                  className="mt-2 py-1 px-3 rounded bg-yellow-700 text-white text-sm hover:bg-yellow-800"
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="flex mb-6">
              <Link
                href="/pet/map"
                className="ml-auto py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primary1)] text-[var(--textColor3)] hover:bg-[var(--primary2)] hover:text-[var(--textColor)]"
              >
                View Pet Map
              </Link>
            </div>

            {success && (
              <div className="p-4 mb-4 rounded-lg bg-green-600 text-white">
                Report submitted successfully! Redirecting to map...
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Pet Information</h2>
                {error && (
                  <div className="p-4 mb-4 rounded-lg bg-red-600 text-white">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">

                  <div>
                    <label className="block mb-1">Pet Name*</label>
                    <input
                      type="text"
                      value={petData.animal_name}
                      onChange={(e) => setPetData({ ...petData, animal_name: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setPetData({ ...petData, category: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                    >
                      <option value="">Select Category</option>
                      {Object.keys(animalCategories).map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Type*</label>
                    <select
                      value={petData.type}
                      onChange={(e) => setPetData({ ...petData, type: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                      required
                    >
                      <option value="">Select Type</option>
                      {selectedCategory &&
                        animalCategories[selectedCategory]?.types.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Breed*</label>
                    <select
                      value={petData.breed}
                      onChange={(e) => setPetData({ ...petData, breed: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                      required
                    >
                      <option value="">Select Breed</option>
                      {petData.type &&
                        animalBreeds[petData.type]?.map((breed) => (
                          <option key={breed} value={breed}>
                            {breed}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Status*</label>
                    <select
                      value={petData.status}
                      onChange={(e) => setPetData({ ...petData, status: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                      required
                    >
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Description</label>
                    <textarea
                      value={petData.description}
                      onChange={(e) => setPetData({ ...petData, description: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                      rows={4}
                      placeholder="Provide details about the pet's appearance, circumstances, etc."
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Pet Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPetData({ ...petData, image: e.target.files[0] })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                    />
                    {petData.image && (
                      <div className="mt-2">
                        <p className="text-sm">Selected image: {petData.image.name}</p>
                      </div>
                    )}
                  </div>
                  {petData.image && (
                    <div className="mt-2 p-2 border rounded-lg">
                      <p className="text-sm mb-2">Selected image:</p>
                      <img
                        src={URL.createObjectURL(petData.image)}
                        alt="Preview"
                        className="max-h-40 rounded-lg"
                      />
                    </div>
                  )}


                  <div>
                    <label className="block mb-1">Last Seen Date</label>
                    <input
                      type="date"
                      value={petData.last_seen_date}
                      onChange={(e) => setPetData({ ...petData, last_seen_date: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={petData.contact_name}
                      onChange={(e) => setPetData({ ...petData, contact_name: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={petData.contact_phone}
                      onChange={(e) => setPetData({ ...petData, contact_phone: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={petData.contact_email}
                      onChange={(e) => setPetData({ ...petData, contact_email: e.target.value })}
                      className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-1">Latitude*</label>
                      <input
                        type="number"
                        step="any"
                        value={petData.latitude || ""}
                        onChange={(e) => setPetData({ ...petData, latitude: parseFloat(e.target.value) })}
                        className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1">Longitude*</label>
                      <input
                        type="number"
                        step="any"
                        value={petData.longitude || ""}
                        onChange={(e) => setPetData({ ...petData, longitude: parseFloat(e.target.value) })}
                        className="w-full p-2 rounded-lg bg-[var(--background2)] text-[var(--textColor)]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2 px-4 rounded-lg shadow-lg transition duration-200 bg-[var(--primaryColor)] text-[var(--textColor3)] hover:bg-[var(--primary1)] hover:text-[var(--textColor)]"
                    >
                      {loading ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </form>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Select Location on Map</h2>
                {locationPermission !== "granted" && (
                  <p className="mb-2 text-yellow-400">
                    {locationPermission === "denied"
                      ? "Location access denied. Click on the map to set location manually."
                      : "Please allow location access for automatic positioning."}
                  </p>
                )}

                <div className="h-96 bg-[var(--background2)] rounded-lg overflow-hidden">
                  <Map
                    markers={selectedLocation ? [
                      {
                        id: "temp",
                        latitude: selectedLocation[0],
                        longitude: selectedLocation[1],
                        animal_name: petData.animal_name || "Report Location",
                        status: petData.status
                      }
                    ] : []}
                    center={selectedLocation || [51.505, -0.09]}
                    zoom={selectedLocation ? 14 : 2}
                    height="100%"
                    onMapClick={handleMapClick}
                  />
                </div>

                {selectedLocation && (
                  <div className="mt-4 p-3 rounded-lg bg-[var(--background2)]">
                    <p>Selected coordinates:</p>
                    <p className="font-mono">
                      Lat: {selectedLocation[0].toFixed(6)}, Lon: {selectedLocation[1].toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}