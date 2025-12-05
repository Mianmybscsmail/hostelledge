import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Skeleton } from '../components/ui/Card';
import { MealMenuItem } from '../types';
import { Info, Pencil, Save, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface WeeklyMenuProps {
  isAdmin: boolean;
  canEdit: boolean;
  onBack: () => void;
}

export const WeeklyMenu: React.FC<WeeklyMenuProps> = ({ isAdmin, canEdit, onBack }) => {
  const [menuItems, setMenuItems] = useState<MealMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editing State
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editBreakfast, setEditBreakfast] = useState('');
  const [editLunch, setEditLunch] = useState('');
  const [editDinner, setEditDinner] = useState('');

  const fetchMenu = async () => {
      setLoading(true);
      const { data } = await supabase.from('meal_menu').select('*');
      
      const dayOrder: {[key: string]: number} = { 'Monday':0, 'Tuesday':1, 'Wednesday':2, 'Thursday':3, 'Friday':4, 'Saturday':5, 'Sunday':6 };
      if (data) {
          const sorted = data.sort((a,b) => dayOrder[a.day] - dayOrder[b.day]);
          setMenuItems(sorted);
      }
      setLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const startEditDay = (item: MealMenuItem) => {
      setEditingDayId(item.id);
      setEditBreakfast(item.breakfast);
      setEditLunch(item.lunch);
      setEditDinner(item.dinner);
  };

  const saveDayMenu = async (id: string) => {
      if (!isAdmin && !canEdit) return;
      
      const { error } = await supabase.from('meal_menu').update({
          breakfast: editBreakfast,
          lunch: editLunch,
          dinner: editDinner
      }).eq('id', id);

      if (!error) {
          setMenuItems(menuItems.map(m => m.id === id ? { ...m, breakfast: editBreakfast, lunch: editLunch, dinner: editDinner } : m));
          setEditingDayId(null);
      } else {
          alert('Error updating menu');
      }
  };

  return (
    <div className="p-4 space-y-4 pt-8 pb-32 animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3 mb-6">
            <button onClick={onBack} className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white transition-colors">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Menu</h1>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
            <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-blue-800 dark:text-blue-200">
                This is the planned menu for the week. 
                {(isAdmin || canEdit) ? ' You can edit items by clicking the edit icon.' : ' Admins can update this.'}
            </p>
        </div>

        {loading ? <Skeleton className="h-96 rounded-2xl" /> : (
            <div className="grid gap-3">
                {menuItems.map(day => (
                    <div key={day.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 dark:bg-zinc-950 px-4 py-2 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center">
                            <span className={`font-bold ${day.day === format(new Date(), 'EEEE') ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                {day.day}
                            </span>
                            {(isAdmin || canEdit) && editingDayId !== day.id && (
                                <button onClick={() => startEditDay(day)} className="text-gray-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400">
                                    <Pencil size={14} />
                                </button>
                            )}
                        </div>
                        
                        <div className="p-3 text-sm space-y-2">
                            {editingDayId === day.id ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                        <span className="text-gray-500 dark:text-zinc-400 text-xs uppercase">Breakfast</span>
                                        <input className="bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white px-2 py-1 rounded text-sm border border-gray-200 dark:border-zinc-700" value={editBreakfast} onChange={e => setEditBreakfast(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                        <span className="text-gray-500 dark:text-zinc-400 text-xs uppercase">Lunch</span>
                                        <input className="bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white px-2 py-1 rounded text-sm border border-gray-200 dark:border-zinc-700" value={editLunch} onChange={e => setEditLunch(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                        <span className="text-gray-500 dark:text-zinc-400 text-xs uppercase">Dinner</span>
                                        <input className="bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white px-2 py-1 rounded text-sm border border-gray-200 dark:border-zinc-700" value={editDinner} onChange={e => setEditDinner(e.target.value)} />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => setEditingDayId(null)} className="text-xs text-gray-500 dark:text-zinc-400 px-3 py-1">Cancel</button>
                                        <button onClick={() => saveDayMenu(day.id)} className="text-xs bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1">
                                            <Save size={12} /> Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-[80px_1fr] gap-2">
                                        <span className="text-gray-400 dark:text-zinc-500 text-xs uppercase pt-0.5">Breakfast</span>
                                        <span className="text-gray-700 dark:text-zinc-300">{day.breakfast}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-2">
                                        <span className="text-gray-400 dark:text-zinc-500 text-xs uppercase pt-0.5">Lunch</span>
                                        <span className="text-gray-700 dark:text-zinc-300">{day.lunch}</span>
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-2">
                                        <span className="text-gray-400 dark:text-zinc-500 text-xs uppercase pt-0.5">Dinner</span>
                                        <span className="text-gray-700 dark:text-zinc-300">{day.dinner}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};
