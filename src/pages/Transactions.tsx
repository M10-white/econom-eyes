import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowDownLeft, ArrowUpRight, Search, Download, Sparkles, Loader2, Repeat, Power, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import type {
  Account, Category, TransactionWithCategory,
  CreateTransaction, TransactionFilters, RecurringRule, CreateRecurringRule,
} from "@/lib/types";

export default function Transactions() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [filterAccount, setFilterAccount] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categorizing, setCategorizing] = useState(false);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recDesc, setRecDesc] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recAccountId, setRecAccountId] = useState("");
  const [recCategoryId, setRecCategoryId] = useState("");
  const [recType, setRecType] = useState("expense");
  const [recFrequency, setRecFrequency] = useState("monthly");
  const [recNextDate, setRecNextDate] = useState(todayISO());

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [txType, setTxType] = useState("expense");
  const [notes, setNotes] = useState("");

  const loadTransactions = () => {
    const filters: TransactionFilters = {};
    if (filterAccount) filters.accountId = filterAccount;
    if (filterType) filters.transactionType = filterType;
    if (searchQuery) filters.search = searchQuery;
    api.getTransactions(filters).then(setTransactions).catch(console.error);
  };

  const loadRecurring = () => {
    api.getRecurringRules().then(setRecurringRules).catch(console.error);
  };

  useEffect(() => {
    api.getAccounts().then(setAccounts).catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
    loadRecurring();
  }, []);

  useEffect(() => { loadTransactions(); }, [filterAccount, filterType, searchQuery]);

  const openCreate = () => {
    setAmount("");
    setDescription("");
    setDate(todayISO());
    setAccountId(accounts[0]?.id || "");
    setCategoryId("");
    setTxType("expense");
    setNotes("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateTransaction = {
      accountId,
      categoryId: categoryId || undefined,
      amount: parseFloat(amount) || 0,
      description,
      date,
      transactionType: txType,
      notes: notes || undefined,
    };
    await api.createTransaction(input);
    setShowForm(false);
    loadTransactions();
    api.getAccounts().then(setAccounts).catch(console.error);
  };

  const handleDelete = async (id: string) => {
    await api.deleteTransaction(id);
    loadTransactions();
    api.getAccounts().then(setAccounts).catch(console.error);
  };

  const handleAutoCategorize = async () => {
    if (!description.trim() || txType !== "expense") return;
    setCategorizing(true);
    try {
      const id = await api.aiCategorize(description);
      if (id && categories.some((c) => c.id === id)) {
        setCategoryId(id);
      }
    } catch {
      // Ollama unavailable — silently fail
    } finally {
      setCategorizing(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = await api.exportCsv({
        accountId: filterAccount || undefined,
        transactionType: filterType || undefined,
        search: searchQuery || undefined,
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions_${todayISO()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateRecurringRule = {
      accountId: recAccountId,
      categoryId: recCategoryId || undefined,
      amount: parseFloat(recAmount) || 0,
      description: recDesc,
      transactionType: recType,
      frequency: recFrequency,
      nextDate: recNextDate,
    };
    await api.createRecurringRule(input);
    setShowRecurringForm(false);
    loadRecurring();
  };

  const handleDeleteRecurring = async (id: string) => {
    await api.deleteRecurringRule(id);
    loadRecurring();
  };

  const handleToggleRecurring = async (id: string, active: boolean) => {
    await api.toggleRecurringRule(id, !active);
    loadRecurring();
  };

  const freqLabels: Record<string, string> = {
    weekly: "Hebdo",
    monthly: "Mensuel",
    yearly: "Annuel",
  };

  const filteredCategories = categories.filter((c) => c.categoryType === txType);
  const recFilteredCategories = categories.filter((c) => c.categoryType === recType);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="bg-panel border border-edge rounded pl-8 pr-3 py-1.5 text-sm text-fg w-48 focus:outline-none focus:border-accent placeholder:text-fg-3"
          />
        </div>
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="bg-panel border border-edge rounded px-3 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
        >
          <option value="">Tous les comptes</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-panel border border-edge rounded px-3 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
        >
          <option value="">Tous les types</option>
          <option value="expense">Dépenses</option>
          <option value="income">Revenus</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-fg-2 border border-edge hover:text-fg hover:bg-panel-2 transition-colors"
        >
          <Download size={14} /> CSV
        </button>
        <button
          onClick={openCreate}
          disabled={accounts.length === 0}
          className="flex items-center gap-2 bg-accent text-ground px-4 py-1.5 rounded text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-edge bg-panel overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-edge">
              <th className="text-left text-[11px] font-medium text-fg-3 uppercase tracking-wider px-4 py-3">
                Date
              </th>
              <th className="text-left text-[11px] font-medium text-fg-3 uppercase tracking-wider px-4 py-3">
                Description
              </th>
              <th className="text-left text-[11px] font-medium text-fg-3 uppercase tracking-wider px-4 py-3">
                Catégorie
              </th>
              <th className="text-left text-[11px] font-medium text-fg-3 uppercase tracking-wider px-4 py-3">
                Compte
              </th>
              <th className="text-right text-[11px] font-medium text-fg-3 uppercase tracking-wider px-4 py-3">
                Montant
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-fg-3 text-sm">
                  {accounts.length === 0
                    ? "Crée un compte d'abord dans l'onglet Comptes"
                    : "Aucune transaction"}
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-edge/50 hover:bg-panel-2/50 transition-colors group"
                >
                  <td className="px-4 py-2.5 text-sm font-mono tabular-nums text-fg-2">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-4 py-2.5 text-sm">{tx.description}</td>
                  <td className="px-4 py-2.5">
                    {tx.categoryName ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (tx.categoryColor || "#64748b") + "1a",
                          color: tx.categoryColor || "#64748b",
                        }}
                      >
                        {tx.categoryName}
                      </span>
                    ) : (
                      <span className="text-xs text-fg-3">&mdash;</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-2">{tx.accountName}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`text-sm font-mono tabular-nums font-medium ${
                        tx.transactionType === "income" ? "text-positive" : "text-danger"
                      }`}
                    >
                      {tx.transactionType === "income" ? "+" : "−"}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </td>
                  <td className="px-2">
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-panel-2 text-fg-3 hover:text-danger transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recurring transactions section */}
      <div className="rounded-lg border border-edge bg-panel overflow-hidden">
        <button
          onClick={() => setShowRecurring(!showRecurring)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-fg hover:bg-panel-2/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-accent" />
            Transactions récurrentes ({recurringRules.length})
          </div>
          {showRecurring ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showRecurring && (
          <div className="border-t border-edge">
            {recurringRules.length === 0 ? (
              <div className="text-center py-6 text-fg-3 text-sm">
                Aucune transaction récurrente configurée
              </div>
            ) : (
              <div className="divide-y divide-edge/50">
                {recurringRules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-2.5 group">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleRecurring(r.id, r.isActive)}
                        className={`p-1 rounded transition-colors ${r.isActive ? "text-positive" : "text-fg-3"}`}
                      >
                        <Power size={14} />
                      </button>
                      <div className={r.isActive ? "" : "opacity-50"}>
                        <div className="text-sm">{r.description}</div>
                        <div className="text-[11px] text-fg-3">
                          {freqLabels[r.frequency] || r.frequency} · Prochaine : {formatDate(r.nextDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-mono tabular-nums font-medium ${
                        r.transactionType === "income" ? "text-positive" : "text-danger"
                      }`}>
                        {r.transactionType === "income" ? "+" : "−"}{formatCurrency(Math.abs(r.amount))}
                      </span>
                      <button
                        onClick={() => handleDeleteRecurring(r.id)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-panel-2 text-fg-3 hover:text-danger transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-3 border-t border-edge">
              {showRecurringForm ? (
                <form onSubmit={handleCreateRecurring} className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      value={recDesc}
                      onChange={(e) => setRecDesc(e.target.value)}
                      required
                      placeholder="Description"
                      className="col-span-2 bg-ground border border-edge rounded px-3 py-1.5 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={recAmount}
                      onChange={(e) => setRecAmount(e.target.value)}
                      required
                      placeholder="Montant"
                      className="bg-ground border border-edge rounded px-3 py-1.5 text-sm text-fg font-mono focus:outline-none focus:border-accent"
                    />
                    <select
                      value={recType}
                      onChange={(e) => { setRecType(e.target.value); setRecCategoryId(""); }}
                      className="bg-ground border border-edge rounded px-2 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <select
                      value={recAccountId}
                      onChange={(e) => setRecAccountId(e.target.value)}
                      required
                      className="bg-ground border border-edge rounded px-2 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
                    >
                      <option value="">Compte</option>
                      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <select
                      value={recCategoryId}
                      onChange={(e) => setRecCategoryId(e.target.value)}
                      className="bg-ground border border-edge rounded px-2 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
                    >
                      <option value="">Catégorie</option>
                      {recFilteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                      value={recFrequency}
                      onChange={(e) => setRecFrequency(e.target.value)}
                      className="bg-ground border border-edge rounded px-2 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
                    >
                      <option value="weekly">Hebdo</option>
                      <option value="monthly">Mensuel</option>
                      <option value="yearly">Annuel</option>
                    </select>
                    <input
                      type="date"
                      value={recNextDate}
                      onChange={(e) => setRecNextDate(e.target.value)}
                      required
                      className="bg-ground border border-edge rounded px-2 py-1.5 text-sm text-fg focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-accent text-ground px-3 py-1.5 rounded text-sm font-medium hover:bg-accent-hover transition-colors">
                      Créer
                    </button>
                    <button type="button" onClick={() => setShowRecurringForm(false)} className="px-3 py-1.5 rounded text-sm text-fg-2 hover:text-fg hover:bg-panel-2 transition-colors">
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setRecAccountId(accounts[0]?.id || "");
                    setRecDesc("");
                    setRecAmount("");
                    setRecCategoryId("");
                    setRecType("expense");
                    setRecFrequency("monthly");
                    setRecNextDate(todayISO());
                    setShowRecurringForm(true);
                  }}
                  className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  <Plus size={14} /> Ajouter une récurrence
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative bg-panel border border-edge rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-semibold mb-5">Nouvelle transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="flex gap-1 bg-ground p-1 rounded">
                <button
                  type="button"
                  onClick={() => { setTxType("expense"); setCategoryId(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    txType === "expense"
                      ? "bg-danger/15 text-danger"
                      : "text-fg-3 hover:text-fg"
                  }`}
                >
                  <ArrowDownLeft size={14} /> Dépense
                </button>
                <button
                  type="button"
                  onClick={() => { setTxType("income"); setCategoryId(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded text-sm font-medium transition-colors ${
                    txType === "income"
                      ? "bg-positive/15 text-positive"
                      : "text-fg-3 hover:text-fg"
                  }`}
                >
                  <ArrowUpRight size={14} /> Revenu
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1">Montant (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0,00"
                    className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg font-mono focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Description</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="ex: Courses Lidl"
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1">Compte</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Sélectionner</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-fg-2 mb-1">Catégorie</label>
                  <div className="flex gap-1.5">
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="flex-1 bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="">Sans catégorie</option>
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {txType === "expense" && (
                      <button
                        type="button"
                        onClick={handleAutoCategorize}
                        disabled={!description.trim() || categorizing}
                        title="Suggestion IA"
                        className="shrink-0 px-2 rounded border border-edge bg-ground text-accent hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {categorizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Notes (optionnel)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes..."
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent transition-colors"
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
