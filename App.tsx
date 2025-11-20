import React, { useState, useEffect, useCallback } from "react";
import { JobApplication, JobStatus, Recruiter, Stats } from "./types";
import {
  initTokenClient,
  triggerAuth,
  fetchEmailsSince,
  fetchEmailDetails,
} from "./services/gmailService";
import { analyzeEmailContent } from "./services/geminiService";
import {
  appConfig,
  loadConfigFromStorage,
  saveConfigToStorage,
  setAppConfig,
} from "./config";
import JobCard from "./components/JobCard";
import RecruiterVault from "./components/RecruiterVault";
import StatsBento from "./components/StatsBento";
import SetupScreen from "./components/SetupScreen";

const App: React.FC = () => {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [activeTab, setActiveTab] = useState<"kanban" | "vault">("kanban");

  // UI State
  const [showSettings, setShowSettings] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [configVersion, setConfigVersion] = useState(0); // New state to track config changes

  const handleDeleteData = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all local data? This cannot be undone."
      )
    ) {
      localStorage.removeItem("career_crm_jobs");
      localStorage.removeItem("career_crm_config");
      setJobs([]);
      setAppConfig({
        googleClientId: "",
        geminiApiKey: "",
        lastSyncTimestamp: 0,
      });
      setIsAuthenticated(false);
      setConfigLoaded(false); // Force re-initialization
      alert("All local data has been deleted.");
      window.location.reload(); // Refresh to apply changes
    }
  };

  // 1. Initialize App Logic
  useEffect(() => {
    // Check for Config keys
    loadConfigFromStorage();
    setConfigLoaded(true); // Trigger auth init check

    // Load saved Jobs
    const savedJobs = localStorage.getItem("career_crm_jobs");
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs));
    }

    // Request Persistent Storage (Browser will try not to delete data)
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        console.log(
          persistent ? "Storage is persistent" : "Storage is NOT persistent"
        );
      });
    }
  }, []);

  // 2. Initialize Google Auth Client whenever config changes/loads
  useEffect(() => {
    if (configLoaded && appConfig.googleClientId) {
      initTokenClient(appConfig.googleClientId, () => {
        setIsAuthenticated(true);
        // Check if we need to auto-scan (once per 24 hours)
        checkAutoRun();
      });
    }
  }, [configLoaded, configVersion]); // Re-run when config version changes

  // 3. Save Jobs on Change
  useEffect(() => {
    localStorage.setItem("career_crm_jobs", JSON.stringify(jobs));
  }, [jobs]);

  const checkAutoRun = () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // If never run (0) or run > 24h ago
    if (now - appConfig.lastSyncTimestamp > oneDay) {
      console.log("Auto-scan triggered: Last run was > 24h ago");
      startScan();
    }
  };

  const handleConnectClick = () => {
    if (!appConfig.googleClientId || !appConfig.geminiApiKey) {
      setShowSettings(true);
    } else {
      triggerAuth();
    }
  };

  const startScan = useCallback(async () => {
    if (!appConfig.geminiApiKey) {
      alert("Please set your Gemini API Key in settings first.");
      setShowSettings(true);
      return;
    }

    setIsScanning(true);
    setScanProgress("Fetching emails...");

    try {
      // Fetch emails since last sync time
      const messages = await fetchEmailsSince(appConfig.lastSyncTimestamp);
      setScanProgress(
        `Found ${messages.length} potential updates. Analyzing...`
      );

      if (messages.length === 0) {
        setScanProgress("Up to date. No new emails found.");
        setAppConfig({ ...appConfig, lastSyncTimestamp: Date.now() });
        saveConfigToStorage();
        setTimeout(() => setScanProgress(""), 2000);
        setIsScanning(false);
        return;
      }

      let newJobs = [...jobs];

      for (const msg of messages) {
        const details = await fetchEmailDetails(msg.id);
        if (!details) continue;

        setScanProgress(`Analyzing: ${details.subject.substring(0, 30)}...`);

        // AI Analysis
        const analysis = await analyzeEmailContent(
          details.subject,
          details.body
        );

        if (
          analysis.isJobRelated &&
          analysis.company &&
          analysis.company.trim() !== ""
        ) {
          const companyNameNormalized = analysis.company.trim();

          const existingIndex = newJobs.findIndex(
            (j) =>
              j.company
                .toLowerCase()
                .includes(companyNameNormalized.toLowerCase()) ||
              companyNameNormalized
                .toLowerCase()
                .includes(j.company.toLowerCase())
          );

          const emailData = {
            id: details.id,
            subject: details.subject,
            snippet: details.snippet,
            sender: details.sender,
            date: details.date,
            body: details.body,
          };

          if (existingIndex > -1) {
            // UPDATE EXISTING
            const job = newJobs[existingIndex];

            if (analysis.statusUpdate !== JobStatus.Unknown) {
              job.status = analysis.statusUpdate;
            }
            if (!job.emails.some((e) => e.id === emailData.id)) {
              job.emails.push(emailData);
            }
            job.lastUpdated = new Date().toISOString();

            if (analysis.recruiter) {
              const exists = job.contacts.some(
                (c) => c.email === analysis.recruiter?.email
              );
              if (!exists) {
                job.contacts.push({
                  ...analysis.recruiter,
                  company: analysis.company,
                  lastContactDate: new Date().toISOString(),
                });
              }
            }
            newJobs[existingIndex] = job;
          } else {
            // CREATE NEW
            newJobs.push({
              id: details.id,
              company: analysis.company,
              status:
                analysis.statusUpdate === JobStatus.Unknown
                  ? JobStatus.Applied
                  : analysis.statusUpdate,
              lastUpdated: new Date().toISOString(),
              emails: [emailData],
              contacts: analysis.recruiter
                ? [
                    {
                      ...analysis.recruiter,
                      company: analysis.company,
                      lastContactDate: new Date().toISOString(),
                    },
                  ]
                : [],
            });
          }
        }
      }

      setJobs(newJobs);

      // Update Sync Timestamp
      setAppConfig({ ...appConfig, lastSyncTimestamp: Date.now() });
      saveConfigToStorage();

      setScanProgress("Sync complete.");
      setTimeout(() => setScanProgress(""), 2000);
    } catch (e) {
      console.error(e);
      setScanProgress("Error during scan.");
    } finally {
      setIsScanning(false);
    }
  }, [jobs]);

  const getStats = (): Stats => {
    const totalApplied = jobs.length;
    const interviews = jobs.filter(
      (j) => j.status === JobStatus.Interviewing
    ).length;
    const offers = jobs.filter((j) => j.status === JobStatus.Offer).length;
    const responded = jobs.filter((j) => j.status !== JobStatus.Applied).length;
    const responseRate =
      totalApplied > 0 ? Math.round((responded / totalApplied) * 100) : 0;
    return { totalApplied, interviews, offers, responseRate };
  };

  const allContacts: Recruiter[] = jobs.flatMap((j) => j.contacts);

  const COLUMNS = [
    { id: JobStatus.Applied, title: "Applied" },
    { id: JobStatus.OA_Received, title: "OA / Skill Test" },
    { id: JobStatus.Interviewing, title: "Interviewing" },
    { id: JobStatus.Offer, title: "Offer" },
    { id: JobStatus.Rejected, title: "Rejected" },
  ];

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      {/* Settings Modal */}
      {showSettings && (
        <SetupScreen
          onComplete={() => {
            setShowSettings(false);
            setConfigVersion((v) => v + 1); // Increment version to trigger effect
          }}
          onCancel={() => setShowSettings(false)}
        />
      )}

      {/* Header */}
      <header className="p-4 md:p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              CareerCRM
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              AI-Powered Job Application Tracker •
              {appConfig.lastSyncTimestamp > 0
                ? ` Last Scan: ${new Date(
                    appConfig.lastSyncTimestamp
                  ).toLocaleString()}`
                : " Waiting for sync"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            <button
              onClick={handleDeleteData}
              className="text-red-500 hover:text-red-400 transition-colors"
              title="Delete all local data"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
            {isAuthenticated ? (
              <button
                onClick={startScan}
                disabled={isScanning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-emerald-900/20 flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>Sync Now</>
                )}
              </button>
            ) : (
              <button
                onClick={handleConnectClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Connect Gmail
              </button>
            )}
          </div>
        </div>

        {scanProgress && (
          <div className="mb-6 bg-slate-800 text-blue-300 px-4 py-2 rounded-lg border border-slate-700 text-sm animate-pulse text-center">
            {scanProgress}
          </div>
        )}

        <StatsBento stats={getStats()} />
      </header>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab("kanban")}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "kanban"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          Board
        </button>
        <button
          onClick={() => setActiveTab("vault")}
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "vault"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          Recruiter Vault
        </button>
      </div>

      {/* Main Content */}
      {activeTab === "kanban" ? (
        <div className="flex overflow-x-auto gap-4 pb-4 min-h-[500px]">
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className="min-w-[280px] w-[300px] flex-shrink-0 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wide">
                  {col.title}
                </h3>
                <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                  {jobs.filter((j) => j.status === col.id).length}
                </span>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-2 border border-slate-800/50 flex-1 space-y-3">
                {jobs
                  .filter((j) => j.status === col.id)
                  .map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                {jobs.filter((j) => j.status === col.id).length === 0 && (
                  <div className="h-24 flex items-center justify-center text-slate-600 text-xs italic border-2 border-dashed border-slate-800 rounded-lg">
                    No applications
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <RecruiterVault contacts={allContacts} />
      )}
    </div>
  );
};

export default App;
