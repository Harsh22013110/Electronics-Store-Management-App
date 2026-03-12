import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, HelperText, TextInput } from 'react-native-paper';
import { parseImeiList } from '../utils/imei';

export function ImeiInput(props: {
  label?: string;
  quantity: number;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [raw, setRaw] = useState('');

  const error =
    props.quantity > 0 && props.value.length > 0 && props.value.length !== props.quantity
      ? `IMEI count must match quantity (${props.value.length}/${props.quantity}).`
      : undefined;

  const preview = useMemo(() => props.value.slice(0, 12), [props.value]);

  return (
    <View style={styles.wrap}>
      <TextInput
        label={props.label ?? 'IMEI numbers (paste: one per line)'}
        value={raw}
        onChangeText={setRaw}
        multiline
        numberOfLines={3}
        autoCorrect={false}
        autoCapitalize="none"
        right={
          <TextInput.Icon
            icon="plus"
            onPress={() => {
              const parsed = parseImeiList(raw);
              if (!parsed.length) return;
              const next = Array.from(new Set([...props.value, ...parsed]));
              props.onChange(next);
              setRaw('');
            }}
          />
        }
      />
      <HelperText type={error ? 'error' : 'info'} visible>
        {error ?? 'Tip: paste from notes/WhatsApp; separators: new line, comma, semicolon.'}
      </HelperText>
      <View style={styles.chips}>
        {preview.map((x) => (
          <Chip key={x} onClose={() => props.onChange(props.value.filter((i) => i !== x))} style={styles.chip}>
            {x}
          </Chip>
        ))}
        {props.value.length > preview.length ? (
          <Chip style={styles.chip}>{`+${props.value.length - preview.length} more`}</Chip>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginRight: 0 },
});

