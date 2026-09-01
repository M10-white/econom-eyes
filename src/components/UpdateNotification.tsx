import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Download, RefreshCw, X } from "lucide-react";

export default function UpdateNotification() {
  const [status, setStatus] = useState<
    "idle" | "available" | "downloading" | "ready"
  >("idle");
  const [version, setVersion] = useState("");
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    check()
      .then((update) => {
        if (update) {
          setVersion(update.version);
          setStatus("available");
        }
      })
      .catch(() => {});
  }, []);

  async function handleUpdate() {
    setStatus("downloading");
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
      setStatus("ready");
    } catch {
      setStatus("available");
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
              Mettre à jour
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
              Mise à jour prête !
            </p>
            <button
              onClick={() => relaunch()}
              className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Redémarrer maintenant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
