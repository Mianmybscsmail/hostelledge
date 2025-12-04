import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input } from '../components/ui/Card';
import { MarketItem } from '../types';
import { ShoppingCart, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface MarketProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export const Market: React.FC<MarketProps> = ({ isAdmin, canEdit }) => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [buyer, setBuyer] = useState('');
  const [budget, setBudget] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMarket = async () => {
    const { data } = await supabase.from('market_items').select('*').order('date', { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => {
    fetchMarket();
    const channel = supabase.channel('market-db').on('postgres_changes', { event: '*', schema: 'public', table: 'market_items' }, fetchMarket).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !canEdit) return;

    setSubmitting(true);
    const { error } = await supabase.from('market_items').insert({
      item_name: itemName,
      quantity,
      cost: parseFloat(cost) || 0,
      buyer,
      budget_per_item: parseFloat(budget) || 0,
      note,
      date: new Date().toISOString()
    });
    setSubmitting(false);

    if (!error) {
      setShowAdd(false);
      setItemName(''); setQuantity(''); setCost(''); setBuyer(''); setBudget(''); setNote('');
    }
  };

  return (
    <div className="p-4 space-y-4 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Market & Shopping</h1>
        {(isAdmin || canEdit) && (
             <button onClick={() => setShowAdd(!showAdd)} className="text-red-500 text-sm font-medium">
             {showAdd ? 'Cancel' : '+ Purchase'}
             </button>
        )}
      </div>

      {showAdd && (
        <Card className="animate-in slide-in-from-top-4 mb-6">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="Item Name" value={itemName} onChange={e => setItemName(e.target.value)} required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              <Input label="Cost" type="number" value={cost} onChange={e => setCost(e.target.value)} required />
            </div>
            <Input label="Buyer" value={buyer} onChange={e => setBuyer(e.target.value)} required />
            
            <div className="pt-2 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Budgeting (Optional)</p>
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Budget Limit" type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" />
                    <Input label="Note" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. For BBQ" />
                </div>
            </div>

            <Button type="submit" isLoading={submitting}>
              {submitting ? 'Saving...' : 'Add Item'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500">
                    <ShoppingCart size={18} />
                </div>
                <div>
                    <h3 className="font-medium text-white">{item.item_name}</h3>
                    <p className="text-xs text-zinc-500">{item.quantity} • Bought by {item.buyer}</p>
                </div>
              </div>
              <span className="text-white font-bold">PKR {item.cost}</span>
            </div>
            
            {(item.budget_per_item || item.note) && (
                <div className="mt-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800 flex flex-col gap-1 text-xs">
                    {item.budget_per_item && item.budget_per_item > 0 && (
                        <div className="flex justify-between text-zinc-400">
                            <span>Budget: {item.budget_per_item}</span>
                            <span className={item.cost > item.budget_per_item ? 'text-red-500' : 'text-green-500'}>
                                {item.cost > item.budget_per_item ? 'Over Budget' : 'Within Budget'}
                            </span>
                        </div>
                    )}
                    {item.note && (
                        <div className="flex items-start gap-1 text-zinc-500 italic">
                            <Tag size={10} className="mt-0.5" /> {item.note}
                        </div>
                    )}
                </div>
            )}
            <div className="text-[10px] text-zinc-600 text-right mt-1">
                {format(new Date(item.date), 'MMM d, yyyy')}
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-zinc-600 py-8">No market purchases yet.</div>}
      </div>
    </div>
  );
};