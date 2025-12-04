import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card } from '../components/ui/Card';
import { DashboardStats, WeeklyMoney, Budget, MarketItem } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, ShoppingBag, Utensils, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWeekly: 0,
    totalSpent: 0,
    marketTotal: 0,
    foodTotal: 0,
    friendDues: 0,
    friendContribution: 0,
    remaining: 0
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Weekly Money (Direct Additions)
      const { data: weeklyData } = await supabase.from('weekly_money').select('amount');
      const directWeeklySum = weeklyData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // 2. Get Expenses (General/Quick)
      const { data: expensesData } = await supabase.from('expenses').select('amount, category');
      
      // Calculate expenses by category
      const expenseMarket = expensesData?.filter(e => e.category === 'Market').reduce((acc, curr) => acc + curr.amount, 0) || 0;
      const expenseMeal = expensesData?.filter(e => e.category === 'Meal').reduce((acc, curr) => acc + curr.amount, 0) || 0;
      const expenseMisc = expensesData?.filter(e => e.category !== 'Market' && e.category !== 'Meal').reduce((acc, curr) => acc + curr.amount, 0) || 0;

      const totalExpensesRaw = expensesData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // 3. Get Market Items Sum (Detailed)
      const { data: marketData } = await supabase.from('market_items').select('*');
      const marketItemsSum = marketData?.reduce((acc, curr) => acc + curr.cost, 0) || 0;
      setMarketItems(marketData || []);

      // 4. Get Meals Sum (Detailed)
      const { data: mealsData } = await supabase.from('meals').select('cost');
      const mealsSum = mealsData?.reduce((acc, curr) => acc + curr.cost, 0) || 0;

      // 5. Get Friend Transactions
      const { data: friendsData } = await supabase.from('friends').select('amount, type, status, category');
      
      // Calculate Friends Contribution (Week Amount & Paid/Deposit)
      const friendContribution = friendsData
        ?.filter(f => f.category === 'Week Amount' && f.type === 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // Calculate Dues (General only - things that are NOT week contributions)
      const friendDues = friendsData
        ?.filter(f => f.status === 'Pending' && f.category !== 'Week Amount')
        .reduce((acc, curr) => curr.type === 'borrowed' ? acc + curr.amount : acc - curr.amount, 0) || 0;

      // 6. Get Budgets
      const { data: budgetData } = await supabase.from('budgets').select('*');
      setBudgets(budgetData || []);

      // Grand Totals
      // Total Weekly = Money Added Directly + Money Deposited by Friends for Week
      const totalWeekly = directWeeklySum + friendContribution;

      // Combine detailed market items + quick add market expenses
      const finalMarketTotal = marketItemsSum + expenseMarket;
      // Combine detailed meals + quick add meal expenses
      const finalFoodTotal = mealsSum + expenseMeal;
      
      // Total Spent Calculation:
      // EXCLUDES marketItemsSum as requested. 
      // It includes Quick Expenses (Misc + Food + Quick Market) + Detailed Meals.
      // If you want to strictly exclude ALL market expenses (even quick ones), subtract expenseMarket.
      // Based on prompt "don't count or add the market items amount", we exclude the marketItemsSum from the table.
      const totalSpent = totalExpensesRaw + mealsSum; 
      
      setStats({
        totalWeekly,
        totalSpent,
        marketTotal: finalMarketTotal,
        foodTotal: finalFoodTotal,
        friendDues,
        friendContribution,
        remaining: totalWeekly - totalSpent
      });

      // Prepare Pie Data
      // We show Market in the chart for visibility, even if it's not subtracted from the main cash balance
      setPieData([
        { name: 'Market', value: finalMarketTotal },
        { name: 'Food', value: finalFoodTotal },
        { name: 'Misc/Others', value: expenseMisc },
      ].filter(d => d.value > 0));

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Simple realtime subscription for refresh
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

  if (loading) {
    return <div className="h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>;
  }

  return (
    <div className="p-4 space-y-6 pt-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-zinc-400 text-sm font-medium">Remaining Balance</h2>
          <h1 className={`text-4xl font-bold ${stats.remaining < 0 ? 'text-red-500' : 'text-white'}`}>
            PKR {stats.remaining.toLocaleString()}
          </h1>
        </div>
        <div className="bg-zinc-800 p-2 rounded-lg">
          <TrendingUp className="text-green-500 w-6 h-6" />
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <div className="flex items-start justify-between mb-2">
            <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><DollarSign size={18} /></span>
          </div>
          <p className="text-zinc-400 text-xs">Total Added</p>
          <p className="text-xl font-bold text-white">PKR {stats.totalWeekly.toLocaleString()}</p>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
           <div className="flex items-start justify-between mb-2">
            <span className="p-2 bg-red-500/10 rounded-lg text-red-500"><TrendingDown size={18} /></span>
          </div>
          <p className="text-zinc-400 text-xs">Total Spent</p>
          <p className="text-xl font-bold text-white">PKR {stats.totalSpent.toLocaleString()}</p>
        </Card>
      </div>

      {/* Specific Category Breakdowns */}
      <div className="grid grid-cols-3 gap-2">
         <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
            <ShoppingBag size={16} className="text-purple-500 mb-2" />
            <p className="text-[10px] text-zinc-500">Market</p>
            <p className="font-semibold">{stats.marketTotal}</p>
         </div>
         <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
            <Utensils size={16} className="text-orange-500 mb-2" />
            <p className="text-[10px] text-zinc-500">Food</p>
            <p className="font-semibold">{stats.foodTotal}</p>
         </div>
         <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800">
            <Users size={16} className="text-teal-500 mb-2" />
            <p className="text-[10px] text-zinc-500">From Friends</p>
            <p className="font-semibold text-teal-400">+{stats.friendContribution}</p>
         </div>
      </div>

      {/* Budgets Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Budgets</h3>
            {pieData.length > 0 && <span className="text-xs text-zinc-500">Distribution</span>}
        </div>
        
        {pieData.length > 0 ? (
          <div className="h-48 w-full bg-zinc-900/50 rounded-2xl border border-zinc-800 p-2 relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
             {/* Center Text */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="text-center">
                     <p className="text-xs text-zinc-500">Spent</p>
                     <p className="text-xl font-bold">{stats.totalSpent}</p>
                 </div>
             </div>
          </div>
        ) : (
          <div className="p-6 bg-zinc-900 rounded-xl text-center text-zinc-500 text-sm border border-zinc-800 border-dashed">
            No expenses yet to show trends.
          </div>
        )}
      </div>

       {/* Market Budgets / Notes Preview */}
       <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Market Budget Notes</h3>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {marketItems.filter(i => i.budget_per_item || i.note).length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs">No market notes yet.</div>
            ) : (
                <ul className="divide-y divide-zinc-800">
                    {marketItems.filter(i => i.budget_per_item || i.note).slice(0, 3).map(item => (
                        <li key={item.id} className="p-3 flex justify-between items-center text-sm">
                            <span className="text-zinc-300">{item.item_name}</span>
                            <div className="text-right">
                                {item.budget_per_item && <span className="block text-xs text-zinc-500">Budget: {item.budget_per_item}</span>}
                                {item.note && <span className="block text-[10px] text-zinc-600 truncate max-w-[100px]">{item.note}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
             {marketItems.filter(i => i.budget_per_item || i.note).length > 3 && (
                <div className="p-2 text-center text-xs text-red-500 border-t border-zinc-800">View all in Market tab</div>
            )}
          </div>
       </div>

    </div>
  );
};
