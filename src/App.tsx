import { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import TransactionForm from './TransactionForm';
import Dashboard from './Dashboard';
import Settings from './Settings';
import History from './History';
import { initializeSettings } from './db';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'add' | 'settings'>('dashboard');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    initializeSettings();

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          toast.success('App installed successfully! 🎉');
        }
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans selection:bg-purple-200">
      
      {/* Add the Toaster here */}
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          duration: 3000,
          style: { borderRadius: '12px', background: '#333', color: '#fff', fontSize: '14px', fontWeight: 'bold' }
        }} 
      />
      
      <header className="bg-white p-4 border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 text-white rounded-lg flex items-center justify-center font-black text-lg shadow-md">F</div>
          <h1 className="text-xl font-black text-cyan-500 tracking-tight">Flo<span className="text-cyan-500">sy</span></h1>
        </div>
        
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="bg-cyan-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-cyan-600 transition block lg:hidden"
          >
            Install ⬇️
          </button>
        )}
      </header>

      <main className="w-full">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'history' && <History />}
        {activeTab === 'add' && <TransactionForm />}
        {activeTab === 'settings' && <Settings />}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-between px-4 py-2 pb-safe z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
        
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 flex-1 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-purple-700 scale-105' : 'text-gray-400'}`}>
          <span className="text-2xl mb-1 drop-shadow-sm">📊</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
        </button>
        
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center p-2 flex-1 rounded-xl transition-all ${activeTab === 'history' ? 'text-blue-600 scale-105' : 'text-gray-400'}`}>
          <span className="text-2xl mb-1 drop-shadow-sm">🧾</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
        </button>

        <button onClick={() => setActiveTab('add')} className={`flex flex-col items-center p-2 flex-1 rounded-xl transition-all ${activeTab === 'add' ? 'text-green-600 scale-105' : 'text-gray-400'}`}>
          <span className="text-2xl mb-1 drop-shadow-sm">➕</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Add</span>
        </button>

        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 flex-1 rounded-xl transition-all ${activeTab === 'settings' ? 'text-gray-800 scale-105' : 'text-gray-400'}`}>
          <span className="text-2xl mb-1 drop-shadow-sm">⚙️</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
        </button>
        
      </nav>

    </div>
  );
}