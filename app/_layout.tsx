import { Stack } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { initSentry, Sentry } from '../config/sentry.config';

// Initialize Sentry before the app starts
initSentry();

function RootLayout() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </ThemeProvider>
        </ErrorBoundary>
    );
}

// Wrap the entire app with Sentry for automatic instrumentation
export default Sentry.wrap(RootLayout);

