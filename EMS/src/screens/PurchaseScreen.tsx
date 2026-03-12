import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, TextInput } from 'react-native-paper';
import { CompanyModelPicker } from '../components/CompanyModelPicker';
import { ImeiInput } from '../components/ImeiInput';
import { useStore } from '../store/StoreProvider';
import type { PaymentStatus } from '../types';
import { toNumberOrZero } from '../utils/money';

export function PurchaseScreen() {
  const nav = useNavigation<any>();
  const store = useStore();

  const [supplier, setSupplier] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [qtyText, setQtyText] = useState('1');
  const [priceText, setPriceText] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('paid');
  const [imeis, setImeis] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quantity = Math.max(0, Math.floor(toNumberOrZero(qtyText)));
  const unitPrice = Math.max(0, toNumberOrZero(priceText));
  const total = useMemo(() => quantity * unitPrice, [quantity, unitPrice]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <TextInput label="Supplier Name" value={supplier} onChangeText={setSupplier} />

      <CompanyModelPicker
        companyId={companyId}
        modelId={modelId}
        onCompanyChange={(id) => {
          setCompanyId(id);
          setModelId(null);
        }}
        onModelChange={(id) => setModelId(id)}
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextInput
            label="Quantity received"
            value={qtyText}
            onChangeText={setQtyText}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.flex}>
          <TextInput
            label="Price per piece"
            value={priceText}
            onChangeText={setPriceText}
            keyboardType="numeric"
          />
        </View>
      </View>

      <TextInput label="Total price (auto)" value={String(total || 0)} editable={false} />

      <SegmentedButtons
        value={status}
        onValueChange={(v) => setStatus(v as PaymentStatus)}
        buttons={[
          { value: 'paid', label: 'Paid' },
          { value: 'pending', label: 'Pending' },
        ]}
      />

      <ImeiInput label="IMEI numbers (one per phone)" quantity={quantity} value={imeis} onChange={setImeis} />

      <HelperText type="error" visible={!!error}>
        {error ?? ''}
      </HelperText>

      <Button
        mode="contained"
        loading={saving}
        disabled={saving}
        onPress={async () => {
          setError(null);
          try {
            setSaving(true);
            const tx = await store.createPurchase({
              personName: supplier,
              companyId: companyId ?? '',
              modelId: modelId ?? '',
              quantity,
              unitPrice,
              paymentStatus: status,
              imeis,
            });
            nav.navigate('Receipt', { transaction: tx });
          } catch (e: any) {
            setError(e?.message ?? 'Failed to save.');
          } finally {
            setSaving(false);
          }
        }}
      >
        Save Purchase
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, gap: 12 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});

