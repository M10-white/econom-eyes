import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Download, RefreshCw, X, AlertTriangle } from "lucide-react";

export default function UpdateNotification() {
  const [status, setStatus] = useState<
    "idle" | "available" | "downloading" | "ready" | "error"
  >("idle");
  const [version, setVersion] = useState("");
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    check()
      .then((update) => {
        if (update) {
          setVersion(update.version);
          setStatus("available");
        }
      })
      .catch((e) => console.error("Update check failed:", e));
  }, []);

  async function handleUpdate() {
    setStatus("downloading");
    setError("");
    try {
      const update = await check();
      if (!update) return;

      let total = 0;
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          total = event.data.contentLength;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          if (total > 0) setProgress(Math.round((downloaded / total) * 100));
        } else if (event.event === "Finished") {
          setStatus("ready");
        }
      });
      await relaunch();
    } catch (e) {
      console.error("Update failed:", e);
      setError(String(e));
      setStatus("error");
    }
  }

  if (status === "idle" || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 max-w-sm">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <X size={16} />
      </button>

      {status === "available" && (
        <div className="flex items-center gap-3">
          <Download className="text-blue-500 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Version {version} disponible
            </p>
            <button
              onClick={handleUpdate}
              className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Mettre à jour et redémarrer
            </button>
          </div>
        </div>
      )}

      {status === "downloading" && (
        <div className="flex items-center gap-3">
          <RefreshCw className="text-blue-500 shrink-0 animate-spin" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Téléchargement… {progress}%
            </p>
            <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="flex items-center gap-3">
          <RefreshCw className="text-green-500 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Redémarrage…
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Erreur de mise à jour
            </p>
            <p className="mt-1 text-xs text-red-500 break-all">{error}</p>
            <button
              onClick={handleUpdate}
              className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
