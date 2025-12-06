import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input, Select, Skeleton } from '../components/ui/Card';
import { Meal } from '../types';
import { Coffee, Sun, Moon, ChefHat, Pencil, Trash2, CalendarDays, ChevronRight, Check } from 'lucide-react';
import { format } from 'date-fns';

interface MealsProps {
  isAdmin: boolean;
  canEdit: boolean;
  onNavigate: (page: string) => void;
}

export const Meals: React.FC<MealsProps> = ({ isAdmin, canEdit, onNavigate }) => {
  // History State
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Friend Selection State
  const [availableFriends, setAvailableFriends] = useState<string[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [manualEaten, setManualEaten] = useState('');

  // Form State
  const [mealType, setMealType] = useState('Dinner');
  const [dishName, setDishName] = useState('');
  const [cooked, setCooked] = useState('');
  const [cost, setCost] = useState('');
  const [people, setPeople] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMeals = async () => {
    setLoading(true);
    const { data } = await supabase.from('meals').select('*').order('date', { ascending: false });
    if (data) setMeals(data);
    setLoading(false);
  };

  const fetchFriends = async () => {
      const { data } = await supabase.from('friends').select('name');
      if (data) {
          // Get unique names
          const unique = Array.from(new Set(data.map(f => f.name.trim()))).filter(n => n).sort();
          setAvailableFriends(unique);
      }
  };

  useEffect(() => {
    fetchMeals();
    fetchFriends();
    const channel = supabase.channel('meals-db').on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchMeals).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-update people count based on selection
  useEffect(() => {
      if (selectedFriends.length > 0) {
          // If we have selected friends, assume people count matches + any manual entries implied?
          // For simplicity, we just set people to the count of checked boxes + 1 if manual text exists?
          // Let's just set it to the count of selected friends. User can override.
          const count = selectedFriends.length + (manualEaten ? 1 : 0);
          setPeople(count.toString());
      }
  }, [selectedFriends, manualEaten]);

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !canEdit) return alert("Permission denied");

    setSubmitting(true);
    const numPeople = parseInt(people) || 1;
    const totalCost = parseFloat(cost) || 0;

    // Construct "Eaten By" string
    let eatenString = selectedFriends.join(', ');
    if (manualEaten) {
        eatenString = eatenString ? `${eatenString}, ${manualEaten}` : manualEaten;
    }

    const payload = {
      meal_type: mealType,
      dish_name: dishName,
      cooked,
      eaten: eatenString, // Stored as string
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
      setDishName(meal.dish_name || '');
      setCooked(meal.cooked);
      setCost(meal.cost.toString());
      setPeople(meal.people.toString());
      
      // Attempt to parse eaten string back to selection
      // This is basic and might not be perfect if names have commas
      const eaters = meal.eaten ? meal.eaten.split(',').map(s => s.trim()) : [];
      const recognized = eaters.filter(e => availableFriends.includes(e));
      const others = eaters.filter(e => !availableFriends.includes(e));
      
      setSelectedFriends(recognized);
      setManualEaten(others.join(', '));

      setEditingId(meal.id);
      setShowAdd(true);
  };

  const resetForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setCooked('');
    setCost('');
    setPeople('');
    setMealType('Dinner');
    setDishName('');
    setSelectedFriends([]);
    setManualEaten('');
  };

  const toggleForm = () => {
      if(showAdd) resetForm();
      else setShowAdd(true);
  };

  const toggleFriendSelection = (name: string) => {
      if (selectedFriends.includes(name)) {
          setSelectedFriends(selectedFriends.filter(f => f !== name));
      } else {
          setSelectedFriends([...selectedFriends, name]);
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
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Log</h1>
        {(isAdmin || canEdit) && (
            <button onClick={toggleForm} className="text-red-500 text-sm font-medium">
                {showAdd ? 'Cancel' : '+ Add Log'}
            </button>
        )}
      </div>

      {/* Navigation to Weekly Menu */}
      <button 
        onClick={() => onNavigate('weekly-menu')}
        className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between group shadow-sm active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                <CalendarDays size={20} />
            </div>
            <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">Weekly Meal Menu</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500">View planned meals for all 7 days</p>
            </div>
        </div>
        <ChevronRight className="text-gray-400 dark:text-zinc-600" size={20} />
      </button>

      {showAdd && (
        <Card className="animate-in slide-in-from-top-4 mb-6 border-red-900/30">
        <h3 className="text-gray-900 dark:text-white font-semibold mb-3">{editingId ? 'Edit Meal' : 'Add New Meal'}</h3>
        <form onSubmit={handleAddMeal} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Select value={mealType} onChange={e => setMealType(e.target.value)} label="Meal Type">
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                </Select>
                <Input label="Dish Name" placeholder="e.g. Biryani" value={dishName} onChange={e => setDishName(e.target.value)} />
            </div>
            
            {/* Eaten By Selector */}
            <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 ml-1">Eaten By</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {availableFriends.map(f => {
                        const isSelected = selectedFriends.includes(f);
                        return (
                            <button
                                key={f}
                                type="button"
                                onClick={() => toggleFriendSelection(f)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                                    isSelected 
                                    ? 'bg-red-500 text-white border-red-500' 
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                                }`}
                            >
                                {f} {isSelected && <Check size={10} />}
                            </button>
                        );
                    })}
                </div>
                <Input 
                    placeholder="Other names (comma separated)" 
                    value={manualEaten} 
                    onChange={e => setManualEaten(e.target.value)} 
                    className="text-sm"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Input label="Cooked By" placeholder="Name" value={cooked} onChange={e => setCooked(e.target.value)} required />
                <Input label="Total Cost" type="number" placeholder="0" value={cost} onChange={e => setCost(e.target.value)} required />
            </div>
            
            <Input label="Number of People" type="number" placeholder="1" value={people} onChange={e => setPeople(e.target.value)} required />
            
            <div className="bg-gray-100 dark:bg-zinc-950 p-3 rounded-xl flex justify-between items-center text-sm border border-gray-200 dark:border-zinc-800">
            <span className="text-gray-500 dark:text-zinc-400">Cost Per Person:</span>
            <span className="font-bold text-gray-900 dark:text-white">
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
        <div key={meal.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 flex items-start gap-3 relative group shadow-sm">
            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full mt-1">
            <MealIcon type={meal.meal_type} />
            </div>
            <div className="flex-1">
            <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 dark:text-white">
                    {meal.dish_name ? `${meal.meal_type} - ${meal.dish_name}` : meal.meal_type}
                </h3>
                <span className="text-red-500 dark:text-red-400 font-bold text-sm">PKR {meal.cost}</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex flex-col gap-1">
                <span className="flex items-center gap-1"><ChefHat size={12}/> Cooked by {meal.cooked}</span>
                <span className="text-gray-400 dark:text-zinc-500">{format(new Date(meal.date), 'MMM d, h:mm a')}</span>
                {meal.eaten && (
                    <span className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1">Eaten by: {meal.eaten}</span>
                )}
            </div>
            </div>
            
            {/* Actions */}
            {(isAdmin || canEdit) && (
                <div className="flex gap-3 absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-zinc-900/80 p-1 rounded backdrop-blur-sm">
                <button onClick={() => startEdit(meal)} className="text-gray-400 dark:text-zinc-400 hover:text-blue-500">
                    <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(meal.id)} className="text-gray-400 dark:text-zinc-400 hover:text-red-500">
                    <Trash2 size={14} />
                </button>
                </div>
            )}
        </div>
        ))}
        {!loading && meals.length === 0 && <div className="text-center text-gray-500 dark:text-zinc-600 py-10">No meals tracked this week.</div>}
      </div>
    </div>
  );
};
