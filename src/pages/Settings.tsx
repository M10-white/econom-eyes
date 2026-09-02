import { useState, useEffect } from "react";
import {
  Save,
  Wifi,
  WifiOff,
  RefreshCw,
  Cpu,
  Database,
  Download,
  Sun,
  Moon,
  Monitor,
  FolderSync,
  FolderOpen,
  X,
  User,
  BookOpen,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { api } from "@/lib/api";
import type { OllamaStatus, UserProfile, UpdateProfile } from "@/lib/types";

const inputClass =
  "w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-medium text-fg-2 mb-1";

const sections = [
  { id: "profil", icon: User, label: "Profil" },
  { id: "ollama", icon: Cpu, label: "Ollama" },
  { id: "sync", icon: FolderSync, label: "Synchronisation" },
  { id: "apparence", icon: Sun, label: "Apparence" },
  { id: "donnees", icon: Database, label: "Donnees" },
  { id: "guide", icon: BookOpen, label: "Guide" },
] as const;

type SectionId = (typeof sections)[number]["id"];

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SectionId>("profil");

  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("mistral");
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dbPath, setDbPath] = useState("");
  const [backupMsg, setBackupMsg] = useState("");
  const [syncDir, setSyncDir] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("economeyes-theme") || "dark";
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateProfile>({
    status: "etudiant",
    monthlyIncome: 0,
    householdType: "seul",
    dependents: 0,
    housingType: "locataire",
    housingZone: "zone_2",
    rentAmount: 0,
    isStudent: false,
    isApprentice: false,
    hasDisability: false,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setOllamaUrl(s.ollamaUrl);
        setOllamaModel(s.ollamaModel);
      })
      .catch(console.error);
    api.getDbPath().then(setDbPath).catch(console.error);
    api.getSyncConfig().then((c) => setSyncDir(c.syncDir)).catch(console.error);
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        setProfileForm({
          birthDate: p.birthDate ?? undefined,
          status: p.status,
          monthlyIncome: p.monthlyIncome,
          householdType: p.householdType,
          dependents: p.dependents,
          housingType: p.housingType,
          housingZone: p.housingZone,
          rentAmount: p.rentAmount,
          isStudent: p.isStudent,
          isApprentice: p.isApprentice,
          hasDisability: p.hasDisability,
        });
      })
      .catch(console.error);
    checkConnection();
  }, []);

  function applyTheme(t: string) {
    setTheme(t);
    localStorage.setItem("economeyes-theme", t);
    const root = document.documentElement;
    if (t === "light") {
      root.setAttribute("data-theme", "light");
    } else if (t === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }

  async function handleBackup() {
    try {
      const csv = await api.exportCsv({});
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `economeyes_backup_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg("Export CSV telecharge");
      setTimeout(() => setBackupMsg(""), 3000);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSetSyncFolder() {
    const selected = await open({
      directory: true,
      title: "Choisir le dossier de synchronisation",
    });
    if (!selected) return;
    setSyncLoading(true);
    try {
      const msg = await api.setSyncFolder(selected);
      setSyncDir(selected);
      setSyncMsg(msg);
    } catch (e) {
      setSyncMsg(`Erreur: ${e}`);
    } finally {
      setSyncLoading(false);
      setTimeout(() => setSyncMsg(""), 5000);
    }
  }

  async function handleRemoveSync() {
    setSyncLoading(true);
    try {
      const msg = await api.removeSyncFolder();
      setSyncDir(null);
      setSyncMsg(msg);
    } catch (e) {
      setSyncMsg(`Erreur: ${e}`);
    } finally {
      setSyncLoading(false);
      setTimeout(() => setSyncMsg(""), 5000);
    }
  }

  async function checkConnection() {
    setChecking(true);
    try {
      const s = await api.checkOllama();
      setStatus(s);
    } catch {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const s = await api.saveSettings(ollamaUrl, ollamaModel);
      setOllamaUrl(s.ollamaUrl);
      setOllamaModel(s.ollamaModel);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      checkConnection();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile() {
    setProfileSaving(true);
    try {
      const p = await api.saveProfile(profileForm);
      setProfile(p);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setProfileSaving(false);
    }
  }

  function updateField<K extends keyof UpdateProfile>(
    key: K,
    value: UpdateProfile[K]
  ) {
    setProfileForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Section nav */}
      <nav className="w-44 shrink-0 space-y-0.5">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-medium transition-colors ${
              activeSection === s.id
                ? "bg-accent/10 text-accent"
                : "text-fg-2 hover:text-fg hover:bg-panel-2"
            }`}
          >
            <s.icon size={16} strokeWidth={1.75} />
            {s.label}
          </button>
        ))}
      </nav>

      {/* Section content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {activeSection === "profil" && (
          <div className="bg-panel border border-edge rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <User size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-fg">Mon profil</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Date de naissance</label>
                <input
                  type="date"
                  value={profileForm.birthDate || ""}
                  onChange={(e) =>
                    updateField("birthDate", e.target.value || undefined)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Statut</label>
                <select
                  value={profileForm.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className={inputClass}
                >
                  <option value="etudiant">Etudiant</option>
                  <option value="apprenti">Apprenti</option>
                  <option value="salarie">Salarie</option>
                  <option value="independant">Independant</option>
                  <option value="demandeur_emploi">Demandeur d'emploi</option>
                  <option value="retraite">Retraite</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Revenu mensuel net</label>
                <div className="relative">
                  <input
                    type="number"
                    value={profileForm.monthlyIncome || ""}
                    onChange={(e) =>
                      updateField("monthlyIncome", Number(e.target.value) || 0)
                    }
                    className={inputClass + " pr-8"}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 text-sm">
                    &euro;
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Situation du foyer</label>
                <select
                  value={profileForm.householdType}
                  onChange={(e) => updateField("householdType", e.target.value)}
                  className={inputClass}
                >
                  <option value="seul">Seul(e)</option>
                  <option value="couple">En couple</option>
                  <option value="famille">Famille</option>
                  <option value="colocation">Colocation</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Personnes a charge</label>
                <input
                  type="number"
                  min={0}
                  value={profileForm.dependents}
                  onChange={(e) =>
                    updateField("dependents", Number(e.target.value) || 0)
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Type de logement</label>
                <select
                  value={profileForm.housingType}
                  onChange={(e) => updateField("housingType", e.target.value)}
                  className={inputClass}
                >
                  <option value="locataire">Locataire</option>
                  <option value="proprietaire">Proprietaire</option>
                  <option value="heberge">Heberge(e)</option>
                  <option value="residence_etudiante">
                    Residence etudiante
                  </option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Zone de logement</label>
                <select
                  value={profileForm.housingZone}
                  onChange={(e) => updateField("housingZone", e.target.value)}
                  className={inputClass}
                >
                  <option value="zone_1">Zone 1 (Paris)</option>
                  <option value="zone_1_bis">Zone 1 bis (Ile-de-France)</option>
                  <option value="zone_2">Zone 2 (grandes villes)</option>
                  <option value="zone_3">Zone 3 (reste de la France)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Loyer mensuel</label>
                <div className="relative">
                  <input
                    type="number"
                    value={profileForm.rentAmount || ""}
                    onChange={(e) =>
                      updateField("rentAmount", Number(e.target.value) || 0)
                    }
                    className={inputClass + " pr-8"}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3 text-sm">
                    &euro;
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-5">
              <label className="flex items-center gap-2 text-sm text-fg-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileForm.isStudent}
                  onChange={(e) => updateField("isStudent", e.target.checked)}
                  className="accent-accent"
                />
                Etudiant
              </label>
              <label className="flex items-center gap-2 text-sm text-fg-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileForm.isApprentice}
                  onChange={(e) =>
                    updateField("isApprentice", e.target.checked)
                  }
                  className="accent-accent"
                />
                Alternant
              </label>
              <label className="flex items-center gap-2 text-sm text-fg-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileForm.hasDisability}
                  onChange={(e) =>
                    updateField("hasDisability", e.target.checked)
                  }
                  className="accent-accent"
                />
                Situation de handicap
              </label>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-edge">
              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                {profileSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
              {profileSaved && (
                <span className="text-sm text-green-400">
                  Profil sauvegarde
                </span>
              )}
            </div>
          </div>
        )}

        {activeSection === "ollama" && (
          <div className="space-y-6">
            <div className="bg-panel border border-edge rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Cpu size={20} className="text-accent" />
                  <h2 className="text-lg font-semibold text-fg">
                    Connexion Ollama
                  </h2>
                </div>
                <button
                  onClick={checkConnection}
                  disabled={checking}
                  className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-ground border border-edge text-fg-2 hover:text-fg transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={checking ? "animate-spin" : ""}
                  />
                  Tester
                </button>
              </div>

              {status && (
                <div
                  className={`flex items-center gap-3 p-3 rounded-lg mb-6 border ${
                    status.connected
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {status.connected ? (
                    <Wifi size={18} />
                  ) : (
                    <WifiOff size={18} />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {status.connected ? "Connecte" : "Non connecte"}
                    </p>
                    <p className="text-xs opacity-70">
                      {status.connected
                        ? `${status.availableModels.length} modele(s) disponible(s)`
                        : "Verifiez qu'Ollama est lance et accessible"}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>URL du serveur Ollama</label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className={inputClass}
                    placeholder="http://localhost:11434"
                  />
                  <p className="text-xs text-fg-3 mt-1">
                    Adresse du serveur Ollama local. Par defaut :
                    http://localhost:11434
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Modele</label>
                  {status?.connected && status.availableModels.length > 0 ? (
                    <select
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className={inputClass}
                    >
                      {status.availableModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className={inputClass}
                      placeholder="mistral"
                    />
                  )}
                  <p className="text-xs text-fg-3 mt-1">
                    Modele utilise pour le chat et la categorisation automatique
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-edge">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent/80 transition-colors disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                {saved && (
                  <span className="text-sm text-green-400">
                    Parametres sauvegardes
                  </span>
                )}
              </div>
            </div>

            {status?.connected && status.availableModels.length > 0 && (
              <div className="bg-panel border border-edge rounded-lg p-6">
                <h3 className="text-sm font-semibold text-fg mb-4">
                  Modeles installes ({status.availableModels.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {status.availableModels.map((m) => (
                    <div
                      key={m}
                      className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${
                        m === ollamaModel
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-edge bg-ground text-fg-2"
                      }`}
                    >
                      <Cpu size={14} />
                      <span className="truncate">{m}</span>
                      {m === ollamaModel && (
                        <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold opacity-70">
                          actif
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "sync" && (
          <div className="bg-panel border border-edge rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <FolderSync size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-fg">
                Synchronisation
              </h2>
            </div>
            <p className="text-xs text-fg-2 mb-4">
              Stockez vos donnees dans un dossier cloud (Google Drive, OneDrive,
              Dropbox) pour y acceder depuis plusieurs machines.
            </p>

            {syncDir ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-accent/30 bg-accent/5">
                  <FolderOpen size={16} className="text-accent shrink-0" />
                  <span className="text-sm text-fg font-mono truncate flex-1">
                    {syncDir}
                  </span>
                  <button
                    onClick={handleRemoveSync}
                    disabled={syncLoading}
                    className="shrink-0 p-1 rounded hover:bg-danger/10 text-fg-2 hover:text-danger transition-colors disabled:opacity-50"
                    title="Desactiver la synchronisation"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs text-fg-3">
                  Synchronisation active. Assurez-vous de fermer l'app sur une
                  machine avant de l'ouvrir sur l'autre.
                </p>
              </div>
            ) : (
              <button
                onClick={handleSetSyncFolder}
                disabled={syncLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-edge bg-ground text-fg-2 hover:text-fg hover:border-accent transition-colors disabled:opacity-50"
              >
                <FolderOpen size={16} />
                {syncLoading ? "Configuration..." : "Choisir un dossier"}
              </button>
            )}

            {syncMsg && (
              <div className="mt-3 px-3 py-2 rounded-lg border border-accent/30 bg-accent/5 text-sm text-accent">
                {syncMsg}
              </div>
            )}
          </div>
        )}

        {activeSection === "apparence" && (
          <div className="bg-panel border border-edge rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sun size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-fg">Apparence</h2>
            </div>
            <div className="flex gap-2">
              {[
                { value: "dark", icon: Moon, label: "Sombre" },
                { value: "light", icon: Sun, label: "Clair" },
                { value: "system", icon: Monitor, label: "Systeme" },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => applyTheme(value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    theme === value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-edge bg-ground text-fg-2 hover:text-fg"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSection === "donnees" && (
          <div className="bg-panel border border-edge rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Database size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-fg">Donnees</h2>
            </div>
            {dbPath && (
              <p className="text-xs text-fg-3 mb-4 font-mono break-all">
                Base de donnees : {dbPath}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackup}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-edge bg-ground text-fg-2 hover:text-fg transition-colors"
              >
                <Download size={16} />
                Exporter CSV
              </button>
              {backupMsg && (
                <span className="text-sm text-green-400">{backupMsg}</span>
              )}
            </div>
          </div>
        )}

        {activeSection === "guide" && (
          <div className="bg-panel border border-edge rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={20} className="text-accent" />
              <h2 className="text-lg font-semibold text-fg">
                Guide de demarrage rapide
              </h2>
            </div>
            <ol className="space-y-2 text-sm text-fg-2">
              <li className="flex gap-2">
                <span className="text-accent font-semibold shrink-0">1.</span>
                <span>
                  Installez Ollama depuis{" "}
                  <span className="text-accent">ollama.com</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-semibold shrink-0">2.</span>
                <span>Lancez Ollama (il tourne en arriere-plan)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-semibold shrink-0">3.</span>
                <span>
                  Telechargez un modele :{" "}
                  <code className="text-xs bg-ground px-1.5 py-0.5 rounded font-mono text-fg">
                    ollama pull mistral
                  </code>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-semibold shrink-0">4.</span>
                <span>
                  Cliquez Tester dans la section Ollama pour verifier la
                  connexion
                </span>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
