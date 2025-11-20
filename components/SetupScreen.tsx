import React, { useState } from "react";
import { appConfig, saveConfigToStorage, setAppConfig } from "../config";

interface SetupScreenProps {
  onComplete: () => void;
  onCancel: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, onCancel }) => {
  const [clientId, setClientId] = useState(appConfig.googleClientId || "");
  const [apiKey, setApiKey] = useState(appConfig.geminiApiKey || "");

  const handleSave = () => {
    if (!clientId || !apiKey) return alert("Please fill in both keys.");

    setAppConfig({
      googleClientId: clientId,
      geminiApiKey: apiKey,
    });
    saveConfigToStorage();
    onComplete();
    window.location.reload(); // Force a reload to re-initialize everything
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-white">Configuration</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              <strong>Security Note:</strong> Your keys are stored strictly in
              your browser's{" "}
              <code className="bg-blue-900/50 px-1 py-0.5 rounded">
                localStorage
              </code>
              . This app is serverless; no data is ever sent to our servers.
            </p>
          </div>

          {/* API Key Step */}
          <div>
            <label className="block text-sm font-medium text-emerald-400 mb-2">
              1. Analysis Service API Key
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Required to analyze emails and extract job status.
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline ml-1"
              >
                Get Key Here
              </a>
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Enter your API key..."
            />
          </div>

          {/* Google Client ID Step */}
          <div>
            <label className="block text-sm font-medium text-blue-400 mb-2">
              2. Google OAuth Client ID
            </label>
            <p className="text-xs text-slate-400 mb-2">
              Required to securely read your Gmail from your browser.
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-500 space-y-1 mb-2 bg-slate-900/50 p-3 rounded-lg">
              <li>
                Go to{" "}
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 underline"
                >
                  Google Cloud Console
                </a>
                .
              </li>
              <li>Create a project & Enable "Gmail API".</li>
              <li>
                Configure OAuth Consent Screen (User Type: External). Add your
                email as Test User.
              </li>
              <li>
                Create Credentials &rarr; OAuth Client ID &rarr; Web
                Application.
              </li>
              <li>
                Add{" "}
                <span className="font-mono text-white break-all">
                  {window.location.origin}
                </span>{" "}
                to "Authorized JavaScript origins".
              </li>
            </ol>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="12345...apps.googleusercontent.com"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end gap-3 bg-slate-800 sticky bottom-0 z-10">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-lg shadow-lg transform transition-all active:scale-95"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
