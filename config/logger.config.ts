/**
 * Simple logging utility
 * Provides basic logging functionality with different levels
 */

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

interface LogContext {
	[key: string]: unknown;
}

/**
 * Initialize the logger (no-op for simple console logging)
 */
export const initLogger = () => {
	if (__DEV__) {
		console.log('🚀 Logger initialized - Simple console logging enabled');
	}
};

/**
 * Log a message with optional context
 */
export const log = (level: LogLevel, message: string, context?: LogContext) => {
	const timestamp = new Date().toISOString();
	const emoji = level === 'debug' ? '🔍' : level === 'info' ? 'ℹ️' : level === 'warning' ? '⚠️' : '❌';
	const prefix = `[${timestamp}] ${emoji} [${level.toUpperCase()}]`;

	if (context) {
		console[
			level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'
		](`${prefix} ${message}`, context);
	} else {
		console[
			level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'
		](`${prefix} ${message}`);
	}
};

/**
 * Log debug message (only in development)
 */
export const logDebug = (message: string, context?: LogContext) => {
	if (__DEV__) {
		log('debug', message, context);
	}
};

/**
 * Log info message (only in development)
 */
export const logInfo = (message: string, context?: LogContext) => {
	if (__DEV__) {
		log('info', message, context);
	}
};

/**
 * Log warning message (only in development)
 */
export const logWarning = (message: string, context?: LogContext) => {
	if (__DEV__) {
		log('warning', message, context);
	}
};

/**
 * Log error message (always logged, even in production)
 */
export const logError = (
	message: string,
	error?: Error,
	context?: LogContext
) => {
	const errorContext = {
		...context,
		...(error && {
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack,
			},
		}),
	};

	log('error', message, errorContext);
};

/**
 * Add a breadcrumb (simplified - just logs)
 */
export const addBreadcrumb = (
	message: string,
	category: string,
	level: LogLevel = 'info'
) => {
	const categoryEmoji = category === 'navigation' ? '🧭' : 
		category === 'ui.interaction' ? '👆' : 
		category === 'ui.component' ? '🧩' :
		category === 'connectivity' ? '🌐' : 
		category === 'webview' ? '📱' : 
		category === 'error-boundary' ? '🛡️' : 
		category === 'system.init' ? '⚡' :
		category === 'system.theme' ? '🎨' :
		category === 'system.cache' ? '💾' :
		category === 'system.offline' ? '📶' :
		category === 'user.action' ? '👤' : '📝';
	logDebug(`${categoryEmoji} [${category}] ${message}`);
};

/**
 * Capture an exception (always logged, even in production)
 */
export const captureException = (error: Error, context?: LogContext) => {
	logError('🐛 Captured exception', error, context);
};

/**
 * Capture a message (only in development)
 */
export const captureMessage = (
	message: string,
	level: LogLevel = 'info',
	context?: LogContext
) => {
	if (__DEV__) {
		log(level, message, context);
	}
};

/**
 * Start a transaction (mock implementation - only in development)
 */
export const startTransaction = (name: string, op: string) => {
	if (__DEV__) {
		logDebug(`⏱️ Starting transaction: ${name} (${op})`);
	}

	return {
		setData: (key: string, value: any) => {
			if (__DEV__) logDebug(`📊 Transaction data: ${key} = ${value}`);
		},
		setTag: (key: string, value: string) => {
			if (__DEV__) logDebug(`🏷️ Transaction tag: ${key} = ${value}`);
		},
		finish: () => {
			if (__DEV__) logDebug(`✅ Finished transaction: ${name}`);
		},
	};
};

/**
 * Set tag (only in development)
 */
export const setTag = (key: string, value: string) => {
	if (__DEV__) {
		logDebug(`🏷️ Tag: ${key} = ${value}`);
	}
};

/**
 * Set context (only in development)
 */
export const setContext = (key: string, context: LogContext) => {
	if (__DEV__) {
		logDebug(`📋 Context: ${key}`, context);
	}
};

/**
 * Test error function (development only)
 */
export const testError = () => {
	if (__DEV__) {
		throw new Error('🧪 Test Error - This is intentional for testing');
	}
};

/**
 * Test native crash (no-op for simple logging)
 */
export const testNativeCrash = () => {
	if (__DEV__) {
		logWarning('💥 Native crash test - not implemented in simple logger');
	}
};
