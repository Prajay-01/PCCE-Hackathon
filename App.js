import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Suppress Firebase deprecation warnings until migration to v22
LogBox.ignoreLogs([
  'This method is deprecated',
  'React Native Firebase',
  'migrating-to-v22',
]);

// Dark theme configuration
const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00D9C0',
    secondary: '#00D9C0',
    background: '#000000',
    surface: '#1a1a1a',
    surfaceVariant: '#2a2a2a',
    error: '#FF5252',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
    text: '#FFFFFF',
    placeholder: '#808080',
  },
  dark: true,
};

export default function App() {
  useEffect(() => {
    // Suppress console warnings for Firebase deprecation
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (
        args[0]?.includes?.('React Native Firebase') ||
        args[0]?.includes?.('migrating-to-v22') ||
        args[0]?.includes?.('This method is deprecated')
      ) {
        return;
      }
      originalWarn(...args);
    };

    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return (
    <PaperProvider theme={darkTheme}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </PaperProvider>
  );
}

