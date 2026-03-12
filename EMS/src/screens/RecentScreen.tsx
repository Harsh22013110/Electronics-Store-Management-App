import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { Card, Chip, Searchbar, SegmentedButtons, Text } from 'react-native-paper';
import { useStore } from '../store/StoreProvider';
import type { PaymentStatus, Transaction, TransactionType } from '../types';
import { formatMoney } from '../utils/money';

type TypeFilter = TransactionType | 'all';
type PayFilter = PaymentStatus | 'all';

function TxCard({ tx }: { tx: Transaction }) {
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

  return (
    <View style={styles.page}>
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
        renderItem={({ item }) => <TxCard tx={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.muted}>No transactions found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, gap: 10 },
  list: { gap: 10, paddingBottom: 20 },
  card: {},
  cardContent: { gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  muted: { opacity: 0.65 },
  paid: { backgroundColor: 'rgba(34,197,94,0.16)' },
  pending: { backgroundColor: 'rgba(239,68,68,0.16)' },
});

