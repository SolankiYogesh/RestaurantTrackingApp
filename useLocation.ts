// useLocation.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';
import DATA from './DATA';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Restaurant {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: 'never' | 'visiting' | 'visited';
  visitStartTime?: number;
  elapsedTime?: number;
}

const useLocation = () => {
  const [currentLocation, setCurrentLocation] =
    useState<GeolocationResponse | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(
    DATA as Restaurant[],
  );
  const [radius, setRadius] = useState(100);
  const radiusRef = useRef(100);
  const [watchId, setWatchId] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Start timer to update elapsed time every second
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setRestaurants(prevRestaurants => {
        const hasVisiting = prevRestaurants.some(r => r.status === 'visiting');

        if (!hasVisiting) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return prevRestaurants;
        }

        return prevRestaurants.map(restaurant => {
          if (restaurant.status === 'visiting' && restaurant.visitStartTime) {
            const elapsedTime = Math.floor(
              (Date.now() - restaurant.visitStartTime) / 1000,
            );

            if (elapsedTime >= 120) {
              // Time's up - mark as visited
              return {
                ...restaurant,
                status: 'visited',
                elapsedTime: 120,
                visitStartTime: undefined,
              };
            }

            return {
              ...restaurant,
              elapsedTime,
            };
          }
          return restaurant;
        });
      });
    }, 1000);
  }, []);

  const updateRestaurantStatus = useCallback(
    (location: GeolocationResponse) => {
      setRestaurants(prevRestaurants => {
        let hasVisiting = false;

        const updatedRestaurants = prevRestaurants.map(restaurant => {
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            restaurant.latitude,
            restaurant.longitude,
          );

          let newStatus = restaurant.status;
          let visitStartTime = restaurant.visitStartTime;
          let elapsedTime = restaurant.elapsedTime || 0;

          if (distance <= radiusRef.current) {
            if (restaurant.status === 'never') {
              newStatus = 'visiting';
              visitStartTime = Date.now();
              elapsedTime = 0;
              hasVisiting = true;
            } else if (restaurant.status === 'visiting') {
              hasVisiting = true;
              // Keep the existing visitStartTime and let the timer handle elapsedTime
            }
          } else if (restaurant.status === 'visiting') {
            // Left the area while visiting
            newStatus = 'never';
            visitStartTime = undefined;
            elapsedTime = 0;
          }

          return {
            ...restaurant,
            status: newStatus,
            visitStartTime,
            elapsedTime,
          };
        });

        // Start/stop timer based on whether any restaurant is being visited
        if (hasVisiting && !timerRef.current) {
          startTimer();
        } else if (!hasVisiting && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        return updatedRestaurants;
      });
    },
    [startTimer],
  );

  const startWatchingLocation = useCallback(() => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }

    const locationOptions = {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 5000,
      fastestInterval: 3000,
    };

    const id = Geolocation.watchPosition(
      position => {
        setCurrentLocation(position);
        updateRestaurantStatus(position);
      },
      error => {
        console.log('Error watching location:', error);
        if (error.code !== error.PERMISSION_DENIED) {
          setTimeout(startWatchingLocation, 5000);
        }
        setCurrentLocation(state => {
          if (!state) {
            return {
              coords: {
                latitude: 22.2703,
                longitude: 70.761,
              },
            } as GeolocationResponse;
          } else {
            return state;
          }
        });
      },
      locationOptions,
    );

    setWatchId(id);
  }, [watchId, updateRestaurantStatus]);

  useEffect(() => {
    AsyncStorage.getItem('RADIUS').then(rad => {
      const getRadius = rad ? +rad : 100;
      if (getRadius) {
        radiusRef.current = getRadius;
        setRadius(getRadius);
        startWatchingLocation();
      }
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetVisits = (id?: string) => {
    if (id) {
      setRestaurants(prev =>
        prev.map(restaurant =>
          restaurant.id === id
            ? {
                ...restaurant,
                status: 'never',
                visitStartTime: undefined,
                elapsedTime: 0,
              }
            : restaurant,
        ),
      );
    } else {
      setRestaurants(prev =>
        prev.map(restaurant => ({
          ...restaurant,
          status: 'never',
          visitStartTime: undefined,
          elapsedTime: 0,
        })),
      );

      // Stop timer when resetting all
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const onRadiusUpdate = useCallback(
    (value: number) => {
      radiusRef.current = value;
      setRadius(value);
      startWatchingLocation();
      AsyncStorage.setItem('RADIUS', value.toString());
    },
    [startWatchingLocation],
  );

  return {
    currentLocation,
    restaurants,
    radius,
    setRadius: onRadiusUpdate,
    resetVisits,
  };
};

export default useLocation;
