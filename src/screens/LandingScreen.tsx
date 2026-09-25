import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REDIRECT_DELAY_MS = 6000;

const landingImageSource = require('../../assets/landing-page.png');
// Native pixel size of the source image (1080x2340, ~9:19.5 — matches most
// phone screens closely). Used to replicate the same crop math that
// resizeMode="cover" applies, so the loader bar overlay (baked into the
// artwork) stays aligned on any screen aspect ratio.
const landingImageSize = Image.resolveAssetSource(landingImageSource);

// Loader bar position/size as a fraction (0-1) of the original 1080x2340
// image, measured directly from the artwork's pixels.
const BAR_FRACTION = {
  top: 0.8821,
  left: 0.3111,
  width: 0.3787,
  height: 0.0094,
};

type Props = {
  onFinish: () => void;
};

export default function LandingScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  const barStyle = useMemo(() => {
    const { width: containerW, height: containerH } = containerSize;
    const { width: imgW, height: imgH } = landingImageSize;
    if (!containerW || !containerH || !imgW || !imgH) {
      return null;
    }

    // Same scale resizeMode="cover" uses internally: fill the box on
    // whichever axis needs the bigger scale, cropping the other axis
    // symmetrically (centered) instead of stretching.
    const scale = Math.max(containerW / imgW, containerH / imgH);
    const renderedW = imgW * scale;
    const renderedH = imgH * scale;
    const offsetX = (renderedW - containerW) / 2;
    const offsetY = (renderedH - containerH) / 2;

    const left = (BAR_FRACTION.left * renderedW - offsetX) / containerW;
    const top = (BAR_FRACTION.top * renderedH - offsetY) / containerH;
    const width = (BAR_FRACTION.width * renderedW) / containerW;
    const height = (BAR_FRACTION.height * renderedH) / containerH;

    return {
      left: `${left * 100}%`,
      top: `${top * 100}%`,
      width: `${width * 100}%`,
      height: `${height * 100}%`,
    } as const;
  }, [containerSize]);

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
      <View style={styles.imageWrapper} onLayout={handleLayout}>
        <Image source={landingImageSource} style={styles.hero} resizeMode="cover" />

        {/*
          Loader bar overlay, positioned to match the same crop math
          resizeMode="cover" applies (see barStyle above) so it stays
          aligned with the loader baked into the artwork on any screen size.
          Track: #E4E9EF, Bar: #FDCE02
        */}
        {barStyle && (
          <View style={[styles.barContainer, barStyle]} pointerEvents="none">
            <Animated.View style={[styles.barFill, { width: barWidth }]} />
          </View>
        )}
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
