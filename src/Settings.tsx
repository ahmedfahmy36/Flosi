import { useState, useEffect, useRef } from 'react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';

export default function Settings() {
  const [closingDay, setClosingDay] = useState(20);
  const [dueDay, setDueDay] = useState(15);
  const [limit, setLimit] = useState(30000);
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🔖');

  const categories = useLiveQuery(() => db.categories.toArray());

  useEffect(() => {
    const fetchSettings = async () => {
      const current = await db.settings.get(1);
      if (current) {
        setClosingDay(current.statementClosingDay);
        setDueDay(current.paymentDueDay);
        setLimit(current.creditLimit);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    await db.settings.update(1, {
      statementClosingDay: closingDay,
      paymentDueDay: dueDay,
      creditLimit: limit
    });
    toast.success('Settings updated successfully! ⚙️');
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !newCatIcon.trim()) {
      toast.error('Name and Icon are required');
      return;
    }
    try {
      await db.categories.add({
        name: newCatName.toLowerCase().trim(),
        icon: newCatIcon.trim()
      });
      toast.success('Category added! 🎉');
      setNewCatName('');
      setNewCatIcon('🔖');
    } catch (e) {
      toast.error('Could not add category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (categories && categories.length <= 1) {
      toast.error('You must have at least one category');
      return;
    }
    try {
      await db.categories.delete(id);
      toast.success('Category deleted');
    } catch (e) {
      toast.error('Could not delete category');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportData = async () => {
    try {
      const incomes = await db.incomes.toArray();
      const expenses = await db.expenses.toArray();
      const ccTransactions = await db.ccTransactions.toArray();
      const settings = await db.settings.toArray();

      const backup = { incomes, expenses, ccTransactions, settings };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pocketsync-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);

        if (!data.settings || !data.expenses) {
            throw new Error('Invalid backup format');
        }

        await db.transaction('rw', db.incomes, db.expenses, db.ccTransactions, db.settings, async () => {
          await db.incomes.clear();
          await db.expenses.clear();
          await db.ccTransactions.clear();
          await db.settings.clear();

          if (data.incomes?.length) await db.incomes.bulkAdd(data.incomes);
          if (data.expenses?.length) await db.expenses.bulkAdd(data.expenses);
          if (data.ccTransactions?.length) await db.ccTransactions.bulkAdd(data.ccTransactions);
          if (data.settings?.length) await db.settings.bulkAdd(data.settings);
        });

        toast.success('Data imported successfully! App will reload in 2s.');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        toast.error('Failed to import data. Please check the file format.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Credit Card Settings</h2>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Credit Card Limit (EGP)</label>
          <input 
            type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Statement Closing Day (e.g., 20)</label>
          <input 
            type="number" min="1" max="31" value={closingDay} onChange={(e) => setClosingDay(Number(e.target.value))}
            className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
          />
          <p className="text-[10px] text-gray-400 mt-1">Purchases after this day are pushed to the next month.</p>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Payment Due Day (e.g., 15)</label>
          <input 
            type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))}
            className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
          />
        </div>

        <button onClick={saveSettings} className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800">
          Save Settings
        </button>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 pt-4">Category Management</h2>
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
        
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Category Name</label>
            <input 
              type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g., Gym"
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
            />
          </div>
          <div className="w-20">
            <label className="text-xs font-bold text-gray-500 uppercase">Icon</label>
            <input 
              type="text" value={newCatIcon} onChange={(e) => setNewCatIcon(e.target.value)}
              className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-center"
            />
          </div>
          <button onClick={handleAddCategory} className="py-3 px-4 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800">
            Add
          </button>
        </div>

        <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2">
          {categories?.map((cat) => (
            <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <span className="font-bold text-sm capitalize">{cat.name}</span>
              </div>
              <button 
                onClick={() => handleDeleteCategory(cat.id!)}
                className="text-rose-500 font-bold text-xs px-2 py-1 rounded bg-rose-50 hover:bg-rose-100"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
      <h2 className="text-2xl font-bold text-gray-800 pt-4">Data Management</h2>
      
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <p className="text-sm text-gray-500">
          Export your data to a JSON file to create a backup, or safely copy it to another device. 
          Importing a file will <strong>overwrite</strong> all current data.
        </p>

        <div className="flex flex-col gap-3">
          <button onClick={exportData} className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-sm">
            ⬇️ Export Data (Backup)
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-rose-500 text-white font-bold rounded-lg hover:bg-rose-600 transition-colors shadow-sm">
            ⬆️ Import Data (Restore)
          </button>
          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            onChange={importData}
            className="hidden" 
          />
        </div>
      </div>



    </div>
  );
}