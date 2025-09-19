import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
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

  const updateRestaurantStatus = useCallback(
    (location: GeolocationResponse) => {
      setRestaurants(prevRestaurants => {
        return prevRestaurants.map(restaurant => {
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
            } else if (restaurant.status === 'visiting') {
              const currentTime = Date.now();
              elapsedTime = Math.floor(
                (currentTime - (visitStartTime || currentTime)) / 1000,
              );

              if (elapsedTime >= 30) {
                newStatus = 'visited';
                visitStartTime = undefined;
              }
            }
          } else if (restaurant.status === 'visiting') {
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
      });
    },
    [],
  );

  const startWatchingLocation = useCallback(() => {
    console.log('startWatchingLocation');

    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }

    const locationOptions = {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 5000,
      fastestInterval: 3000,
    };

    if (Platform.OS === 'ios') {
      Object.assign(locationOptions, {
        showsBackgroundLocationIndicator: true,
        activityType: 'otherNavigation',
      });
    }

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
