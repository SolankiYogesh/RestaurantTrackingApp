// RestaurantItem.tsx
import { memo, useEffect, useRef } from 'react';
import { Restaurant } from './useLocation';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';

interface Props {
  item: Restaurant;
  onReset: (id: string) => void;
}

export default memo(({ item, onReset }: Props) => {
  const status =
    item.status === 'visiting'
      ? '⏳ Visiting'
      : item.status === 'visited'
      ? '✅ Visited'
      : '❌ Not Visited';

  const statusColor =
    item.status === 'visiting'
      ? 'orange'
      : item.status === 'visited'
      ? 'green'
      : '#888';

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Animation for status changes
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate when status changes to visiting or visited
    if (item.status === 'visiting' || item.status === 'visited') {
      // Pulse animation for visiting status
      if (item.status === 'visiting') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.03,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }

      // Scale animation for status changes
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      pulseAnim.setValue(1);
      scaleAnim.setValue(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.status]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale: scaleAnim }],
          opacity: pulseAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={[styles.status, { color: statusColor }]}>{status}</Text>

          {item.status === 'visiting' && (
            <>
              <Text style={styles.timer}>
                Time: {formatTime(item.elapsedTime || 0)} / 0:30
              </Text>
              <Text style={styles.hint}>Scrolls to view when active</Text>
            </>
          )}
        </View>

        {item.status === 'visited' && (
          <TouchableOpacity
            style={[styles.resetButton]}
            onPress={() => onReset(item.id)}
          >
            <Text style={styles.resetText}>↺</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#333',
  },
  status: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  timer: {
    fontSize: 14,
    color: 'orange',
    fontWeight: '500',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  resetButton: {
    backgroundColor: '#FF6B6B',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  resetText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
