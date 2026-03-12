import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { DashboardCard } from '../components/DashboardCard';
import { useStore } from '../store/StoreProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { logger } from '../utils/logger';

export function DashboardScreen() {
  const nav = useNavigation<any>();
  const store = useStore();
  const theme = useAppTheme();
  const paperTheme = useTheme();

  useLayoutEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton
            icon="bug"
            onPress={() => {
              logger.info('Open logs screen', undefined, 'ui');
              nav.navigate('Logs');
            }}
            accessibilityLabel="Open logs"
          />
          <IconButton
            icon="theme-light-dark"
            onPress={() => {
              const next = theme.mode === 'dark' ? 'light' : theme.mode === 'light' ? 'system' : 'dark';
              logger.info('Theme change', { from: theme.mode, to: next }, 'ui');
              theme.setMode(next);
            }}
            accessibilityLabel="Toggle theme"
          />
        </View>
      ),
    });
  }, [nav, theme]);

  const stats = useMemo(() => {
    const recent = store.transactions.slice(0, 5);
    const totalStock = store.inventory.reduce((a, b) => a + (b.stock || 0), 0);
    return { recentCount: recent.length, totalStock };
  }, [store.inventory, store.transactions]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.header}>
        <Text variant="headlineSmall">Welcome to EMS</Text>
        <Text variant="bodyMedium" style={styles.hint}>
          {store.mode === 'firebase'
            ? 'Synced with Firebase Firestore.'
            : 'Working in local offline mode. Add Firebase config to sync.'}
        </Text>
      </View>

      <View style={styles.cards}>
        <DashboardCard
          title="Recent"
          subtitle={`${stats.recentCount} latest transactions`}
          onPress={() => nav.navigate('Recent')}
          right={<IconButton icon="history" size={26} />}
        />
        <DashboardCard
          title="Received From"
          subtitle="Purchase entry"
          onPress={() => nav.navigate('Purchase')}
          right={<IconButton icon="package-down" size={26} />}
        />
        <DashboardCard
          title="Sold To"
          subtitle="Sales entry"
          onPress={() => nav.navigate('Sale')}
          right={<IconButton icon="package-up" size={26} />}
        />
        <DashboardCard
          title="Inventory"
          subtitle={`${stats.totalStock} pieces available`}
          onPress={() => nav.navigate('Inventory')}
          right={<IconButton icon="warehouse" size={26} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 18,
  },
  header: {
    marginBottom: 8,
    gap: 4,
  },
  hint: {
    opacity: 0.7,
  },
  cards: {
    marginTop: 8,
  },
});

