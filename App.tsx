// App.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import MapView from './MapView';
import useLocation from './useLocation';
import RestaurantItem from './RestaurantItem';

const App = () => {
  const { restaurants, resetVisits, currentLocation, radius, setRadius } =
    useLocation();
  const flatListRef = useRef<FlatList>(null);
  const [prevRestaurants, setPrevRestaurants] = useState(restaurants);
  const [radiusInput, setRadiusInput] = useState(String(radius));

  const handleResetAll = () => {
    resetVisits();
  };

  const handleResetItem = (id: string) => {
    resetVisits(id);
  };

  const handleRadiusChange = (text: string) => {
    setRadiusInput(text);
    const newRadius = parseInt(text, 10);
    if (!isNaN(newRadius) && newRadius > 0) {
      setRadius(newRadius);
    }
  };

  useEffect(() => {
    const changedRestaurants = restaurants.filter((restaurant, index) => {
      if (index >= prevRestaurants.length) return false;
      return restaurant.status !== prevRestaurants[index].status;
    });

    const importantChange = changedRestaurants.find(
      restaurant =>
        restaurant.status === 'visiting' || restaurant.status === 'visited',
    );

    if (importantChange && flatListRef.current) {
      const index = restaurants.findIndex(r => r.id === importantChange.id);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 300);
      }
    }

    setPrevRestaurants(restaurants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {!currentLocation ? (
          <ActivityIndicator
            style={{
              flex: 1,
            }}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <MapView location={currentLocation} radius={radius} />

            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>Radius (meters):</Text>
              <TextInput
                style={styles.radiusInput}
                value={radiusInput}
                onChangeText={handleRadiusChange}
                keyboardType="numeric"
              />
            </View>

            <FlatList
              ref={flatListRef}
              data={restaurants}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <RestaurantItem item={item} onReset={handleResetItem} />
              )}
              contentContainerStyle={styles.listContent}
              onScrollToIndexFailed={info => {
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }, 100);
              }}
            />

            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={styles.resetAllButton}
                onPress={handleResetAll}
              >
                <Text style={styles.resetAllText}>Reset All Visits</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  radiusLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  resetAllButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  resetAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
