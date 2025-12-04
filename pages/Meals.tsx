import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Button, Input, Select } from '../components/ui/Card';
import { Meal } from '../types';
import { Coffee, Sun, Moon, ChefHat, Info, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface MealsProps {
  isAdmin: boolean;
  canEdit: boolean;
}

export const Meals: React.FC<MealsProps> = ({ isAdmin, canEdit }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  useEffect(() => {
    fetchMeals();
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

  const MealIcon = ({ type }: { type: string }) => {
    switch(type) {
      case 'Breakfast': return <Coffee size={18} className="text-orange-400" />;
      case 'Lunch': return <Sun size={18} className="text-yellow-400" />;
      default: return <Moon size={18} className="text-indigo-400" />;
    }
  };

  return (
    <div className="p-4 space-y-4 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">Meal History</h1>
        {(isAdmin || canEdit) && (
            <button onClick={toggleForm} className="text-red-500 text-sm font-medium">
            {showAdd ? 'Cancel' : '+ Add Meal'}
            </button>
        )}
      </div>

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
        {loading ? <div className="text-center text-zinc-500 py-10">Loading meals...</div> : meals.map((meal) => (
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
    </div>
  );
};
