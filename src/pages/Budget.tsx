import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { BudgetWithSpent, BudgetAlert, Category } from "@/lib/types";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function Budget() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  const load = () => {
    api.getBudgets(year, month).then(setBudgets).catch(console.error);
    api.getBudgetAlerts(year, month).then(setAlerts).catch(console.error);
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [year, month]);

  const prev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const next = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;

  const usedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter(
    (c) => c.categoryType === "expense" && !usedCategoryIds.has(c.id)
  );

  const openCreate = () => {
    setCategoryId(availableCategories[0]?.id || "");
    setAmount("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.upsertBudget({
      categoryId,
      year,
      month,
      amount: parseFloat(amount) || 0,
    });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await api.deleteBudget(id);
    load();
  };

  const handleAmountChange = async (b: BudgetWithSpent, newAmount: string) => {
    const parsed = parseFloat(newAmount);
    if (isNaN(parsed) || parsed <= 0) return;
    await api.upsertBudget({
      categoryId: b.categoryId,
      year: b.year,
      month: b.month,
      amount: parsed,
    });
    load();
  };

  return (
    <div className="space-y-6">
      {/* Budget alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm ${
                a.level === "critical"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              }`}
            >
              {a.level === "critical" ? <XCircle size={16} /> : <AlertTriangle size={16} />}
              <span className="font-medium">{a.categoryName}</span>
              <span className="text-xs opacity-80">
                {formatCurrency(a.spent)} / {formatCurrency(a.amount)} ({a.percent.toFixed(0)}%)
              </span>
              <span className="ml-auto text-xs">
                {a.level === "critical" ? "Budget dépassé" : "Attention : > 80%"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Month selector + summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prev} className="p-1.5 rounded hover:bg-panel-2 text-fg-2 hover:text-fg transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold w-40 text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={next} className="p-1.5 rounded hover:bg-panel-2 text-fg-2 hover:text-fg transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={openCreate}
          disabled={availableCategories.length === 0}
          className="flex items-center gap-2 bg-accent text-ground px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Ajouter un budget
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-edge bg-panel p-4">
          <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider mb-2">Budgété</div>
          <div className="text-xl font-semibold font-mono tabular-nums">{formatCurrency(totalBudgeted)}</div>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-4">
          <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider mb-2">Dépensé</div>
          <div className="text-xl font-semibold font-mono tabular-nums text-danger">{formatCurrency(totalSpent)}</div>
        </div>
        <div className="rounded-lg border border-edge bg-panel p-4">
          <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider mb-2">Restant</div>
          <div className={`text-xl font-semibold font-mono tabular-nums ${remaining >= 0 ? "text-positive" : "text-danger"}`}>
            {formatCurrency(remaining)}
          </div>
        </div>
      </div>

      {/* Budget rows */}
      {budgets.length === 0 ? (
        <div className="rounded-lg border border-edge bg-panel p-8 text-center">
          <p className="text-fg-2 text-sm">Aucun budget défini pour ce mois</p>
          <p className="text-fg-3 text-xs mt-1">Définis un budget par catégorie pour suivre tes dépenses</p>
        </div>
      ) : (
        <div className="rounded-lg border border-edge bg-panel divide-y divide-edge">
          {budgets.map((b) => {
            const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
            const over = b.spent > b.amount;
            return (
              <div key={b.id} className="p-4 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: b.categoryColor }}
                    />
                    <span className="text-sm font-medium">{b.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-mono tabular-nums ${over ? "text-danger" : "text-fg-2"}`}>
                      {formatCurrency(b.spent)}
                    </span>
                    <span className="text-fg-3 text-xs">/</span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      defaultValue={b.amount}
                      onBlur={(e) => handleAmountChange(b, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className="w-20 bg-transparent border-b border-edge text-sm font-mono tabular-nums text-right py-0.5 focus:outline-none focus:border-accent transition-colors"
                    />
                    <span className="text-fg-3 text-xs">€</span>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-panel-2 text-fg-3 hover:text-danger transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-panel-3">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-danger" : "bg-accent"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {over && (
                  <div className="text-[11px] text-danger mt-1">
                    Dépassement de {formatCurrency(b.spent - b.amount)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative bg-panel border border-edge rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-semibold mb-5">Nouveau budget</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Catégorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Montant mensuel (€)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="ex: 200"
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg font-mono focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded text-sm font-medium text-fg-2 hover:text-fg hover:bg-panel-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-accent text-ground px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
