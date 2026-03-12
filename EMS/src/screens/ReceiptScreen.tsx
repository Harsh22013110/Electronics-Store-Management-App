import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { Button, Card, Chip, Divider, Text } from 'react-native-paper';
import { SHOP_NAME } from '../config/shop';
import type { RootStackParamList } from '../navigation/types';
import { printReceipt, shareReceiptPdf } from '../receipts/receiptPdf';
import { formatMoney } from '../utils/money';

export function ReceiptScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Receipt'>>();
  const tx = route.params.transaction;
  const [busy, setBusy] = useState<'share' | 'print' | null>(null);

  const personLabel = tx.type === 'purchase' ? 'Supplier' : 'Customer';
  const title = tx.type === 'purchase' ? 'Purchase Receipt' : 'Sales Receipt';
  const created = useMemo(() => format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm'), [tx.createdAt]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Card mode="outlined">
        <Card.Content style={styles.card}>
          <Text variant="titleLarge">{SHOP_NAME}</Text>
          <Text style={{ opacity: 0.65 }}>{title}</Text>
          <Divider style={{ marginVertical: 12 }} />

          <Text>
            <Text style={styles.bold}>Date:</Text> {created}
          </Text>
          <Text>
            <Text style={styles.bold}>{personLabel}:</Text> {tx.personName}
          </Text>
          <Text>
            <Text style={styles.bold}>Phone:</Text> {tx.companyName} · {tx.modelName}
          </Text>

          <Divider style={{ marginVertical: 12 }} />

          <View style={styles.rowBetween}>
            <Text>Qty</Text>
            <Text style={styles.bold}>{tx.quantity}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text>Unit Price</Text>
            <Text style={styles.bold}>{formatMoney(tx.unitPrice)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text>Total</Text>
            <Text style={[styles.bold, styles.total]}>{formatMoney(tx.totalPrice)}</Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <Chip style={tx.paymentStatus === 'paid' ? styles.paid : styles.pending}>
              {tx.paymentStatus.toUpperCase()}
            </Chip>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <Text style={styles.bold}>IMEI</Text>
          <Text style={{ opacity: 0.8 }}>{tx.imeis.join(', ')}</Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained"
        icon="share-variant"
        loading={busy === 'share'}
        disabled={!!busy}
        onPress={async () => {
          try {
            setBusy('share');
            await shareReceiptPdf({ shopName: SHOP_NAME, transaction: tx });
          } finally {
            setBusy(null);
          }
        }}
      >
        Share PDF
      </Button>
      <Button
        mode="outlined"
        icon="printer"
        loading={busy === 'print'}
        disabled={!!busy}
        onPress={async () => {
          try {
            setBusy('print');
            await printReceipt({ shopName: SHOP_NAME, transaction: tx });
          } finally {
            setBusy(null);
          }
        }}
      >
        Print
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 12 },
  card: { gap: 6 },
  bold: { fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  total: { fontSize: 18 },
  paid: { backgroundColor: 'rgba(34,197,94,0.16)' },
  pending: { backgroundColor: 'rgba(239,68,68,0.16)' },
});

