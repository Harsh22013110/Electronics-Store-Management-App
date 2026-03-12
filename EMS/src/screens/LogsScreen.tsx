import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { format } from 'date-fns';
import { Button, Card, Chip, Text } from 'react-native-paper';
import { clearLogs, initLogs, subscribeLogs, type LogEntry } from '../utils/logger';

function levelColor(level: LogEntry['level']) {
  switch (level) {
    case 'error':
      return { backgroundColor: 'rgba(239,68,68,0.18)' };
    case 'warn':
      return { backgroundColor: 'rgba(245,158,11,0.18)' };
    case 'debug':
      return { backgroundColor: 'rgba(59,130,246,0.14)' };
    default:
      return { backgroundColor: 'rgba(34,197,94,0.14)' };
  }
}

export function LogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    initLogs();
    return subscribeLogs((x) => setLogs([...x].reverse()));
  }, []);

  const stats = useMemo(() => {
    const total = logs.length;
    const errors = logs.filter((l) => l.level === 'error').length;
    return { total, errors };
  }, [logs]);

  return (
    <View style={styles.page}>
      <View style={styles.row}>
        <Text variant="titleMedium">Logs</Text>
        <Text style={{ opacity: 0.65 }}>
          {stats.total} items · {stats.errors} errors
        </Text>
      </View>

      <View style={styles.row}>
        <Button mode="outlined" onPress={() => clearLogs()}>
          Clear
        </Button>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card mode="outlined">
            <Card.Content style={{ gap: 6 }}>
              <View style={styles.rowBetween}>
                <Chip compact style={levelColor(item.level)}>
                  {item.level.toUpperCase()}
                </Chip>
                <Text style={{ opacity: 0.6 }} variant="labelSmall">
                  {format(new Date(item.t), 'HH:mm:ss')}
                </Text>
              </View>
              {!!item.tag && (
                <Text style={{ opacity: 0.7 }} variant="labelMedium">
                  {item.tag}
                </Text>
              )}
              <Text>{item.msg}</Text>
              {item.data != null ? (
                <Text style={styles.mono} selectable>
                  {typeof item.data === 'string' ? item.data : JSON.stringify(item.data, null, 2)}
                </Text>
              ) : null}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ opacity: 0.65 }}>No logs yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, gap: 10 },
  list: { gap: 10, paddingBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mono: { fontFamily: 'monospace', fontSize: 12, opacity: 0.8 },
});

