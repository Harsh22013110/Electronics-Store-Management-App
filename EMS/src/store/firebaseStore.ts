import { initializeApp, getApps } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config/firebaseConfig';
import { getCompanyById, getModelById } from '../data/catalog';
import type { InventoryItem, PaymentStatus, Transaction } from '../types';

function invId(companyId: string, modelId: string) {
  return `${companyId}_${modelId}`;
}

function toEpochMs(v: any): number {
  // Firestore Timestamp has toMillis()
  if (!v) return Date.now();
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v === 'number') return v;
  return Date.now();
}

export function getFirebaseDb() {
  const app = getApps().length ? getApps()[0]! : initializeApp(FIREBASE_CONFIG);
  return getFirestore(app);
}

export function subscribeTransactions(onData: (txs: Transaction[]) => void) {
  const db = getFirebaseDb();
  const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const txs: Transaction[] = snap.docs.map((d) => {
      const x = d.data() as any;
      return {
        id: d.id,
        type: x.type,
        personName: x.personName,
        companyId: x.companyId,
        companyName: x.companyName,
        modelId: x.modelId,
        modelName: x.modelName,
        quantity: x.quantity,
        unitPrice: x.unitPrice,
        totalPrice: x.totalPrice,
        paymentStatus: x.paymentStatus,
        imeis: x.imeis ?? [],
        createdAt: toEpochMs(x.createdAt),
      };
    });
    onData(txs);
  });
}

export function subscribeInventory(onData: (items: InventoryItem[]) => void) {
  const db = getFirebaseDb();
  const q = query(collection(db, 'inventory'), orderBy('companyName', 'asc'));
  return onSnapshot(q, (snap) => {
    const items: InventoryItem[] = snap.docs.map((d) => {
      const x = d.data() as any;
      return {
        id: d.id,
        companyId: x.companyId,
        companyName: x.companyName,
        modelId: x.modelId,
        modelName: x.modelName,
        stock: x.stock,
        updatedAt: toEpochMs(x.updatedAt),
      };
    });
    onData(items);
  });
}

type Entry = {
  personName: string;
  companyId: string;
  modelId: string;
  quantity: number;
  unitPrice: number;
  paymentStatus: PaymentStatus;
  imeis: string[];
};

async function createTx(type: 'purchase' | 'sale', entry: Entry): Promise<Transaction> {
  if (!entry.personName.trim()) throw new Error('Name is required.');
  if (!entry.companyId) throw new Error('Company is required.');
  if (!entry.modelId) throw new Error('Model is required.');
  if (!Number.isFinite(entry.quantity) || entry.quantity <= 0) throw new Error('Quantity must be > 0.');
  if (!Number.isFinite(entry.unitPrice) || entry.unitPrice <= 0) throw new Error('Price must be > 0.');

  const catCompany = getCompanyById(entry.companyId);
  const catModel = getModelById(entry.companyId, entry.modelId);
  const companyId = catCompany?.id ?? entry.companyId.trim();
  const companyName = catCompany?.name ?? entry.companyId.trim();
  const modelId = catModel?.id ?? entry.modelId.trim();
  const modelName = catModel?.name ?? entry.modelId.trim();
  if (!entry.imeis.length) throw new Error('Please enter IMEI numbers (one per piece).');
  if (entry.imeis.length !== entry.quantity) throw new Error('IMEI count must match quantity.');

  const db = getFirebaseDb();
  const modelKey = invId(companyId, modelId);
  const invRef = doc(db, 'inventory', modelKey);
  const imeiRefs = entry.imeis.map((imei) => doc(db, 'imeis', imei));

  const txRef = await runTransaction(db, async (t) => {
    const invSnap = await t.get(invRef);
    const currentStock = invSnap.exists() ? (invSnap.data() as any).stock : 0;
    if (type === 'sale' && currentStock < entry.quantity) {
      throw new Error(`Not enough stock. Available: ${currentStock}`);
    }

    // IMEI rules
    for (const r of imeiRefs) {
      const s = await t.get(r);
      if (type === 'purchase') {
        if (s.exists()) throw new Error(`IMEI already exists: ${r.id}`);
      } else {
        if (!s.exists()) throw new Error(`IMEI not found in stock: ${r.id}`);
        const data = s.data() as any;
        if (data.status !== 'in_stock') throw new Error(`IMEI already sold: ${r.id}`);
        if (data.modelKey !== modelKey) throw new Error(`IMEI belongs to a different model: ${r.id}`);
      }
    }

    const txDoc = doc(collection(db, 'transactions'));
    t.set(txDoc, {
      type,
      personName: entry.personName.trim(),
      companyId,
      companyName,
      modelId,
      modelName,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      totalPrice: entry.quantity * entry.unitPrice,
      paymentStatus: entry.paymentStatus,
      imeis: entry.imeis,
      createdAt: serverTimestamp(),
    });

    const nextStock = currentStock + (type === 'purchase' ? entry.quantity : -entry.quantity);
    if (!invSnap.exists()) {
      t.set(invRef, {
        companyId,
        companyName,
        modelId,
        modelName,
        stock: nextStock,
        updatedAt: serverTimestamp(),
      });
    } else {
      t.update(invRef, { stock: nextStock, updatedAt: serverTimestamp() });
    }

    for (const r of imeiRefs) {
      if (type === 'purchase') {
        t.set(r, { status: 'in_stock', modelKey, lastTransactionId: txDoc.id, updatedAt: serverTimestamp() });
      } else {
        t.update(r, { status: 'sold', lastTransactionId: txDoc.id, updatedAt: serverTimestamp() });
      }
    }

    return txDoc;
  });

  // re-read to get normalized receipt context
  const snap = await getDoc(txRef);
  const d = snap.data() as any;
  return {
    id: snap.id,
    type: d.type,
    personName: d.personName,
    companyId: d.companyId,
    companyName: d.companyName,
    modelId: d.modelId,
    modelName: d.modelName,
    quantity: d.quantity,
    unitPrice: d.unitPrice,
    totalPrice: d.totalPrice,
    paymentStatus: d.paymentStatus,
    imeis: d.imeis ?? [],
    createdAt: toEpochMs(d.createdAt),
  };
}

export function firebaseCreatePurchase(entry: Entry) {
  return createTx('purchase', entry);
}

export function firebaseCreateSale(entry: Entry) {
  return createTx('sale', entry);
}

export async function firebaseAdjustStock(params: { companyId: string; modelId: string; delta: number }) {
  const catCompany = getCompanyById(params.companyId);
  const catModel = getModelById(params.companyId, params.modelId);
  const companyId = catCompany?.id ?? params.companyId.trim();
  const companyName = catCompany?.name ?? params.companyId.trim();
  const modelId = catModel?.id ?? params.modelId.trim();
  const modelName = catModel?.name ?? params.modelId.trim();
  if (!Number.isFinite(params.delta) || params.delta === 0) throw new Error('Delta must be non-zero.');

  const db = getFirebaseDb();
  const modelKey = invId(companyId, modelId);
  const invRef = doc(db, 'inventory', modelKey);

  return runTransaction(db, async (t) => {
    const s = await t.get(invRef);
    const current = s.exists() ? (s.data() as any).stock : 0;
    const next = current + params.delta;
    if (next < 0) throw new Error(`Stock cannot go below 0. Available: ${current}`);
    if (!s.exists()) {
      t.set(invRef, {
        companyId,
        companyName,
        modelId,
        modelName,
        stock: next,
        updatedAt: serverTimestamp(),
      });
    } else {
      t.update(invRef, { stock: next, updatedAt: serverTimestamp() });
    }
  });
}

