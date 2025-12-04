import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input, Select } from '../components/ui/Card';
import { FriendTransaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Users, Trash2, Pencil } from 'lucide-react';

interface FriendsProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export const Friends: React.FC<FriendsProps> = ({ isAdmin, canEdit }) => {
  const [friends, setFriends] = useState<FriendTransaction[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Updated Defaults: Week Amount & Paid (Deposit)
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('paid'); 
  const [category, setCategory] = useState('Week Amount');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchFriends = async () => {
    const { data } = await supabase.from('friends').select('*').order('date', { ascending: false });
    if (data) setFriends(data);
  };

  useEffect(() => {
    fetchFriends();
    const channel = supabase.channel('friends-db').on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchFriends).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !canEdit) return;

    setSubmitting(true);
    const payload = {
      name,
      amount: parseFloat(amount) || 0,
      type,
      category,
      reason: category === 'Week Amount' ? 'Weekly Contribution' : reason,
      status: 'Pending',
      date: new Date().toISOString()
    };

    let error;
    if (editingId) {
       // Update existing
       const { error: updateError } = await supabase.from('friends').update(payload).eq('id', editingId);
       error = updateError;
    } else {
       // Insert new
       const { error: insertError } = await supabase.from('friends').insert(payload);
       error = insertError;
    }

    setSubmitting(false);

    if (!error) {
      resetForm();
    } else {
      alert("Error saving record");
    }
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setName(''); 
    setAmount(''); 
    setReason(''); 
    setCategory('Week Amount'); // Reset to default
    setType('paid'); // Reset to default
  };

  const startEdit = (item: FriendTransaction) => {
      setName(item.name);
      setAmount(item.amount.toString());
      setType(item.type);
      setCategory(item.category || 'General');
      setReason(item.reason || '');
      setEditingId(item.id);
      setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    await supabase.from('friends').delete().eq('id', id);
  };

  const markSettled = async (id: string) => {
    if (!isAdmin && !canEdit) return;
    await supabase.from('friends').update({ status: 'Settled' }).eq('id', id);
  };

  const toggleForm = () => {
      if(showAdd) resetForm();
      else setShowAdd(true);
  };

  return (
    <div className="p-4 space-y-4 pt-8">
       <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Friends Tracker</h1>
        {(isAdmin || canEdit) && (
             <button onClick={toggleForm} className="text-red-500 text-sm font-medium">
             {showAdd ? 'Cancel' : '+ Record'}
             </button>
        )}
      </div>

      {showAdd && (
        <Card className="animate-in slide-in-from-top-4 mb-6">
          <h3 className="text-white font-semibold mb-3">{editingId ? 'Edit Record' : 'New Record'}</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="Friend Name" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} required />
            
            <div className="grid grid-cols-2 gap-3">
                <Select label="Category" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="Week Amount">Week Amount</option>
                    <option value="General">General</option>
                </Select>
                <Select label="Type" value={type} onChange={e => setType(e.target.value)}>
                    <option value="paid">Deposit / Received</option>
                    <option value="borrowed">Borrowed (They owe)</option>
                </Select>
            </div>

            {category === 'General' && (
                <Input label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Urgent cash" />
            )}
            
            <Button type="submit" isLoading={submitting}>
              {submitting ? 'Saving...' : (editingId ? 'Update Record' : 'Save Record')}
            </Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {friends.map((item) => {
           // Check if it's a contribution/deposit
           const isDeposit = item.category === 'Week Amount' || item.type === 'paid';

           return (
            <div key={item.id} className={`p-4 rounded-xl border flex items-center justify-between group ${item.status === 'Settled' && !isDeposit ? 'bg-zinc-900/50 border-zinc-800 opacity-60' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.category === 'Week Amount' ? 'bg-blue-500/10 text-blue-500' : (item.type === 'borrowed' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500')}`}>
                      {item.category === 'Week Amount' ? <Users size={18} /> : (item.type === 'borrowed' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />)}
                  </div>
                  <div>
                      <h3 className="font-bold text-zinc-200">{item.name}</h3>
                      <p className="text-xs text-zinc-500">
                          {item.category === 'Week Amount' ? <span className="text-blue-400">Weekly Contribution</span> : item.reason}
                      </p>
                  </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                  <p className={`font-mono font-bold ${item.type === 'borrowed' ? 'text-red-400' : 'text-green-400'}`}>
                      {item.type === 'borrowed' ? '-' : '+'} {item.amount}
                  </p>
                  
                  {isDeposit ? (
                       <span className="text-[10px] font-medium px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700">Received</span>
                  ) : (
                      <>
                        {(isAdmin || canEdit) && item.status === 'Pending' ? (
                            <button onClick={() => markSettled(item.id)} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
                                Mark Settled
                            </button>
                        ) : (
                            <div className="flex items-center justify-end gap-1 text-[10px] text-zinc-500">
                                {item.status === 'Settled' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                                {item.status}
                            </div>
                        )}
                      </>
                  )}

                  {/* Edit/Delete Actions */}
                  {(isAdmin || canEdit) && (
                      <div className="flex gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item)} className="text-zinc-500 hover:text-blue-400">
                              <Pencil size={12} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="text-zinc-500 hover:text-red-500">
                              <Trash2 size={12} />
                          </button>
                      </div>
                  )}
              </div>
            </div>
          );
        })}
         {friends.length === 0 && <div className="text-center text-zinc-600 py-8">No friend transactions recorded.</div>}
      </div>
    </div>
  );
};
