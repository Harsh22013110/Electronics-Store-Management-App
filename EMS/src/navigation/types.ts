import type { Transaction } from '../types';

export type RootStackParamList = {
  Dashboard: undefined;
  Recent: undefined;
  Purchase: undefined;
  Sale: undefined;
  Inventory: undefined;
  Receipt: { transaction: Transaction };
  Logs: undefined;
   Summary: undefined;
};

