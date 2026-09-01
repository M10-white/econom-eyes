use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub id: String,
    pub name: String,
    pub account_type: String,
    pub balance: f64,
    pub currency: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateAccount {
    pub name: String,
    pub account_type: String,
    pub balance: f64,
    pub currency: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAccount {
    pub name: String,
    pub account_type: String,
    pub balance: f64,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub category_type: String,
    pub is_default: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TransactionWithCategory {
    pub id: String,
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub description: String,
    pub date: String,
    pub transaction_type: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub category_name: Option<String>,
    pub category_icon: Option<String>,
    pub category_color: Option<String>,
    pub account_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTransaction {
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub description: String,
    pub date: String,
    pub transaction_type: String,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TransactionFilters {
    pub account_id: Option<String>,
    pub from_date: Option<String>,
    pub to_date: Option<String>,
    pub transaction_type: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MonthlySummary {
    pub total_income: f64,
    pub total_expenses: f64,
    pub balance: f64,
    pub by_category: Vec<CategorySummary>,
    pub daily: Vec<DailySummary>,
}

#[derive(Debug, Serialize, Clone)]
pub struct CategorySummary {
    pub name: String,
    pub color: String,
    pub icon: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct DailySummary {
    pub date: String,
    pub expenses: f64,
    pub income: f64,
}

// ── Budgets ──

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BudgetWithSpent {
    pub id: String,
    pub category_id: String,
    pub category_name: String,
    pub category_icon: String,
    pub category_color: String,
    pub year: i32,
    pub month: u32,
    pub amount: f64,
    pub spent: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertBudget {
    pub category_id: String,
    pub year: i32,
    pub month: u32,
    pub amount: f64,
}

// ── Savings ──

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SavingsGoal {
    pub id: String,
    pub name: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub deadline: Option<String>,
    pub color: String,
    pub icon: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSavingsGoal {
    pub name: String,
    pub target_amount: f64,
    pub current_amount: Option<f64>,
    pub deadline: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSavingsGoal {
    pub name: String,
    pub target_amount: f64,
    pub deadline: Option<String>,
    pub color: Option<String>,
    pub icon: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SavingsContribution {
    pub id: String,
    pub goal_id: String,
    pub amount: f64,
    pub date: String,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateContribution {
    pub goal_id: String,
    pub amount: f64,
    pub date: String,
    pub notes: Option<String>,
}

// ── User Profile ──

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    pub birth_date: Option<String>,
    pub status: String,
    pub monthly_income: f64,
    pub household_type: String,
    pub dependents: i32,
    pub housing_type: String,
    pub housing_zone: String,
    pub rent_amount: f64,
    pub is_student: bool,
    pub is_apprentice: bool,
    pub has_disability: bool,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfile {
    pub birth_date: Option<String>,
    pub status: String,
    pub monthly_income: f64,
    pub household_type: String,
    pub dependents: i32,
    pub housing_type: String,
    pub housing_zone: String,
    pub rent_amount: f64,
    pub is_student: bool,
    pub is_apprentice: bool,
    pub has_disability: bool,
}

// ── Aid Results ──

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AidResult {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub estimated_amount: String,
    pub eligible: bool,
    pub reasons: Vec<String>,
}

// ── Recurring Transactions ──

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecurringRule {
    pub id: String,
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub description: String,
    pub transaction_type: String,
    pub frequency: String,
    pub next_date: String,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRecurringRule {
    pub account_id: String,
    pub category_id: Option<String>,
    pub amount: f64,
    pub description: String,
    pub transaction_type: String,
    pub frequency: String,
    pub next_date: String,
}

// ── Multi-month ──

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MonthOverview {
    pub label: String,
    pub income: f64,
    pub expenses: f64,
}

// ── Budget Alerts ──

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BudgetAlert {
    pub category_name: String,
    pub category_color: String,
    pub amount: f64,
    pub spent: f64,
    pub percent: f64,
    pub level: String,
}

// ── AI / Chat ──

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessageDto {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OllamaStatus {
    pub connected: bool,
    pub url: String,
    pub model: String,
    pub available_models: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SettingsMap {
    pub ollama_url: String,
    pub ollama_model: String,
}

// ── Transfer ──

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTransfer {
    pub from_account_id: String,
    pub to_account_id: String,
    pub amount: f64,
    pub description: String,
    pub date: String,
}

// ── Sync Config ──

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SyncConfig {
    pub sync_dir: Option<String>,
}
