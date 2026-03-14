import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, ToastAndroid, View } from 'react-native';
import { Button, Card, Searchbar, Text } from 'react-native-paper';
import { CATALOG } from '../data/catalog';
import { useStore } from '../store/StoreProvider';

export function InventoryScreen() {
  const store = useStore();
  const [q, setQ] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return store.inventory.filter((x) => {
      if (companyFilter !== 'all' && x.companyId !== companyFilter) return false;
      if (!s) return true;
      return `${x.companyName} ${x.modelName}`.toLowerCase().includes(s);
    });
  }, [companyFilter, q, store.inventory]);

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text variant="titleMedium">Inventory</Text>
        <Text style={{ opacity: 0.65 }} variant="bodySmall">
          Last refreshed:{' '}
          {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : 'auto / realtime'}
        </Text>
      </View>
      <Searchbar placeholder="Search inventory..." value={q} onChangeText={setQ} />

      <View style={styles.filters}>
        <Text variant="labelLarge">Company:</Text>
        <FlatList
          horizontal
          data={[{ id: 'all', name: 'All' }, ...CATALOG.map((c) => ({ id: c.id, name: c.name }))]}
          keyExtractor={(x) => x.id}
          renderItem={({ item }) => (
            <Button
              compact
              mode={companyFilter === item.id ? 'contained' : 'outlined'}
              onPress={() => setCompanyFilter(item.id)}
              style={styles.filterBtn}
            >
              {item.name}
            </Button>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ opacity: 0.65 }}>No inventory yet. Add a purchase first.</Text>}
        renderItem={({ item }) => {
          const low = item.stock < 3;
          return (
            <Card mode="outlined">
              <Card.Content style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="titleSmall">
                    {item.companyName} · {item.modelName}
                  </Text>
                  <Text variant="bodyMedium" style={[styles.stock, low && styles.lowStock]}>
                    Stock: {item.stock}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              if (refreshing) return;
              try {
                setRefreshing(true);
                await store.manualRefresh('inventory');
                const now = Date.now();
                setLastRefreshedAt(now);
                ToastAndroid.show('Data refreshed successfully', ToastAndroid.SHORT);
              } catch {
                ToastAndroid.show('Refresh failed', ToastAndroid.SHORT);
              } finally {
                setRefreshing(false);
              }
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  filters: { gap: 8 },
  filterBtn: { marginRight: 8 },
  list: { gap: 10, paddingBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stock: { marginTop: 4 },
  lowStock: { color: '#DC2626', fontWeight: '700' },
});

