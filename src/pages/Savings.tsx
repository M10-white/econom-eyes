import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, PiggyBank, Target, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import type { SavingsGoal, SavingsContribution } from "@/lib/types";

const GOAL_COLORS = [
  "#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ec4899",
  "#06b6d4", "#ef4444", "#84cc16",
];

export default function Savings() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [showContribForm, setShowContribForm] = useState<string | null>(null);
  const [contributions, setContributions] = useState<Record<string, SavingsContribution[]>>({});
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(GOAL_COLORS[0]);

  const [contribAmount, setContribAmount] = useState("");
  const [contribDate, setContribDate] = useState(todayISO());
  const [contribNotes, setContribNotes] = useState("");

  const load = () => {
    api.getSavingsGoals().then(setGoals).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);

  const openCreate = () => {
    setEditingGoal(null);
    setName("");
    setTargetAmount("");
    setDeadline("");
    setColor(GOAL_COLORS[0]);
    setShowGoalForm(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setDeadline(g.deadline || "");
    setColor(g.color);
    setShowGoalForm(true);
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      await api.updateSavingsGoal(editingGoal.id, {
        name,
        targetAmount: parseFloat(targetAmount) || 0,
        deadline: deadline || undefined,
        color,
      });
    } else {
      await api.createSavingsGoal({
        name,
        targetAmount: parseFloat(targetAmount) || 0,
        deadline: deadline || undefined,
        color,
      });
    }
    setShowGoalForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await api.deleteSavingsGoal(id);
    load();
  };

  const openContrib = (goalId: string) => {
    setContribAmount("");
    setContribDate(todayISO());
    setContribNotes("");
    setShowContribForm(goalId);
  };

  const handleContribSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showContribForm) return;
    await api.addContribution({
      goalId: showContribForm,
      amount: parseFloat(contribAmount) || 0,
      date: contribDate,
      notes: contribNotes || undefined,
    });
    setShowContribForm(null);
    load();
    if (expandedGoal) loadContributions(expandedGoal);
  };

  const loadContributions = async (goalId: string) => {
    const contribs = await api.getContributions(goalId);
    setContributions((prev) => ({ ...prev, [goalId]: contribs }));
  };

  const toggleExpand = (goalId: string) => {
    if (expandedGoal === goalId) {
      setExpandedGoal(null);
    } else {
      setExpandedGoal(goalId);
      loadContributions(goalId);
    }
  };

  const handleDeleteContrib = async (id: string, goalId: string) => {
    await api.deleteContribution(id);
    load();
    loadContributions(goalId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider">Épargne totale</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold font-mono tabular-nums">{formatCurrency(totalSaved)}</span>
            {totalTarget > 0 && (
              <span className="text-sm text-fg-3 font-mono">/ {formatCurrency(totalTarget)}</span>
            )}
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-accent text-ground px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus size={16} /> Nouvel objectif
        </button>
      </div>

      {/* Goals */}
      {goals.length === 0 ? (
        <div className="rounded-lg border border-edge bg-panel p-8 text-center">
          <PiggyBank size={32} className="mx-auto text-fg-3 mb-3" />
          <p className="text-fg-2 text-sm">Aucun objectif d'épargne</p>
          <p className="text-fg-3 text-xs mt-1">Définis un objectif pour commencer à épargner</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
            const isExpanded = expandedGoal === goal.id;
            const goalContribs = contributions[goal.id] || [];

            return (
              <div key={goal.id} className="rounded-lg border border-edge bg-panel overflow-hidden">
                <div className="p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: goal.color + "1a" }}
                      >
                        <Target size={18} style={{ color: goal.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{goal.name}</div>
                        {goal.deadline && (
                          <div className="flex items-center gap-1 text-[11px] text-fg-3 mt-0.5">
                            <Calendar size={10} />
                            {formatDate(goal.deadline)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openContrib(goal.id)}
                        className="px-2 py-1 rounded text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        + Verser
                      </button>
                      <button
                        onClick={() => openEdit(goal)}
                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-panel-2 text-fg-3 hover:text-fg transition-all"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-panel-2 text-fg-3 hover:text-danger transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 rounded-full bg-panel-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: goal.color }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums text-fg-2 w-12 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-mono tabular-nums" style={{ color: goal.color }}>
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-xs text-fg-3 font-mono">
                      objectif {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Toggle history */}
                  <button
                    onClick={() => toggleExpand(goal.id)}
                    className="text-[11px] text-fg-3 hover:text-fg-2 mt-2 transition-colors"
                  >
                    {isExpanded ? "Masquer l'historique" : "Voir l'historique"}
                  </button>
                </div>

                {/* Contributions history */}
                {isExpanded && (
                  <div className="border-t border-edge bg-ground/50 px-5 py-3">
                    {goalContribs.length === 0 ? (
                      <p className="text-xs text-fg-3 text-center py-2">Aucun versement</p>
                    ) : (
                      <div className="space-y-1.5">
                        {goalContribs.map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-xs group/row">
                            <div className="flex items-center gap-2">
                              <span className="text-fg-2 font-mono tabular-nums">{formatDate(c.date)}</span>
                              {c.notes && <span className="text-fg-3">{c.notes}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono tabular-nums text-positive">+{formatCurrency(c.amount)}</span>
                              <button
                                onClick={() => handleDeleteContrib(c.id, goal.id)}
                                className="p-0.5 rounded opacity-0 group-hover/row:opacity-100 text-fg-3 hover:text-danger transition-all"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Goal form modal */}
      {showGoalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowGoalForm(false)} />
          <div className="relative bg-panel border border-edge rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-semibold mb-5">
              {editingGoal ? "Modifier l'objectif" : "Nouvel objectif"}
            </h2>
            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Nom</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ex: Fonds d'urgence"
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Objectif (€)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  placeholder="ex: 1000"
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg font-mono focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Échéance (optionnel)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1.5">Couleur</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        backgroundColor: c,
                        transform: color === c ? "scale(1.2)" : "scale(1)",
                        outline: color === c ? "2px solid white" : "none",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalForm(false)}
                  className="px-4 py-2 rounded text-sm font-medium text-fg-2 hover:text-fg hover:bg-panel-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-accent text-ground px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  {editingGoal ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution form modal */}
      {showContribForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowContribForm(null)} />
          <div className="relative bg-panel border border-edge rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-semibold mb-5">Nouveau versement</h2>
            <form onSubmit={handleContribSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  required
                  placeholder="ex: 50"
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg font-mono focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Date</label>
                <input
                  type="date"
                  value={contribDate}
                  onChange={(e) => setContribDate(e.target.value)}
                  required
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Notes (optionnel)</label>
                <input
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                  placeholder="ex: Virement mensuel"
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContribForm(null)}
                  className="px-4 py-2 rounded text-sm font-medium text-fg-2 hover:text-fg hover:bg-panel-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-accent text-ground px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors"
                >
                  Verser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
