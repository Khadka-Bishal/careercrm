import { GoogleGenAI, Type } from "@google/genai";
import { JobStatus, GeminiAnalysisResult } from "../types";
import { appConfig } from "../config";

const MODEL_NAME = "gemini-2.5-flash";

export const analyzeEmailContent = async (
  subject: string,
  body: string
): Promise<GeminiAnalysisResult> => {
  console.log(
    `[ANALYSIS_SERVICE] Analyzing email. Key from config: "${appConfig.geminiApiKey}"`
  );

  if (!appConfig.geminiApiKey || appConfig.geminiApiKey.length < 10) {
    console.error(
      "[ANALYSIS_SERVICE] ABORTING: API Key is missing, empty, or too short in config."
    );
    return {
      company: "Unknown",
      statusUpdate: JobStatus.Unknown,
      isJobRelated: false,
    };
  }

  const ai = new GoogleGenAI({ apiKey: appConfig.geminiApiKey });

  const prompt = `
    You are a highly intelligent and strict AI assistant for a Personal Job Application CRM. Your task is to analyze an email and determine if it is DIRECTLY related to a job application process. You must be very critical and ignore generic notifications.

    **CRITICAL RULES:**
    1.  **Job-Related ONLY**: The email MUST be about a specific job application, interview, coding test, or offer. General marketing, newsletters from job boards (like ZipRecruiter, LinkedIn), or notifications about room bookings are NOT job-related.
    2.  **Company Name is KEY**: You MUST extract a specific, real company name. 
        - If no company is mentioned, or if it's a generic service (like "Interview Room"), you MUST set 'company' to an empty string ("").
        - DO NOT use generic words, months, or "null" as a company name.
    3.  **If Not Job-Related, STOP**: If the email does not meet these criteria (e.g., it's a room booking confirmation), you MUST set 'isJobRelated' to false and leave other fields empty.

    **Email to Analyze:**
    - Subject: "${subject}"
    - Body: "${body}"

    **Your Task:**
    1.  **isJobRelated (boolean)**: Is this email *directly* about a job application process with a specific company?
    2.  **company (string)**: If job-related, what is the company name? If not, return "".
    3.  **statusUpdate (enum)**: If job-related, determine the new status: "Applied", "OA / Skill Test", "Interviewing", "Offer", "Rejected", or "Unknown".
    4.  **recruiter (object | null)**: If a specific recruiter is mentioned, extract their details.

    Output strictly valid JSON matching this schema:
    {
      "company": string,
      "statusUpdate": "Applied" | "OA / Skill Test" | "Interviewing" | "Offer" | "Rejected" | "Unknown",
      "recruiter": { "name": string, "email": string, "role": string, "linkedIn": string } | null,
      "isJobRelated": boolean
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            company: { type: Type.STRING },
            statusUpdate: { type: Type.STRING, enum: Object.values(JobStatus) },
            isJobRelated: { type: Type.BOOLEAN },
            recruiter: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                name: { type: Type.STRING },
                email: { type: Type.STRING },
                role: { type: Type.STRING },
                linkedIn: { type: Type.STRING },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    console.log("Raw API Response:", text); // Log the raw response
    if (!text) throw new Error("Empty response from analysis service");
    return JSON.parse(text) as GeminiAnalysisResult;
  } catch (error) {
    console.error("Email Analysis Failed. Raw Error:", error); // Log the full error object
    return {
      company: "Error",
      statusUpdate: JobStatus.Unknown,
      isJobRelated: false,
    };
  }
};
