import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import React, { useEffect, useRef, useState } from 'react';
import {
	Alert,
	BackHandler,
	Button,
	Platform,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import FloatingActionButton from '../components/FloatingActionButton';
import LoadingScreen from '../components/LoadingScreen';
import Sidebar from '../components/Sidebar';
import {
	addBreadcrumb,
	captureException,
	initLogger,
	logInfo,
	setContext,
	setTag,
	startTransaction,
} from '../config/logger.config';
import { useTheme } from '../contexts/ThemeContext';

const WEBVIEW_URL = process.env.EXPO_PUBLIC_WEBVIEW_URL || 'https://google.com';
const DOMAIN_NAME = process.env.EXPO_PUBLIC_DOMAIN_NAME || 'google.com';

// New constant for app name
const APP_NAME = Constants.expoConfig?.name || 'App';

const PRIMARY_COLOR = '#FF6F00';
const SECONDARY_COLOR = '#32CD32';
const BACKGROUND_COLOR = '#F2F4F7';

// Cache keys
const CACHE_KEY_HTML = 'WEBVIEW_CACHE_HTML';
const CACHE_KEY_TIMESTAMP = 'WEBVIEW_CACHE_TIMESTAMP';

export default function Index() {
	logInfo('📱 Index component initializing...');
	const { theme } = useTheme();
	const webViewRef = useRef<WebView>(null);
	const [canGoBack, setCanGoBack] = useState(false);
	const [sidebarVisible, setSidebarVisible] = useState(false);

	// Performance monitoring refs
	const loadTransaction = useRef<any>(null);
	const appStartTime = useRef(Date.now());

	// Add states:
	const [isConnected, setIsConnected] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [cachedHtml, setCachedHtml] = useState<string | null>(null);
	const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);
	const [isSavingCache, setIsSavingCache] = useState(false);
	const [webErrorOffline, setWebErrorOffline] = useState(false); // NEW: flag for webview network error
	const [offlineError, setOfflineError] = useState<{
		code?: number;
		description?: string;
	} | null>(null);
	const [relativeTimeLabel, setRelativeTimeLabel] = useState<string>('');

	// Recompute relative time label immediately and every 60s when a cache timestamp exists
	useEffect(() => {
		function updateLabel() {
			if (cacheTimestamp) {
				setRelativeTimeLabel(
					`A última atualização foi há ${formatRelativeTime(
						cacheTimestamp
					)}`
				);
			} else {
				setRelativeTimeLabel('Sem cache salvo ainda');
			}
		}
		updateLabel();
		if (!cacheTimestamp) return; // no interval needed
		const id = setInterval(updateLabel, 5000);
		return () => clearInterval(id);
	}, [cacheTimestamp]);

	// Initialize logger context and performance monitoring
	useEffect(() => {
		const initLogging = async () => {
			// Start app load transaction
			loadTransaction.current = startTransaction(
				'App Load',
				'navigation'
			);

			// Set initial context
			setTag('screen', 'webview-main');
			setTag('theme', theme.isDark ? 'dark' : 'light');
			setContext('webview', {
				url: WEBVIEW_URL,
				domain: DOMAIN_NAME,
			});

			addBreadcrumb('App Index component mounted', 'navigation', 'info');
		};

		logInfo('⚙️ Initializing app systems...');
		initLogger();
		initLogging();

		return () => {
			// Clean up transaction on unmount
			if (loadTransaction.current) {
				loadTransaction.current.finish();
			}
		};
	}, [theme]);

	// Add useEffect for connectivity:
	useEffect(() => {
		checkConnection();
		const interval = setInterval(checkConnection, 5000); // Poll every 5s
		return () => clearInterval(interval);
	}, []);

	async function checkConnection() {
		try {
			const networkState = await Network.getNetworkStateAsync();
			const connected = networkState.isConnected || false;
			setIsConnected(connected);
			setIsLoading(false);
			
			if (connected) {
				logInfo('🌐 Network connection established');
			} else {
				logInfo('📶 No network connection detected');
			}

			// Track connectivity changes
			addBreadcrumb(
				`Connectivity changed: ${connected ? 'online' : 'offline'}`,
				'connectivity',
				'info'
			);

			// Finish load transaction when connectivity check completes
			if (loadTransaction.current) {
				const loadTime = Date.now() - appStartTime.current;
				loadTransaction.current.setData('loadTime', loadTime);
				loadTransaction.current.setTag(
					'connectivity',
					connected ? 'online' : 'offline'
				);
				loadTransaction.current.finish();
				loadTransaction.current = null;
			}
		} catch (error) {
			console.error('Network check failed:', error);
			captureException(error as Error, {
				extra: {
					context: 'network-connectivity-check',
				},
			});
			setIsLoading(false);
		}
	}

	// Load cached HTML on mount
	useEffect(() => {
		(async () => {
			try {
				const html = await AsyncStorage.getItem(CACHE_KEY_HTML);
				const ts = await AsyncStorage.getItem(CACHE_KEY_TIMESTAMP);
				if (html) setCachedHtml(html);
				if (ts) setCacheTimestamp(ts);
			} catch (e) {
				console.warn('Failed to load cache', e);
			}
		})();
	}, []);

	async function saveCache(html: string) {
		if (!html || isSavingCache) return;
		logInfo('💾 Starting cache save operation', { htmlLength: html.length });
		try {
			setIsSavingCache(true);
			await AsyncStorage.setItem(CACHE_KEY_HTML, html);
			const ts = new Date().toISOString();
			await AsyncStorage.setItem(CACHE_KEY_TIMESTAMP, ts);
			setCachedHtml(html);
			setCacheTimestamp(ts);
			logInfo('✅ Cache saved successfully', { timestamp: ts });
			addBreadcrumb(`Cache saved (${html.length} chars)`, 'system.cache', 'info');
		} catch (e) {
			logInfo('❌ Cache save failed', { error: e });
			console.warn('Failed to save cache', e);
		} finally {
			setIsSavingCache(false);
		}
	}

	const handleWebViewMessage = (event: any) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);
			if (
				data?.type === 'HTML_SNAPSHOT' &&
				typeof data.html === 'string'
			) {
				logInfo('📸 HTML snapshot received from WebView');
				addBreadcrumb('HTML snapshot received', 'webview', 'info');
				saveCache(data.html);
			}
		} catch {
			// Handle non-JSON messages
			const message = event.nativeEvent.data;
			logInfo('📨 WebView message received', { message });
			console.log('WebView message received:', message);

			if (message === 'EXIT_APP') {
				logInfo('🚪 EXIT_APP message received from WebView');
				addBreadcrumb('EXIT_APP message received', 'webview', 'info');
				console.log('EXIT_APP message received, attempting to exit...');
				try {
					BackHandler.exitApp();
					console.log('BackHandler.exitApp() called successfully');
				} catch (error) {
					logInfo('❌ BackHandler.exitApp() failed', { error });
					console.log('BackHandler.exitApp() failed:', error);

					// iOS doesn't need special exit handling since we don't show the exit button
					// Just log that we received the message but won't process it
					if (Platform.OS === 'ios') {
						logInfo('🍎 EXIT_APP ignored on iOS - programmatic termination discouraged');
						console.log(
							'EXIT_APP message received on iOS, but ignoring as iOS discourages programmatic termination'
						);
					}
				}
			}
		}
	};

	const handleNavigationStateChange = (navState: WebViewNavigation) => {
		setCanGoBack(navState.canGoBack);

		// Track navigation
		if (navState.url) {
			addBreadcrumb(
				`WebView navigation: ${navState.url}`,
				'webview',
				'info'
			);
		}
	};

	useEffect(() => {
		const backAction = () => {
			if (canGoBack && webViewRef.current) {
				webViewRef.current.goBack();
				return true; // Prevent default back action (e.g., app exit)
			} else {
				// Optional: Show exit confirmation if at root
				Alert.alert('Sair do App', 'Tem certeza de que deseja sair?', [
					{
						text: 'Cancelar',
						style: 'cancel',
					},
					{
						text: 'Sim',
						onPress: () => BackHandler.exitApp(),
					},
				]);
				return true;
			}
		};

		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			backAction
		);

		return () => backHandler.remove();
	}, [canGoBack]);

	// In return, conditional render:
	if (isLoading) {
		logInfo('⏳ App still loading - showing loading screen');
		return (
			<LoadingScreen message="Carregando aplicativo..." showLogo={true} />
		);
	}

	if (!isConnected || webErrorOffline) {
		const lastUpdateRelative = relativeTimeLabel;

		const offlineDescription = (() => {
			if (offlineError?.code === -1009)
				return 'Conexão à internet indisponível.';
			if (offlineError?.code === -2)
				return 'Não foi possível carregar o conteúdo.';
			return 'Você está offline.';
		})();
		
		logInfo('📱 App in offline mode', { hasCache: !!cachedHtml, errorCode: offlineError?.code });
		addBreadcrumb('Offline mode activated', 'system.offline', 'info');
		
		// If we have cached HTML, show it inside a WebView with an offline banner
		if (cachedHtml) {
			logInfo('💾 Displaying cached content in offline mode');
			addBreadcrumb('Cached content displayed', 'system.cache', 'info');
			return (
				<View
					style={[
						styles.offlineRoot,
						{
							backgroundColor: theme.background,
						},
					]}
				>
					<View
						style={[
							styles.header,
							{
								backgroundColor: theme.primary,
							},
						]}
					>
						<Text style={styles.headerTitle}>{APP_NAME}</Text>
					</View>
					<View
						style={[
							styles.cacheInfoBar,
							{
								backgroundColor: theme.surface,
								borderBottomColor: theme.border,
							},
						]}
					>
						<View style={{ flex: 1 }}>
							<Text
								style={[
									styles.cacheInfoOffline,
									{ color: '#D14343' },
								]}
							>
								Você está offline
							</Text>
							<Text
								style={[
									styles.cacheInfoText,
									{ color: theme.text },
								]}
							>
								{lastUpdateRelative}
							</Text>
						</View>
						<View
							accessible={true}
							accessibilityLabel="Recarregar conteúdo"
							accessibilityHint="Tenta recarregar o conteúdo quando voltar online"
							accessibilityRole="button"
						>
							<Button
								title="Recarregar"
								color={theme.primary}
								onPress={() => {
									setWebErrorOffline(false);
									setOfflineError(null);
									if (webViewRef.current)
										webViewRef.current.reload();
								}}
							/>
						</View>
					</View>
					<WebView
						style={styles.container}
						originWhitelist={['*']}
						source={{
							html: cachedHtml,
							baseUrl: WEBVIEW_URL,
						}}
						javaScriptEnabled
						domStorageEnabled
						injectedJavaScript={
							disableZoomAndSelectionAndSnapshotJS
						}
						onMessage={handleWebViewMessage}
						pullToRefreshEnabled={true} // Allows pull-to-refresh
						scalesPageToFit={false} // Disable pinch-to-zoom
						allowsBackForwardNavigationGestures={true} // Enable swipe gestures for navigation
						setBuiltInZoomControls={false}
						setDisplayZoomControls={false}
						bounces={false}
						overScrollMode={'never'}
					/>
					<FloatingActionButton
						onPress={() => setSidebarVisible(true)}
						visible={true}
					/>
					<Sidebar
						visible={sidebarVisible}
						onClose={() => setSidebarVisible(false)}
						webViewRef={webViewRef}
					/>
				</View>
			);
		}
		// No cache available fallback UI
		logInfo('📱 No cache available - showing offline fallback UI');
		addBreadcrumb('No cache offline UI displayed', 'system.offline', 'info');
		
		return (
			<View
				style={[
					styles.offlineRoot,
					{ backgroundColor: theme.background },
				]}
			>
				<View
					style={[styles.header, { backgroundColor: theme.primary }]}
				>
					<Text style={styles.headerTitle}>{APP_NAME}</Text>
				</View>
				<View style={styles.offlineContent}>
					<Ionicons
						name="cloud-offline-outline"
						size={75}
						color={SECONDARY_COLOR}
						style={{ marginBottom: 12 }}
					/>
					<Text style={[styles.offlineTitle, { color: theme.text }]}>
						Sem Conexão
					</Text>
					<Text
						style={[
							styles.offlineSubtitle,
							{ color: theme.textSecondary },
						]}
					>
						{offlineDescription}
					</Text>
					<Text
						style={[
							styles.offlineSubtitle,
							{
								fontSize: 14,
								marginTop: 4,
								color: theme.textSecondary,
							},
						]}
					>
						{lastUpdateRelative}
					</Text>
					<View
						accessible={true}
						accessibilityLabel="Tentar novamente"
						accessibilityHint="Tenta conectar novamente ao servidor"
						accessibilityRole="button"
					>
						<Button
							title="Tentar Novamente"
							onPress={() => {
								setWebErrorOffline(false);
								setOfflineError(null);
								webViewRef.current?.reload();
							}}
							color={theme.primary}
						/>
					</View>
				</View>
				<FloatingActionButton
					onPress={() => setSidebarVisible(true)}
					visible={true}
				/>
				<Sidebar
					visible={sidebarVisible}
					onClose={() => setSidebarVisible(false)}
					webViewRef={webViewRef}
				/>
			</View>
		);
	}

	logInfo('🌐 App rendering in online mode - displaying main WebView');
	addBreadcrumb('Main WebView rendered', 'webview', 'info');
	
	return (
		<View style={{ flex: 1 }}>
			<WebView
				ref={webViewRef}
				style={styles.container}
				source={{
					uri: WEBVIEW_URL,
				}}
				originWhitelist={[
					`http://*${DOMAIN_NAME}`,
					`https://*${DOMAIN_NAME}`,
				]}
				allowsInlineMediaPlayback={true} // Improves video performance
				mediaPlaybackRequiresUserAction={false} // Auto-play media
				javaScriptEnabled={true} // Required for most web apps
				domStorageEnabled={true} // Enables localStorage/sessionStorage
				cacheEnabled={true} // Caches for better performance
				startInLoadingState={true} // Shows loading indicator initially
				accessible={true}
				accessibilityLabel="Conteúdo principal do aplicativo"
				accessibilityHint="Interface web do Lets Delivery para fazer pedidos"
				onNavigationStateChange={handleNavigationStateChange}
				onError={(syntheticEvent) => {
					const { nativeEvent } = syntheticEvent;
					console.error('WebView error: ', nativeEvent);

					// Report WebView errors
					const webViewError = new Error(
						`WebView Error: ${
							nativeEvent.description || 'Unknown error'
						}`
					);
					captureException(webViewError, {
						webViewError: {
							code: nativeEvent.code,
							description: nativeEvent.description,
							url: nativeEvent.url,
							loading: nativeEvent.loading,
							canGoBack: nativeEvent.canGoBack,
							canGoForward: nativeEvent.canGoForward,
						},
					});

					addBreadcrumb(
						`WebView error: ${nativeEvent.description}`,
						'webview',
						'error'
					);

					const desc = (nativeEvent.description || '').toLowerCase();
					if (
						nativeEvent.code === -2 || // generic net error (Android)
						nativeEvent.code === -1009 || // iOS offline
						desc.includes('err_internet_disconnected') ||
						desc.includes('internet disconnected') ||
						desc.includes('internet offline') ||
						desc.includes('nsurlerrordomain')
					) {
						setOfflineError({
							code: nativeEvent.code,
							description: nativeEvent.description,
						});
						setWebErrorOffline(true);
					}
				}}
				onHttpError={(e) => {
					const status = e.nativeEvent.statusCode;
					if (status >= 500 || status === 0) {
						// treat as offline-ish if no cache
						if (!cachedHtml) setWebErrorOffline(true);
					}
				}}
				onLoadEnd={() => setIsLoading(false)} // Hide loading indicator when page loads
				injectedJavaScript={disableZoomAndSelectionAndSnapshotJS} // Disable zoom and text selection
				onMessage={handleWebViewMessage}
				pullToRefreshEnabled={true} // Allows pull-to-refresh
				scalesPageToFit={false} // Disable pinch-to-zoom
				allowsBackForwardNavigationGestures={true} // Enable swipe gestures for navigation
				setBuiltInZoomControls={false}
				setDisplayZoomControls={false}
				bounces={false}
				overScrollMode={'never'}
			/>

			<FloatingActionButton
				onPress={() => setSidebarVisible(true)}
				visible={true}
			/>

			<Sidebar
				visible={sidebarVisible}
				onClose={() => setSidebarVisible(false)}
				webViewRef={webViewRef}
			/>
		</View>
	);
}

const BOTTOM_SAFE_AREA = Platform.OS === 'ios' ? 34 : 24; // Estimate for safe areas

const disableZoomAndSelectionAndSnapshotJS = `
  (function() {
    try {
      // Disable zoom
      var existing = document.querySelector('meta[name="viewport"]');
      if(!existing){
        var meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no';
        document.head.appendChild(meta);
      }
      // Disable selection
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = 'body{-webkit-user-select:none;-webkit-touch-callout:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}';
      document.head.appendChild(style);
      
      // Add bottom padding to prevent overlap with floating elements
      setTimeout(function(){
        var bottomPadding = ${
			BOTTOM_SAFE_AREA + 80
		}; // 80px for floating button area
        document.body.style.paddingBottom = bottomPadding + 'px';
        document.body.style.boxSizing = 'border-box';
      }, 100);
      
      // Post HTML snapshot after brief delay (allow dynamic content)
      setTimeout(function(){
        try {
          var html = document.documentElement.outerHTML;
          if (html && html.length < 5_000_000) { // crude guard against extremely large payloads
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'HTML_SNAPSHOT', html: html }));
          }
        } catch (e) {}
      }, 800);
    } catch(e) {}
  })();
`;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: Constants.statusBarHeight,
	},
	webview: {
		flex: 1,
	},
	// Offline / header styling
	header: {
		paddingTop: Constants.statusBarHeight + 6,
		paddingHorizontal: 16,
		paddingBottom: 14,
		backgroundColor: PRIMARY_COLOR,
		width: '100%',
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
		elevation: 4,
	},
	headerTitle: {
		color: '#fff',
		fontSize: 20,
		fontWeight: '600',
		textAlign: 'left',
	},
	offlineRoot: {
		flex: 1,
		backgroundColor: BACKGROUND_COLOR,
	},
	offlineContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	offlineBanner: {
		backgroundColor: BACKGROUND_COLOR,
		padding: 10,
		alignItems: 'center',
	},
	offlineText: {
		color: 'white',
		fontWeight: 'bold',
		fontSize: 14,
		textAlign: 'center',
	},
	offlineTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginTop: 4,
		color: '#11181C',
		textAlign: 'center',
	},
	offlineSubtitle: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 24,
		color: '#3C3C4399',
		lineHeight: 22,
	},
	cacheInfoBar: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: '#fff',
		borderBottomColor: '#E2E8F0',
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	cacheInfoOffline: {
		fontSize: 14,
		fontWeight: '600',
		color: '#D14343',
		marginBottom: 2,
	},
	cacheInfoText: {
		fontSize: 12,
		color: '#444',
		flexShrink: 1,
	},
	savingIndicator: {
		position: 'absolute',
		top: Constants.statusBarHeight + 10,
		left: 20,
		right: 20,
		borderRadius: 8,
		borderWidth: StyleSheet.hairlineWidth,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
});

function formatRelativeTime(iso: string | null): string {
	if (!iso) return 'tempo desconhecido';
	const date = new Date(iso);
	const diffMs = Date.now() - date.getTime();
	if (diffMs < 0) return 'agora';
	const sec = Math.floor(diffMs / 1000);
	if (sec < 60) return sec <= 1 ? '1 segundo' : `${sec} segundos`;
	const min = Math.floor(sec / 60);
	if (min < 60) return min === 1 ? '1 minuto' : `${min} minutos`;
	const hrs = Math.floor(min / 60);
	if (hrs < 24) return hrs === 1 ? '1 hora' : `${hrs} horas`;
	const days = Math.floor(hrs / 24);
	if (days < 30) return days === 1 ? '1 dia' : `${days} dias`;
	const months = Math.floor(days / 30);
	if (months < 12) return months === 1 ? '1 mês' : `${months} meses`;
	const years = Math.floor(months / 12);
	return years === 1 ? '1 ano' : `${years} anos`;
}

