import { useEffect, useState } from "react";

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number} | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            setError(error.message);
          }
        );
      }
    };

    getLocation();
  }, []);

  return { location, error };
}