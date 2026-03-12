export type PaymentStatus = 'paid' | 'pending';
export type TransactionType = 'purchase' | 'sale';

export type Transaction = {
  id: string;
  type: TransactionType;
  personName: string;
  companyId: string;
  companyName: string;
  modelId: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentStatus: PaymentStatus;
  imeis: string[];
  createdAt: number; // epoch ms
};

export type InventoryItem = {
  id: string; // `${companyId}_${modelId}`
  companyId: string;
  companyName: string;
  modelId: string;
  modelName: string;
  stock: number;
  updatedAt: number; // epoch ms
};

export type ReceiptContext = {
  transaction: Transaction;
  shopName: string;
};

