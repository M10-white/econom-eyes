import { useState, useEffect } from "react";
import { Save, Wifi, WifiOff, RefreshCw, Cpu, Database, Download, Sun, Moon, Monitor, FolderSync, FolderOpen, X } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { api } from "@/lib/api";
import type { OllamaStatus } from "@/lib/types";

const inputClass =
  "w-full bg-ground border border-edge rounded px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent transition-colors";
const labelClass = "block text-xs font-medium text-fg-2 mb-1";

export default function Settings() {
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

  useEffect(() => {
    api.getSettings().then((s) => {
      setOllamaUrl(s.ollamaUrl);
      setOllamaModel(s.ollamaModel);
    }).catch(console.error);
    api.getDbPath().then(setDbPath).catch(console.error);
    api.getSyncConfig().then((c) => setSyncDir(c.syncDir)).catch(console.error);
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
      setBackupMsg("Export CSV téléchargé");
      setTimeout(() => setBackupMsg(""), 3000);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSetSyncFolder() {
    const selected = await open({ directory: true, title: "Choisir le dossier de synchronisation" });
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

  return (
    <div className="space-y-6">
      {/* Ollama Connection */}
      <div className="bg-panel border border-edge rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cpu size={20} className="text-accent" />
            <h2 className="text-lg font-semibold text-fg">Connexion Ollama</h2>
          </div>
          <button
            onClick={checkConnection}
            disabled={checking}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-ground border border-edge text-fg-2 hover:text-fg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} />
            Tester
          </button>
        </div>

        {/* Status indicator */}
        {status && (
          <div
            className={`flex items-center gap-3 p-3 rounded-lg mb-6 border ${
              status.connected
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {status.connected ? <Wifi size={18} /> : <WifiOff size={18} />}
            <div>
              <p className="text-sm font-medium">
                {status.connected ? "Connecté" : "Non connecté"}
              </p>
              <p className="text-xs opacity-70">
                {status.connected
                  ? `${status.availableModels.length} modèle(s) disponible(s)`
                  : "Vérifiez qu'Ollama est lancé et accessible"}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
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
              Adresse du serveur Ollama local. Par défaut : http://localhost:11434
            </p>
          </div>

          <div>
            <label className={labelClass}>Modèle</label>
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
              Modèle utilisé pour le chat et la catégorisation automatique
            </p>
          </div>
        </div>

        {/* Save */}
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
            <span className="text-sm text-green-400">Paramètres sauvegardés</span>
          )}
        </div>
      </div>

      {/* Available models detail */}
      {status?.connected && status.availableModels.length > 0 && (
        <div className="bg-panel border border-edge rounded-lg p-6">
          <h3 className="text-sm font-semibold text-fg mb-4">
            Modèles installés ({status.availableModels.length})
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

      {/* Sync */}
      <div className="bg-panel border border-edge rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <FolderSync size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-fg">Synchronisation</h2>
        </div>
        <p className="text-xs text-fg-2 mb-4">
          Stockez vos données dans un dossier cloud (Google Drive, OneDrive, Dropbox) pour y accéder depuis plusieurs machines.
        </p>

        {syncDir ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-accent/30 bg-accent/5">
              <FolderOpen size={16} className="text-accent shrink-0" />
              <span className="text-sm text-fg font-mono truncate flex-1">{syncDir}</span>
              <button
                onClick={handleRemoveSync}
                disabled={syncLoading}
                className="shrink-0 p-1 rounded hover:bg-danger/10 text-fg-2 hover:text-danger transition-colors disabled:opacity-50"
                title="Désactiver la synchronisation"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-fg-3">
              Synchronisation active. Assurez-vous de fermer l'app sur une machine avant de l'ouvrir sur l'autre.
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

      {/* Theme */}
      <div className="bg-panel border border-edge rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sun size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-fg">Apparence</h2>
        </div>
        <div className="flex gap-2">
          {[
            { value: "dark", icon: Moon, label: "Sombre" },
            { value: "light", icon: Sun, label: "Clair" },
            { value: "system", icon: Monitor, label: "Système" },
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

      {/* Backup */}
      <div className="bg-panel border border-edge rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database size={20} className="text-accent" />
          <h2 className="text-lg font-semibold text-fg">Données</h2>
        </div>
        {dbPath && (
          <p className="text-xs text-fg-3 mb-4 font-mono break-all">
            Base de données : {dbPath}
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

      {/* Info section */}
      <div className="bg-panel border border-edge rounded-lg p-6">
        <h3 className="text-sm font-semibold text-fg mb-3">
          Guide de démarrage rapide
        </h3>
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
            <span>
              Lancez Ollama (il tourne en arrière-plan)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent font-semibold shrink-0">3.</span>
            <span>
              Téléchargez un modèle :{" "}
              <code className="text-xs bg-ground px-1.5 py-0.5 rounded font-mono text-fg">
                ollama pull mistral
              </code>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-accent font-semibold shrink-0">4.</span>
            <span>
              Cliquez « Tester » ci-dessus pour vérifier la connexion
            </span>
          </li>
        </ol>
      </div>
    </div>
  );
}
