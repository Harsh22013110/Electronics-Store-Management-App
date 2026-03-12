import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, IconButton, Portal, Searchbar, Text, TextInput } from 'react-native-paper';
import { CATALOG } from '../data/catalog';
import { useStore } from '../store/StoreProvider';

export function InventoryScreen() {
  const store = useStore();
  const [q, setQ] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [dialogItemId, setDialogItemId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'remove'>('add');
  const [dialogQty, setDialogQty] = useState('1');
  const [dialogError, setDialogError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return store.inventory.filter((x) => {
      if (companyFilter !== 'all' && x.companyId !== companyFilter) return false;
      if (!s) return true;
      return `${x.companyName} ${x.modelName}`.toLowerCase().includes(s);
    });
  }, [companyFilter, q, store.inventory]);

  const openDialog = (id: string, mode: 'add' | 'remove') => {
    setDialogItemId(id);
    setDialogMode(mode);
    setDialogQty('1');
    setDialogError(null);
  };

  const activeItem = useMemo(
    () => filtered.find((x) => x.id === dialogItemId) ?? store.inventory.find((x) => x.id === dialogItemId) ?? null,
    [dialogItemId, filtered, store.inventory]
  );

  const handleConfirmDialog = async () => {
    if (!activeItem) {
      setDialogItemId(null);
      return;
    }
    const n = Number(dialogQty);
    if (!Number.isFinite(n) || n <= 0) {
      setDialogError('Enter a positive number.');
      return;
    }
    if (dialogMode === 'remove' && n > activeItem.stock) {
      setDialogError(`Cannot remove more than current stock (${activeItem.stock}).`);
      return;
    }

    try {
      setBusyKey(activeItem.id);
      const delta = dialogMode === 'add' ? n : -n;
      await store.adjustStock({ companyId: activeItem.companyId, modelId: activeItem.modelId, delta });
      setDialogItemId(null);
    } catch (e: any) {
      setDialogError(e?.message ?? 'Failed to update stock.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <View style={styles.page}>
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

                <View style={styles.btns}>
                  <IconButton
                    icon="minus"
                    mode="contained-tonal"
                    disabled={busyKey === item.id || item.stock <= 0}
                    onPress={() => openDialog(item.id, 'remove')}
                  />
                  <IconButton
                    icon="plus"
                    mode="contained-tonal"
                    disabled={busyKey === item.id}
                    onPress={() => openDialog(item.id, 'add')}
                  />
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />

      <Portal>
        <Dialog visible={!!dialogItemId} onDismiss={() => setDialogItemId(null)}>
          <Dialog.Title>{dialogMode === 'add' ? 'Add stock' : 'Reduce stock'}</Dialog.Title>
          <Dialog.Content>
            {activeItem && (
              <Text style={styles.dialogLabel}>
                {activeItem.companyName} · {activeItem.modelName} (Current: {activeItem.stock})
              </Text>
            )}
            <TextInput
              label="Quantity"
              value={dialogQty}
              onChangeText={(t) => {
                setDialogQty(t.replace(/[^0-9]/g, ''));
                setDialogError(null);
              }}
              keyboardType="number-pad"
            />
            {!!dialogError && <Text style={styles.dialogError}>{dialogError}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogItemId(null)}>Cancel</Button>
            <Button onPress={handleConfirmDialog}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, gap: 10 },
  filters: { gap: 8 },
  filterBtn: { marginRight: 8 },
  list: { gap: 10, paddingBottom: 20 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btns: { flexDirection: 'row', gap: 2 },
  stock: { marginTop: 4 },
  lowStock: { color: '#DC2626', fontWeight: '700' },
  dialogLabel: { marginBottom: 8, opacity: 0.8 },
  dialogError: { marginTop: 4, color: '#DC2626' },
});

