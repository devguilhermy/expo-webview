import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Alert,
    Linking,
    BackHandler,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../contexts/ThemeContext';
import {
    testSentryError,
    testSentryNativeCrash,
    addSentryBreadcrumb,
} from '../config/sentry.config';

const CONTACT_EMAIL =
    process.env.EXPO_PUBLIC_CONTACT_EMAIL || '';
const SUPPORT_PHONE =
    process.env.EXPO_PUBLIC_SUPPORT_PHONE || '';

const { width: screenWidth, height: screenHeight } =
    Dimensions.get('window');
const SIDEBAR_WIDTH = screenWidth * 0.75;

interface SidebarProps {
    visible: boolean;
    onClose: () => void;
    webViewRef?: React.RefObject<any>;
}

const Sidebar: React.FC<SidebarProps> = ({
    visible,
    onClose,
    webViewRef,
}) => {
    const { theme, toggleTheme } = useTheme();
    const [aboutModalVisible, setAboutModalVisible] =
        useState(false);
    const slideAnim = useRef(
        new Animated.Value(-SIDEBAR_WIDTH)
    ).current;
    const overlayOpacity = useRef(
        new Animated.Value(0)
    ).current;
    useEffect(() => {
        if (visible) {
            // Track sidebar opening
            addSentryBreadcrumb(
                'Sidebar opened',
                'ui.interaction',
                'info'
            );

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0.5,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Track sidebar closing
            addSentryBreadcrumb(
                'Sidebar closed',
                'ui.interaction',
                'info'
            );

            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -SIDEBAR_WIDTH,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideAnim, overlayOpacity]);

    const handleSupportCall = () => {
        Alert.alert(
            'Contatar Suporte',
            'Deseja ligar para o suporte?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ligar',
                    onPress: () => {
                        Linking.openURL(
                            SUPPORT_PHONE
                        ).catch(() => {
                            Alert.alert(
                                'Erro',
                                'Não foi possível fazer a ligação'
                            );
                        });
                    },
                },
            ]
        );
    };

    const handleExit = () => {
        Alert.alert(
            'Sair do App',
            'Tem certeza de que deseja sair?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: () => {
                        // Close sidebar first
                        onClose();

                        // Android exit - simple and straightforward
                        if (webViewRef?.current) {
                            webViewRef.current
                                .injectJavaScript(`
                                try {
                                    // Navigate to root/home page
                                    if (window.history.length > 1) {
                                        window.history.go(-(window.history.length - 1));
                                    }
                                } catch (e) {
                                    console.log('History navigation failed:', e);
                                }
                            `);
                        }

                        setTimeout(() => {
                            BackHandler.exitApp();
                        }, 200);
                    },
                },
            ]
        );
    };

    const handleGoHome = () => {
        // Track sidebar usage
        addSentryBreadcrumb(
            'Sidebar menu item clicked: home',
            'ui.interaction',
            'info'
        );

        // Close sidebar first
        onClose();
        // Navigate to homepage - assuming the initial URL is the homepage
        if (webViewRef?.current) {
            webViewRef.current.injectJavaScript(`
                window.location.href = window.location.origin;
            `);
        }
    };

    const menuItems = [
        {
            icon: 'home' as const,
            title: 'Início',
            onPress: handleGoHome,
        },
        {
            icon: 'moon' as const,
            iconSelected: 'sunny' as const,
            title: theme.isDark
                ? 'Modo Claro'
                : 'Modo Escuro',
            onPress: () => {
                addSentryBreadcrumb(
                    `Theme changed to: ${
                        theme.isDark ? 'light' : 'dark'
                    }`,
                    'ui.interaction',
                    'info'
                );
                toggleTheme();
            },
            showToggle: true,
        },
        {
            icon: 'information-circle' as const,
            title: 'Sobre o App',
            onPress: () => {
                addSentryBreadcrumb(
                    'Sidebar menu item clicked: about',
                    'ui.interaction',
                    'info'
                );
                setAboutModalVisible(true);
            },
        },
        {
            icon: 'call' as const,
            title: 'Suporte',
            onPress: () => {
                addSentryBreadcrumb(
                    'Sidebar menu item clicked: support',
                    'ui.interaction',
                    'info'
                );
                handleSupportCall();
            },
        },
        // Only show "Sair" button on Android, as iOS discourages programmatic app termination
        ...(Platform.OS === 'android'
            ? [
                  {
                      icon: 'exit' as const,
                      title: 'Sair',
                      onPress: () => {
                          addSentryBreadcrumb(
                              'Sidebar menu item clicked: exit',
                              'ui.interaction',
                              'info'
                          );
                          handleExit();
                      },
                      danger: true,
                  },
              ]
            : []),

        // Development only - Sentry test buttons
        ...(__DEV__
            ? [
                  {
                      icon: 'bug' as const,
                      title: 'Test Sentry Error',
                      onPress: () => {
                          addSentryBreadcrumb(
                              'Sidebar menu item clicked: test_sentry_error',
                              'ui.interaction',
                              'info'
                          );
                          testSentryError();
                      },
                      danger: true,
                  },
                  {
                      icon: 'warning' as const,
                      title: 'Test Native Crash',
                      onPress: () => {
                          addSentryBreadcrumb(
                              'Sidebar menu item clicked: test_native_crash',
                              'ui.interaction',
                              'info'
                          );
                          Alert.alert(
                              'Test Native Crash',
                              'This will crash the app for testing. Continue?',
                              [
                                  {
                                      text: 'Cancel',
                                      style: 'cancel',
                                  },
                                  {
                                      text: 'Crash App',
                                      style: 'destructive',
                                      onPress:
                                          testSentryNativeCrash,
                                  },
                              ]
                          );
                      },
                      danger: true,
                  },
              ]
            : []),
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <View style={styles.container}>
                <Animated.View
                    style={[
                        styles.overlay,
                        { opacity: overlayOpacity },
                    ]}
                >
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        onPress={onClose}
                        activeOpacity={1}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.sidebar,
                        {
                            backgroundColor: theme.surface,
                            transform: [
                                { translateX: slideAnim },
                            ],
                        },
                    ]}
                >
                    {/* Header */}
                    <View
                        style={[
                            styles.header,
                            {
                                backgroundColor:
                                    theme.primary,
                            },
                        ]}
                    >
                        <View style={styles.headerContent}>
                            <View
                                style={styles.logoContainer}
                            >
                                <View
                                    style={[
                                        styles.logoPlaceholder,
                                        {
                                            backgroundColor:
                                                'rgba(255,255,255,0.2)',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="restaurant"
                                        size={32}
                                        color="#FFFFFF"
                                    />
                                </View>
                                <View
                                    style={styles.appInfo}
                                >
                                    <Text
                                        style={
                                            styles.appName
                                        }
                                    >
                                        {Constants
                                            .expoConfig
                                            ?.name ||
                                            'Let&apos;s Delivery'}
                                    </Text>
                                    <Text
                                        style={
                                            styles.appVersion
                                        }
                                    >
                                        v
                                        {Constants
                                            .expoConfig
                                            ?.version ||
                                            '1.0.0'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                style={styles.closeButton}
                                accessibilityLabel="Fechar menu"
                                accessibilityHint="Fecha o menu lateral"
                                accessibilityRole="button"
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View style={styles.menuContainer}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.menuItem,
                                    {
                                        borderBottomColor:
                                            theme.border,
                                    },
                                ]}
                                onPress={item.onPress}
                                accessibilityLabel={
                                    item.title
                                }
                                accessibilityHint={`${item.title} - Toque para acessar`}
                                accessibilityRole="button"
                            >
                                <View
                                    style={
                                        styles.menuItemContent
                                    }
                                >
                                    <Ionicons
                                        name={
                                            item.showToggle
                                                ? theme.isDark
                                                    ? item.iconSelected!
                                                    : item.icon
                                                : item.icon
                                        }
                                        size={24}
                                        color={
                                            item.danger
                                                ? '#FF4757'
                                                : theme.text
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.menuItemText,
                                            {
                                                color: item.danger
                                                    ? '#FF4757'
                                                    : theme.text,
                                            },
                                        ]}
                                    >
                                        {item.title}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={
                                        theme.textSecondary
                                    }
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>

            {/* About Modal */}
            <Modal
                visible={aboutModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setAboutModalVisible(false)
                }
                statusBarTranslucent={true}
            >
                <View style={styles.aboutOverlay}>
                    <View
                        style={[
                            styles.aboutModal,
                            {
                                backgroundColor:
                                    theme.surface,
                            },
                        ]}
                    >
                        <View style={styles.aboutHeader}>
                            <Text
                                style={[
                                    styles.aboutTitle,
                                    { color: theme.text },
                                ]}
                            >
                                Sobre o App
                            </Text>
                            <TouchableOpacity
                                onPress={() =>
                                    setAboutModalVisible(
                                        false
                                    )
                                }
                                accessibilityLabel="Fechar sobre o app"
                                accessibilityHint="Fecha a janela de informações sobre o aplicativo"
                                accessibilityRole="button"
                            >
                                <Ionicons
                                    name="close"
                                    size={24}
                                    color={theme.text}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.aboutContent}>
                            <View
                                style={
                                    styles.aboutLogoContainer
                                }
                            >
                                <View
                                    style={[
                                        styles.aboutLogo,
                                        {
                                            backgroundColor:
                                                theme.primary,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name="restaurant"
                                        size={48}
                                        color="#FFFFFF"
                                    />
                                </View>
                            </View>
                            <Text
                                style={[
                                    styles.aboutAppName,
                                    { color: theme.text },
                                ]}
                            >
                                {Constants.expoConfig
                                    ?.name ||
                                    'Let&apos;s Delivery'}
                            </Text>
                            <Text
                                style={[
                                    styles.aboutVersion,
                                    {
                                        color: theme.textSecondary,
                                    },
                                ]}
                            >
                                Versão{' '}
                                {Constants.expoConfig
                                    ?.version || '1.0.0'}
                            </Text>
                            <View style={styles.aboutInfo}>
                                <Text
                                    style={[
                                        styles.aboutDescription,
                                        {
                                            color: theme.textSecondary,
                                        },
                                    ]}
                                >
                                    Aplicativo de delivery
                                    moderno e eficiente para
                                    conectar restaurantes,
                                    clientes e entregadores.
                                </Text>

                                <View
                                    style={
                                        styles.aboutSection
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.aboutSectionTitle,
                                            {
                                                color: theme.text,
                                            },
                                        ]}
                                    >
                                        Desenvolvedores
                                    </Text>
                                    <Text
                                        style={[
                                            styles.aboutSectionText,
                                            {
                                                color: theme.textSecondary,
                                            },
                                        ]}
                                    >
                                        Equipe Let&apos;s
                                        Delivery
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.aboutSection
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.aboutSectionTitle,
                                            {
                                                color: theme.text,
                                            },
                                        ]}
                                    >
                                        Suporte
                                    </Text>
                                    <Text
                                        style={[
                                            styles.aboutSectionText,
                                            {
                                                color: theme.textSecondary,
                                            },
                                        ]}
                                    >
                                        {CONTACT_EMAIL}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        zIndex: 1000, // Ensure modal is above other elements
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        zIndex: 1000,
    },
    sidebar: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: SIDEBAR_WIDTH,
        height: screenHeight + Constants.statusBarHeight,
        zIndex: 1001, // Above overlay
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        paddingTop: Constants.statusBarHeight + 16,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logoPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    appInfo: {
        flex: 1,
    },
    appName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    appVersion: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    closeButton: {
        padding: 4,
    },
    menuContainer: {
        flex: 1,
        paddingTop: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 16,
        fontWeight: '500',
    },
    // About Modal Styles
    aboutOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    aboutModal: {
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    aboutHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E2E8F0',
    },
    aboutTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    aboutContent: {
        padding: 20,
    },
    aboutLogoContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    aboutLogo: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aboutAppName: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    aboutVersion: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    aboutInfo: {
        gap: 16,
    },
    aboutDescription: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    aboutSection: {
        gap: 4,
    },
    aboutSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    aboutSectionText: {
        fontSize: 15,
        lineHeight: 20,
    },
});

export default Sidebar;
