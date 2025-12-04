export interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  allow_edit: boolean;
  created_at?: string;
}

export interface WeeklyMoney {
  id: string;
  amount: number;
  week_start: string;
  notes?: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  details?: string;
  date: string;
  created_by?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'Meal' | 'Friend' | 'Market' | 'Misc';
  amount: number;
  date: string;
  details?: string;
  created_at?: string;
}

export interface FriendTransaction {
  id: string;
  name: string;
  amount: number;
  type: 'borrowed' | 'paid';
  date: string;
  reason?: string;
  status: 'Pending' | 'Settled';
  category?: 'General' | 'Week Amount';
}

export interface Meal {
  id: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner';
  cooked: string;
  eaten: string; // Stored as comma separated string or user IDs
  cost: number;
  people: number;
  per_person: number;
  date: string;
}

export interface MarketItem {
  id: string;
  item_name: string;
  quantity: string;
  buyer: string;
  cost: number;
  date: string;
  budget_per_item?: number;
  note?: string;
}

export interface WeeklyArchive {
  id: string;
  week_start: string;
  week_end: string;
  data_snapshot: any; // JSON
  total_spent: number;
  created_at?: string;
}

// Stats interface for dashboard
export interface DashboardStats {
  totalWeekly: number;
  totalSpent: number;
  marketTotal: number;
  foodTotal: number;
  friendDues: number;
  friendContribution: number;
  remaining: number;
}