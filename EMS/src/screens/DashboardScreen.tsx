import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { DashboardCard } from '../components/DashboardCard';
import { useStore } from '../store/StoreProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { logger } from '../utils/logger';

export function DashboardScreen() {
  const nav = useNavigation<any>();
  const store = useStore();
  const theme = useAppTheme();
  const paperTheme = useTheme();
  const [testing, setTesting] = useState(false);

  const connectionColor =
    store.mode !== 'firebase'
      ? paperTheme.colors.secondary
      : store.connectionStatus === 'connected'
      ? '#22c55e'
      : store.connectionStatus === 'disconnected'
      ? '#ef4444'
      : '#facc15';

  const lastUpdatedLabel = useMemo(() => {
    if (!store.lastRefreshAt && !store.lastInventoryListenerAt && !store.lastTransactionsListenerAt) {
      return 'Never updated yet';
    }
    const t = store.lastRefreshAt ?? Math.max(store.lastInventoryListenerAt ?? 0, store.lastTransactionsListenerAt ?? 0);
    const diff = Date.now() - t;
    const sec = Math.round(diff / 1000);
    if (sec < 5) return 'Just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec / 60);
    return `${min} min ago`;
  }, [store.lastInventoryListenerAt, store.lastRefreshAt, store.lastTransactionsListenerAt]);

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
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: connectionColor }]} />
          <Text variant="bodyMedium" style={styles.hint}>
            {store.mode !== 'firebase'
              ? 'Local mode (offline only)'
              : store.connectionStatus === 'connected'
              ? 'Firebase connected'
              : store.connectionStatus === 'disconnected'
              ? 'Firebase not connected'
              : 'Checking Firebase...'}
          </Text>
        </View>
        {store.mode === 'firebase' && (
          <Text variant="bodySmall" style={styles.hint}>
            {store.isRealtimeActive ? 'Realtime sync: Active' : 'Realtime sync: Waiting for updates'}
          </Text>
        )}
        <Text variant="bodySmall" style={styles.hint}>
          Last updated: {lastUpdatedLabel} · {store.isOnline ? 'Online' : 'Offline'}
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
        <DashboardCard
          title="Summary"
          subtitle="Monthly / yearly profit"
          onPress={() => nav.navigate('Summary')}
          right={<IconButton icon="chart-line" size={26} />}
        />
      </View>

      <View style={styles.debug}>
        <Button
          mode="outlined"
          loading={testing}
          disabled={testing}
          onPress={async () => {
            if (store.mode !== 'firebase') {
              Alert.alert('Firebase not enabled', 'Add Firebase config to use sync test.');
              return;
            }
            setTesting(true);
            const ok = await store.testFirebaseSync();
            setTesting(false);
            Alert.alert(ok ? 'Firebase Sync Working' : 'Sync Failed', ok ? 'Realtime data fetched successfully.' : 'Could not refresh data from Firestore.');
          }}
        >
          Test Firebase Sync
        </Button>
        <View style={styles.debugLines}>
          <Text variant="bodySmall" style={styles.hint}>
            Last tx listener: {store.lastTransactionsListenerAt ? new Date(store.lastTransactionsListenerAt).toLocaleTimeString() : '—'}
          </Text>
          <Text variant="bodySmall" style={styles.hint}>
            Last inv listener: {store.lastInventoryListenerAt ? new Date(store.lastInventoryListenerAt).toLocaleTimeString() : '—'}
          </Text>
          <Text variant="bodySmall" style={styles.hint}>
            Last manual refresh: {store.lastRefreshAt ? new Date(store.lastRefreshAt).toLocaleTimeString() : '—'}
          </Text>
        </View>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  cards: {
    marginTop: 8,
  },
  debug: {
    marginTop: 16,
    gap: 6,
  },
  debugLines: {
    gap: 2,
  },
});

