import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { calculateDueDate } from './utils';
import toast from 'react-hot-toast';

type UnifiedTransaction = {
  id?: number;
  amount: number;
  date: string;
  _type: 'income' | 'expense' | 'cc';
  title: string;
  description?: string;
  category?: string;
  dueDate?: string;
};

export default function History() {
  const incomes = useLiveQuery(() => db.incomes.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const ccTransactions = useLiveQuery(() => db.ccTransactions.toArray()) || [];
  const categories = useLiveQuery(() => db.categories.toArray());

  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'cc'>('all');
  
  // States for our Modals
  const [editingItem, setEditingItem] = useState<UnifiedTransaction | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{type: string, id: number} | null>(null);

  // Merge and sort all transactions by date (newest first)
  const allTransactions: UnifiedTransaction[] = [
    ...incomes.map(i => ({ ...i, _type: 'income' as const, title: 'Pocket Income' })),
    ...expenses.map(e => ({ ...e, _type: 'expense' as const, title: e.description })),
    ...ccTransactions.map(c => ({ ...c, _type: 'cc' as const, title: c.description }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = allTransactions.filter(t => filter === 'all' || t._type === filter);

  // Triggered when user confirms delete from the custom modal
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      if (itemToDelete.type === 'income') await db.incomes.delete(itemToDelete.id);
      if (itemToDelete.type === 'expense') await db.expenses.delete(itemToDelete.id);
      if (itemToDelete.type === 'cc') await db.ccTransactions.delete(itemToDelete.id);
      
      setItemToDelete(null); 
      toast.success('Entry deleted! 🗑️');
    } catch (error) {
      toast.error('Failed to delete entry.');
    }
  };

  // Triggered when user saves changes in the edit modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.id) return;

    const { _type, id, amount, date, description, category } = editingItem;
    const parsedAmount = Number(amount);
    
    try {
      if (_type === 'income') {
        await db.incomes.update(id, { amount: parsedAmount, date });
      } else if (_type === 'expense') {
        await db.expenses.update(id, { amount: parsedAmount, date, description: description || '', category: category as any });
      } else if (_type === 'cc') {
        const dueDate = await calculateDueDate(date); 
        await db.ccTransactions.update(id, { amount: parsedAmount, date, description: description || '', dueDate });
      }
      
      setEditingItem(null);
      toast.success('Changes saved! ✨');
    } catch (error) {
      toast.error('Failed to save changes.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {['all', 'income', 'expense', 'cc'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-all ${
              filter === f ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {f === 'cc' ? 'Credit Card' : f}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <span className="text-4xl block mb-2">📭</span>
            <p>No transactions found.</p>
          </div>
        ) : (
          filteredTransactions.map((item) => (
            <div key={`${item._type}-${item.id}`} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {/* Icon Indicator */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
                    item._type === 'income' ? 'bg-green-100 text-green-600' :
                    item._type === 'expense' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {item._type === 'income' ? '💰' : item._type === 'expense' ? '💵' : '💳'}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm capitalize">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.date} {item.category && `• ${item.category}`}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-black ${item._type === 'income' ? 'text-green-500' : 'text-gray-900'}`}>
                    {item._type === 'income' ? '+' : '-'}{item.amount.toLocaleString()} EGP
                  </span>
                  {item._type === 'cc' && item.dueDate && (
                    <div className="text-[10px] mt-1 font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded inline-block">
                      Due: {item.dueDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end border-t border-gray-50 pt-2 mt-1">
                <button 
                  onClick={() => setEditingItem(item)}
                  className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => setItemToDelete({ type: item._type, id: item.id! })}
                  className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 transform transition-all">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex justify-between">
              Edit {editingItem._type === 'cc' ? 'Credit' : editingItem._type}
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </h3>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Amount (EGP)</label>
                <input 
                  type="number" value={editingItem.amount} 
                  onChange={e => setEditingItem({...editingItem, amount: Number(e.target.value)})}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" 
                  required
                />
              </div>

              {editingItem._type !== 'income' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <input 
                    type="text" value={editingItem.description || ''} 
                    onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" 
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                <input 
                  type="date" value={editingItem.date} 
                  onChange={e => setEditingItem({...editingItem, date: e.target.value})}
                  className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400" 
                  required
                />
              </div>

              {editingItem._type === 'expense' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select 
                    value={editingItem.category || (categories && categories.length > 0 ? categories[0].name : '')} 
                    onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                    className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)} {cat.icon}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="w-full py-3 mt-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl p-6 text-center transform transition-all">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Entry?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}