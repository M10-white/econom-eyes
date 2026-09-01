import { invoke } from "@tauri-apps/api/core";
import type {
  Account, CreateAccount, UpdateAccount,
  Category,
  TransactionWithCategory, CreateTransaction, TransactionFilters,
  MonthlySummary,
  BudgetWithSpent, UpsertBudget,
  SavingsGoal, CreateSavingsGoal, UpdateSavingsGoal,
  SavingsContribution, CreateContribution,
  UserProfile, UpdateProfile, AidResult,
  RecurringRule, CreateRecurringRule,
  MonthOverview, BudgetAlert,
  ChatMessage, OllamaStatus, SettingsMap,
  SyncConfig,
  CreateTransfer,
} from "./types";

export const api = {
  getAccounts: () => invoke<Account[]>("get_accounts"),
  createAccount: (input: CreateAccount) => invoke<Account>("create_account", { input }),
  updateAccount: (id: string, input: UpdateAccount) => invoke<Account>("update_account", { id, input }),
  deleteAccount: (id: string) => invoke<void>("delete_account", { id }),

  getTransactions: (filters: TransactionFilters = {}) =>
    invoke<TransactionWithCategory[]>("get_transactions", { filters }),
  createTransaction: (input: CreateTransaction) =>
    invoke<TransactionWithCategory>("create_transaction", { input }),
  deleteTransaction: (id: string) => invoke<void>("delete_transaction", { id }),
  transfer: (input: CreateTransfer) => invoke<void>("transfer", { input }),

  getCategories: () => invoke<Category[]>("get_categories"),
  getMonthlySummary: (year: number, month: number) =>
    invoke<MonthlySummary>("get_monthly_summary", { year, month }),

  getBudgets: (year: number, month: number) =>
    invoke<BudgetWithSpent[]>("get_budgets", { year, month }),
  upsertBudget: (input: UpsertBudget) =>
    invoke<BudgetWithSpent>("upsert_budget", { input }),
  deleteBudget: (id: string) => invoke<void>("delete_budget", { id }),

  getSavingsGoals: () => invoke<SavingsGoal[]>("get_savings_goals"),
  createSavingsGoal: (input: CreateSavingsGoal) =>
    invoke<SavingsGoal>("create_savings_goal", { input }),
  updateSavingsGoal: (id: string, input: UpdateSavingsGoal) =>
    invoke<SavingsGoal>("update_savings_goal", { id, input }),
  deleteSavingsGoal: (id: string) => invoke<void>("delete_savings_goal", { id }),

  addContribution: (input: CreateContribution) =>
    invoke<SavingsContribution>("add_contribution", { input }),
  getContributions: (goalId: string) =>
    invoke<SavingsContribution[]>("get_contributions", { goalId }),
  deleteContribution: (id: string) => invoke<void>("delete_contribution", { id }),

  getProfile: () => invoke<UserProfile>("get_profile"),
  saveProfile: (input: UpdateProfile) => invoke<UserProfile>("save_profile", { input }),
  checkEligibility: () => invoke<AidResult[]>("check_eligibility"),

  getMultiMonth: (count: number) => invoke<MonthOverview[]>("get_multi_month", { count }),

  getRecurringRules: () => invoke<RecurringRule[]>("get_recurring_rules"),
  createRecurringRule: (input: CreateRecurringRule) =>
    invoke<RecurringRule>("create_recurring_rule", { input }),
  deleteRecurringRule: (id: string) => invoke<void>("delete_recurring_rule", { id }),
  toggleRecurringRule: (id: string, active: boolean) =>
    invoke<void>("toggle_recurring_rule", { id, active }),
  applyRecurring: () => invoke<number>("apply_recurring"),

  getBudgetAlerts: (year: number, month: number) =>
    invoke<BudgetAlert[]>("get_budget_alerts", { year, month }),

  exportCsv: (filters: TransactionFilters = {}) =>
    invoke<string>("export_csv", { filters }),

  getDbPath: () => invoke<string>("get_db_path"),
  backupDb: (dest: string) => invoke<void>("backup_db", { dest }),
  restoreDb: (src: string) => invoke<void>("restore_db", { src }),

  getSettings: () => invoke<SettingsMap>("get_settings"),
  saveSettings: (ollamaUrl: string, ollamaModel: string) =>
    invoke<SettingsMap>("save_settings", { ollamaUrl, ollamaModel }),
  checkOllama: () => invoke<OllamaStatus>("check_ollama"),
  aiCategorize: (description: string) => invoke<string>("ai_categorize", { description }),
  aiChat: (messages: ChatMessage[]) => invoke<string>("ai_chat", { messages }),

  getSyncConfig: () => invoke<SyncConfig>("get_sync_config"),
  setSyncFolder: (folder: string) => invoke<string>("set_sync_folder", { folder }),
  removeSyncFolder: () => invoke<string>("remove_sync_folder"),
};
