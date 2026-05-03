import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AnalyticsData {
  spending: {
    totalSpent: number;
    monthlySpent: number;
    averageOrder: number;
    spendingTrend: number;
    monthlyData: { month: string; amount: number }[];
  };
  categories: {
    name: string;
    spent: number;
    orders: number;
    percentage: number;
  }[];
  orders: {
    totalOrders: number;
    completedOrders: number;
    averageDeliveryTime: number;
    orderTrend: number;
  };
  budget: {
    monthlyBudget: number;
    spent: number;
    remaining: number;
    daysLeft: number;
    onTrack: boolean;
  };
  recommendations: {
    id: number;
    title: string;
    products: string[];
    reason: string;
  }[];
}

interface AnalyticsState {
  data: AnalyticsData;
  isLoading: boolean;
  selectedPeriod: string;
  
  // Actions
  updateSpending: (amount: number, category: string) => void;
  addOrder: (amount: number, category: string) => void;
  setBudget: (amount: number) => void;
  setSelectedPeriod: (period: string) => void;
  
  // Computed
  getCategorySpending: (category: string) => number;
  getBudgetProgress: () => number;
  getTopCategory: () => string;
}

const initialData: AnalyticsData = {
  spending: {
    totalSpent: 0,
    monthlySpent: 0,
    averageOrder: 0,
    spendingTrend: 0,
    monthlyData: []
  },
  categories: [
    { name: 'Electronics', spent: 0, orders: 0, percentage: 0 },
    { name: 'Fashion', spent: 0, orders: 0, percentage: 0 },
    { name: 'Home & Garden', spent: 0, orders: 0, percentage: 0 },
    { name: 'Books', spent: 0, orders: 0, percentage: 0 },
    { name: 'Sports', spent: 0, orders: 0, percentage: 0 }
  ],
  orders: {
    totalOrders: 0,
    completedOrders: 0,
    averageDeliveryTime: 0,
    orderTrend: 0
  },
  budget: {
    monthlyBudget: 500,
    spent: 0,
    remaining: 500,
    daysLeft: 30,
    onTrack: true
  },
  recommendations: []
};

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      data: initialData,
      isLoading: false,
      selectedPeriod: '6months',

      updateSpending: (amount: number, category: string) => {
        set(state => {
          const newTotalSpent = state.data.spending.totalSpent + amount;
          const newMonthlySpent = state.data.spending.monthlySpent + amount;
          
          const updatedCategories = state.data.categories.map(cat => 
            cat.name === category 
              ? { ...cat, spent: cat.spent + amount, orders: cat.orders + 1 }
              : cat
          );

          // Recalculate percentages
          const totalCategorySpent = updatedCategories.reduce((sum, cat) => sum + cat.spent, 0);
          updatedCategories.forEach(cat => {
            cat.percentage = totalCategorySpent > 0 ? Math.round((cat.spent / totalCategorySpent) * 100) : 0;
          });

          const newBudgetSpent = state.data.budget.spent + amount;
          const budgetRemaining = state.data.budget.monthlyBudget - newBudgetSpent;

          return {
            data: {
              ...state.data,
              spending: {
                ...state.data.spending,
                totalSpent: newTotalSpent,
                monthlySpent: newMonthlySpent,
                averageOrder: newTotalSpent / (state.data.orders.totalOrders + 1)
              },
              categories: updatedCategories,
              budget: {
                ...state.data.budget,
                spent: newBudgetSpent,
                remaining: budgetRemaining,
                onTrack: budgetRemaining >= 0
              }
            }
          };
        });
      },

      addOrder: (amount: number, category: string) => {
        set(state => ({
          data: {
            ...state.data,
            orders: {
              ...state.data.orders,
              totalOrders: state.data.orders.totalOrders + 1,
              completedOrders: state.data.orders.completedOrders + 1
            }
          }
        }));

        // Also update spending
        get().updateSpending(amount, category);
      },

      setBudget: (amount: number) => {
        set(state => {
          const remaining = amount - state.data.budget.spent;
          return {
            data: {
              ...state.data,
              budget: {
                ...state.data.budget,
                monthlyBudget: amount,
                remaining,
                onTrack: remaining >= 0
              }
            }
          };
        });
      },

      setSelectedPeriod: (period: string) => {
        set({ selectedPeriod: period });
      },

      getCategorySpending: (category: string) => {
        const { data } = get();
        const cat = data.categories.find(c => c.name === category);
        return cat?.spent || 0;
      },

      getBudgetProgress: () => {
        const { data } = get();
        return (data.budget.spent / data.budget.monthlyBudget) * 100;
      },

      getTopCategory: () => {
        const { data } = get();
        const topCategory = data.categories.reduce((top, current) => 
          current.spent > top.spent ? current : top
        );
        return topCategory.name;
      }
    }),
    {
      name: 'analytics-storage',
      partialize: (state) => ({ data: state.data })
    }
  )
);