import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { IS_FIREBASE_CONFIGURED } from '../config/flags';
import type { InventoryItem, PaymentStatus, Transaction } from '../types';
import { localAdjustStock, localCreatePurchase, localCreateSale, localLoad, localUpdatePaymentStatus } from './localStore';
import {
  firebaseAdjustStock,
  firebaseCreatePurchase,
  firebaseCreateSale,
  fetchInventoryOnce,
  fetchTransactionsOnce,
  subscribeInventory,
  subscribeTransactions,
  testFirebaseConnection,
  firebaseUpdatePaymentStatus,
} from './firebaseStore';
import { logger } from '../utils/logger';

type TxEntry = {
  personName: string;
  companyId: string;
  modelId: string;
  quantity: number;
  unitPrice: number;
  paymentStatus: PaymentStatus;
  imeis: string[];
};

type StoreApi = {
  mode: 'local' | 'firebase';
  loading: boolean;
  transactions: Transaction[];
  inventory: InventoryItem[];
  // connection / debug
  connectionStatus: 'unknown' | 'connected' | 'disconnected';
  isRealtimeActive: boolean;
  isOnline: boolean;
  lastInventoryListenerAt: number | null;
  lastTransactionsListenerAt: number | null;
  lastRefreshAt: number | null;
  createPurchase: (entry: TxEntry) => Promise<Transaction>;
  createSale: (entry: TxEntry) => Promise<Transaction>;
  adjustStock: (p: { companyId: string; modelId: string; delta: number }) => Promise<void>;
  refreshLocal: () => Promise<void>;
  manualRefresh: (scope: 'all' | 'inventory' | 'transactions') => Promise<void>;
  testFirebaseSync: () => Promise<boolean>;
  updatePaymentStatus: (id: string, status: PaymentStatus) => Promise<void>;
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const mode: 'local' | 'firebase' = IS_FIREBASE_CONFIGURED ? 'firebase' : 'local';
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastInventoryListenerAt, setLastInventoryListenerAt] = useState<number | null>(null);
  const [lastTransactionsListenerAt, setLastTransactionsListenerAt] = useState<number | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);

  const refreshLocal = useCallback(async () => {
    if (mode !== 'local') return;
    const snap = await localLoad();
    setTransactions(snap.transactions);
    setInventory(snap.inventory);
    setLastRefreshAt(Date.now());
  }, [mode]);

  const manualRefresh = useCallback(
    async (scope: 'all' | 'inventory' | 'transactions') => {
      if (mode === 'firebase') {
        try {
          logger.info('Manual refresh (firebase)', { scope }, 'store');
          if (scope === 'all' || scope === 'transactions') {
            const txs = await fetchTransactionsOnce(100);
            setTransactions(txs);
          }
          if (scope === 'all' || scope === 'inventory') {
            const inv = await fetchInventoryOnce();
            setInventory(inv);
          }
          setLastRefreshAt(Date.now());
        } catch (e: any) {
          logger.error('Manual refresh failed', e?.message ?? e, 'store');
          throw e;
        }
      } else {
        await refreshLocal();
      }
    },
    [mode, refreshLocal]
  );

  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    });
    return () => sub();
  }, []);

  useEffect(() => {
    let unsubTx: undefined | (() => void);
    let unsubInv: undefined | (() => void);

    async function start() {
      setLoading(true);
      if (mode === 'firebase') {
        logger.info('Store start (firebase)', undefined, 'store');
        try {
          const ok = await testFirebaseConnection();
          setConnectionStatus(ok ? 'connected' : 'disconnected');
        } catch {
          setConnectionStatus('disconnected');
        }
        unsubTx = subscribeTransactions((txs) => {
          logger.info('Transactions snapshot', { count: txs.length }, 'store');
          setTransactions(txs);
          setIsRealtimeActive(true);
          setLastTransactionsListenerAt(Date.now());
        });
        unsubInv = subscribeInventory((items) => {
          logger.info('Inventory snapshot', { count: items.length }, 'store');
          setInventory(items);
          setIsRealtimeActive(true);
          setLastInventoryListenerAt(Date.now());
        });
        setLoading(false);
      } else {
        logger.info('Store start (local)', undefined, 'store');
        await refreshLocal();
        setLoading(false);
      }
    }

    start();
    return () => {
      unsubTx?.();
      unsubInv?.();
    };
  }, [mode]);

  const api = useMemo<StoreApi>(
    () => ({
      mode,
      loading,
      transactions,
      inventory,
      connectionStatus,
      isRealtimeActive,
      isOnline,
      lastInventoryListenerAt,
      lastTransactionsListenerAt,
      lastRefreshAt,
      async createPurchase(entry) {
        logger.info('Create purchase', { quantity: entry.quantity }, 'store');
        const tx = mode === 'firebase' ? await firebaseCreatePurchase(entry) : await localCreatePurchase(entry);
        if (mode === 'local') await refreshLocal();
        return tx;
      },
      async createSale(entry) {
        logger.info('Create sale', { quantity: entry.quantity }, 'store');
        const tx = mode === 'firebase' ? await firebaseCreateSale(entry) : await localCreateSale(entry);
        if (mode === 'local') await refreshLocal();
        return tx;
      },
      async adjustStock(p) {
        logger.info('Adjust stock', p, 'store');
        if (mode === 'firebase') await firebaseAdjustStock(p);
        else await localAdjustStock(p);
        if (mode === 'local') await refreshLocal();
      },
      refreshLocal,
      manualRefresh,
      async testFirebaseSync() {
        if (mode !== 'firebase') {
          return false;
        }
        try {
          logger.info('Test Firebase sync', undefined, 'store');
          // A light-weight connectivity test: just refetch small datasets.
          await manualRefresh('transactions');
          return true;
        } catch (e) {
          logger.error('Test Firebase sync failed', e, 'store');
          return false;
        }
      },
      async updatePaymentStatus(id, status) {
        logger.info('Update payment status', { id, status }, 'store');
        if (mode === 'firebase') {
          await firebaseUpdatePaymentStatus(id, status);
        } else {
          await localUpdatePaymentStatus(id, status);
          await refreshLocal();
        }
      },
    }),
    [
      connectionStatus,
      inventory,
      isOnline,
      isRealtimeActive,
      lastInventoryListenerAt,
      lastRefreshAt,
      lastTransactionsListenerAt,
      loading,
      manualRefresh,
      mode,
      refreshLocal,
      transactions,
    ]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error('StoreProvider is missing');
  return v;
}

