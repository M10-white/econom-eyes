mod db;
mod models;
mod commands;
mod aids;
mod ai;
mod config;

use tauri::Manager;

pub struct AppDataDirState {
    pub path: std::path::PathBuf,
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            std::fs::create_dir_all(&data_dir).ok();

            let cfg = config::load_config(&data_dir);
            let db_dir = config::resolve_db_dir(&data_dir, &cfg);
            let use_wal = cfg.db_dir.is_none();

            let conn = db::init_db(&db_dir, use_wal);
            db::apply_due_recurring(&conn).ok();
            app.manage(db::DbState {
                db: std::sync::Mutex::new(conn),
            });
            app.manage(AppDataDirState {
                path: data_dir,
            });

            #[cfg(debug_assertions)]
            if let Some(w) = app.get_webview_window("main") {
                w.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_accounts,
            commands::create_account,
            commands::update_account,
            commands::delete_account,
            commands::get_transactions,
            commands::create_transaction,
            commands::delete_transaction,
            commands::transfer,
            commands::get_categories,
            commands::get_monthly_summary,
            commands::get_budgets,
            commands::upsert_budget,
            commands::delete_budget,
            commands::get_savings_goals,
            commands::create_savings_goal,
            commands::update_savings_goal,
            commands::delete_savings_goal,
            commands::add_contribution,
            commands::get_contributions,
            commands::delete_contribution,
            commands::get_profile,
            commands::save_profile,
            commands::check_eligibility,
            commands::get_multi_month,
            commands::get_recurring_rules,
            commands::create_recurring_rule,
            commands::delete_recurring_rule,
            commands::toggle_recurring_rule,
            commands::apply_recurring,
            commands::get_budget_alerts,
            commands::export_csv,
            commands::get_db_path,
            commands::backup_db,
            commands::restore_db,
            commands::get_settings,
            commands::save_settings,
            commands::check_ollama,
            commands::ai_categorize,
            commands::ai_chat,
            commands::get_sync_config,
            commands::set_sync_folder,
            commands::remove_sync_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
