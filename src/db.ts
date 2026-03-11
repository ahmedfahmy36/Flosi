import Dexie, { type Table } from 'dexie';

export interface PocketIncome {
  id?: number;
  amount: number;
  date: string;
}

export interface PocketExpense {
  id?: number;
  amount: number;
  date: string;
  description: string;
  category: string;
}

export interface Category {
  id?: number;
  name: string;
  icon: string;
}

export interface CreditCardTransaction {
  id?: number;
  amount: number;
  date: string;
  description: string;
  dueDate: string;
  isPaid: number; 
  paidAmount?: number;
}

export interface AppSettings {
  id?: number;
  statementClosingDay: number;
  paymentDueDay: number;
  creditLimit: number; // Added credit limit
}

export class FinanceDatabase extends Dexie {
  incomes!: Table<PocketIncome>;
  expenses!: Table<PocketExpense>;
  ccTransactions!: Table<CreditCardTransaction>;
  settings!: Table<AppSettings>;
  categories!: Table<Category>;

  constructor() {
    super('MyFinanceDB');
    
    // v1 is kept for backward compatibility if you already have data
    this.version(1).stores({
      expenses: '++id, date, category',
      ccTransactions: '++id, date, dueDate, isPaid',
      settings: '++id'
    });

    // v2 adds the new incomes table
    this.version(2).stores({
      incomes: '++id, date',
      expenses: '++id, date, category',
      ccTransactions: '++id, date, dueDate, isPaid',
      settings: '++id'
    });

    // v3 adds custom categories
    this.version(3).stores({
      incomes: '++id, date',
      expenses: '++id, date, category',
      ccTransactions: '++id, date, dueDate, isPaid',
      settings: '++id',
      categories: '++id, name'
    });
  }
}

export const db = new FinanceDatabase();

export async function initializeSettings() {
  const existingSettings = await db.settings.get(1);
  if (!existingSettings) {
    await db.settings.add({
      id: 1,
      statementClosingDay: 20,
      paymentDueDay: 15,
      creditLimit: 30000 // Default limit, you can change this in the app
    });
  }

  const existingCategories = await db.categories.count();
  if (existingCategories === 0) {
    const defaultCategories = [
      { name: 'grocery', icon: '🛒' },
      { name: 'fast food', icon: '🍔' },
      { name: 'clothes', icon: '👕' },
      { name: 'desserts', icon: '🍰' },
      { name: 'hagat 7elwa', icon: '✨' },
      { name: 'transportation', icon: '🚗' },
      { name: 'cafe', icon: '☕' },
      { name: 'other', icon: '📦' },
    ];
    await db.categories.bulkAdd(defaultCategories);
  }
}