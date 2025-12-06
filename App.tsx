import React, { useEffect, useState, useRef } from 'react';
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
import { X, LogOut } from 'lucide-react';
import { Input, Button, Select } from './components/ui/Card';
import { AiAssistant } from './components/AiAssistant';

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [aiEnabled, setAiEnabled] = useState(true);
  
  // Quick Add State
  const [addAmount, setAddAmount] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addCategory, setAddCategory] = useState('Misc');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref to access current activeTab inside useEffect closure if needed
  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

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

    // Fetch Global AI Settings
    const fetchAiConfig = async () => {
        const { data } = await supabase.from('app_config').select('value').eq('key', 'ai_settings').single();
        if (data?.value) {
            setAiEnabled(data.value.enabled);
        }
    };
    fetchAiConfig();

    return () => subscription.unsubscribe();
  }, []);

  // History API Integration
  useEffect(() => {
    // Push an initial state to trap the back button on load
    window.history.pushState({ tab: 'home' }, '');

    const handlePopState = (event: PopStateEvent) => {
      // If event.state exists, it means we are navigating internally (Redo History)
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
        setIsAddModalOpen(false); // Close modal if open when going back
        setShowExitConfirmation(false);
      } else {
        // We reached the start of our history stack (no state)
        // Show custom themed modal
        setShowExitConfirmation(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleExitConfirm = () => {
     window.history.back();
  };

  const handleExitCancel = () => {
     // User wants to stay. We push the state back so they remain "in" the app.
     window.history.pushState({ tab: activeTabRef.current }, '');
     setShowExitConfirmation(false);
  };

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
      // Push new tab to history stack
      window.history.pushState({ tab }, '');
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
              onBack={() => handleTabChange('meals')} 
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

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3 text-red-600 dark:text-red-500">
                      <LogOut size={24} />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Exit App?</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">Do you want to close the app?</p>
                  <div className="grid grid-cols-2 gap-3 w-full">
                     <Button variant="secondary" onClick={handleExitCancel} className="w-full justify-center">Cancel</Button>
                     <Button variant="primary" onClick={handleExitConfirm} className="w-full justify-center bg-red-600 hover:bg-red-700 text-white">Close</Button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* AI Assistant - Only show if enabled or user is admin */}
      {(aiEnabled || isAdmin) && <AiAssistant />}
    </>
  );
}

export default App;
