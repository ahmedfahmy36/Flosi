import  { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6'];

export default function Dashboard() {
  const incomes = useLiveQuery(() => db.incomes.toArray());
  const allExpenses = useLiveQuery(() => db.expenses.toArray());
  const ccTransactions = useLiveQuery(() => db.ccTransactions.where('isPaid').equals(0).toArray());
  const settings = useLiveQuery(() => db.settings.get(1));

  // Filtering States
  const [filterType, setFilterType] = useState<'thisMonth' | 'custom' | 'all'>('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set "This Month" dates automatically based on the current date
  useEffect(() => {
    if (filterType === 'thisMonth') {
      const today = new Date();
      // Format YYYY-MM-DD
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    }
  }, [filterType]);

  // Pocket Money Math (Overall Balance)
  const totalIncome = incomes?.reduce((sum, inc) => sum + inc.amount, 0) || 0;
  const totalExpense = allExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const remainingPocket = totalIncome - totalExpense;

  // Credit Card Math
  const totalCCDebt = ccTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
  const creditLimit = settings?.creditLimit || 0;
  const availableCredit = creditLimit - totalCCDebt;

  // Filter Expenses for the Chart based on selected dates
  const filteredExpenses = allExpenses?.filter(exp => {
    if (filterType === 'all') return true;
    if (startDate && endDate) {
      return exp.date >= startDate && exp.date <= endDate;
    }
    return true;
  }) || [];

  // Chart Data Calculation
  const categoryStats = filteredExpenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryStats).map(([name, value]) => ({ name, value }));

  // Mark Credit Card debt as paid
  const markAsPaid = async (id: number) => {
    try {
      await db.ccTransactions.update(id, { isPaid: 1 });
      toast.success('Debt cleared! 🎉', { icon: '✅' });
    } catch (error) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 pb-24">
      
      {/* Pocket Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-2xl shadow-md text-white">
        <h2 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">My Pocket Balance</h2>
        <div className="text-4xl font-black mb-2">
          {remainingPocket.toLocaleString()} <span className="text-lg font-normal">EGP</span>
        </div>
        <div className="text-xs opacity-80 flex justify-between">
          <span>Total In: {totalIncome.toLocaleString()}</span>
          <span>Total Out: {totalExpense.toLocaleString()}</span>
        </div>
      </div>

      {/* Credit Card Section */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-900 p-6 rounded-2xl shadow-lg text-white">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Available Credit</h2>
            <div className="text-3xl font-black">
              {availableCredit.toLocaleString()} <span className="text-lg font-normal">EGP</span>
            </div>
          </div>
          <div className="text-right text-xs opacity-70">
            Limit: {creditLimit.toLocaleString()} EGP
          </div>
        </div>
        
        <div className="space-y-3 mt-4">
          <p className="text-xs font-bold text-purple-200 uppercase">Unpaid Debt ({totalCCDebt.toLocaleString()} EGP)</p>
          {ccTransactions?.map(tx => (
            <div key={tx.id} className="flex justify-between items-center bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
              <div>
                <p className="font-bold text-sm">{tx.description}</p>
                <p className="text-[10px] opacity-70 text-red-200">Due: {tx.dueDate}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{tx.amount.toLocaleString()}</span>
                <button 
                  onClick={() => markAsPaid(tx.id!)}
                  className="bg-green-400 text-green-900 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-green-300 transition-all flex items-center gap-1 shadow-sm"
                >
                  ✅ Pay
                </button>
              </div>
            </div>
          ))}
          {ccTransactions?.length === 0 && (
            <div className="text-center p-2 bg-green-500/20 rounded-lg text-sm border border-green-500/30">
              All clear! No pending debts. 🎉
            </div>
          )}
        </div>
      </div>

      {/* Expense Chart & Filters */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Spending Breakdown</h2>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex bg-gray-100 p-1 rounded-lg text-xs">
            <button 
              onClick={() => setFilterType('thisMonth')}
              className={`flex-1 py-1.5 rounded-md font-bold transition-all ${filterType === 'thisMonth' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              This Month
            </button>
            <button 
              onClick={() => setFilterType('custom')}
              className={`flex-1 py-1.5 rounded-md font-bold transition-all ${filterType === 'custom' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Custom
            </button>
            <button 
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1.5 rounded-md font-bold transition-all ${filterType === 'all' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Time
            </button>
          </div>

          {filterType === 'custom' && (
            <div className="flex gap-2">
              <input 
                type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-1/2 p-2 text-xs bg-gray-50 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input 
                type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 p-2 text-xs bg-gray-50 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
        </div>

        {chartData.length > 0 ? (
          <>
            {/* The Pie Chart */}
            <div className="h-48 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => `${(value || 0).toLocaleString()} EGP`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend with Amounts */}
            <div className="space-y-3 border-t border-gray-100 pt-5">
              {chartData.sort((a, b) => b.value - a.value).map((item, index) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className="capitalize font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value.toLocaleString()} EGP</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <span className="text-3xl block mb-2 opacity-50">📊</span>
            <p className="text-gray-500 text-sm">No expenses in this period.</p>
          </div>
        )}
      </div>

    </div>
  );
}