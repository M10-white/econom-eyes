import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Save } from "lucide-react";
import { api } from "@/lib/api";
import type { UserProfile, AidResult } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "etudiant", label: "Étudiant" },
  { value: "alternant", label: "Alternant" },
  { value: "salarie", label: "Salarié" },
  { value: "demandeur_emploi", label: "Demandeur d'emploi" },
  { value: "independant", label: "Indépendant" },
];

const HOUSEHOLD_OPTIONS = [
  { value: "seul", label: "Seul(e)" },
  { value: "couple", label: "En couple" },
  { value: "famille", label: "Famille" },
];

const HOUSING_OPTIONS = [
  { value: "locataire", label: "Locataire" },
  { value: "proprietaire", label: "Propriétaire" },
  { value: "heberge", label: "Hébergé(e) gratuit" },
];

const ZONE_OPTIONS = [
  { value: "zone_1", label: "Zone 1 — Paris / Île-de-France" },
  { value: "zone_2", label: "Zone 2 — Grandes agglomérations" },
  { value: "zone_3", label: "Zone 3 — Reste de la France" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Logement": "#3b82f6",
  "Revenus": "#22c55e",
  "Santé": "#ef4444",
  "Éducation": "#a855f7",
  "Transport": "#f59e0b",
};

const inputClass = "w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-medium text-fg-2 mb-1";

export default function Aides() {
  const [, setProfile] = useState<UserProfile | null>(null);
  const [aids, setAids] = useState<AidResult[]>([]);
  const [profileOpen, setProfileOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const [birthDate, setBirthDate] = useState("");
  const [status, setStatus] = useState("etudiant");
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [householdType, setHouseholdType] = useState("seul");
  const [dependents, setDependents] = useState("0");
  const [housingType, setHousingType] = useState("locataire");
  const [housingZone, setHousingZone] = useState("zone_2");
  const [rentAmount, setRentAmount] = useState("0");
  const [isStudent, setIsStudent] = useState(true);
  const [isApprentice, setIsApprentice] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);

  useEffect(() => {
    api.getProfile().then((p) => {
      setProfile(p);
      setBirthDate(p.birthDate || "");
      setStatus(p.status);
      setMonthlyIncome(String(p.monthlyIncome));
      setHouseholdType(p.householdType);
      setDependents(String(p.dependents));
      setHousingType(p.housingType);
      setHousingZone(p.housingZone);
      setRentAmount(String(p.rentAmount));
      setIsStudent(p.isStudent);
      setIsApprentice(p.isApprentice);
      setHasDisability(p.hasDisability);
      if (p.updatedAt) setProfileOpen(false);
    }).catch(console.error);

    api.checkEligibility().then(setAids).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.saveProfile({
        birthDate: birthDate || undefined,
        status,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        householdType,
        dependents: parseInt(dependents) || 0,
        housingType,
        housingZone,
        rentAmount: parseFloat(rentAmount) || 0,
        isStudent,
        isApprentice,
        hasDisability,
      });
      setProfile(updated);
      const results = await api.checkEligibility();
      setAids(results);
      setProfileOpen(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const eligibleCount = aids.filter((a) => a.eligible).length;
  const sortedAids = [...aids].sort((a, b) => (a.eligible === b.eligible ? 0 : a.eligible ? -1 : 1));

  return (
    <div className="space-y-6">
      {/* Summary */}
      {aids.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="rounded-lg border border-edge bg-panel p-4 flex-1">
            <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider mb-1">Aides éligibles</div>
            <div className="text-2xl font-semibold text-positive">{eligibleCount}</div>
          </div>
          <div className="rounded-lg border border-edge bg-panel p-4 flex-1">
            <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider mb-1">Aides analysées</div>
            <div className="text-2xl font-semibold">{aids.length}</div>
          </div>
          <div className="rounded-lg border border-edge bg-panel p-4 flex-1">
            <div className="text-[11px] font-medium text-fg-2 uppercase tracking-wider mb-1">Non éligibles</div>
            <div className="text-2xl font-semibold text-fg-3">{aids.length - eligibleCount}</div>
          </div>
        </div>
      )}

      {/* Profile form */}
      <div className="rounded-lg border border-edge bg-panel overflow-hidden">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-panel-2/50 transition-colors"
        >
          <span className="text-sm font-semibold">Mon profil</span>
          {profileOpen ? <ChevronUp size={16} className="text-fg-3" /> : <ChevronDown size={16} className="text-fg-3" />}
        </button>

        {profileOpen && (
          <div className="px-5 pb-5 border-t border-edge pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Date de naissance</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Situation</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Revenus mensuels nets (€)</label>
                <input type="number" step="1" min="0" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Foyer</label>
                <select value={householdType} onChange={(e) => setHouseholdType(e.target.value)} className={inputClass}>
                  {HOUSEHOLD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Personnes à charge</label>
                <input type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Logement</label>
                <select value={housingType} onChange={(e) => setHousingType(e.target.value)} className={inputClass}>
                  {HOUSING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Zone géographique</label>
                <select value={housingZone} onChange={(e) => setHousingZone(e.target.value)} className={inputClass}>
                  {ZONE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Loyer mensuel (€)</label>
                <input type="number" step="1" min="0" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div className="flex items-end pb-1">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isStudent} onChange={(e) => setIsStudent(e.target.checked)} className="accent-accent" />
                    <span className="text-fg-2">Étudiant</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={isApprentice} onChange={(e) => setIsApprentice(e.target.checked)} className="accent-accent" />
                    <span className="text-fg-2">Alternant / Apprenti</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={hasDisability} onChange={(e) => setHasDisability(e.target.checked)} className="accent-accent" />
                    <span className="text-fg-2">Situation de handicap</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-accent text-ground px-5 py-2 rounded text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "Analyse..." : "Enregistrer et analyser"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Aid results */}
      {sortedAids.length > 0 && (
        <div className="space-y-3">
          {sortedAids.map((aid) => {
            const catColor = CATEGORY_COLORS[aid.category] || "#64748b";
            return (
              <div
                key={aid.id}
                className={`rounded-lg border bg-panel p-5 ${
                  aid.eligible ? "border-positive/30" : "border-edge"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    {aid.eligible ? (
                      <CheckCircle size={20} className="text-positive mt-0.5 shrink-0" />
                    ) : (
                      <XCircle size={20} className="text-fg-3 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium">{aid.name}</div>
                      <div className="text-xs text-fg-2 mt-0.5">{aid.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: catColor + "1a", color: catColor }}
                    >
                      {aid.category}
                    </span>
                  </div>
                </div>

                <div className="ml-8 mt-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    {aid.reasons.map((r, i) => (
                      <div key={i} className="text-[11px] text-fg-3 flex items-center gap-1.5">
                        <span className={aid.eligible ? "text-positive" : "text-danger"}>
                          {aid.eligible ? "✓" : "✗"}
                        </span>
                        {r}
                      </div>
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-fg-3 uppercase tracking-wider">Estimation</div>
                    <div className="text-sm font-mono tabular-nums font-medium mt-0.5">
                      {aid.estimatedAmount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
