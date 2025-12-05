import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Card, Skeleton } from '../components/ui/Card';
import { DashboardStats, WeeklyMoney, Budget, MarketItem, MealMenuItem } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, ShoppingBag, Utensils, Users, User, CalendarDays } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalWeekly: 0,
    totalSpent: 0,
    marketTotal: 0,
    foodTotal: 0,
    friendDues: 0,
    friendContribution: 0,
    remaining: 0,
    costPerPerson: 0,
    friendCount: 0
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [pieData, setPieData] = useState<{name: string, value: number}[]>([]);
  const [menuPlan, setMenuPlan] = useState<{day: string, menu: MealMenuItem | undefined}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Weekly Money (Direct Additions)
      const { data: weeklyData } = await supabase.from('weekly_money').select('amount');
      const directWeeklySum = weeklyData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // 2. Get Expenses (General/Quick)
      // Note: Fetching title/details now to match against budgets
      const { data: expensesData } = await supabase.from('expenses').select('*');
      
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
      const { data: friendsData } = await supabase.from('friends').select('amount, type, status, category, name');
      
      // Calculate Friends Contribution (Week Amount & Paid/Deposit)
      const friendContribution = friendsData
        ?.filter(f => f.category === 'Week Amount' && f.type === 'paid')
        .reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // Calculate Dues (General only - things that are NOT week contributions)
      const friendDues = friendsData
        ?.filter(f => f.status === 'Pending' && f.category !== 'Week Amount')
        .reduce((acc, curr) => curr.type === 'borrowed' ? acc + curr.amount : acc - curr.amount, 0) || 0;

      // Count Unique Friends
      const uniqueFriends = new Set(friendsData?.map(f => f.name.trim().toLowerCase()).filter(n => n));
      const friendCount = uniqueFriends.size;

      // 6. Get Budgets & Calculate Progress
      const { data: budgetData } = await supabase.from('budgets').select('*');
      
      // Logic to match expenses/market items to budgets by Name
      const budgetsWithSpent = (budgetData || []).map((b: Budget) => {
        const budgetName = b.name.toLowerCase();
        
        // Match in Expenses
        const matchedExpenses = (expensesData || []).filter(e => 
            e.title?.toLowerCase().includes(budgetName) || 
            e.details?.toLowerCase().includes(budgetName)
        );
        const expenseSum = matchedExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Match in Market Items
        const matchedMarket = (marketData || []).filter(m => 
            m.item_name?.toLowerCase().includes(budgetName) || 
            m.note?.toLowerCase().includes(budgetName)
        );
        const marketSum = matchedMarket.reduce((sum, m) => sum + m.cost, 0);

        return {
            ...b,
            spent: expenseSum + marketSum
        };
      });

      setBudgets(budgetsWithSpent);

      // 7. Get Meal Menu
      const { data: menuData } = await supabase.from('meal_menu').select('*');
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayIndex = new Date().getDay();
      const yesterdayIndex = (todayIndex - 1 + 7) % 7;
      const tomorrowIndex = (todayIndex + 1) % 7;

      const plannedMeals = [
        { day: 'Yesterday', menu: menuData?.find(m => m.day === days[yesterdayIndex]) },
        { day: 'Today', menu: menuData?.find(m => m.day === days[todayIndex]) },
        { day: 'Tomorrow', menu: menuData?.find(m => m.day === days[tomorrowIndex]) },
      ];
      setMenuPlan(plannedMeals);

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
      const totalSpent = totalExpensesRaw + mealsSum; 
      
      // Cost Per Person
      // Divide total spent by number of unique friends added
      const costPerPerson = friendCount > 0 ? totalSpent / friendCount : 0;
      
      setStats({
        totalWeekly,
        totalSpent,
        marketTotal: finalMarketTotal,
        foodTotal: finalFoodTotal,
        friendDues,
        friendContribution,
        remaining: totalWeekly - totalSpent,
        costPerPerson,
        friendCount
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
    return (
      <div className="p-4 space-y-6 pt-10">
        {/* Header Skeleton */}
        <div className="flex justify-between items-end">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>

        {/* Menu Skeleton */}
        <Skeleton className="h-24 w-full rounded-2xl" />

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>

        {/* Specific Category Breakdowns */}
        <div className="grid grid-cols-2 gap-2">
           <Skeleton className="h-20 rounded-xl" />
           <Skeleton className="h-20 rounded-xl" />
           <Skeleton className="h-20 rounded-xl" />
           <Skeleton className="h-20 rounded-xl" />
        </div>

        {/* Budgets Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
               <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        
        {/* Market Notes */}
         <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pt-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-zinc-400 text-sm font-medium">Remaining Balance</h2>
          <h1 className={`text-4xl font-bold ${stats.remaining < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
            PKR {stats.remaining.toLocaleString()}
          </h1>
        </div>
        <div className="bg-gray-100 dark:bg-zinc-800 p-2 rounded-lg">
          <TrendingUp className="text-green-500 w-6 h-6" />
        </div>
      </div>

       {/* Daily Menu Section */}
       <div className="space-y-2">
        <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2 text-sm">
            <CalendarDays size={16} className="text-red-500" /> Meal Menu
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 snap-x">
            {menuPlan.map((item, idx) => (
                <div key={idx} className={`snap-center min-w-[140px] flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border ${item.day === 'Today' ? 'border-red-500/30 ring-1 ring-red-500/20' : 'border-gray-200 dark:border-zinc-800'}`}>
                    <p className={`text-xs font-bold mb-2 ${item.day === 'Today' ? 'text-red-500' : 'text-gray-500 dark:text-zinc-400'}`}>
                        {item.day} {item.day === 'Today' && `(${format(new Date(), 'EEE')})`}
                    </p>
                    <div className="space-y-1 text-[10px] text-gray-700 dark:text-zinc-300">
                        <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-zinc-600">L:</span>
                            <span className="font-medium truncate max-w-[80px] text-right">{item.menu?.lunch || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400 dark:text-zinc-600">D:</span>
                            <span className="font-medium truncate max-w-[80px] text-right">{item.menu?.dinner || '-'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
       </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
          <div className="flex items-start justify-between mb-2">
            <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><DollarSign size={18} /></span>
          </div>
          <p className="text-gray-500 dark:text-zinc-400 text-xs">Total Added</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">PKR {stats.totalWeekly.toLocaleString()}</p>
        </Card>
        <Card className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
           <div className="flex items-start justify-between mb-2">
            <span className="p-2 bg-red-500/10 rounded-lg text-red-500"><TrendingDown size={18} /></span>
          </div>
          <p className="text-gray-500 dark:text-zinc-400 text-xs">Total Spent</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">PKR {stats.totalSpent.toLocaleString()}</p>
        </Card>
      </div>

      {/* Specific Category Breakdowns */}
      <div className="grid grid-cols-2 gap-2">
         <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
            <ShoppingBag size={16} className="text-purple-500 mb-2" />
            <p className="text-[10px] text-gray-500 dark:text-zinc-500">Market</p>
            <p className="font-semibold text-gray-900 dark:text-zinc-200">{stats.marketTotal}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
            <Utensils size={16} className="text-orange-500 mb-2" />
            <p className="text-[10px] text-gray-500 dark:text-zinc-500">Food</p>
            <p className="font-semibold text-gray-900 dark:text-zinc-200">{stats.foodTotal}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
            <Users size={16} className="text-teal-500 mb-2" />
            <p className="text-[10px] text-gray-500 dark:text-zinc-500">From Friends</p>
            <p className="font-semibold text-teal-600 dark:text-teal-400">+{stats.friendContribution}</p>
         </div>
         <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
            <User size={16} className="text-pink-500 mb-2" />
            <p className="text-[10px] text-gray-500 dark:text-zinc-500">Per Person ({stats.friendCount})</p>
            <p className="font-semibold text-pink-600 dark:text-pink-400">PKR {Math.round(stats.costPerPerson).toLocaleString()}</p>
         </div>
      </div>

      {/* Budgets Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budgets</h3>
            {pieData.length > 0 && <span className="text-xs text-gray-500 dark:text-zinc-500">Distribution</span>}
        </div>
        
        {pieData.length > 0 ? (
          <div className="h-48 w-full bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-zinc-800 p-2 relative shadow-sm">
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
                     <p className="text-xs text-gray-500 dark:text-zinc-500">Spent</p>
                     <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalSpent}</p>
                 </div>
             </div>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl text-center text-gray-500 dark:text-zinc-500 text-sm border border-gray-200 dark:border-zinc-800 border-dashed">
            No expenses yet to show trends.
          </div>
        )}

        {/* Budget Progress Bars */}
        {budgets.length > 0 && (
            <div className="space-y-3 pt-2">
                {budgets.map(b => {
                    const spent = b.spent || 0;
                    const percent = Math.min(100, Math.max(0, (spent / b.amount) * 100));
                    const isOver = spent > b.amount;
                    let colorClass = 'bg-green-500';
                    if (percent > 75) colorClass = 'bg-yellow-500';
                    if (percent > 90) colorClass = 'bg-red-500';

                    return (
                        <div key={b.id} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800">
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="font-medium text-gray-900 dark:text-zinc-200">{b.name}</span>
                                <span className="text-gray-500 dark:text-zinc-400 text-xs">
                                    <span className={isOver ? "text-red-500 font-bold" : "text-gray-900 dark:text-zinc-200"}>{spent}</span> 
                                    / {b.amount}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
                                    style={{ width: `${percent}%` }} 
                                />
                            </div>
                            {b.details && <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">{b.details}</p>}
                        </div>
                    );
                })}
            </div>
        )}
      </div>

       {/* Market Budgets / Notes Preview */}
       <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Market Budget Notes</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {marketItems.filter(i => i.budget_per_item || i.note).length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-zinc-500 text-xs">No market notes yet.</div>
            ) : (
                <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {marketItems.filter(i => i.budget_per_item || i.note).slice(0, 3).map(item => (
                        <li key={item.id} className="p-3 flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-zinc-300">{item.item_name}</span>
                            <div className="text-right">
                                {item.budget_per_item && <span className="block text-xs text-gray-500 dark:text-zinc-500">Budget: {item.budget_per_item}</span>}
                                {item.note && <span className="block text-[10px] text-gray-500 dark:text-zinc-600 truncate max-w-[100px]">{item.note}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
             {marketItems.filter(i => i.budget_per_item || i.note).length > 3 && (
                <div className="p-2 text-center text-xs text-red-500 border-t border-gray-100 dark:border-zinc-800">View all in Market tab</div>
            )}
          </div>
       </div>

    </div>
  );
};
