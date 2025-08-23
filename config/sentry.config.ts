import * as Sentry from '@sentry/react-native';

// Sentry DSN - replace with your actual DSN
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry with simple error monitoring and session replay
 */
export const initSentry = () => {
    if (!SENTRY_DSN) {
        console.warn(
            '⚠️ Sentry DSN not configured - error monitoring disabled'
        );
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,

        // Basic configuration
        debug: __DEV__,
        environment: __DEV__ ? 'development' : 'production',

        // Session Replays - 10% of sessions, 100% on errors
        replaysSessionSampleRate: 1.0,
        replaysOnErrorSampleRate: 1.0,

        // Mobile replay integration for session recordings
        integrations: [Sentry.mobileReplayIntegration()],

        // Basic privacy settings
        sendDefaultPii: true,
        attachStacktrace: true,
    });

    console.log(
        '✅ Sentry initialized - Error monitoring and session replay enabled'
    );
};

/**
 * Test Sentry error (development only)
 */
export const testSentryError = () => {
    if (__DEV__) {
        throw new Error(
            'Test Sentry Error - This is intentional for testing'
        );
    }
};

export const testSentryNativeCrash = () => {
    if (__DEV__) {
        Sentry.nativeCrash();
    }
};

// Additional helper functions that were expected
export const startTransaction = (
    name: string,
    op: string
) => {
    // Return a mock transaction for compatibility
    return {
        setData: (key: string, value: any) => {},
        setTag: (key: string, value: string) => {},
        finish: () => {},
    };
};

export const addSentryBreadcrumb = (
    message: string,
    category: string,
    level: 'info' | 'error' | 'warning' | 'debug'
) => {
    Sentry.addBreadcrumb({
        message,
        category,
        level,
    });
};

export const setSentryTag = (
    key: string,
    value: string
) => {
    Sentry.setTag(key, value);
};

export const setSentryContext = (
    key: string,
    context: Record<string, unknown>
) => {
    Sentry.setContext(key, context);
};

export const captureException = (
    error: Error,
    context?: any
) => {
    Sentry.captureException(error, context);
};

// Export Sentry for direct use if needed
export { Sentry };
