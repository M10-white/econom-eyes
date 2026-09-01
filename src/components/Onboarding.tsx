import { useState } from "react";
import { ChevronRight, Wallet, User, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

const inputClass =
  "w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-medium text-fg-2 mb-1";

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [accountName, setAccountName] = useState("Compte principal");
  const [accountType, setAccountType] = useState("checking");
  const [balance, setBalance] = useState("0");
  const [birthDate, setBirthDate] = useState("");
  const [status, setStatus] = useState("etudiant");
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await api.createAccount({
        name: accountName,
        accountType,
        balance: parseFloat(balance) || 0,
      });
      await api.saveProfile({
        birthDate: birthDate || undefined,
        status,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        householdType: "seul",
        dependents: 0,
        housingType: "locataire",
        housingZone: "zone_2",
        rentAmount: 0,
        isStudent: status === "etudiant" || status === "alternant",
        isApprentice: status === "alternant",
        hasDisability: false,
      });
      localStorage.setItem("economeyes-onboarded", "true");
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ground/95">
      <div className="w-full max-w-lg mx-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? "bg-accent w-12" : "bg-edge w-8"
              }`}
            />
          ))}
        </div>

        <div className="bg-panel border border-edge rounded-xl p-8 shadow-2xl">
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                <span className="text-3xl font-mono font-bold text-accent">e'</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-fg mb-2">
                  Bienvenue sur econom'eyes
                </h1>
                <p className="text-sm text-fg-2">
                  Configurons votre espace en 2 étapes rapides.
                  Vos données restent 100% locales sur votre machine.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent/80 transition-colors"
              >
                Commencer <ChevronRight size={16} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Wallet size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Votre premier compte</h2>
                  <p className="text-xs text-fg-2">Compte courant, épargne, etc.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nom du compte</label>
                  <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Type</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className={inputClass}
                    >
                      <option value="checking">Courant</option>
                      <option value="savings">Épargne</option>
                      <option value="shared">Commun</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Solde actuel (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent/80 transition-colors"
                >
                  Suivant <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <User size={20} className="text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Votre profil</h2>
                  <p className="text-xs text-fg-2">Pour les recommandations d'aides</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Date de naissance</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Statut</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className={inputClass}
                    >
                      <option value="etudiant">Étudiant</option>
                      <option value="alternant">Alternant</option>
                      <option value="salarie">Salarié</option>
                      <option value="demandeur_emploi">Demandeur d'emploi</option>
                      <option value="independant">Indépendant</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Revenu mensuel (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg text-sm text-fg-2 hover:text-fg hover:bg-panel-2 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent text-white font-medium text-sm hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {saving ? "Configuration..." : "Terminer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
