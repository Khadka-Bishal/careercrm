
export enum JobStatus {
  Applied = 'Applied',
  OA_Received = 'OA / Skill Test',
  Interviewing = 'Interviewing',
  Offer = 'Offer',
  Rejected = 'Rejected',
  Unknown = 'Unknown'
}

export interface Recruiter {
  name: string;
  email: string;
  role: string;
  linkedIn?: string;
  company: string;
  lastContactDate: string;
}

export interface EmailData {
  id: string;
  subject: string;
  snippet: string;
  sender: string;
  date: string;
  body?: string;
}

export interface JobApplication {
  id: string;
  company: string;
  role?: string;
  status: JobStatus;
  lastUpdated: string; // ISO Date string
  emails: EmailData[];
  contacts: Recruiter[];
  notes?: string;
}

export interface Stats {
  totalApplied: number;
  interviews: number;
  offers: number;
  responseRate: number;
}

export interface GeminiAnalysisResult {
  company: string;
  statusUpdate: JobStatus;
  recruiter?: {
    name: string;
    email: string;
    role: string;
    linkedIn: string;
  } | null;
  isJobRelated: boolean;
}
