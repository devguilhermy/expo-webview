import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    shadow: string;
    isDark: boolean;
}

const lightTheme: Theme = {
    primary: '#FF6F00',
    secondary: '#32CD32',
    background: '#F2F4F7',
    surface: '#FFFFFF',
    text: '#11181C',
    textSecondary: '#3C3C4399',
    border: '#E2E8F0',
    shadow: '#000000',
    isDark: false,
};

const darkTheme: Theme = {
    primary: '#FF6F00',
    secondary: '#32CD32',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    border: '#333333',
    shadow: '#000000',
    isDark: true,
};

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isLoading: boolean;
}

const ThemeContext = createContext<
    ThemeContextType | undefined
>(undefined);

const THEME_STORAGE_KEY = 'app_theme_mode';

export const ThemeProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const [isDark, setIsDark] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(
                THEME_STORAGE_KEY
            );
            if (savedTheme !== null) {
                setIsDark(savedTheme === 'dark');
            }
        } catch (error) {
            console.warn('Erro ao carregar tema:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = !isDark;
            setIsDark(newTheme);
            await AsyncStorage.setItem(
                THEME_STORAGE_KEY,
                newTheme ? 'dark' : 'light'
            );
        } catch (error) {
            console.warn('Erro ao salvar tema:', error);
        }
    };

    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider
            value={{ theme, toggleTheme, isLoading }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error(
            'useTheme deve ser usado dentro de um ThemeProvider'
        );
    }
    return context;
};
