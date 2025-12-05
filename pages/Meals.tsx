import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input, Select, Skeleton } from '../components/ui/Card';
import { Meal, MealMenuItem } from '../types';
import { Coffee, Sun, Moon, ChefHat, Info, Pencil, Trash2, Calendar, Save } from 'lucide-react';
import { format } from 'date-fns';

interface MealsProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export const Meals: React.FC<MealsProps> = ({ isAdmin, canEdit }) => {
  const [viewMode, setViewMode] = useState<'history' | 'menu'>('history');
  
  // History State
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Menu State
  const [menuItems, setMenuItems] = useState<MealMenuItem[]>([]);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editBreakfast, setEditBreakfast] = useState('');
  const [editLunch, setEditLunch] = useState('');
  const [editDinner, setEditDinner] = useState('');
  const [menuLoading, setMenuLoading] = useState(false);

  // Form State
  const [mealType, setMealType] = useState('Dinner');
  const [cooked, setCooked] = useState('');
  const [eaten, setEaten] = useState('');
  const [cost, setCost] = useState('');
  const [people, setPeople] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMeals = async () => {
    setLoading(true);
    const { data } = await supabase.from('meals').select('*').order('date', { ascending: false });
    if (data) setMeals(data);
    setLoading(false);
  };

  const fetchMenu = async () => {
      setMenuLoading(true);
      // Order: Mon, Tue, Wed... we can rely on ID or sort manually if needed.
      // Since we inserted in order, default order might be OK, but better to sort by a known logic.
      // For simplicity, we just fetch.
      const { data } = await supabase.from('meal_menu').select('*');
      
      // Sort days: Mon=0 .. Sun=6
      const dayOrder: {[key: string]: number} = { 'Monday':0, 'Tuesday':1, 'Wednesday':2, 'Thursday':3, 'Friday':4, 'Saturday':5, 'Sunday':6 };
      if (data) {
          const sorted = data.sort((a,b) => dayOrder[a.day] - dayOrder[b.day]);
          setMenuItems(sorted);
      }
      setMenuLoading(false);
  };

  useEffect(() => {
    fetchMeals();
    fetchMenu();
    const channel = supabase.channel('meals-db').on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchMeals).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !canEdit) return alert("Permission denied");

    setSubmitting(true);
    const numPeople = parseInt(people) || 1;
    const totalCost = parseFloat(cost) || 0;

    const payload = {
      meal_type: mealType,
      cooked,
      eaten,
      cost: totalCost,
      people: numPeople,
      per_person: totalCost / numPeople,
      date: new Date().toISOString()
    };

    let error;
    if (editingId) {
        const { error: updateError } = await supabase.from('meals').update(payload).eq('id', editingId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('meals').insert(payload);
        error = insertError;
    }

    setSubmitting(false);

    if (error) alert(error.message);
    else {
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Delete this meal record?")) return;
      await supabase.from('meals').delete().eq('id', id);
  };

  const startEdit = (meal: Meal) => {
      setMealType(meal.meal_type);
      setCooked(meal.cooked);
      setEaten(meal.eaten);
      setCost(meal.cost.toString());
      setPeople(meal.people.toString());
      setEditingId(meal.id);
      setShowAdd(true);
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setCooked('');
    setEaten('');
    setCost('');
    setPeople('');
    setMealType('Dinner');
  };

  const toggleForm = () => {
      if(showAdd) resetForm();
      else setShowAdd(true);
  };

  // Menu Handlers
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

  const MealIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'Breakfast': return <Coffee size={18} className="text-orange-400" />;
      case 'Lunch': return <Sun size={18} className="text-yellow-400" />;
      default: return <Moon size={18} className="text-indigo-400" />;
    }
  };

  return (
    <div className="p-4 space-y-4 pt-8">
      {/* Header & Toggle */}
      <div className="space-y-4 mb-4">
        <h1 className="text-2xl font-bold text-white">Food & Meals</h1>
        
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button 
                onClick={() => setViewMode('history')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'history' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                History
            </button>
            <button 
                onClick={() => setViewMode('menu')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'menu' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                Weekly Menu
            </button>
        </div>

        {viewMode === 'history' && (isAdmin || canEdit) && (
            <div className="flex justify-end">
                 <button onClick={toggleForm} className="text-red-500 text-sm font-medium">
                    {showAdd ? 'Cancel' : '+ Add Meal Log'}
                 </button>
            </div>
        )}
      </div>

      {/* VIEW: HISTORY */}
      {viewMode === 'history' && (
      <>
        {showAdd && (
            <Card className="animate-in slide-in-from-top-4 mb-6 border-red-900/30">
            <h3 className="text-white font-semibold mb-3">{editingId ? 'Edit Meal' : 'Add New Meal'}</h3>
            <form onSubmit={handleAddMeal} className="space-y-3">
                <Select value={mealType} onChange={e => setMealType(e.target.value)} label="Meal Type">
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                    <Input label="Cooked By" placeholder="Name" value={cooked} onChange={e => setCooked(e.target.value)} required />
                    <Input label="Total Cost" type="number" placeholder="0" value={cost} onChange={e => setCost(e.target.value)} required />
                </div>
                <Input label="Eaten By (Details)" placeholder="Names or description" value={eaten} onChange={e => setEaten(e.target.value)} required />
                <Input label="Number of People" type="number" placeholder="1" value={people} onChange={e => setPeople(e.target.value)} required />
                
                <div className="bg-zinc-950 p-3 rounded-xl flex justify-between items-center text-sm border border-zinc-800">
                <span className="text-zinc-400">Cost Per Person:</span>
                <span className="font-bold text-white">
                    PKR {((parseFloat(cost) || 0) / (parseInt(people) || 1)).toFixed(2)}
                </span>
                </div>

                <Button type="submit" isLoading={submitting}>
                {submitting ? 'Saving...' : (editingId ? 'Update Meal' : 'Save Meal')}
                </Button>
            </form>
            </Card>
        )}

        <div className="space-y-3">
            {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            ))
            ) : meals.map((meal) => (
            <div key={meal.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-start gap-3 relative group">
                <div className="p-2 bg-zinc-800 rounded-full mt-1">
                <MealIcon type={meal.meal_type} />
                </div>
                <div className="flex-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-medium text-white">{meal.meal_type}</h3>
                    <span className="text-red-400 font-bold text-sm">PKR {meal.cost}</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 flex flex-col gap-1">
                    <span className="flex items-center gap-1"><ChefHat size={12}/> Cooked by {meal.cooked}</span>
                    <span className="text-zinc-500">{format(new Date(meal.date), 'MMM d, h:mm a')}</span>
                </div>
                </div>
                
                {/* Actions */}
                {(isAdmin || canEdit) && (
                    <div className="flex gap-3 absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 p-1 rounded backdrop-blur-sm">
                    <button onClick={() => startEdit(meal)} className="text-zinc-400 hover:text-blue-400">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(meal.id)} className="text-zinc-400 hover:text-red-500">
                        <Trash2 size={14} />
                    </button>
                    </div>
                )}
            </div>
            ))}
            {!loading && meals.length === 0 && <div className="text-center text-zinc-600 py-10">No meals tracked this week.</div>}
        </div>
      </>
      )}

      {/* VIEW: WEEKLY MENU */}
      {viewMode === 'menu' && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                  <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-blue-200">
                      This is the planned menu for the week. 
                      {(isAdmin || canEdit) ? ' You can edit items by clicking the edit icon.' : ' Admins can update this.'}
                  </p>
              </div>

              {menuLoading ? <Skeleton className="h-64 rounded-2xl" /> : (
                  <div className="grid gap-3">
                      {menuItems.map(day => (
                          <div key={day.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                              <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
                                  <span className={`font-bold ${day.day === format(new Date(), 'EEEE') ? 'text-red-500' : 'text-white'}`}>
                                      {day.day}
                                  </span>
                                  {(isAdmin || canEdit) && editingDayId !== day.id && (
                                      <button onClick={() => startEditDay(day)} className="text-zinc-500 hover:text-blue-400">
                                          <Pencil size={14} />
                                      </button>
                                  )}
                              </div>
                              
                              <div className="p-3 text-sm space-y-2">
                                  {editingDayId === day.id ? (
                                      <div className="space-y-3">
                                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                              <span className="text-zinc-400 text-xs uppercase">Breakfast</span>
                                              <input className="bg-zinc-800 text-white px-2 py-1 rounded text-sm border border-zinc-700" value={editBreakfast} onChange={e => setEditBreakfast(e.target.value)} />
                                          </div>
                                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                              <span className="text-zinc-400 text-xs uppercase">Lunch</span>
                                              <input className="bg-zinc-800 text-white px-2 py-1 rounded text-sm border border-zinc-700" value={editLunch} onChange={e => setEditLunch(e.target.value)} />
                                          </div>
                                          <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                                              <span className="text-zinc-400 text-xs uppercase">Dinner</span>
                                              <input className="bg-zinc-800 text-white px-2 py-1 rounded text-sm border border-zinc-700" value={editDinner} onChange={e => setEditDinner(e.target.value)} />
                                          </div>
                                          <div className="flex justify-end gap-2 mt-2">
                                              <button onClick={() => setEditingDayId(null)} className="text-xs text-zinc-400 px-3 py-1">Cancel</button>
                                              <button onClick={() => saveDayMenu(day.id)} className="text-xs bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1">
                                                  <Save size={12} /> Save
                                              </button>
                                          </div>
                                      </div>
                                  ) : (
                                      <>
                                          <div className="grid grid-cols-[80px_1fr] gap-2">
                                              <span className="text-zinc-500 text-xs uppercase pt-0.5">Breakfast</span>
                                              <span className="text-zinc-300">{day.breakfast}</span>
                                          </div>
                                          <div className="grid grid-cols-[80px_1fr] gap-2">
                                              <span className="text-zinc-500 text-xs uppercase pt-0.5">Lunch</span>
                                              <span className="text-zinc-300">{day.lunch}</span>
                                          </div>
                                          <div className="grid grid-cols-[80px_1fr] gap-2">
                                              <span className="text-zinc-500 text-xs uppercase pt-0.5">Dinner</span>
                                              <span className="text-zinc-300">{day.dinner}</span>
                                          </div>
                                      </>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
