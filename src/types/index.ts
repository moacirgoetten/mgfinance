export type TransactionCategory = 'income' | 'fixed_expense' | 'variable_expense' | 'investment'

export interface Transaction {
  id: string
  user_id: string
  amount: number
  description: string
  category: TransactionCategory
  subcategory?: string
  date: string
  is_recurring: boolean
  notes?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  subcategory?: string
  amount: number
  month: number
  year: number
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  description?: string
  target_amount: number
  current_amount: number
  deadline?: string
  color: string
  icon: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface MonthlySummary {
  id: string
  user_id: string
  month: number
  year: number
  summary_text: string
  total_income: number
  total_expenses: number
  total_investments: number
  net_balance: number
  generated_at: string
}

export interface MonthlyStats {
  totalIncome: number
  totalExpenses: number
  totalInvestments: number
  netBalance: number
  byCategory: Record<string, number>
  bySubcategory: Record<string, number>
  transactionCount: number
}
