import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Wallet, PiggyBank, Users, ArrowLeftRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, accountTypeLabels } from "@/lib/utils";
import type { Account } from "@/lib/types";

const accountIcons: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  checking: Wallet,
  savings: PiggyBank,
  shared: Users,
};

const accountColors: Record<string, string> = {
  checking: "#3b82f6",
  savings: "#10b981",
  shared: "#a855f7",
};

const inputClass =
  "w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors";

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("0");

  const [showTransfer, setShowTransfer] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("Virement");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [transferring, setTransferring] = useState(false);

  const load = () => {
    api.getAccounts().then(setAccounts).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setType("checking");
    setBalance("0");
    setShowForm(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setName(a.name);
    setType(a.accountType);
    setBalance(String(a.balance));
    setShowForm(true);
  };

  const openTransfer = () => {
    if (accounts.length < 2) return;
    setFromId(accounts[0].id);
    setToId(accounts[1].id);
    setTransferAmount("");
    setTransferDesc("Virement");
    setTransferDate(new Date().toISOString().slice(0, 10));
    setShowTransfer(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name,
      accountType: type,
      balance: parseFloat(balance) || 0,
      color: accountColors[type],
    };
    if (editing) {
      await api.updateAccount(editing.id, data);
    } else {
      await api.createAccount(data);
    }
    setShowForm(false);
    load();
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromId === toId || !transferAmount) return;
    setTransferring(true);
    try {
      await api.transfer({
        fromAccountId: fromId,
        toAccountId: toId,
        amount: parseFloat(transferAmount) || 0,
        description: transferDesc,
        date: transferDate,
      });
      setShowTransfer(false);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setTransferring(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.deleteAccount(id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider">Solde total</div>
          <div className="text-2xl font-semibold font-mono tabular-nums mt-1">
            {formatCurrency(totalBalance)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {accounts.length >= 2 && (
            <button
              onClick={openTransfer}
              className="flex items-center gap-2 border border-edge text-fg-2 hover:text-fg px-4 py-2 rounded text-sm font-medium hover:bg-panel-2 transition-colors"
            >
              <ArrowLeftRight size={16} /> Virement
            </button>
          )}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-accent text-ground px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            <Plus size={16} /> Nouveau compte
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-lg border border-edge bg-panel p-8 text-center">
          <Wallet size={32} className="mx-auto text-fg-3 mb-3" />
          <p className="text-fg-2 text-sm">Aucun compte créé</p>
          <p className="text-fg-3 text-xs mt-1">Commence par ajouter ton compte courant</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = accountIcons[account.accountType] || Wallet;
            const color = account.color || accountColors[account.accountType] || "#64748b";
            return (
              <div key={account.id} className="rounded-lg border border-edge bg-panel p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: color + "1a" }}
                    >
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{account.name}</div>
                      <div className="text-[11px] text-fg-3">
                        {accountTypeLabels[account.accountType] || account.accountType}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(account)}
                      className="p-1.5 rounded hover:bg-panel-2 text-fg-3 hover:text-fg transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-1.5 rounded hover:bg-panel-2 text-fg-3 hover:text-danger transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div
                  className="text-xl font-semibold font-mono tabular-nums"
                  style={{ color: account.balance < 0 ? "#ef4444" : undefined }}
                >
                  {formatCurrency(account.balance)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowForm(false)} />
          <div className="relative bg-panel border border-edge rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-semibold mb-5">
              {editing ? "Modifier le compte" : "Nouveau compte"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Nom</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="ex: Compte courant"
                  className="w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg placeholder:text-fg-3 focus:outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={inputClass}
                >
                  <option value="checking">Courant</option>
                  <option value="savings">Épargne</option>
                  <option value="shared">Commun</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Solde initial (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
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
                  {editing ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTransfer(false)} />
          <div className="relative bg-panel border border-edge rounded-lg p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2.5 mb-5">
              <ArrowLeftRight size={20} className="text-accent" />
              <h2 className="text-base font-semibold">Virement entre comptes</h2>
            </div>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Depuis</label>
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className={inputClass}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Vers</label>
                <select
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className={inputClass}
                >
                  {accounts.filter((a) => a.id !== fromId).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Description</label>
                <input
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fg-2 mb-1">Date</label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransfer(false)}
                  className="px-4 py-2 rounded text-sm font-medium text-fg-2 hover:text-fg hover:bg-panel-2 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={transferring || fromId === toId}
                  className="bg-accent text-ground px-4 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {transferring ? "Transfert..." : "Transférer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
