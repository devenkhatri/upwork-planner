export interface UpworkJob {
  jobId: string;
  subId: string;
  title: string;
  url: string;
  description: string;
  budget: string;
  jobType: 'Fixed' | 'Hourly';
  experienceLevel: string;
  clientLocation: string;
  clientRating: number;
  clientHireRatePercent: number;
  clientTotalSpent: number;
  clientAvgHourlyRate: number | null;
  clientName: string | null;
  hasHired: boolean;
  paymentVerified: boolean;
  proposals: number;
  relativeDate: string;
  absoluteDate: string;
  tags: string; // JSON array stored as string
  questions: string; // JSON array stored as string
  allowedApplicantCountries: string | null;

  // AI-generated columns
  complexityScore: number; // 1–5
  projectPhase: 'discovery' | 'MVP' | 'rebuild' | 'scaling' | 'unknown';
  riskIndicators: string; // Comma-separated risk flags
  budgetSeriousness: number; // 1–10
  professionalismSignal: number; // 1–10
  longTermPotential: 'one-time' | 'ongoing' | 'multi-phase' | 'unknown';
  uniqueHooks: string; // 2–3 specific lines to reference
  requiredQuestions: string; // Extracted questions
  skillFit: number; // 0–10
  clientQuality: number; // 0–10
  rewardVsEffort: number; // 0–10
  competitionAdvantage: number; // 0–10
  applyScore: number; // computed formula
  applyDecision: 'Apply' | 'Skip';
  recommendations: string; // Tailored proposal advice
  status: 'active' | 'archive' | null;
}

export interface FilterState {
  search: string;
  jobType: string[];
  projectPhase: string[];
  applyDecision: string[];
  experienceLevel: string[];
  longTermPotential: string[];
  minScore: number;
  maxScore: number;
  minProposals: number;
  maxProposals: number;
}

export type SortField =
  | 'absoluteDate'
  | 'applyScore'
  | 'skillFit'
  | 'clientQuality'
  | 'rewardVsEffort'
  | 'proposals'
  | 'complexityScore'
  | 'budgetSeriousness';

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

export interface ParsedQuestion {
  question: string;
  position: number;
}
