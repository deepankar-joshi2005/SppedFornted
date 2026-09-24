import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { resolveAssetUrl } from '../config/api';
import { Nav } from '../navigation/types';
import { ERROR, NAVY } from '../theme/colors';

type Props = {
  title: string;
  fileUrl: string;
  nav: Nav;
};

type ViewerMessage =
  | { type: 'ready' }
  | { type: 'loaded'; numPages: number }
  | { type: 'progress'; page: number; numPages: number }
  | { type: 'error'; message: string };

const viewerHtml = require('../../assets/pdf-viewer/viewer.html');

export default function PdfViewerScreen({ title, fileUrl, nav }: Props) {
  // react-native-webview's `WebView<P = undefined>` collapses its props to `never`
  // when TS resolves a typed ref against the un-instantiated generic — untyped
  // ref sidesteps that resolution without affecting runtime behavior.
  const webviewRef = useRef<any>(null);
  const [localHtmlUri, setLocalHtmlUri] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading-asset' | 'loading-pdf' | 'ready' | 'error'>(
    'loading-asset'
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const asset = Asset.fromModule(viewerHtml);
        await asset.downloadAsync();
        if (!cancelled && asset.localUri) {
          setLocalHtmlUri(asset.localUri);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load PDF viewer.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const absoluteFileUrl = resolveAssetUrl(fileUrl) ?? fileUrl;

  const requestLoad = useCallback(() => {
    setStatus('loading-pdf');
    setErrorMessage('');
    const script = `window.loadPdf(${JSON.stringify(absoluteFileUrl)}, ${JSON.stringify(
      title
    )}); true;`;
    webviewRef.current?.injectJavaScript(script);
  }, [absoluteFileUrl, title]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as ViewerMessage;
        if (msg.type === 'ready') {
          requestLoad();
        } else if (msg.type === 'loaded') {
          setStatus('ready');
        } else if (msg.type === 'error') {
          setStatus('error');
          setErrorMessage(msg.message);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [requestLoad]
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable style={styles.iconBtn} onPress={nav.pop} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={NAVY} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.webviewWrap}>
        {localHtmlUri && (
          <WebView
            ref={webviewRef}
            source={{ uri: localHtmlUri }}
            originWhitelist={['*']}
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleMessage}
            style={styles.webview}
          />
        )}

        {status !== 'ready' && status !== 'error' && (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color={NAVY} size="large" />
            <Text style={styles.overlayText}>
              {status === 'loading-asset' ? 'Preparing viewer…' : 'Loading PDF…'}
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.overlay}>
            <Ionicons name="alert-circle-outline" size={32} color={ERROR} />
            <Text style={styles.errorText}>{errorMessage || 'Failed to load this PDF.'}</Text>
            <Pressable style={styles.retryBtn} onPress={requestLoad}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#525659',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#F5F4EF',
  },
  iconBtn: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
  },
  webviewWrap: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#525659',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#525659',
    paddingHorizontal: 24,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: NAVY,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
