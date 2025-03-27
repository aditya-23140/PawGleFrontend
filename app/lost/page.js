"use client";
import { useEffect, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import Image from "next/image";

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const center = { lat: 20.5937, lng: 78.9629 }; // Default to India

const LostPetsMap = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  });

  const [lostPets, setLostPets] = useState([]);

  useEffect(() => {
    const fetchLostPets = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_PORT}/api/lost_pets/`);
      const data = await response.json();
      setLostPets(data);
    };
    fetchLostPets();
  }, []);

  if (!isLoaded) return <div className="text-center text-lg font-semibold text-gray-500">Loading map...</div>;

  return (
    <div className="p-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-white mb-4">Lost Pets Map</h1>
      <GoogleMap mapContainerStyle={mapContainerStyle} zoom={5} center={center}>
        {lostPets.map((pet) => (
          <Marker
            key={pet.id}
            position={{ lat: pet.latitude, lng: pet.longitude }}
            icon={{
              url: "/lost-pet-icon.png",
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={() => alert(`Lost pet: ${pet.pet.name}`)}
          />
        ))}
      </GoogleMap>
    </div>
  );
};

export default LostPetsMap;
