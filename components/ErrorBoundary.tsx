import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import { useTheme } from '../contexts/ThemeContext';
import { Sentry, addSentryBreadcrumb, setSentryContext, captureException } from '../config/sentry.config';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error,
            errorInfo,
        });

        // Log to Sentry with additional context
        this.logErrorToSentry(error, errorInfo);
    }

    private logErrorToSentry = (error: Error, errorInfo: ErrorInfo) => {
        // Add breadcrumb for error boundary trigger
        addSentryBreadcrumb('Error Boundary Triggered', 'error-boundary', 'error');

        // Set additional context for this error
        setSentryContext('errorBoundary', {
            componentStack: errorInfo.componentStack,
            errorBoundaryTimestamp: new Date().toISOString(),
            appVersion: Application.nativeApplicationVersion,
            buildVersion: Application.nativeBuildVersion,
        });

        // Capture the exception with additional context
        captureException(error, {
            extra: {
                errorInfo: {
                    componentStack: errorInfo.componentStack,
                    errorBoundaryLocation: 'React Error Boundary',
                },
                appState: {
                    timestamp: new Date().toISOString(),
                    nativeAppVersion: Application.nativeApplicationVersion,
                    nativeBuildVersion: Application.nativeBuildVersion,
                },
            },
        });

        console.log('✅ Error reported to Sentry:', error.message);
    };

    private handleRestart = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    private handleReportError = () => {
        const { error, errorInfo } = this.state;
        if (!error) return;

        const errorDetails = `
Erro: ${error.message}
Stack: ${error.stack}
Component Stack: ${errorInfo?.componentStack}
Versão: ${Application.nativeApplicationVersion}
Build: ${Application.nativeBuildVersion}
        `.trim();

        Alert.alert(
            'Reportar Erro',
            'Deseja enviar os detalhes do erro para nossa equipe? (Já foi enviado automaticamente para análise)',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Ver Detalhes',
                    onPress: () => {
                        // Show error details (development only)
                        if (__DEV__) {
                            Alert.alert('Detalhes do Erro', errorDetails);
                        } else {
                            Alert.alert(
                                'Obrigado!',
                                'O relatório de erro já foi enviado automaticamente. Nossa equipe irá investigar.'
                            );
                        }
                        
                        // Add breadcrumb for user reporting action
                        addSentryBreadcrumb('User manually reported error', 'user-action', 'info');
                    },
                },
            ]
        );
    };

    public render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI wrapped with theme
            return <ErrorBoundaryUI 
                onRestart={this.handleRestart}
                onReportError={this.handleReportError}
                error={this.state.error}
            />;
        }

        return this.props.children;
    }
}

// Separate component for themed error UI
const ErrorBoundaryUI: React.FC<{
    onRestart: () => void;
    onReportError: () => void;
    error: Error | null;
}> = ({ onRestart, onReportError, error }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF4757' }]}>
                    <Ionicons
                        name="warning"
                        size={48}
                        color="#FFFFFF"
                    />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                    Ops! Algo deu errado
                </Text>

                <Text style={[styles.message, { color: theme.textSecondary }]}>
                    Ocorreu um erro inesperado no aplicativo. 
                    Tente reiniciar ou reporte o problema para nossa equipe.
                </Text>

                {__DEV__ && error && (
                    <View style={[styles.errorDetails, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.errorTitle, { color: theme.text }]}>
                            Detalhes do erro (desenvolvimento):
                        </Text>
                        <Text style={[styles.errorText, { color: '#FF4757' }]} numberOfLines={5}>
                            {error.message}
                        </Text>
                    </View>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={onRestart}
                        accessibilityLabel="Tentar novamente"
                        accessibilityHint="Reinicia o aplicativo e tenta corrigir o erro"
                    >
                        <Ionicons
                            name="refresh"
                            size={20}
                            color="#FFFFFF"
                            style={styles.buttonIcon}
                        />
                        <Text style={styles.buttonText}>Tentar Novamente</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton, { borderColor: theme.border }]}
                        onPress={onReportError}
                        accessibilityLabel="Reportar erro"
                        accessibilityHint="Envia detalhes do erro para a equipe de desenvolvimento"
                    >
                        <Ionicons
                            name="bug"
                            size={20}
                            color={theme.text}
                            style={styles.buttonIcon}
                        />
                        <Text style={[styles.buttonText, { color: theme.text }]}>
                            Reportar Erro
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

// HOC wrapper to provide theme context
const ErrorBoundary: React.FC<Props> = (props) => {
    return <ErrorBoundaryClass {...props} />;
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
        maxWidth: 320,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    errorDetails: {
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    errorTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    buttonContainer: {
        gap: 16,
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        minHeight: 52,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default ErrorBoundary;