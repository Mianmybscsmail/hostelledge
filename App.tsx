import React, { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { UserProfile } from './types';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Meals } from './pages/Meals';
import { Market } from './pages/Market';
import { Friends } from './pages/Friends';
import { Settings } from './pages/Settings';
import { WeeklyMenu } from './pages/WeeklyMenu';
import { Layout } from './components/ui/Layout';
import { X } from 'lucide-react';
import { Input, Button, Select } from './components/ui/Card';

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Quick Add State
  const [addAmount, setAddAmount] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState('Misc');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add('dark');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(newTheme);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) {
      console.error("Error fetching user profile:", error);
    }
    if (data) setUserProfile(data);
  };

  const isAdmin = userProfile?.role === 'admin' || session?.user?.email === 'main@main.com';
  const canEdit = userProfile?.allow_edit || isAdmin;

  // Handler for the "Add" button in the tab bar
  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setIsAddModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleQuickAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAmount || !addTitle) return;
    
    setIsSubmitting(true);
    const { error } = await supabase.from('expenses').insert({
      title: addTitle,
      amount: parseFloat(addAmount),
      category: addCategory,
      date: new Date().toISOString()
    });
    setIsSubmitting(false);

    if (error) {
      alert('Error adding expense');
    } else {
      setIsAddModalOpen(false);
      setAddAmount('');
      setAddTitle('');
    }
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={handleTabChange} isAdmin={isAdmin} canEdit={canEdit}>
        {activeTab === 'home' && <Dashboard onNavigate={handleTabChange} />}
        {activeTab === 'meals' && <Meals isAdmin={isAdmin} canEdit={canEdit} onNavigate={handleTabChange} />}
        {activeTab === 'market' && <Market isAdmin={isAdmin} canEdit={canEdit} />}
        {activeTab === 'friends' && <Friends isAdmin={isAdmin} canEdit={canEdit} />}
        {activeTab === 'settings' && (
          <Settings 
            user={session.user} 
            profile={userProfile} 
            isAdmin={isAdmin} 
            theme={theme}
            toggleTheme={toggleTheme}
            onNavigate={handleTabChange}
          />
        )}
        {activeTab === 'weekly-menu' && (
           <WeeklyMenu 
              isAdmin={isAdmin} 
              canEdit={canEdit} 
              onBack={() => setActiveTab('meals')} 
           />
        )}
      </Layout>

      {/* Quick Add Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 animate-in slide-in-from-bottom-10 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Expense</h2>
                  <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-white"><X /></button>
              </div>
              
              <form onSubmit={handleQuickAddExpense} className="space-y-4">
                 <Input 
                    label="What was it?" 
                    placeholder="e.g. Cold drinks" 
                    value={addTitle} 
                    onChange={e => setAddTitle(e.target.value)} 
                    autoFocus
                 />
                 <Input 
                    label="Cost" 
                    type="number" 
                    placeholder="0.00" 
                    value={addAmount} 
                    onChange={e => setAddAmount(e.target.value)} 
                 />
                 <Select label="Category" value={addCategory} onChange={e => setAddCategory(e.target.value)}>
                    <option value="Misc">Misc</option>
                    <option value="Market">Market (Quick)</option>
                    <option value="Friend">Friend</option>
                 </Select>
                 <Button type="submit" isLoading={isSubmitting}>
                   {isSubmitting ? 'Saving...' : 'Add Expense'}
                 </Button>
              </form>
           </div>
        </div>
      )}
    </>
  );
}

export default App;
