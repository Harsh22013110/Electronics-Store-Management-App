import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useStore } from '../store/StoreProvider';
import { formatMoney } from '../utils/money';

const currentYear = new Date().getFullYear();

export function SummaryScreen() {
  const store = useStore();
  const [year, setYear] = useState<number | null>(currentYear);
  const [month, setMonth] = useState<number | null>(null); // 0-11 or null for all months

  const { filtered, totals } = useMemo(() => {
    const txs = store.transactions;
    const filtered = txs.filter((t) => {
      const d = new Date(t.createdAt);
      if (year != null && d.getFullYear() !== year) return false;
      if (month != null && d.getMonth() !== month) return false;
      return true;
    });
    let received = 0;
    let sold = 0;
    for (const t of filtered) {
      if (t.type === 'purchase') received += t.totalPrice;
      else if (t.type === 'sale') sold += t.totalPrice;
    }
    return {
      filtered,
      totals: {
        received,
        sold,
        profit: sold - received,
      },
    };
  }, [month, store.transactions, year]);

  const monthLabel =
    month == null
      ? 'All months'
      : new Date(2000, month, 1).toLocaleString(undefined, { month: 'short' });

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text variant="titleLarge">Summary</Text>
      <Text variant="bodyMedium" style={styles.hint}>
        Profit based on completed purchases and sales.
      </Text>

      <View style={styles.row}>
        <Text variant="labelLarge">Year</Text>
        <View style={styles.chipRow}>
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <Button
              key={y}
              mode={year === y ? 'contained' : 'outlined'}
              compact
              onPress={() => setYear(y)}
            >
              {y}
            </Button>
          ))}
          <Button mode={year == null ? 'contained' : 'outlined'} compact onPress={() => setYear(null)}>
            All
          </Button>
        </View>
      </View>

      <View style={styles.row}>
        <Text variant="labelLarge">Month</Text>
        <View style={styles.chipRow}>
          <Button mode={month == null ? 'contained' : 'outlined'} compact onPress={() => setMonth(null)}>
            All
          </Button>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((m) => (
            <Button
              key={m}
              mode={month === m ? 'contained' : 'outlined'}
              compact
              onPress={() => setMonth(m)}
            >
              {new Date(2000, m, 1).toLocaleString(undefined, { month: 'short' })}
            </Button>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text variant="titleMedium">Period: {monthLabel} {year ?? ''}</Text>
        <Text variant="bodyMedium" style={styles.hint}>
          Transactions: {filtered.length}
        </Text>

        <View style={styles.statRow}>
          <Text variant="bodyLarge">Total Purchased</Text>
          <Text variant="bodyLarge">{formatMoney(totals.received)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="bodyLarge">Total Sold</Text>
          <Text variant="bodyLarge">{formatMoney(totals.sold)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text variant="titleMedium">Profit</Text>
          <Text
            variant="titleMedium"
            style={{ color: totals.profit >= 0 ? '#22c55e' : '#ef4444', fontWeight: '700' }}
          >
            {formatMoney(totals.profit)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    gap: 16,
  },
  hint: {
    opacity: 0.7,
  },
  row: {
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  card: {
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
});

