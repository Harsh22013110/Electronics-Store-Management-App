import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import type { RootStackParamList } from './types';
import { DashboardScreen } from '../screens/DashboardScreen';
import { RecentScreen } from '../screens/RecentScreen';
import { PurchaseScreen } from '../screens/PurchaseScreen';
import { SaleScreen } from '../screens/SaleScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { ReceiptScreen } from '../screens/ReceiptScreen';
import { LogsScreen } from '../screens/LogsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'EMS' }} />
      <Stack.Screen name="Recent" component={RecentScreen} options={{ title: 'Recent' }} />
      <Stack.Screen name="Purchase" component={PurchaseScreen} options={{ title: 'Received From' }} />
      <Stack.Screen name="Sale" component={SaleScreen} options={{ title: 'Sold To' }} />
      <Stack.Screen name="Inventory" component={InventoryScreen} options={{ title: 'Inventory' }} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt' }} />
      <Stack.Screen name="Logs" component={LogsScreen} options={{ title: 'Logs' }} />
    </Stack.Navigator>
  );
}

