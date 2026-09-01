import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/comptes": "Comptes",
  "/budget": "Budget",
  "/epargne": "Épargne",
  "/aides": "Aides sociales",
  "/assistant": "Assistant IA",
  "/parametres": "Paramètres",
};

export default function Header() {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? "econom'eyes";

  return (
    <header className="h-14 flex items-center px-6 border-b border-edge bg-panel shrink-0">
      <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
    </header>
  );
}
