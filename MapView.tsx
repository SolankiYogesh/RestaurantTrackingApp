// MapView.tsx
import { GeolocationResponse } from '@react-native-community/geolocation';
import { memo } from 'react';
import { Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import DATA from './DATA';

const height = Dimensions.get('window').height * 0.35;

interface Props {
  location: GeolocationResponse;
  radius: number;
}

export default memo(({ location, radius }: Props) => {
  return (
    <MapView
      style={{ width: '100%', height }}
      initialRegion={{
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      followsUserLocation
      showsUserLocation
      showsMyLocationButton
      showsCompass
      zoomEnabled
      zoomControlEnabled
    >
      <Circle
        center={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }}
        radius={radius}
        fillColor="rgba(100, 200, 240, 0.2)"
        strokeColor="rgba(100, 200, 240, 0.8)"
        strokeWidth={2}
      />

      {DATA.map(restaurant => (
        <Marker
          key={restaurant.id}
          coordinate={{
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
          }}
          title={restaurant.name}
          description={`Status: ${restaurant.status}`}
          pinColor={
            restaurant.status === 'visited'
              ? 'green'
              : restaurant.status === 'visiting'
              ? 'orange'
              : 'red'
          }
        />
      ))}
    </MapView>
  );
});
