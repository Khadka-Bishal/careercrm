import React from "react";
import { JobApplication, JobStatus } from "../types";

const formatDate = (isoString: string) => {
  if (!isoString) return "No date";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

interface JobCardProps {
  job: JobApplication;
}

const formatRelativeTime = (isoDate: string) => {
  const date = new Date(isoDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
};

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  // Status Badge Logic
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Applied:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case JobStatus.OA_Received:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case JobStatus.Interviewing:
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case JobStatus.Offer:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case JobStatus.Rejected:
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-slate-700 text-slate-400";
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md hover:shadow-lg transition-all group relative">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white text-lg">{job.company}</h3>
          <p className="text-slate-400 text-xs">
            {job.role || "Software Engineer"}
          </p>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(
            job.status
          )} uppercase font-semibold tracking-wide`}
        >
          {job.status === JobStatus.OA_Received ? "OA / Skill" : job.status}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-400 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span>Last Update: {formatDate(job.lastUpdated)}</span>
      </div>
    </div>
  );
};

export default JobCard;
