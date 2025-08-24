import { Stack } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { initLogger, logInfo } from '../config/logger.config';

// Initialize logger before the app starts
initLogger();
logInfo('🚀 App starting up...');

function RootLayout() {
    logInfo('📱 RootLayout component mounting...');
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default RootLayout;

