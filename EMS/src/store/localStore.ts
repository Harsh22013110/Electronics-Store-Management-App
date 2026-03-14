import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCompanyById, getModelById } from '../data/catalog';
import type { InventoryItem, PaymentStatus, Transaction, TransactionType } from '../types';

const KEY_TRANSACTIONS = 'ems.transactions.v1';
const KEY_INVENTORY = 'ems.inventory.v1';
const KEY_IMEI_STATUS = 'ems.imeis.v1'; // { [imei]: { status, transactionId, modelKey } }

type ImeiStatus = { status: 'in_stock' | 'sold'; transactionId: string; modelKey: string };

function now() {
  return Date.now();
}

function invId(companyId: string, modelId: string) {
  return `${companyId}_${modelId}`;
}

function newId(prefix: string) {
  return `${prefix}_${now()}_${Math.random().toString(16).slice(2)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export type LocalDbSnapshot = {
  transactions: Transaction[];
  inventory: InventoryItem[];
};

export async function localLoad(): Promise<LocalDbSnapshot> {
  const [transactions, inventory] = await Promise.all([
    readJson<Transaction[]>(KEY_TRANSACTIONS, []),
    readJson<InventoryItem[]>(KEY_INVENTORY, []),
  ]);
  return {
    transactions: transactions.sort((a, b) => b.createdAt - a.createdAt),
    inventory: inventory.sort((a, b) =>
      a.companyName === b.companyName ? a.modelName.localeCompare(b.modelName) : a.companyName.localeCompare(b.companyName)
    ),
  };
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

async function applyTransaction(type: TransactionType, entry: Entry): Promise<Transaction> {
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

  if (entry.imeis.length && entry.imeis.length !== entry.quantity) {
    throw new Error('IMEI count must match quantity.');
  }
  if (!entry.imeis.length) {
    throw new Error('Please enter IMEI numbers (one per piece).');
  }

  const modelKey = invId(companyId, modelId);
  const [transactions, inventory, imeiMap] = await Promise.all([
    readJson<Transaction[]>(KEY_TRANSACTIONS, []),
    readJson<InventoryItem[]>(KEY_INVENTORY, []),
    readJson<Record<string, ImeiStatus>>(KEY_IMEI_STATUS, {}),
  ]);

  // IMEI uniqueness / status rules
  for (const imei of entry.imeis) {
    const s = imeiMap[imei];
    if (type === 'purchase') {
      if (s) throw new Error(`IMEI already exists: ${imei}`);
    } else {
      if (!s) throw new Error(`IMEI not found in stock: ${imei}`);
      if (s.status !== 'in_stock') throw new Error(`IMEI already sold: ${imei}`);
      if (s.modelKey !== modelKey) throw new Error(`IMEI belongs to a different model: ${imei}`);
    }
  }

  const invIndex = inventory.findIndex((x) => x.id === modelKey);
  const currentStock = invIndex >= 0 ? inventory[invIndex]!.stock : 0;

  if (type === 'sale' && currentStock < entry.quantity) {
    throw new Error(`Not enough stock. Available: ${currentStock}`);
  }

  const txId = newId(type);
  const tx: Transaction = {
    id: txId,
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
    createdAt: now(),
  };

  const delta = type === 'purchase' ? entry.quantity : -entry.quantity;
  const updatedStock = currentStock + delta;

  const invItem: InventoryItem = {
    id: modelKey,
    companyId,
    companyName,
    modelId,
    modelName,
    stock: updatedStock,
    updatedAt: now(),
  };

  if (invIndex >= 0) inventory[invIndex] = invItem;
  else inventory.push(invItem);

  if (type === 'purchase') {
    for (const imei of entry.imeis) {
      imeiMap[imei] = { status: 'in_stock', transactionId: txId, modelKey };
    }
  } else {
    for (const imei of entry.imeis) {
      imeiMap[imei] = { status: 'sold', transactionId: txId, modelKey };
    }
  }

  transactions.push(tx);

  await Promise.all([
    writeJson(KEY_TRANSACTIONS, transactions),
    writeJson(KEY_INVENTORY, inventory),
    writeJson(KEY_IMEI_STATUS, imeiMap),
  ]);

  return tx;
}

export async function localCreatePurchase(entry: Entry) {
  return applyTransaction('purchase', entry);
}

export async function localCreateSale(entry: Entry) {
  return applyTransaction('sale', entry);
}

export async function localUpdatePaymentStatus(id: string, status: PaymentStatus) {
  const txs = await readJson<Transaction[]>(KEY_TRANSACTIONS, []);
  const idx = txs.findIndex((t) => t.id === id);
  if (idx === -1) return;
  txs[idx] = { ...txs[idx]!, paymentStatus: status };
  await writeJson(KEY_TRANSACTIONS, txs);
}

export async function localAdjustStock(params: {
  companyId: string;
  modelId: string;
  delta: number;
}) {
  const catCompany = getCompanyById(params.companyId);
  const catModel = getModelById(params.companyId, params.modelId);
  const companyId = catCompany?.id ?? params.companyId.trim();
  const companyName = catCompany?.name ?? params.companyId.trim();
  const modelId = catModel?.id ?? params.modelId.trim();
  const modelName = catModel?.name ?? params.modelId.trim();
  if (!Number.isFinite(params.delta) || params.delta === 0) throw new Error('Delta must be non-zero.');

  const modelKey = invId(companyId, modelId);
  const inventory = await readJson<InventoryItem[]>(KEY_INVENTORY, []);
  const idx = inventory.findIndex((x) => x.id === modelKey);
  const current = idx >= 0 ? inventory[idx]!.stock : 0;
  const next = current + params.delta;
  if (next < 0) throw new Error(`Stock cannot go below 0. Available: ${current}`);

  const updated: InventoryItem = {
    id: modelKey,
    companyId,
    companyName,
    modelId,
    modelName,
    stock: next,
    updatedAt: now(),
  };
  if (idx >= 0) inventory[idx] = updated;
  else inventory.push(updated);

  await writeJson(KEY_INVENTORY, inventory);
  return updated;
}

