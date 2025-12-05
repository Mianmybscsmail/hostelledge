import React from 'react';
import { Home, Utensils, Users, Settings, PlusCircle, ShoppingCart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
  canEdit: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isAdmin, canEdit }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 font-sans selection:bg-red-500/30 transition-colors duration-300">
      <main className="pb-24 max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-zinc-950 shadow-2xl overflow-x-hidden relative transition-colors duration-300">
        {children}
      </main>

      {/* Sticky Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-gray-200 dark:border-zinc-800 z-50 transition-colors duration-300">
        <div className="max-w-md mx-auto flex justify-between items-center px-2 py-3">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === 'home' ? 'text-red-600 dark:text-red-500 scale-105' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
            }`}
          >
            <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('meals')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === 'meals' ? 'text-red-600 dark:text-red-500 scale-105' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
            }`}
          >
            <Utensils size={22} strokeWidth={activeTab === 'meals' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Meals</span>
          </button>

           {/* Central Add Button */}
           {(isAdmin || canEdit) && (
            <button
              onClick={() => setActiveTab('add')}
              className="flex flex-col items-center justify-center -mt-6"
            >
              <div className={`w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-red-500 shadow-lg shadow-red-500/40 flex items-center justify-center transform transition-transform ${activeTab === 'add' ? 'scale-110' : ''}`}>
                <PlusCircle size={28} className="text-white" />
              </div>
              <span className="text-[10px] mt-1 font-medium text-gray-400 dark:text-zinc-400">Add</span>
            </button>
          )}
          
          {/* If viewer, show Expenses instead of Add in the middle */}
          {!isAdmin && !canEdit && (
             <button
             onClick={() => setActiveTab('market')}
             className={`flex flex-col items-center p-2 rounded-xl transition-all ${
               activeTab === 'market' ? 'text-red-600 dark:text-red-500 scale-105' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
             }`}
           >
             <ShoppingCart size={22} strokeWidth={activeTab === 'market' ? 2.5 : 2} />
             <span className="text-[10px] mt-1 font-medium">Market</span>
           </button>
          )}

          {(isAdmin || canEdit) && (
            <button
              onClick={() => setActiveTab('market')}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                activeTab === 'market' ? 'text-red-600 dark:text-red-500 scale-105' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
              }`}
            >
              <ShoppingCart size={22} strokeWidth={activeTab === 'market' ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">Market</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('friends')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === 'friends' ? 'text-red-600 dark:text-red-500 scale-105' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
            }`}
          >
            <Users size={22} strokeWidth={activeTab === 'friends' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">Friends</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              activeTab === 'settings' ? 'text-red-600 dark:text-red-500 scale-105' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
            }`}
          >
            <Settings size={22} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
