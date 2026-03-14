import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View, ToastAndroid } from 'react-native';
import { format } from 'date-fns';
import { Card, Chip, Searchbar, SegmentedButtons, Text } from 'react-native-paper';
import { useStore } from '../store/StoreProvider';
import type { PaymentStatus, Transaction, TransactionType } from '../types';
import { formatMoney } from '../utils/money';

type TypeFilter = TransactionType | 'all';
type PayFilter = PaymentStatus | 'all';

type TxCardProps = {
  tx: Transaction;
  onMarkPaid?: () => void;
};

function TxCard({ tx, onMarkPaid }: TxCardProps) {
  return (
    <Card style={styles.card} mode="outlined">
      <Card.Content style={styles.cardContent}>
        <View style={styles.rowBetween}>
          <Text variant="titleSmall">{tx.type === 'purchase' ? 'Received' : 'Sold'}</Text>
          <Text variant="labelSmall" style={styles.muted}>
            {format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm')}
          </Text>
        </View>
        <Text variant="bodyMedium">
          {tx.personName} · {tx.companyName} · {tx.modelName}
        </Text>
        <View style={styles.rowBetween}>
          <Text variant="bodySmall" style={styles.muted}>
            Qty {tx.quantity} · Unit {formatMoney(tx.unitPrice)}
          </Text>
          <Text variant="bodyMedium">
            <Text style={{ fontWeight: '700' }}>{formatMoney(tx.totalPrice)}</Text>
          </Text>
        </View>
        <View style={styles.row}>
          <Chip compact style={tx.paymentStatus === 'paid' ? styles.paid : styles.pending}>
            {tx.paymentStatus.toUpperCase()}
          </Chip>
          {tx.paymentStatus === 'pending' && onMarkPaid && (
            <Chip compact mode="outlined" onPress={onMarkPaid}>
              Mark as Paid
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

export function RecentScreen() {
  const store = useStore();
  const [q, setQ] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [pay, setPay] = useState<PayFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return store.transactions.filter((tx) => {
      if (type !== 'all' && tx.type !== type) return false;
      if (pay !== 'all' && tx.paymentStatus !== pay) return false;
      if (!s) return true;
      const hay = `${tx.personName} ${tx.companyName} ${tx.modelName} ${tx.imeis.join(' ')}`.toLowerCase();
      return hay.includes(s);
    });
  }, [pay, q, store.transactions, type]);

  const totalForFilter = useMemo(() => {
    if (pay === 'all') return 0;
    return filtered.reduce((sum, tx) => sum + tx.totalPrice, 0);
  }, [filtered, pay]);

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text variant="titleMedium">Recent</Text>
        <Text style={styles.muted} variant="bodySmall">
          Last refreshed:{' '}
          {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleTimeString() : 'auto / realtime'}
        </Text>
      </View>
      <Searchbar placeholder="Search (name, model, IMEI)..." value={q} onChangeText={setQ} />
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as TypeFilter)}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'purchase', label: 'Received' },
          { value: 'sale', label: 'Sold' },
        ]}
      />

      {pay !== 'all' && (
        <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
          {pay === 'paid' ? 'Total Paid: ' : 'Total Pending: '}
          {formatMoney(totalForFilter)}
        </Text>
      )}
      <SegmentedButtons
        value={pay}
        onValueChange={(v) => setPay(v as PayFilter)}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
        ]}
      />

      <FlatList
        data={filtered}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <TxCard
            tx={item}
            onMarkPaid={
              pay === 'pending'
                ? async () => {
                    await store.updatePaymentStatus(item.id, 'paid');
                  }
                : undefined
            }
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.muted}>No transactions found.</Text>}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              if (refreshing) return;
              try {
                setRefreshing(true);
                await store.manualRefresh('transactions');
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { gap: 10, paddingBottom: 20 },
  card: {},
  cardContent: { gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  muted: { opacity: 0.65 },
  paid: { backgroundColor: 'rgba(34,197,94,0.16)' },
  pending: { backgroundColor: 'rgba(239,68,68,0.16)' },
});

