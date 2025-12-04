import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input } from '../components/ui/Card';
import { UserProfile } from '../types';
import { Download, LogOut, User, ShieldAlert, Archive, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface SettingsProps {
  user: any;
  profile: UserProfile | null;
  isAdmin: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ user, profile, isAdmin }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingMoney, setAddingMoney] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    // Note: 'users' table is a public profile table linked to auth.users
    const { data } = await supabase.from('users').select('*');
    if (data) setUsers(data as UserProfile[]);
    setLoadingUsers(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleEditPermission = async (userId: string, currentStatus: boolean) => {
    await supabase.from('users').update({ allow_edit: !currentStatus }).eq('id', userId);
    fetchUsers();
  };

  const addWeeklyMoney = async () => {
    if (!weeklyBudget) return;
    setAddingMoney(true);
    await supabase.from('weekly_money').insert({
        amount: parseFloat(weeklyBudget),
        week_start: new Date().toISOString(),
        notes: 'Added via Settings'
    });
    setWeeklyBudget('');
    setAddingMoney(false);
    alert("Money added to balance!");
  };

  const exportData = async () => {
     // Fetch all data
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

  const resetWeek = async () => {
      if(!confirm("Are you sure? This will ARCHIVE current data and reset the dashboard.")) return;
      
      try {
        setLoadingUsers(true); // Reusing loading state

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
        const snapshot = {
            expenses, meals, market, friends, budgets, weekly
        };

        const { error: archiveError } = await supabase.from('weekly_archive').insert({
            week_start: weekly?.[0]?.week_start || new Date().toISOString(),
            week_end: new Date().toISOString(),
            data_snapshot: snapshot,
            total_spent: totalSpent
        });

        if (archiveError) throw archiveError;

        // 3. Clear Tables
        await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
        await supabase.from('meals').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('market_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('weekly_money').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('friends').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        alert("Week reset complete. Data has been archived.");
      } catch (err: any) {
          console.error(err);
          alert("Error resetting week: " + err.message);
      } finally {
        setLoadingUsers(false);
      }
  };

  return (
    <div className="p-4 space-y-6 pt-8 pb-32">
        <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <User size={32} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-white">{user.email}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${profile?.role === 'admin' ? 'border-red-500 text-red-500' : 'border-zinc-600 text-zinc-500'}`}>
                    {profile?.role?.toUpperCase() || 'VIEWER'}
                </span>
            </div>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
            <div className="space-y-4">
                <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Admin Controls</h3>
                
                <Card title="Add Weekly Budget">
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            placeholder="Amount" 
                            value={weeklyBudget} 
                            onChange={e => setWeeklyBudget(e.target.value)} 
                            className="mb-0"
                        />
                        <Button onClick={addWeeklyMoney} className="w-auto px-6" isLoading={addingMoney}>Add</Button>
                    </div>
                </Card>

                <Card title="User Management">
                    {loadingUsers ? <p className="text-xs text-zinc-500">Loading...</p> : (
                        <div className="space-y-3">
                            {users.map(u => (
                                <div key={u.id} className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
                                    <div className="overflow-hidden">
                                        <p className="text-white truncate max-w-[150px]">{u.email}</p>
                                        <p className="text-[10px] text-zinc-500">{u.role}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => toggleEditPermission(u.id, u.allow_edit)}
                                            className={`text-[10px] px-2 py-1 rounded border ${u.allow_edit ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                                        >
                                            {u.allow_edit ? 'Can Edit' : 'Read Only'}
                                        </button>
                                        <button className="text-red-500 p-1 hover:bg-red-500/10 rounded"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                 <Card className="border-red-900/30">
                    <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2"><ShieldAlert size={16}/> Danger Zone</h3>
                    <Button variant="danger" onClick={resetWeek}>Start New Week (Archive & Reset)</Button>
                </Card>
            </div>
        )}

        {/* General Settings */}
        <div className="space-y-4">
             <h3 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">General</h3>
             
             <Card>
                <Button variant="secondary" onClick={exportData} className="mb-3">
                    <Download size={18} /> Export Data (CSV)
                </Button>
                <div className="text-[10px] text-zinc-500 text-center">
                    Compatible with Google Sheets & Excel
                </div>
             </Card>

             <Button variant="ghost" onClick={handleSignOut} className="text-red-400 hover:text-red-300 hover:bg-red-500/5">
                <LogOut size={18} /> Sign Out
             </Button>
        </div>

        <div className="text-center text-[10px] text-zinc-700 pt-10">
            Version 1.0.0 • Hostel Kharcha Manager • Created by Mian Khizar
        </div>
    </div>
  );
};
