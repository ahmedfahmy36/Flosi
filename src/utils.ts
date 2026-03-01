import { db } from './db';

export async function calculateDueDate(purchaseDateStr: string): Promise<string> {
  const settings = await db.settings.get(1);
  const closingDay = settings?.statementClosingDay || 20;
  const dueDay = settings?.paymentDueDay || 15;

  const purchaseDate = new Date(purchaseDateStr);
  const purchaseDay = purchaseDate.getDate();
  const purchaseMonth = purchaseDate.getMonth(); 
  const purchaseYear = purchaseDate.getFullYear();

  let dueMonth = purchaseMonth;
  let dueYear = purchaseYear;

  if (purchaseDay <= closingDay) {
    dueMonth = purchaseMonth + 1;
  } else {
    dueMonth = purchaseMonth + 2;
  }

  if (dueMonth > 11) {
    dueMonth = dueMonth % 12;
    dueYear += 1;
  }

  // Format explicitly avoiding timezone shifts
  const dueDate = new Date(dueYear, dueMonth, dueDay);
  return `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`;
}