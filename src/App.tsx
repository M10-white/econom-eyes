import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Onboarding from "./components/Onboarding";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Budget from "./pages/Budget";
import Savings from "./pages/Savings";
import Aides from "./pages/Aides";
import Settings from "./pages/Settings";
import Assistant from "./pages/Assistant";
import UpdateNotification from "./components/UpdateNotification";
import { api } from "./lib/api";

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("economeyes-onboarded");
    if (onboarded) {
      setReady(true);
      return;
    }
    api.getAccounts()
      .then((accounts) => {
        if (accounts.length === 0) {
          setShowOnboarding(true);
        } else {
          localStorage.setItem("economeyes-onboarded", "true");
        }
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, []);

  if (!ready) return null;

  return (
    <>
      <UpdateNotification />
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/comptes" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/epargne" element={<Savings />} />
          <Route path="/aides" element={<Aides />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/parametres" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
}
