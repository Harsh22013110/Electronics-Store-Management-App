import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IS_FIREBASE_CONFIGURED } from '../config/flags';
import type { InventoryItem, PaymentStatus, Transaction } from '../types';
import { localAdjustStock, localCreatePurchase, localCreateSale, localLoad } from './localStore';
import {
  firebaseAdjustStock,
  firebaseCreatePurchase,
  firebaseCreateSale,
  subscribeInventory,
  subscribeTransactions,
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
  createPurchase: (entry: TxEntry) => Promise<Transaction>;
  createSale: (entry: TxEntry) => Promise<Transaction>;
  adjustStock: (p: { companyId: string; modelId: string; delta: number }) => Promise<void>;
  refreshLocal: () => Promise<void>;
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const mode: 'local' | 'firebase' = IS_FIREBASE_CONFIGURED ? 'firebase' : 'local';
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const refreshLocal = useCallback(async () => {
    if (mode !== 'local') return;
    const snap = await localLoad();
    setTransactions(snap.transactions);
    setInventory(snap.inventory);
  }, [mode]);

  useEffect(() => {
    let unsubTx: undefined | (() => void);
    let unsubInv: undefined | (() => void);

    async function start() {
      setLoading(true);
      if (mode === 'firebase') {
        logger.info('Store start (firebase)', undefined, 'store');
        unsubTx = subscribeTransactions(setTransactions);
        unsubInv = subscribeInventory(setInventory);
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
    }),
    [inventory, loading, mode, refreshLocal, transactions]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const v = useContext(StoreContext);
  if (!v) throw new Error('StoreProvider is missing');
  return v;
}

