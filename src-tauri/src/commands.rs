use tauri::State;
use crate::db::DbState;
use crate::models::*;
use crate::AppDataDirState;

#[tauri::command]
pub fn get_accounts(state: State<'_, DbState>) -> Result<Vec<Account>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_all_accounts(&db)
}

#[tauri::command]
pub fn create_account(state: State<'_, DbState>, input: CreateAccount) -> Result<Account, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::insert_account(&db, input)
}

#[tauri::command]
pub fn update_account(state: State<'_, DbState>, id: String, input: UpdateAccount) -> Result<Account, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::update_account_in_db(&db, &id, input)
}

#[tauri::command]
pub fn delete_account(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::delete_account_from_db(&db, &id)
}

#[tauri::command]
pub fn get_transactions(state: State<'_, DbState>, filters: TransactionFilters) -> Result<Vec<TransactionWithCategory>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_transactions_filtered(&db, filters)
}

#[tauri::command]
pub fn create_transaction(state: State<'_, DbState>, input: CreateTransaction) -> Result<TransactionWithCategory, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::insert_transaction(&db, input)
}

#[tauri::command]
pub fn delete_transaction(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::delete_transaction_from_db(&db, &id)
}

#[tauri::command]
pub fn get_categories(state: State<'_, DbState>) -> Result<Vec<Category>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_all_categories(&db)
}

#[tauri::command]
pub fn get_monthly_summary(state: State<'_, DbState>, year: i32, month: u32) -> Result<MonthlySummary, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_monthly_summary_data(&db, year, month)
}

// ── Budgets ──

#[tauri::command]
pub fn get_budgets(state: State<'_, DbState>, year: i32, month: u32) -> Result<Vec<BudgetWithSpent>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_budgets_for_month(&db, year, month)
}

#[tauri::command]
pub fn upsert_budget(state: State<'_, DbState>, input: UpsertBudget) -> Result<BudgetWithSpent, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::upsert_budget(&db, input)
}

#[tauri::command]
pub fn delete_budget(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::delete_budget_from_db(&db, &id)
}

// ── Savings ──

#[tauri::command]
pub fn get_savings_goals(state: State<'_, DbState>) -> Result<Vec<SavingsGoal>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_all_savings_goals(&db)
}

#[tauri::command]
pub fn create_savings_goal(state: State<'_, DbState>, input: CreateSavingsGoal) -> Result<SavingsGoal, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::insert_savings_goal(&db, input)
}

#[tauri::command]
pub fn update_savings_goal(state: State<'_, DbState>, id: String, input: UpdateSavingsGoal) -> Result<SavingsGoal, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::update_savings_goal_in_db(&db, &id, input)
}

#[tauri::command]
pub fn delete_savings_goal(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::delete_savings_goal_from_db(&db, &id)
}

#[tauri::command]
pub fn add_contribution(state: State<'_, DbState>, input: CreateContribution) -> Result<SavingsContribution, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::add_contribution_to_goal(&db, input)
}

#[tauri::command]
pub fn get_contributions(state: State<'_, DbState>, goal_id: String) -> Result<Vec<SavingsContribution>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_contributions_for_goal(&db, &goal_id)
}

#[tauri::command]
pub fn delete_contribution(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::delete_contribution_from_db(&db, &id)
}

// ── Transfers ──

#[tauri::command]
pub fn transfer(state: State<'_, DbState>, input: CreateTransfer) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::transfer_between_accounts(&db, input)
}

// ── Profile & Aids ──

#[tauri::command]
pub fn get_profile(state: State<'_, DbState>) -> Result<UserProfile, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_profile(&db)
}

#[tauri::command]
pub fn save_profile(state: State<'_, DbState>, input: UpdateProfile) -> Result<UserProfile, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::save_profile(&db, input)
}

#[tauri::command]
pub fn check_eligibility(state: State<'_, DbState>) -> Result<Vec<AidResult>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let profile = crate::db::get_profile(&db)?;
    Ok(crate::aids::check_all_aids(&profile))
}

// ── Multi-month ──

#[tauri::command]
pub fn get_multi_month(state: State<'_, DbState>, count: u32) -> Result<Vec<MonthOverview>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_multi_month_overview(&db, count)
}

// ── Recurring ──

#[tauri::command]
pub fn get_recurring_rules(state: State<'_, DbState>) -> Result<Vec<RecurringRule>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_recurring_rules(&db)
}

#[tauri::command]
pub fn create_recurring_rule(state: State<'_, DbState>, input: CreateRecurringRule) -> Result<RecurringRule, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::insert_recurring_rule(&db, input)
}

#[tauri::command]
pub fn delete_recurring_rule(state: State<'_, DbState>, id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::delete_recurring_rule(&db, &id)
}

#[tauri::command]
pub fn toggle_recurring_rule(state: State<'_, DbState>, id: String, active: bool) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::toggle_recurring_rule(&db, &id, active)
}

#[tauri::command]
pub fn apply_recurring(state: State<'_, DbState>) -> Result<u32, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::apply_due_recurring(&db)
}

// ── Budget Alerts ──

#[tauri::command]
pub fn get_budget_alerts(state: State<'_, DbState>, year: i32, month: u32) -> Result<Vec<BudgetAlert>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_budget_alerts(&db, year, month)
}

// ── Export ──

#[tauri::command]
pub fn export_csv(state: State<'_, DbState>, filters: TransactionFilters) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::export_transactions_csv(&db, filters)
}

// ── Backup ──

#[tauri::command]
pub fn get_db_path(state: State<'_, DbState>) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::get_db_path(&db)
}

#[tauri::command]
pub fn backup_db(state: State<'_, DbState>, dest: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let src = crate::db::get_db_path(&db)?;
    std::fs::copy(&src, &dest).map_err(|e| format!("Échec de la sauvegarde: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn restore_db(state: State<'_, DbState>, src: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let dest = crate::db::get_db_path(&db)?;
    drop(db);
    std::fs::copy(&src, &dest).map_err(|e| format!("Échec de la restauration: {}", e))?;
    Ok(())
}

// ── Settings ──

#[tauri::command]
pub fn get_settings(state: State<'_, DbState>) -> Result<SettingsMap, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    Ok(SettingsMap {
        ollama_url: {
            let v = crate::db::get_setting(&db, "ollama_url");
            if v.is_empty() { "http://localhost:11434".into() } else { v }
        },
        ollama_model: {
            let v = crate::db::get_setting(&db, "ollama_model");
            if v.is_empty() { "mistral".into() } else { v }
        },
    })
}

#[tauri::command]
pub fn save_settings(state: State<'_, DbState>, ollama_url: String, ollama_model: String) -> Result<SettingsMap, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::db::set_setting(&db, "ollama_url", &ollama_url)?;
    crate::db::set_setting(&db, "ollama_model", &ollama_model)?;
    Ok(SettingsMap { ollama_url, ollama_model })
}

// ── AI ──

#[tauri::command]
pub async fn check_ollama(state: State<'_, DbState>) -> Result<OllamaStatus, String> {
    let (url, model) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let url = { let v = crate::db::get_setting(&db, "ollama_url"); if v.is_empty() { "http://localhost:11434".into() } else { v } };
        let model = { let v = crate::db::get_setting(&db, "ollama_model"); if v.is_empty() { "mistral".into() } else { v } };
        (url, model)
    };

    let connected = crate::ai::check_status(&url).await.unwrap_or(false);
    let available_models = if connected {
        crate::ai::list_models(&url).await
            .unwrap_or_default()
            .into_iter()
            .map(|m| m.name)
            .collect()
    } else {
        vec![]
    };

    Ok(OllamaStatus { connected, url, model, available_models })
}

#[tauri::command]
pub async fn ai_categorize(state: State<'_, DbState>, description: String) -> Result<String, String> {
    let (url, model, categories) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let url = { let v = crate::db::get_setting(&db, "ollama_url"); if v.is_empty() { "http://localhost:11434".into() } else { v } };
        let model = { let v = crate::db::get_setting(&db, "ollama_model"); if v.is_empty() { "mistral".into() } else { v } };
        let cats = crate::db::get_all_categories(&db)?
            .into_iter()
            .filter(|c| c.category_type == "expense")
            .map(|c| (c.id, c.name))
            .collect::<Vec<_>>();
        (url, model, cats)
    };

    crate::ai::categorize(&url, &model, &description, &categories).await
}

#[tauri::command]
pub async fn ai_chat(state: State<'_, DbState>, messages: Vec<ChatMessageDto>) -> Result<String, String> {
    let (url, model, context) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let url = { let v = crate::db::get_setting(&db, "ollama_url"); if v.is_empty() { "http://localhost:11434".into() } else { v } };
        let model = { let v = crate::db::get_setting(&db, "ollama_model"); if v.is_empty() { "mistral".into() } else { v } };
        let ctx = crate::db::gather_financial_context(&db)?;
        (url, model, ctx)
    };

    let chat_messages: Vec<crate::ai::ChatMessage> = messages
        .into_iter()
        .map(|m| crate::ai::ChatMessage { role: m.role, content: m.content })
        .collect();

    crate::ai::chat(&url, &model, chat_messages, &context).await
}

// ── Sync Config ──

#[tauri::command]
pub fn get_sync_config(app_dir: State<'_, AppDataDirState>) -> Result<SyncConfig, String> {
    let cfg = crate::config::load_config(&app_dir.path);
    Ok(SyncConfig {
        sync_dir: cfg.db_dir,
    })
}

#[tauri::command]
pub fn set_sync_folder(
    state: State<'_, DbState>,
    app_dir: State<'_, AppDataDirState>,
    folder: String,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;

    // Checkpoint WAL to flush all data into the main DB file
    db.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);").ok();

    let src = crate::db::get_db_path(&db)?;
    let dest_dir = std::path::Path::new(&folder);
    std::fs::create_dir_all(dest_dir).map_err(|e| format!("Impossible de créer le dossier: {}", e))?;
    let dest = dest_dir.join("economeyes.db");

    // Copy DB to new location (don't move — keep local copy as fallback)
    if src != dest.to_string_lossy() {
        std::fs::copy(&src, &dest).map_err(|e| format!("Échec de la copie: {}", e))?;
    }

    // Clean up WAL/SHM files from source (they won't be needed)
    let src_path = std::path::Path::new(&src);
    for ext in &["-wal", "-shm"] {
        let aux = src_path.with_extension(format!("db{}", ext));
        if aux.exists() {
            std::fs::remove_file(&aux).ok();
        }
    }

    // Save config
    let cfg = crate::config::AppConfig {
        db_dir: Some(folder.clone()),
    };
    crate::config::save_config(&app_dir.path, &cfg)?;

    Ok(format!("Base de données synchronisée vers {}. Redémarrez l'application pour appliquer.", folder))
}

#[tauri::command]
pub fn remove_sync_folder(
    state: State<'_, DbState>,
    app_dir: State<'_, AppDataDirState>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let src = crate::db::get_db_path(&db)?;

    // Checkpoint WAL
    db.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);").ok();

    // Copy current DB back to AppData
    let local_dest = app_dir.path.join("economeyes.db");
    if src != local_dest.to_string_lossy() {
        std::fs::copy(&src, &local_dest).map_err(|e| format!("Échec de la copie: {}", e))?;
    }

    // Clear config
    let cfg = crate::config::AppConfig { db_dir: None };
    crate::config::save_config(&app_dir.path, &cfg)?;

    Ok("Synchronisation désactivée. Redémarrez l'application pour appliquer.".into())
}
