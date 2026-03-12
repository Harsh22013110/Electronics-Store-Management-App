import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

export function DashboardCard(props: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  right?: React.ReactNode;
}) {
  return (
    <Card mode="elevated" style={styles.card} onPress={props.onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.left}>
          <Text variant="titleLarge" style={styles.title}>
            {props.title}
          </Text>
          {!!props.subtitle && (
            <Text variant="bodyMedium" style={styles.subtitle}>
              {props.subtitle}
            </Text>
          )}
        </View>
        {!!props.right && <View style={styles.icon}>{props.right}</View>}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  title: {
    letterSpacing: 0.3,
  },
  subtitle: {
    opacity: 0.7,
  },
  icon: {
    marginLeft: 8,
  },
});

