import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { RootNavigator } from './src/navigation/RootNavigator';
import { StoreProvider } from './src/store/StoreProvider';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { initLogs, logger } from './src/utils/logger';

function AppShell() {
  const { theme } = useAppTheme();
  React.useEffect(() => {
    initLogs();
    logger.info('App started', undefined, 'app');
  }, []);
  return (
    <PaperProvider theme={theme.paper}>
      <NavigationContainer theme={theme.navigation}>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </ThemeProvider>
  );
}
