import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input } from '../components/ui/Card';
import { UserProfile } from '../types';
import { Download, LogOut, User, ShieldAlert, Archive, Trash2, Moon, Sun, ChevronRight, Wallet, Users, FileText, ArrowLeft, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface SettingsProps {
  user: any;
  profile: UserProfile | null;
  isAdmin: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onNavigate: (page: string) => void;
}

type View = 'menu' | 'users' | 'budget' | 'archive' | 'general';

export const Settings: React.FC<SettingsProps> = ({ user, profile, isAdmin, theme, toggleTheme, onNavigate }) => {
  const [currentView, setCurrentView] = useState<View>('menu');
  
  // Handlers for Views
  const goBack = () => setCurrentView('menu');

  // RENDER: Main Menu
  if (currentView === 'menu') {
    return (
      <div className="p-4 space-y-6 pt-8 pb-32 animate-in slide-in-from-left-4 fade-in duration-300">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-400">
                <User size={32} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{user.email}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${profile?.role === 'admin' ? 'border-red-500 text-red-600 dark:text-red-500' : 'border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-zinc-500'}`}>
                    {profile?.role?.toUpperCase() || 'VIEWER'}
                </span>
            </div>
        </div>

        {/* Theme Toggle (For Any User) */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
               </div>
               <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Appearance</h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
               </div>
            </div>
            <button 
              onClick={toggleTheme} 
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${theme === 'dark' ? 'bg-purple-600 justify-end' : 'bg-gray-300 justify-start'}`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </Card>

        {/* Shortcuts */}
        <div className="space-y-3">
             <h3 className="text-gray-500 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider ml-1">Menu</h3>
             
             <MenuItem 
                icon={<CalendarDays size={18} />} 
                color="text-blue-500" 
                bg="bg-blue-100 dark:bg-blue-900/20"
                label="Weekly Meal Menu" 
                onClick={() => onNavigate('weekly-menu')} 
             />
        </div>

        {/* Admin Controls Menu */}
        {isAdmin && (
          <div className="space-y-3">
             <h3 className="text-gray-500 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider ml-1">Admin Controls</h3>
             
             <MenuItem 
                icon={<Wallet size={18} />} 
                color="text-green-500" 
                bg="bg-green-100 dark:bg-green-900/20"
                label="Weekly Budget" 
                onClick={() => setCurrentView('budget')} 
             />
             
             <MenuItem 
                icon={<Users size={18} />} 
                color="text-blue-500" 
                bg="bg-blue-100 dark:bg-blue-900/20"
                label="User Management" 
                onClick={() => setCurrentView('users')} 
             />

             <MenuItem 
                icon={<Archive size={18} />} 
                color="text-orange-500" 
                bg="bg-orange-100 dark:bg-orange-900/20"
                label="Archive & Reset" 
                onClick={() => setCurrentView('archive')} 
             />
          </div>
        )}

        {/* General / Data Menu */}
        <div className="space-y-3">
             <h3 className="text-gray-500 dark:text-zinc-500 text-xs font-semibold uppercase tracking-wider ml-1">General</h3>
             
             <MenuItem 
                icon={<FileText size={18} />} 
                color="text-zinc-500 dark:text-zinc-400" 
                bg="bg-gray-100 dark:bg-zinc-800"
                label="General (Export Data)" 
                onClick={() => setCurrentView('general')} 
             />
        </div>

        {/* Sign Out */}
        <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
            <LogOut size={18} /> Sign Out
        </Button>

        <div className="text-center text-[10px] text-gray-400 dark:text-zinc-700 pt-4">
            Version 1.0.1 • Hostel Kharcha Manager • Created by Mian Khizar
        </div>
      </div>
    );
  }

  // RENDER: Sub-Views
  return (
    <div className="p-4 space-y-4 pt-8 pb-32 min-h-screen animate-in slide-in-from-right-10 fade-in duration-300">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={goBack} className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white transition-colors">
                <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentView === 'users' && 'User Management'}
                {currentView === 'budget' && 'Weekly Budget'}
                {currentView === 'archive' && 'Archive Center'}
                {currentView === 'general' && 'General Settings'}
            </h2>
        </div>

        {currentView === 'users' && <UsersView />}
        {currentView === 'budget' && <BudgetView />}
        {currentView === 'archive' && <ArchiveView />}
        {currentView === 'general' && <GeneralView />}
    </div>
  );
};

// --- Sub Components ---

const MenuItem = ({ icon, label, onClick, color, bg }: { icon: React.ReactNode, label: string, onClick: () => void, color: string, bg: string }) => (
    <button onClick={onClick} className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                {icon}
            </div>
            <span className="font-medium text-gray-900 dark:text-zinc-200">{label}</span>
        </div>
        <ChevronRight size={18} className="text-gray-400 dark:text-zinc-600 group-hover:text-gray-600 dark:group-hover:text-zinc-400" />
    </button>
);

const UsersView = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('users').select('*');
            if (data) setUsers(data as UserProfile[]);
            setLoading(false);
        };
        fetch();
    }, []);

    const toggleEdit = async (userId: string, current: boolean) => {
        await supabase.from('users').update({ allow_edit: !current }).eq('id', userId);
        setUsers(users.map(u => u.id === userId ? { ...u, allow_edit: !current } : u));
    };

    if (loading) return <div className="text-center text-zinc-500 mt-10">Loading users...</div>;

    return (
        <Card className="space-y-4">
             {users.map(u => (
                <div key={u.id} className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <div className="overflow-hidden">
                        <p className="text-gray-900 dark:text-white truncate max-w-[150px] font-medium">{u.email}</p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500">{u.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => toggleEdit(u.id, u.allow_edit)}
                            className={`text-[10px] px-3 py-1.5 rounded-lg border font-medium transition-colors ${u.allow_edit ? 'bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400'}`}
                        >
                            {u.allow_edit ? 'Can Edit' : 'Read Only'}
                        </button>
                        <button className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-red-500/10 transition-colors"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
        </Card>
    );
};

const BudgetView = () => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!amount) return;
        setLoading(true);
        await supabase.from('weekly_money').insert({
            amount: parseFloat(amount),
            week_start: new Date().toISOString(),
            notes: 'Added via Admin Settings'
        });
        setAmount('');
        setLoading(false);
        alert("Weekly budget updated.");
    };

    return (
        <Card title="Add Funds">
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-4">Add money to the current week's total allowance.</p>
            <div className="flex gap-3">
                <Input 
                    type="number" 
                    placeholder="Amount (PKR)" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    className="mb-0"
                />
                <Button onClick={handleAdd} className="w-auto px-6 whitespace-nowrap" isLoading={loading}>Add Money</Button>
            </div>
        </Card>
    );
};

const ArchiveView = () => {
    const [loading, setLoading] = useState(false);

    const resetWeek = async () => {
        if(!confirm("Are you sure? This will ARCHIVE current data and reset the dashboard.")) return;
        
        try {
          setLoading(true);
  
          // 1. Fetch current data to archive
          const { data: expenses } = await supabase.from('expenses').select('*');
          const { data: meals } = await supabase.from('meals').select('*');
          const { data: market } = await supabase.from('market_items').select('*');
          const { data: friends } = await supabase.from('friends').select('*');
          const { data: budgets } = await supabase.from('budgets').select('*');
          const { data: weekly } = await supabase.from('weekly_money').select('*');
  
          // Calculate total spent
          const totalSpent = (expenses?.reduce((acc, c) => acc + c.amount, 0) || 0) +
                             (market?.reduce((acc, c) => acc + c.cost, 0) || 0) +
                             (meals?.reduce((acc, c) => acc + c.cost, 0) || 0);
  
          // 2. Insert into Archive
          const snapshot = { expenses, meals, market, friends, budgets, weekly };
  
          const { error: archiveError } = await supabase.from('weekly_archive').insert({
              week_start: weekly?.[0]?.week_start || new Date().toISOString(),
              week_end: new Date().toISOString(),
              data_snapshot: snapshot,
              total_spent: totalSpent
          });
  
          if (archiveError) throw archiveError;
  
          // 3. Clear Tables (Keeping ID 0 row if exists strategy, or just delete all)
          // Simplified delete all for now as user requested reset
          const tables = ['expenses', 'meals', 'market_items', 'weekly_money', 'friends', 'budgets'];
          for (const t of tables) {
              await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
          }
          
          alert("Week reset complete. Data archived.");
        } catch (err: any) {
            console.error(err);
            alert("Error resetting week: " + err.message);
        } finally {
          setLoading(false);
        }
    };

    return (
        <Card className="border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
            <div className="flex flex-col items-center text-center py-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 mb-3">
                    <ShieldAlert size={24}/>
                </div>
                <h3 className="text-red-700 dark:text-red-400 font-bold mb-2">Danger Zone</h3>
                <p className="text-xs text-red-600/80 dark:text-red-300/70 mb-6">
                    Archiving will save a snapshot of all current expenses, meals, and friend records, then delete them from the active dashboard to start fresh.
                </p>
                <Button variant="primary" onClick={resetWeek} isLoading={loading} className="bg-red-600 hover:bg-red-700 w-full">
                    Archive & Start New Week
                </Button>
            </div>
        </Card>
    );
};

const GeneralView = () => {
    const exportData = async () => {
        const { data: expenses } = await supabase.from('expenses').select('*');
        const { data: meals } = await supabase.from('meals').select('*');
        const { data: market } = await supabase.from('market_items').select('*');
        const { data: friends } = await supabase.from('friends').select('*');
   
        const csvRows = [];
        csvRows.push(['Type', 'Details', 'Amount', 'Date', 'Category/Person']);
   
        expenses?.forEach(e => csvRows.push(['Expense', e.title, e.amount, e.date, e.category]));
        meals?.forEach(m => csvRows.push(['Meal', m.meal_type + ' cooked by ' + m.cooked, m.cost, m.date, 'Split: ' + m.people]));
        market?.forEach(m => csvRows.push(['Market', m.item_name, m.cost, m.date, 'Buyer: ' + m.buyer]));
        friends?.forEach(f => csvRows.push(['Friend', f.name + ' (' + f.type + ')', f.amount, f.date, f.status]));
   
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `kharcha_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
     };

    return (
        <Card>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Export Data</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">Download CSV of all records</p>
                </div>
                <Button onClick={exportData} variant="secondary" className="w-auto px-4 py-2">
                    <Download size={18} />
                </Button>
            </div>
        </Card>
    );
};
