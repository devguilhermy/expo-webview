import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { logInfo, logDebug, addBreadcrumb } from '../config/logger.config';

interface LoadingScreenProps {
    message?: string;
    showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Carregando...',
    showLogo = true,
}) => {
    const { theme } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(
        new Animated.Value(0.8)
    ).current;
    
    logInfo('⏳ LoadingScreen displayed', { message, showLogo });
    addBreadcrumb(`LoadingScreen: ${message}`, 'ui.component', 'info');
    useEffect(() => {
        logDebug('🎬 LoadingScreen animations starting');
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start(() => {
            logDebug('✨ LoadingScreen animations completed');
        });
    }, [fadeAnim, scaleAnim]);

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.background },
            ]}
        >
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {showLogo && (
                    <View
                        style={[
                            styles.logoContainer,
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
                )}

                <ActivityIndicator
                    size="large"
                    color={theme.primary}
                    style={styles.spinner}
                />

                <Text
                    style={[
                        styles.message,
                        { color: theme.text },
                    ]}
                >
                    {message}
                </Text>

                <View style={styles.dotsContainer}>
                    <LoadingDots
                        color={theme.textSecondary}
                    />
                </View>
            </Animated.View>
        </View>
    );
};

const LoadingDots: React.FC<{ color: string }> = ({
    color,
}) => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;
    
    logDebug('⚪ LoadingDots component initialized');

    useEffect(() => {
        logDebug('🎭 LoadingDots animation cycle starting');
        const animateDots = () => {
            const duration = 600;
            const delay = 200;

            Animated.sequence([
                Animated.timing(dot1, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.delay(delay),
                Animated.timing(dot2, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.delay(delay),
                Animated.timing(dot3, {
                    toValue: 1,
                    duration: duration,
                    useNativeDriver: true,
                }),
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(dot1, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot2, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot3, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => animateDots());
        };
        animateDots();
    }, [dot1, dot2, dot3]);

    return (
        <View style={styles.dots}>
            <Animated.View
                style={[
                    styles.dot,
                    {
                        backgroundColor: color,
                        opacity: dot1,
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.dot,
                    {
                        backgroundColor: color,
                        opacity: dot2,
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.dot,
                    {
                        backgroundColor: color,
                        opacity: dot3,
                    },
                ]}
            />
        </View>
    );
};

interface InlineLoadingProps {
    message?: string;
    size?: 'small' | 'large';
}

export const InlineLoading: React.FC<
    InlineLoadingProps
> = ({ message = 'Carregando...', size = 'small' }) => {
    const { theme } = useTheme();
    
    logDebug('📏 InlineLoading displayed', { message, size });
    addBreadcrumb(`InlineLoading: ${message}`, 'ui.component', 'info');

    return (
        <View style={styles.inlineContainer}>
            <ActivityIndicator
                size={size}
                color={theme.primary}
                style={styles.inlineSpinner}
            />
            <Text
                style={[
                    styles.inlineMessage,
                    { color: theme.textSecondary },
                ]}
            >
                {message}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    content: {
        alignItems: 'center',
        maxWidth: 280,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    spinner: {
        marginBottom: 24,
    },
    message: {
        fontSize: 18,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
    },
    dotsContainer: {
        marginTop: 8,
    },
    dots: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    // Inline loading styles
    inlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    inlineSpinner: {
        marginRight: 12,
    },
    inlineMessage: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default LoadingScreen;
