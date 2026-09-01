export interface Account {
  id: string;
  name: string;
  accountType: string;
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccount {
  name: string;
  accountType: string;
  balance: number;
  currency?: string;
  color?: string;
  icon?: string;
}

export interface UpdateAccount {
  name: string;
  accountType: string;
  balance: number;
  color?: string;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  categoryType: string;
  isDefault: boolean;
  createdAt: string;
}

export interface TransactionWithCategory {
  id: string;
  accountId: string;
  categoryId: string | null;
  amount: number;
  description: string;
  date: string;
  transactionType: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  accountName: string | null;
}

export interface CreateTransaction {
  accountId: string;
  categoryId?: string;
  amount: number;
  description: string;
  date: string;
  transactionType: string;
  notes?: string;
}

export interface TransactionFilters {
  accountId?: string;
  fromDate?: string;
  toDate?: string;
  transactionType?: string;
  search?: string;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  byCategory: CategorySummary[];
  daily: DailySummary[];
}

export interface CategorySummary {
  name: string;
  color: string;
  icon: string;
  amount: number;
}

export interface DailySummary {
  date: string;
  expenses: number;
  income: number;
}

// ── Budgets ──

export interface BudgetWithSpent {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  year: number;
  month: number;
  amount: number;
  spent: number;
}

export interface UpsertBudget {
  categoryId: string;
  year: number;
  month: number;
  amount: number;
}

// ── Savings ──

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingsGoal {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string;
  color?: string;
  icon?: string;
}

export interface UpdateSavingsGoal {
  name: string;
  targetAmount: number;
  deadline?: string;
  color?: string;
  icon?: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateContribution {
  goalId: string;
  amount: number;
  date: string;
  notes?: string;
}

// ── Profile ──

export interface UserProfile {
  id: string;
  birthDate: string | null;
  status: string;
  monthlyIncome: number;
  householdType: string;
  dependents: number;
  housingType: string;
  housingZone: string;
  rentAmount: number;
  isStudent: boolean;
  isApprentice: boolean;
  hasDisability: boolean;
  updatedAt: string;
}

export interface UpdateProfile {
  birthDate?: string;
  status: string;
  monthlyIncome: number;
  householdType: string;
  dependents: number;
  housingType: string;
  housingZone: string;
  rentAmount: number;
  isStudent: boolean;
  isApprentice: boolean;
  hasDisability: boolean;
}

// ── Aids ──

export interface AidResult {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedAmount: string;
  eligible: boolean;
  reasons: string[];
}

// ── Recurring ──

export interface RecurringRule {
  id: string;
  accountId: string;
  categoryId: string | null;
  amount: number;
  description: string;
  transactionType: string;
  frequency: string;
  nextDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRecurringRule {
  accountId: string;
  categoryId?: string;
  amount: number;
  description: string;
  transactionType: string;
  frequency: string;
  nextDate: string;
}

// ── Multi-month ──

export interface MonthOverview {
  label: string;
  income: number;
  expenses: number;
}

// ── Budget Alerts ──

export interface BudgetAlert {
  categoryName: string;
  categoryColor: string;
  amount: number;
  spent: number;
  percent: number;
  level: "warning" | "critical";
}

// ── AI / Settings ──

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OllamaStatus {
  connected: boolean;
  url: string;
  model: string;
  availableModels: string[];
}

export interface SettingsMap {
  ollamaUrl: string;
  ollamaModel: string;
}

// ── Transfer ──

export interface CreateTransfer {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
  date: string;
}

// ── Sync ──

export interface SyncConfig {
  syncDir: string | null;
}
