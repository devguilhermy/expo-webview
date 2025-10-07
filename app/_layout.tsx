import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { initLogger, logInfo } from '../config/logger.config';

// Initialize logger before the app starts
initLogger();
logInfo('🚀 App starting up...');

function RootLayout() {
    logInfo('📱 RootLayout component mounting...');
    return (
        <SafeAreaProvider>
            <ErrorBoundary>
                <ThemeProvider>
                    <Stack screenOptions={{ headerShown: false }} />
                </ThemeProvider>
            </ErrorBoundary>
        </SafeAreaProvider>
    );
}

export default RootLayout;

