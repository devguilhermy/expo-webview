import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    actionText?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon = 'information-circle-outline',
    title,
    message,
    actionText,
    onAction,
}) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                    <Ionicons
                        name={icon}
                        size={48}
                        color={theme.textSecondary}
                    />
                </View>

                <Text 
                    style={[styles.title, { color: theme.text }]}
                    accessible={true}
                    accessibilityRole="header"
                >
                    {title}
                </Text>

                <Text 
                    style={[styles.message, { color: theme.textSecondary }]}
                    accessible={true}
                >
                    {message}
                </Text>

                {actionText && onAction && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                        onPress={onAction}
                        accessible={true}
                        accessibilityLabel={actionText}
                        accessibilityHint="Executa ação para resolver o estado vazio"
                        accessibilityRole="button"
                    >
                        <Text style={styles.actionText}>{actionText}</Text>
                    </TouchableOpacity>
                )}
            </View>
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
        maxWidth: 320,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    actionButton: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        minWidth: 140,
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default EmptyState;