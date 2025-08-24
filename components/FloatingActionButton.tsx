import React, { useRef, useEffect } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    Animated,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { logInfo, logDebug, addBreadcrumb } from '../config/logger.config';

interface FloatingActionButtonProps {
    onPress: () => void;
    visible?: boolean;
}

const FloatingActionButton: React.FC<
    FloatingActionButtonProps
> = ({ onPress, visible = true }) => {
    const { theme } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(
        new Animated.Value(0)
    ).current;
    
    logDebug('🎈 FloatingActionButton component rendered', { visible });
    useEffect(() => {
        if (visible) {
            logDebug('📈 FloatingActionButton showing with animation');
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        } else {
            logDebug('📉 FloatingActionButton hiding with animation');
            Animated.spring(scaleAnim, {
                toValue: 0,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, scaleAnim]);

    const handlePress = () => {
        logInfo('🎈 FloatingActionButton pressed');
        addBreadcrumb('FloatingActionButton pressed', 'ui.interaction', 'info');
        
        // Add a small rotation animation on press
        Animated.sequence([
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();

        onPress();
    };

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <TouchableOpacity
                style={[
                    styles.button,
                    {
                        backgroundColor: theme.primary,
                        shadowColor: theme.shadow,
                    },
                ]}
                onPress={handlePress}
                activeOpacity={0.8}
                accessibilityLabel="Menu principal"
                accessibilityHint="Abre o menu lateral do aplicativo"
                accessibilityRole="button"
            >
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            transform: [
                                { rotate: rotation },
                            ],
                        },
                    ]}
                >
                    <Ionicons
                        name="menu"
                        size={24}
                        color="#FFFFFF"
                    />
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 500, // Lower than sidebar modal
    },
    button: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FloatingActionButton;
