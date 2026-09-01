import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  PiggyBank,
  HandCoins,
  Bot,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/comptes", icon: Wallet, label: "Comptes" },
  { to: "/budget", icon: Target, label: "Budget" },
  { to: "/epargne", icon: PiggyBank, label: "Épargne" },
  { to: "/aides", icon: HandCoins, label: "Aides" },
  { to: "/assistant", icon: Bot, label: "Assistant IA" },
  { to: "/parametres", icon: Settings, label: "Paramètres" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 h-full bg-panel border-r border-edge flex flex-col shrink-0">
      <div className="h-14 flex items-center px-5 border-b border-edge">
        <span className="font-mono text-sm font-bold tracking-tight text-accent">
          econom'eyes
        </span>
      </div>

      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-fg-2 hover:text-fg hover:bg-panel-2"
              }`
            }
          >
            <item.icon size={16} strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-edge">
        <div className="text-[11px] font-mono text-fg-3">v0.1.0</div>
      </div>
    </aside>
  );
}
