use std::sync::Mutex;
use rusqlite::{Connection, params};
use chrono::Datelike;
use crate::models::*;

pub struct DbState {
    pub db: Mutex<Connection>,
}

pub fn init_db(db_dir: &std::path::Path, use_wal: bool) -> Connection {
    std::fs::create_dir_all(db_dir).expect("failed to create db dir");
    let db_path = db_dir.join("economeyes.db");
    let conn = Connection::open(&db_path).expect("failed to open database");

    let journal = if use_wal { "WAL" } else { "DELETE" };
    conn.execute_batch(&format!("PRAGMA journal_mode={}; PRAGMA foreign_keys=ON;", journal)).unwrap();
    create_tables(&conn);
    seed_categories(&conn);
    conn
}

fn create_tables(conn: &Connection) {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS accounts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            account_type TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'EUR',
            color TEXT,
            icon TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT,
            color TEXT,
            category_type TEXT NOT NULL,
            is_default INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            date TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_tx_account ON transactions(account_id);

        CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            amount REAL NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(category_id, year, month)
        );

        CREATE TABLE IF NOT EXISTS savings_goals (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL NOT NULL DEFAULT 0,
            deadline TEXT,
            color TEXT NOT NULL DEFAULT '#10b981',
            icon TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS savings_contributions (
            id TEXT PRIMARY KEY,
            goal_id TEXT NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_contributions_goal ON savings_contributions(goal_id);

        CREATE TABLE IF NOT EXISTS user_profile (
            id TEXT PRIMARY KEY DEFAULT 'main',
            birth_date TEXT,
            status TEXT NOT NULL DEFAULT 'etudiant',
            monthly_income REAL NOT NULL DEFAULT 0,
            household_type TEXT NOT NULL DEFAULT 'seul',
            dependents INTEGER NOT NULL DEFAULT 0,
            housing_type TEXT NOT NULL DEFAULT 'locataire',
            housing_zone TEXT NOT NULL DEFAULT 'zone_2',
            rent_amount REAL NOT NULL DEFAULT 0,
            is_student INTEGER NOT NULL DEFAULT 0,
            is_apprentice INTEGER NOT NULL DEFAULT 0,
            has_disability INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recurring_rules (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
            category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            frequency TEXT NOT NULL DEFAULT 'monthly',
            next_date TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        );"
    ).expect("failed to create tables");
}

fn seed_categories(conn: &Connection) {
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM categories WHERE is_default = 1", [], |r| r.get(0))
        .unwrap_or(0);
    if count > 0 {
        return;
    }

    let now = chrono::Utc::now().to_rfc3339();
    let defaults = [
        ("Loyer & charges", "Home", "#6366f1", "expense"),
        ("Courses", "ShoppingCart", "#f59e0b", "expense"),
        ("Transport", "Car", "#3b82f6", "expense"),
        ("Santé", "Heart", "#ef4444", "expense"),
        ("Loisirs", "Gamepad2", "#a855f7", "expense"),
        ("Shopping", "ShoppingBag", "#ec4899", "expense"),
        ("Abonnements", "Repeat", "#14b8a6", "expense"),
        ("Éducation", "GraduationCap", "#8b5cf6", "expense"),
        ("Autres dépenses", "MoreHorizontal", "#64748b", "expense"),
        ("Salaire", "Briefcase", "#22c55e", "income"),
        ("Aides & allocations", "HandCoins", "#06b6d4", "income"),
        ("Remboursements", "RotateCcw", "#84cc16", "income"),
        ("Autres revenus", "Plus", "#64748b", "income"),
    ];
    for (name, icon, color, cat_type) in defaults {
        conn.execute(
            "INSERT INTO categories (id, name, icon, color, category_type, is_default, created_at) VALUES (?1,?2,?3,?4,?5,1,?6)",
            params![uuid::Uuid::new_v4().to_string(), name, icon, color, cat_type, &now],
        ).ok();
    }
}

// ── Accounts ──

pub fn get_all_accounts(conn: &Connection) -> Result<Vec<Account>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, account_type, balance, currency, color, icon, created_at, updated_at FROM accounts ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let result = stmt.query_map([], |r| {
        Ok(Account {
            id: r.get(0)?, name: r.get(1)?, account_type: r.get(2)?,
            balance: r.get(3)?, currency: r.get(4)?, color: r.get(5)?,
            icon: r.get(6)?, created_at: r.get(7)?, updated_at: r.get(8)?,
        })
    }).map_err(|e| e.to_string())?
      .collect::<Result<Vec<_>, _>>()
      .map_err(|e| e.to_string());
    result
}

pub fn insert_account(conn: &Connection, input: CreateAccount) -> Result<Account, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let currency = input.currency.unwrap_or_else(|| "EUR".into());
    conn.execute(
        "INSERT INTO accounts (id,name,account_type,balance,currency,color,icon,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![id, input.name, input.account_type, input.balance, currency, input.color, input.icon, now, now],
    ).map_err(|e| e.to_string())?;
    Ok(Account { id, name: input.name, account_type: input.account_type, balance: input.balance, currency, color: input.color, icon: input.icon, created_at: now.clone(), updated_at: now })
}

pub fn update_account_in_db(conn: &Connection, id: &str, input: UpdateAccount) -> Result<Account, String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE accounts SET name=?1,account_type=?2,balance=?3,color=?4,icon=?5,updated_at=?6 WHERE id=?7",
        params![input.name, input.account_type, input.balance, input.color, input.icon, now, id],
    ).map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id,name,account_type,balance,currency,color,icon,created_at,updated_at FROM accounts WHERE id=?1",
        params![id],
        |r| Ok(Account {
            id: r.get(0)?, name: r.get(1)?, account_type: r.get(2)?,
            balance: r.get(3)?, currency: r.get(4)?, color: r.get(5)?,
            icon: r.get(6)?, created_at: r.get(7)?, updated_at: r.get(8)?,
        }),
    ).map_err(|e| e.to_string())
}

pub fn delete_account_from_db(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM accounts WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Transactions ──

const TX_SELECT: &str =
    "SELECT t.id,t.account_id,t.category_id,t.amount,t.description,t.date,t.transaction_type,t.notes,t.created_at,t.updated_at,\
     c.name,c.icon,c.color,a.name \
     FROM transactions t LEFT JOIN categories c ON t.category_id=c.id LEFT JOIN accounts a ON t.account_id=a.id";

fn row_to_tx(r: &rusqlite::Row) -> rusqlite::Result<TransactionWithCategory> {
    Ok(TransactionWithCategory {
        id: r.get(0)?, account_id: r.get(1)?, category_id: r.get(2)?,
        amount: r.get(3)?, description: r.get(4)?, date: r.get(5)?,
        transaction_type: r.get(6)?, notes: r.get(7)?, created_at: r.get(8)?,
        updated_at: r.get(9)?, category_name: r.get(10)?, category_icon: r.get(11)?,
        category_color: r.get(12)?, account_name: r.get(13)?,
    })
}

pub fn get_transactions_filtered(conn: &Connection, f: TransactionFilters) -> Result<Vec<TransactionWithCategory>, String> {
    let search_pattern = f.search.as_ref().map(|s| format!("%{}%", s));
    let sql = format!(
        "{} WHERE (?1 IS NULL OR t.account_id=?1) AND (?2 IS NULL OR t.date>=?2) AND (?3 IS NULL OR t.date<=?3) AND (?4 IS NULL OR t.transaction_type=?4) AND (?5 IS NULL OR t.description LIKE ?5) ORDER BY t.date DESC, t.created_at DESC LIMIT 200",
        TX_SELECT
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let result = stmt.query_map(params![f.account_id, f.from_date, f.to_date, f.transaction_type, search_pattern], row_to_tx)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string());
    result
}

pub fn insert_transaction(conn: &Connection, input: CreateTransaction) -> Result<TransactionWithCategory, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO transactions (id,account_id,category_id,amount,description,date,transaction_type,notes,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
        params![id, input.account_id, input.category_id, input.amount, input.description, input.date, input.transaction_type, input.notes, now, now],
    ).map_err(|e| e.to_string())?;

    let balance_delta = if input.transaction_type == "expense" { -input.amount.abs() } else { input.amount.abs() };
    conn.execute(
        "UPDATE accounts SET balance=balance+?1, updated_at=?2 WHERE id=?3",
        params![balance_delta, now, input.account_id],
    ).map_err(|e| e.to_string())?;

    let sql = format!("{} WHERE t.id=?1", TX_SELECT);
    conn.query_row(&sql, params![id], row_to_tx).map_err(|e| e.to_string())
}

pub fn delete_transaction_from_db(conn: &Connection, id: &str) -> Result<(), String> {
    let (account_id, amount, tx_type): (String, f64, String) = conn
        .query_row("SELECT account_id,amount,transaction_type FROM transactions WHERE id=?1", params![id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .map_err(|e| e.to_string())?;

    let reversal = if tx_type == "expense" { amount.abs() } else { -amount.abs() };
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute("DELETE FROM transactions WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("UPDATE accounts SET balance=balance+?1, updated_at=?2 WHERE id=?3", params![reversal, now, account_id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Transfers ──

pub fn transfer_between_accounts(conn: &Connection, input: CreateTransfer) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    let amount = input.amount.abs();

    let id_out = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO transactions (id,account_id,category_id,amount,description,date,transaction_type,notes,created_at,updated_at) VALUES (?1,?2,NULL,?3,?4,?5,'expense','Virement entre comptes',?6,?7)",
        params![id_out, input.from_account_id, amount, input.description, input.date, now, now],
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE accounts SET balance=balance-?1, updated_at=?2 WHERE id=?3",
        params![amount, now, input.from_account_id],
    ).map_err(|e| e.to_string())?;

    let id_in = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO transactions (id,account_id,category_id,amount,description,date,transaction_type,notes,created_at,updated_at) VALUES (?1,?2,NULL,?3,?4,?5,'income','Virement entre comptes',?6,?7)",
        params![id_in, input.to_account_id, amount, input.description, input.date, now, now],
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE accounts SET balance=balance+?1, updated_at=?2 WHERE id=?3",
        params![amount, now, input.to_account_id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

// ── Categories ──

pub fn get_all_categories(conn: &Connection) -> Result<Vec<Category>, String> {
    let mut stmt = conn
        .prepare("SELECT id,name,icon,color,category_type,is_default,created_at FROM categories ORDER BY category_type, name")
        .map_err(|e| e.to_string())?;
    let result = stmt.query_map([], |r| {
        Ok(Category {
            id: r.get(0)?, name: r.get(1)?, icon: r.get(2)?, color: r.get(3)?,
            category_type: r.get(4)?, is_default: r.get(5)?, created_at: r.get(6)?,
        })
    }).map_err(|e| e.to_string())?
      .collect::<Result<Vec<_>, _>>()
      .map_err(|e| e.to_string());
    result
}

// ── Monthly summary ──

pub fn get_monthly_summary_data(conn: &Connection, year: i32, month: u32) -> Result<MonthlySummary, String> {
    let from = format!("{:04}-{:02}-01", year, month);
    let to = if month == 12 { format!("{:04}-01-01", year + 1) } else { format!("{:04}-{:02}-01", year, month + 1) };

    let total_income: f64 = conn
        .query_row("SELECT COALESCE(SUM(ABS(amount)),0) FROM transactions WHERE date>=?1 AND date<?2 AND transaction_type='income'", params![from, to], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    let total_expenses: f64 = conn
        .query_row("SELECT COALESCE(SUM(ABS(amount)),0) FROM transactions WHERE date>=?1 AND date<?2 AND transaction_type='expense'", params![from, to], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let by_category = {
        let mut stmt = conn.prepare(
            "SELECT COALESCE(c.name,'Non catégorisé'), COALESCE(c.color,'#64748b'), COALESCE(c.icon,'HelpCircle'), COALESCE(SUM(ABS(t.amount)),0) \
             FROM transactions t LEFT JOIN categories c ON t.category_id=c.id \
             WHERE t.date>=?1 AND t.date<?2 AND t.transaction_type='expense' GROUP BY t.category_id ORDER BY SUM(ABS(t.amount)) DESC"
        ).map_err(|e| e.to_string())?;
        let result = stmt.query_map(params![from, to], |r| {
            Ok(CategorySummary { name: r.get(0)?, color: r.get(1)?, icon: r.get(2)?, amount: r.get(3)? })
        }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string());
        result
    }?;

    let daily = {
        let mut stmt = conn.prepare(
            "SELECT date, SUM(CASE WHEN transaction_type='expense' THEN ABS(amount) ELSE 0 END), SUM(CASE WHEN transaction_type='income' THEN ABS(amount) ELSE 0 END) \
             FROM transactions WHERE date>=?1 AND date<?2 GROUP BY date ORDER BY date"
        ).map_err(|e| e.to_string())?;
        let result = stmt.query_map(params![from, to], |r| {
            Ok(DailySummary { date: r.get(0)?, expenses: r.get(1)?, income: r.get(2)? })
        }).map_err(|e| e.to_string())?.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string());
        result
    }?;

    Ok(MonthlySummary { total_income, total_expenses, balance: total_income - total_expenses, by_category, daily })
}

// ── Budgets ──

pub fn get_budgets_for_month(conn: &Connection, year: i32, month: u32) -> Result<Vec<BudgetWithSpent>, String> {
    let from = format!("{:04}-{:02}-01", year, month);
    let to = if month == 12 { format!("{:04}-01-01", year + 1) } else { format!("{:04}-{:02}-01", year, month + 1) };

    let mut stmt = conn.prepare(
        "SELECT b.id, b.category_id, c.name, COALESCE(c.icon,'HelpCircle'), COALESCE(c.color,'#64748b'), b.year, b.month, b.amount, \
         COALESCE((SELECT SUM(ABS(t.amount)) FROM transactions t WHERE t.category_id=b.category_id AND t.date>=?1 AND t.date<?2 AND t.transaction_type='expense'),0) \
         FROM budgets b JOIN categories c ON b.category_id=c.id WHERE b.year=?3 AND b.month=?4 ORDER BY b.amount DESC"
    ).map_err(|e| e.to_string())?;

    let result = stmt.query_map(params![from, to, year, month], |r| {
        Ok(BudgetWithSpent {
            id: r.get(0)?, category_id: r.get(1)?, category_name: r.get(2)?,
            category_icon: r.get(3)?, category_color: r.get(4)?,
            year: r.get(5)?, month: r.get(6)?, amount: r.get(7)?, spent: r.get(8)?,
        })
    }).map_err(|e| e.to_string())?
      .collect::<Result<Vec<_>, _>>()
      .map_err(|e| e.to_string());
    result
}

pub fn upsert_budget(conn: &Connection, input: UpsertBudget) -> Result<BudgetWithSpent, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO budgets (id, category_id, year, month, amount, created_at, updated_at) \
         VALUES (?1,?2,?3,?4,?5,?6,?7) \
         ON CONFLICT(category_id, year, month) DO UPDATE SET amount=?5, updated_at=?7",
        params![id, input.category_id, input.year, input.month, input.amount, now, now],
    ).map_err(|e| e.to_string())?;

    let budgets = get_budgets_for_month(conn, input.year, input.month)?;
    budgets.into_iter()
        .find(|b| b.category_id == input.category_id)
        .ok_or_else(|| "Budget not found after upsert".to_string())
}

pub fn delete_budget_from_db(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM budgets WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── Savings Goals ──

pub fn get_all_savings_goals(conn: &Connection) -> Result<Vec<SavingsGoal>, String> {
    let mut stmt = conn
        .prepare("SELECT id,name,target_amount,current_amount,deadline,color,icon,created_at,updated_at FROM savings_goals ORDER BY created_at")
        .map_err(|e| e.to_string())?;
    let result = stmt.query_map([], |r| {
        Ok(SavingsGoal {
            id: r.get(0)?, name: r.get(1)?, target_amount: r.get(2)?,
            current_amount: r.get(3)?, deadline: r.get(4)?, color: r.get(5)?,
            icon: r.get(6)?, created_at: r.get(7)?, updated_at: r.get(8)?,
        })
    }).map_err(|e| e.to_string())?
      .collect::<Result<Vec<_>, _>>()
      .map_err(|e| e.to_string());
    result
}

pub fn insert_savings_goal(conn: &Connection, input: CreateSavingsGoal) -> Result<SavingsGoal, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let color = input.color.unwrap_or_else(|| "#10b981".into());
    let current = input.current_amount.unwrap_or(0.0);
    conn.execute(
        "INSERT INTO savings_goals (id,name,target_amount,current_amount,deadline,color,icon,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![id, input.name, input.target_amount, current, input.deadline, color, input.icon, now, now],
    ).map_err(|e| e.to_string())?;
    Ok(SavingsGoal { id, name: input.name, target_amount: input.target_amount, current_amount: current, deadline: input.deadline, color, icon: input.icon, created_at: now.clone(), updated_at: now })
}

pub fn update_savings_goal_in_db(conn: &Connection, id: &str, input: UpdateSavingsGoal) -> Result<SavingsGoal, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let color = input.color.unwrap_or_else(|| "#10b981".into());
    conn.execute(
        "UPDATE savings_goals SET name=?1,target_amount=?2,deadline=?3,color=?4,icon=?5,updated_at=?6 WHERE id=?7",
        params![input.name, input.target_amount, input.deadline, color, input.icon, now, id],
    ).map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id,name,target_amount,current_amount,deadline,color,icon,created_at,updated_at FROM savings_goals WHERE id=?1",
        params![id],
        |r| Ok(SavingsGoal {
            id: r.get(0)?, name: r.get(1)?, target_amount: r.get(2)?,
            current_amount: r.get(3)?, deadline: r.get(4)?, color: r.get(5)?,
            icon: r.get(6)?, created_at: r.get(7)?, updated_at: r.get(8)?,
        }),
    ).map_err(|e| e.to_string())
}

pub fn delete_savings_goal_from_db(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM savings_goals WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn add_contribution_to_goal(conn: &Connection, input: CreateContribution) -> Result<SavingsContribution, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO savings_contributions (id,goal_id,amount,date,notes,created_at) VALUES (?1,?2,?3,?4,?5,?6)",
        params![id, input.goal_id, input.amount, input.date, input.notes, now],
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE savings_goals SET current_amount=current_amount+?1, updated_at=?2 WHERE id=?3",
        params![input.amount, now, input.goal_id],
    ).map_err(|e| e.to_string())?;
    Ok(SavingsContribution { id, goal_id: input.goal_id, amount: input.amount, date: input.date, notes: input.notes, created_at: now })
}

pub fn get_contributions_for_goal(conn: &Connection, goal_id: &str) -> Result<Vec<SavingsContribution>, String> {
    let mut stmt = conn
        .prepare("SELECT id,goal_id,amount,date,notes,created_at FROM savings_contributions WHERE goal_id=?1 ORDER BY date DESC, created_at DESC")
        .map_err(|e| e.to_string())?;
    let result = stmt.query_map(params![goal_id], |r| {
        Ok(SavingsContribution {
            id: r.get(0)?, goal_id: r.get(1)?, amount: r.get(2)?,
            date: r.get(3)?, notes: r.get(4)?, created_at: r.get(5)?,
        })
    }).map_err(|e| e.to_string())?
      .collect::<Result<Vec<_>, _>>()
      .map_err(|e| e.to_string());
    result
}

pub fn delete_contribution_from_db(conn: &Connection, id: &str) -> Result<(), String> {
    let (goal_id, amount): (String, f64) = conn
        .query_row("SELECT goal_id,amount FROM savings_contributions WHERE id=?1", params![id], |r| Ok((r.get(0)?, r.get(1)?)))
        .map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute("DELETE FROM savings_contributions WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    conn.execute("UPDATE savings_goals SET current_amount=current_amount-?1, updated_at=?2 WHERE id=?3", params![amount, now, goal_id]).map_err(|e| e.to_string())?;
    Ok(())
}

// ── User Profile ──

pub fn get_profile(conn: &Connection) -> Result<UserProfile, String> {
    conn.query_row(
        "SELECT id,birth_date,status,monthly_income,household_type,dependents,housing_type,housing_zone,rent_amount,is_student,is_apprentice,has_disability,updated_at FROM user_profile WHERE id='main'",
        [],
        |r| Ok(UserProfile {
            id: r.get(0)?, birth_date: r.get(1)?, status: r.get(2)?,
            monthly_income: r.get(3)?, household_type: r.get(4)?, dependents: r.get(5)?,
            housing_type: r.get(6)?, housing_zone: r.get(7)?, rent_amount: r.get(8)?,
            is_student: r.get(9)?, is_apprentice: r.get(10)?, has_disability: r.get(11)?,
            updated_at: r.get(12)?,
        }),
    ).or_else(|_| {
        let now = chrono::Utc::now().to_rfc3339();
        Ok(UserProfile {
            id: "main".into(), birth_date: None, status: "etudiant".into(),
            monthly_income: 0.0, household_type: "seul".into(), dependents: 0,
            housing_type: "locataire".into(), housing_zone: "zone_2".into(),
            rent_amount: 0.0, is_student: true, is_apprentice: false,
            has_disability: false, updated_at: now,
        })
    })
}

pub fn save_profile(conn: &Connection, input: UpdateProfile) -> Result<UserProfile, String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO user_profile (id,birth_date,status,monthly_income,household_type,dependents,housing_type,housing_zone,rent_amount,is_student,is_apprentice,has_disability,updated_at) \
         VALUES ('main',?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12) \
         ON CONFLICT(id) DO UPDATE SET birth_date=?1,status=?2,monthly_income=?3,household_type=?4,dependents=?5,housing_type=?6,housing_zone=?7,rent_amount=?8,is_student=?9,is_apprentice=?10,has_disability=?11,updated_at=?12",
        params![input.birth_date, input.status, input.monthly_income, input.household_type, input.dependents, input.housing_type, input.housing_zone, input.rent_amount, input.is_student, input.is_apprentice, input.has_disability, now],
    ).map_err(|e| e.to_string())?;
    get_profile(conn)
}

// ── Settings ──

pub fn get_setting(conn: &Connection, key: &str) -> String {
    conn.query_row("SELECT value FROM settings WHERE key=?1", params![key], |r| r.get(0))
        .unwrap_or_default()
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?2",
        params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_all_settings(conn: &Connection) -> Result<Vec<(String, String)>, String> {
    let mut stmt = conn.prepare("SELECT key, value FROM settings ORDER BY key")
        .map_err(|e| e.to_string())?;
    let result = stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?)))
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string());
    result
}

pub fn gather_financial_context(conn: &Connection) -> Result<String, String> {
    let now = chrono::Utc::now();
    let year = now.format("%Y").to_string().parse::<i32>().unwrap_or(2026);
    let month = now.format("%m").to_string().parse::<u32>().unwrap_or(1);

    let accounts = get_all_accounts(conn)?;
    let total_balance: f64 = accounts.iter().map(|a| a.balance).sum();
    let accounts_str = accounts.iter()
        .map(|a| format!("  - {} ({}): {:.2}€", a.name, a.account_type, a.balance))
        .collect::<Vec<_>>().join("\n");

    let summary = get_monthly_summary_data(conn, year, month)?;

    let budgets = get_budgets_for_month(conn, year, month)?;
    let budgets_str = if budgets.is_empty() {
        "  Aucun budget défini".into()
    } else {
        budgets.iter()
            .map(|b| {
                let status = if b.spent > b.amount { "DÉPASSÉ" } else { "OK" };
                format!("  - {}: {:.0}€ / {:.0}€ ({})", b.category_name, b.spent, b.amount, status)
            })
            .collect::<Vec<_>>().join("\n")
    };

    let goals = get_all_savings_goals(conn)?;
    let goals_str = if goals.is_empty() {
        "  Aucun objectif".into()
    } else {
        goals.iter()
            .map(|g| format!("  - {}: {:.0}€ / {:.0}€ ({:.0}%)", g.name, g.current_amount, g.target_amount, if g.target_amount > 0.0 { g.current_amount / g.target_amount * 100.0 } else { 0.0 }))
            .collect::<Vec<_>>().join("\n")
    };

    Ok(format!(
        "COMPTES (solde total: {:.2}€):\n{}\n\nCE MOIS ({:02}/{}):\n  Revenus: {:.2}€\n  Dépenses: {:.2}€\n  Balance: {:.2}€\n\nBUDGETS:\n{}\n\nÉPARGNE:\n{}",
        total_balance, accounts_str, month, year,
        summary.total_income, summary.total_expenses, summary.balance,
        budgets_str, goals_str
    ))
}

// ── Multi-month Overview ──

pub fn get_multi_month_overview(conn: &Connection, count: u32) -> Result<Vec<MonthOverview>, String> {
    let now = chrono::Utc::now();
    let mut result = Vec::new();
    let months_fr = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

    for i in (0..count).rev() {
        let d = now - chrono::Duration::days(i as i64 * 30);
        let y: i32 = d.format("%Y").to_string().parse().unwrap_or(2026);
        let m: u32 = d.format("%m").to_string().parse().unwrap_or(1);
        let from = format!("{:04}-{:02}-01", y, m);
        let to = if m == 12 { format!("{:04}-01-01", y + 1) } else { format!("{:04}-{:02}-01", y, m + 1) };

        let income: f64 = conn.query_row(
            "SELECT COALESCE(SUM(ABS(amount)),0) FROM transactions WHERE date>=?1 AND date<?2 AND transaction_type='income'",
            params![from, to], |r| r.get(0),
        ).unwrap_or(0.0);
        let expenses: f64 = conn.query_row(
            "SELECT COALESCE(SUM(ABS(amount)),0) FROM transactions WHERE date>=?1 AND date<?2 AND transaction_type='expense'",
            params![from, to], |r| r.get(0),
        ).unwrap_or(0.0);

        let label = format!("{} {}", months_fr[m as usize], y % 100);
        result.push(MonthOverview { label, income, expenses });
    }
    Ok(result)
}

// ── Recurring Rules ──

pub fn get_recurring_rules(conn: &Connection) -> Result<Vec<RecurringRule>, String> {
    let mut stmt = conn.prepare(
        "SELECT id,account_id,category_id,amount,description,transaction_type,frequency,next_date,is_active,created_at FROM recurring_rules ORDER BY next_date"
    ).map_err(|e| e.to_string())?;
    let result = stmt.query_map([], |r| {
        Ok(RecurringRule {
            id: r.get(0)?, account_id: r.get(1)?, category_id: r.get(2)?,
            amount: r.get(3)?, description: r.get(4)?, transaction_type: r.get(5)?,
            frequency: r.get(6)?, next_date: r.get(7)?, is_active: r.get(8)?,
            created_at: r.get(9)?,
        })
    }).map_err(|e| e.to_string())?
      .collect::<Result<Vec<_>, _>>()
      .map_err(|e| e.to_string());
    result
}

pub fn insert_recurring_rule(conn: &Connection, input: CreateRecurringRule) -> Result<RecurringRule, String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO recurring_rules (id,account_id,category_id,amount,description,transaction_type,frequency,next_date,is_active,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,1,?9)",
        params![id, input.account_id, input.category_id, input.amount, input.description, input.transaction_type, input.frequency, input.next_date, now],
    ).map_err(|e| e.to_string())?;
    Ok(RecurringRule {
        id, account_id: input.account_id, category_id: input.category_id,
        amount: input.amount, description: input.description, transaction_type: input.transaction_type,
        frequency: input.frequency, next_date: input.next_date, is_active: true, created_at: now,
    })
}

pub fn delete_recurring_rule(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM recurring_rules WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn toggle_recurring_rule(conn: &Connection, id: &str, active: bool) -> Result<(), String> {
    conn.execute("UPDATE recurring_rules SET is_active=?1 WHERE id=?2", params![active, id]).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn apply_due_recurring(conn: &Connection) -> Result<u32, String> {
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let rules = get_recurring_rules(conn)?;
    let mut applied = 0u32;

    for rule in rules.iter().filter(|r| r.is_active && r.next_date <= today) {
        let tx = CreateTransaction {
            account_id: rule.account_id.clone(),
            category_id: rule.category_id.clone(),
            amount: rule.amount,
            description: rule.description.clone(),
            date: rule.next_date.clone(),
            transaction_type: rule.transaction_type.clone(),
            notes: Some("Transaction récurrente auto".into()),
        };
        insert_transaction(conn, tx)?;

        let next = advance_date(&rule.next_date, &rule.frequency);
        conn.execute("UPDATE recurring_rules SET next_date=?1 WHERE id=?2", params![next, rule.id])
            .map_err(|e| e.to_string())?;
        applied += 1;
    }
    Ok(applied)
}

fn advance_date(date_str: &str, frequency: &str) -> String {
    let parts: Vec<&str> = date_str.split('-').collect();
    if parts.len() != 3 { return date_str.to_string(); }
    let y: i32 = parts[0].parse().unwrap_or(2026);
    let m: u32 = parts[1].parse().unwrap_or(1);
    let d: u32 = parts[2].parse().unwrap_or(1);

    match frequency {
        "weekly" => {
            if let Some(dt) = chrono::NaiveDate::from_ymd_opt(y, m, d) {
                return (dt + chrono::Duration::days(7)).format("%Y-%m-%d").to_string();
            }
        }
        "monthly" => {
            let (ny, nm) = if m == 12 { (y + 1, 1u32) } else { (y, m + 1) };
            let max_d = chrono::NaiveDate::from_ymd_opt(ny, nm + 1, 1)
                .or_else(|| chrono::NaiveDate::from_ymd_opt(ny + 1, 1, 1))
                .map(|dt| dt.pred_opt().map(|p| p.day()).unwrap_or(28))
                .unwrap_or(28);
            return format!("{:04}-{:02}-{:02}", ny, nm, d.min(max_d));
        }
        "yearly" => {
            return format!("{:04}-{:02}-{:02}", y + 1, m, d);
        }
        _ => {}
    }
    date_str.to_string()
}

// ── Budget Alerts ──

pub fn get_budget_alerts(conn: &Connection, year: i32, month: u32) -> Result<Vec<BudgetAlert>, String> {
    let budgets = get_budgets_for_month(conn, year, month)?;
    Ok(budgets.into_iter().filter_map(|b| {
        if b.amount <= 0.0 { return None; }
        let pct = b.spent / b.amount * 100.0;
        if pct >= 80.0 {
            Some(BudgetAlert {
                category_name: b.category_name,
                category_color: b.category_color,
                amount: b.amount,
                spent: b.spent,
                percent: pct,
                level: if pct >= 100.0 { "critical".into() } else { "warning".into() },
            })
        } else {
            None
        }
    }).collect())
}

// ── Export CSV ──

pub fn export_transactions_csv(conn: &Connection, f: TransactionFilters) -> Result<String, String> {
    let txs = get_transactions_filtered(conn, f)?;
    let mut csv = String::from("Date;Description;Catégorie;Compte;Type;Montant;Notes\n");
    for t in &txs {
        csv.push_str(&format!(
            "{};{};{};{};{};{:.2};{}\n",
            t.date,
            t.description.replace(';', ","),
            t.category_name.as_deref().unwrap_or(""),
            t.account_name.as_deref().unwrap_or(""),
            if t.transaction_type == "expense" { "Dépense" } else { "Revenu" },
            if t.transaction_type == "expense" { -t.amount.abs() } else { t.amount.abs() },
            t.notes.as_deref().unwrap_or("").replace(';', ","),
        ));
    }
    Ok(csv)
}

// ── Backup ──

pub fn get_db_path(conn: &Connection) -> Result<String, String> {
    let path: String = conn.query_row("PRAGMA database_list", [], |r| r.get::<_, String>(2))
        .map_err(|e| e.to_string())?;
    Ok(path)
}
