import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, formatDateShort } from "@/lib/utils";
import type { Account, MonthlySummary, TransactionWithCategory, MonthOverview } from "@/lib/types";

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [recentTx, setRecentTx] = useState<TransactionWithCategory[]>([]);
  const [monthTrend, setMonthTrend] = useState<MonthOverview[]>([]);

  useEffect(() => {
    const now = new Date();
    api.getAccounts().then(setAccounts).catch(console.error);
    api.getMonthlySummary(now.getFullYear(), now.getMonth() + 1)
      .then(setSummary)
      .catch(console.error);
    api.getTransactions({})
      .then((txs) => setRecentTx(txs.slice(0, 5)))
      .catch(console.error);
    api.getMultiMonth(6).then(setMonthTrend).catch(console.error);
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Solde total"
          value={formatCurrency(totalBalance)}
          positive={totalBalance >= 0}
        />
        <StatCard
          label="Revenus du mois"
          value={formatCurrency(summary?.totalIncome ?? 0)}
          positive
        />
        <StatCard
          label="Dépenses du mois"
          value={formatCurrency(summary?.totalExpenses ?? 0)}
        />
        <StatCard
          label="Balance mensuelle"
          value={formatCurrency(summary?.balance ?? 0)}
          positive={(summary?.balance ?? 0) >= 0}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="col-span-2 rounded-lg border border-edge bg-panel p-5">
          <h2 className="text-sm font-semibold mb-4">Évolution du mois</h2>
          {summary && summary.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={summary.daily}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDateShort(d)}
                  stroke="#3d4f63"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#3d4f63"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}€`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0e1520",
                    border: "1px solid #1b2b3d",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#dfe6ee",
                  }}
                  labelFormatter={(d) => formatDate(d as string)}
                  formatter={(v) => [formatCurrency(Number(v))]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                  name="Revenus"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                  name="Dépenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-fg-3 text-sm">
              Pas de données ce mois
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="rounded-lg border border-edge bg-panel p-5">
          <h2 className="text-sm font-semibold mb-4">Répartition dépenses</h2>
          {summary && summary.byCategory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={summary.byCategory}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                  >
                    {summary.byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#0e1520",
                      border: "1px solid #1b2b3d",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#dfe6ee",
                    }}
                    formatter={(v) => [formatCurrency(Number(v))]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {summary.byCategory.slice(0, 5).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-fg-2">{cat.name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-fg-2">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[160px] text-fg-3 text-sm">
              Pas de dépenses
            </div>
          )}
        </div>
      </div>

      {/* Multi-month trend */}
      {monthTrend.length > 0 && monthTrend.some((m) => m.income > 0 || m.expenses > 0) && (
        <div className="rounded-lg border border-edge bg-panel p-5">
          <h2 className="text-sm font-semibold mb-4">Évolution sur 6 mois</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthTrend} barGap={4}>
              <XAxis
                dataKey="label"
                stroke="#3d4f63"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#3d4f63"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0e1520",
                  border: "1px solid #1b2b3d",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#dfe6ee",
                }}
                formatter={(v) => [formatCurrency(Number(v))]}
              />
              <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} name="Revenus" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent transactions */}
      <div className="rounded-lg border border-edge bg-panel p-5">
        <h2 className="text-sm font-semibold mb-4">Transactions récentes</h2>
        {recentTx.length === 0 ? (
          <div className="text-center py-6 text-fg-3 text-sm">
            Aucune transaction
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3">
                  {tx.categoryColor && (
                    <div
                      className="w-1.5 h-6 rounded-full"
                      style={{ backgroundColor: tx.categoryColor }}
                    />
                  )}
                  <div>
                    <div className="text-sm">{tx.description}</div>
                    <div className="text-[11px] text-fg-3">
                      {formatDate(tx.date)} · {tx.accountName}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-sm font-mono tabular-nums font-medium ${
                    tx.transactionType === "income" ? "text-positive" : "text-danger"
                  }`}
                >
                  {tx.transactionType === "income" ? "+" : "−"}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-edge bg-panel p-4">
      <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div
        className={`text-xl font-semibold font-mono tabular-nums ${
          positive === false ? "text-danger" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
