export const PROSPECT = {
  name: "Sam Morrison",
  title: "VP of Sales",
  company: "TechFlow",
  details: "200 employees • Series B • B2B SaaS",
  initials: "SM",
};

export const TEMPERAMENT_LABELS = [
  { level: 1, name: "Hostile", description: "Curt, may hang up, challenges your legitimacy" },
  { level: 2, name: "Skeptical", description: "Guarded, tests you, demands proof" },
  { level: 3, name: "Neutral", description: "Professional, evaluative, measured" },
  { level: 4, name: "Warm", description: "Shares pain openly, engaged, curious" },
  { level: 5, name: "Eager", description: "Ready to buy, volunteers information" },
];

export const CALL_TYPES = {
  cold: {
    id: "cold",
    title: "Cold Call",
    description: "They don't know you. You're interrupting. Earn 30 seconds.",
    icon: "phone-incoming",
  },
  discovery: {
    id: "discovery",
    title: "Discovery Call",
    description: "Pre-scheduled meeting. You booked this. You speak first.",
    icon: "calendar",
  },
} as const;

export const INPUT_MODES = {
  voice: {
    id: "voice",
    title: "Voice",
    description: "Speak naturally using your microphone",
    icon: "mic",
  },
  text: {
    id: "text",
    title: "Text",
    description: "Type your responses",
    icon: "keyboard",
  },
} as const;

export const PRACTICE_MODES = {
  sales: {
    id: "sales",
    title: "Sales Call Practice",
    description: "Practice discovery calls and cold calls with an AI prospect",
    icon: "phone",
  },
  interview: {
    id: "interview",
    title: "Hiring Manager Interview",
    description: "Practice job interviews with a customizable hiring manager",
    icon: "briefcase",
  },
} as const;

export const INTERVIEW_STYLES = [
  { level: 1, name: "Challenging", description: "Tough questions, pushback, stress-testing your answers" },
  { level: 2, name: "Probing", description: "Deep follow-ups, wants specifics and examples" },
  { level: 3, name: "Balanced", description: "Mix of behavioral and technical, professional tone" },
  { level: 4, name: "Conversational", description: "Casual, culture-fit focused, getting to know you" },
  { level: 5, name: "Friendly", description: "Warm, encouraging, wants you to succeed" },
];

export interface InterviewConfig {
  companyName: string;
  roleName: string;
  interviewerName: string;
  interviewerTitle: string;
  jobDescription: string;
  companyContext: string;
  interviewerContext: string;
}

export type CallType = keyof typeof CALL_TYPES;
export type TemperamentLevel = 1 | 2 | 3 | 4 | 5;
export type InputMode = keyof typeof INPUT_MODES;
export type PracticeMode = keyof typeof PRACTICE_MODES;
export type InterviewStyle = 1 | 2 | 3 | 4 | 5;
