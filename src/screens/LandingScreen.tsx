import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REDIRECT_DELAY_MS = 6000;

type Props = {
  onFinish: () => void;
};

export default function LandingScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: REDIRECT_DELAY_MS,
      useNativeDriver: false,
    });
    animation.start();

    const timer = setTimeout(onFinish, REDIRECT_DELAY_MS);
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [onFinish, progress]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      onPress={onFinish}
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar style="dark" />

      {/* Image wrapper to lock bar coordinates directly to image bounds */}
      <View style={styles.imageWrapper}>
        <Image
          source={require('../../assets/landing-page.png')}
          style={styles.hero}
          resizeMode="stretch"
        />

        {/*
          Exact overlay on top of the image's loader bar:
          Positioned directly relative to image:
          - Top: 88.55% (moved slightly down to perfectly match the real loader in the image)
          - Left: 31.05%, Width: 37.89%, Height: 0.95%
          - Track: #E4E9EF, Bar: #FDCE02
        */}
        <View style={styles.barContainer} pointerEvents="none">
          <Animated.View style={[styles.barFill, { width: barWidth }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FDFBF6',
  },
  imageWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  barContainer: {
    position: 'absolute',
    top: '88.20%',
    left: '30.95%',
    width: '38.10%',
    height: '1.05%',
    backgroundColor: '#E4E9EF',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FDCE02',
    borderRadius: 6,
  },
});
