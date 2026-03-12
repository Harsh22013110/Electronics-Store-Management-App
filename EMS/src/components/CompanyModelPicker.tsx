import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Divider, Menu, Text, TextInput } from 'react-native-paper';
import { CATALOG, getCompanyById, type CatalogCompany } from '../data/catalog';

function PickerMenu(props: {
  label: string;
  valueLabel: string | null;
  valueId: string | null;
  disabled?: boolean;
  items: { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return props.items;
    return props.items.filter((x) => x.label.toLowerCase().includes(s));
  }, [props.items, q]);

  const hasExact = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return false;
    return props.items.some((x) => x.label.toLowerCase() === s);
  }, [props.items, q]);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <Pressable onPress={() => !props.disabled && setOpen(true)}>
          <TextInput
            label={props.label}
            value={props.valueLabel ?? props.valueId ?? ''}
            editable={false}
            right={<TextInput.Icon icon="menu-down" />}
            style={styles.input}
            pointerEvents="none"
            disabled={props.disabled}
          />
        </Pressable>
      }
    >
      <View style={styles.menuHeader}>
        <TextInput
          placeholder="Search..."
          value={q}
          onChangeText={setQ}
          autoCorrect={false}
          autoCapitalize="none"
          left={<TextInput.Icon icon="magnify" />}
          style={styles.search}
        />
      </View>
      <Divider />
      {!!q.trim() && !hasExact && (
        <Menu.Item
          title={`Use "${q.trim()}"`}
          onPress={() => {
            const v = q.trim();
            if (!v) return;
            props.onSelect(v);
            setOpen(false);
            setQ('');
          }}
        />
      )}
      {!!q.trim() && <Divider />}
      {filtered.slice(0, 30).map((x) => (
        <Menu.Item
          key={x.id}
          title={x.label}
          onPress={() => {
            props.onSelect(x.id);
            setOpen(false);
            setQ('');
          }}
        />
      ))}
      {filtered.length > 30 && <Menu.Item title={`+ ${filtered.length - 30} more...`} disabled />}
    </Menu>
  );
}

export function CompanyModelPicker(props: {
  companyId: string | null;
  modelId: string | null;
  onCompanyChange: (companyId: string) => void;
  onModelChange: (modelId: string) => void;
}) {
  const company = getCompanyById(props.companyId ?? undefined);
  const model = company?.models.find((m) => m.id === props.modelId) ?? null;

  const companyItems = useMemo(
    () => CATALOG.map((c) => ({ id: c.id, label: c.name })),
    []
  );
  const modelItems = useMemo(() => {
    const c: CatalogCompany | null = company;
    return (c?.models ?? []).map((m) => ({ id: m.id, label: m.name }));
  }, [company]);

  return (
    <View style={styles.row}>
      <PickerMenu
        label="Phone Company"
        valueLabel={company?.name ?? null}
        valueId={props.companyId}
        items={companyItems}
        onSelect={(id) => {
          props.onCompanyChange(id);
        }}
      />
      <PickerMenu
        label="Phone Model"
        valueLabel={model?.name ?? null}
        valueId={props.modelId}
        items={modelItems}
        disabled={!company}
        onSelect={(id) => {
          props.onModelChange(id);
        }}
      />
      {!!company && (
        <View style={styles.clearRow}>
          <Button
            mode="text"
            onPress={() => {
              props.onCompanyChange(company.id);
            }}
            disabled
          >
            Selected: {company.name}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10 },
  input: { backgroundColor: 'transparent' },
  menuHeader: { paddingHorizontal: 8, paddingTop: 6 },
  search: { backgroundColor: 'transparent' },
  clearRow: { marginTop: -6 },
});

