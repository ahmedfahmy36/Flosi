import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { calculateDueDate } from './utils';
import toast from 'react-hot-toast'; 

export default function TransactionForm() {
  const [type, setType] = useState<'income' | 'pocket' | 'cc'>('pocket');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  
  const categories = useLiveQuery(() => db.categories.toArray());

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (!parsedAmount || (type !== 'income' && !description)) {
      toast.error('Please fill in the required fields!'); // Professional Error
      return;
    }

    try {
      if (type === 'income') {
        await db.incomes.add({ amount: parsedAmount, date });
      } else if (type === 'pocket') {
        const catValue = category || categories?.[0]?.name || 'other';
        await db.expenses.add({ amount: parsedAmount, date, description, category: catValue });
      } else {
        const dueDate = await calculateDueDate(date);
        await db.ccTransactions.add({ amount: parsedAmount, date, description, dueDate, isPaid: 0 });
      }
      
      toast.success('Added successfully! 🎉'); // Professional Success
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Something went wrong!');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Add Entry</h2>
      
      {/* 3-Way Toggle */}
      <div className="flex bg-gray-200 p-1 rounded-lg text-sm">
        <button 
          onClick={() => setType('income')}
          className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'income' ? 'bg-white text-green-600 shadow' : 'text-gray-500'}`}
        >
          💰 Add Income
        </button>
        <button 
          onClick={() => setType('pocket')}
          className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'pocket' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
        >
          💵 Expense
        </button>
        <button 
          onClick={() => setType('cc')}
          className={`flex-1 py-2 rounded-md font-bold transition-all ${type === 'cc' ? 'bg-white text-purple-600 shadow' : 'text-gray-500'}`}
        >
          💳 Credit
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Amount (EGP)</label>
          <input 
            type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="0.00"
          />
        </div>
        
        {type !== 'income' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
            <input 
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" placeholder="e.g., Starbucks"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
          <input 
            type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
          />
        </div>

        {type === 'pocket' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
            <select 
              value={category || (categories && categories.length > 0 ? categories[0].name : '')} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
            >
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)} {cat.icon}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="w-full py-4 mt-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 active:scale-95 transition-all">
          Save {type === 'income' ? 'Income' : 'Entry'}
        </button>
      </form>
    </div>
  );
}