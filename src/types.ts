export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  portfolio?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  link?: string;
  url?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location: string;
  dates: string;
  details?: string;
}

export interface SkillCategories {
  technical: string[];
  soft: string[];
  tools: string[];
  certifications: string[];
}

export interface CustomSectionItem {
  id?: string;
  title: string;
  items: string[];
}

export interface ResumeData {
  title: string;
  contact: ContactInfo;
  summary: string;
  skills: SkillCategories;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  customSections?: CustomSectionItem[];
  languages?: string[];
  awards?: string[];
}

export interface JobDescriptionData {
  id: string;
  title: string;
  company: string;
  location?: string;
  rawText: string;
}

export interface KeywordBreakdown {
  required: string[];
  matching: string[];
  missingCritical: string[];
  missingRecommended: string[];
}

export interface ATSAnalysisResult {
  matchScore: number; // 0-100
  breakdown: {
    hardSkillsScore: number;
    experienceScore: number;
    softSkillsScore: number;
    formattingScore: number;
  };
  verdict: string; // e.g. "Strong ATS Match", "Moderate Match - Missing Key Skills"
  executiveSummary: string;
  keywords: KeywordBreakdown;
  missingSkillsAndGaps: string[];
  keyStrengths: string[];
  atsWarnings: string[];
}

export interface BulletImprovement {
  id: string;
  section: string; // e.g. "Experience: InnovateTech"
  original: string;
  tailored: string;
  reasoning: string;
  keywordsAdded: string[];
  isApplied: boolean;
}

export interface OptimizationResult {
  tailoredResume: ResumeData;
  improvementsMade: BulletImprovement[];
  newMatchScore: number;
  coverLetter: string;
}

export type TemplateStyle = 'modern' | 'classic' | 'tech' | 'executive';

export interface SavedResumeRecord {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  resumeData: ResumeData;
  tailoredResumeData?: ResumeData | null;
  atsScore?: number;
  coverLetter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserActivityRecord {
  id: string;
  userId: string;
  actionType: 'ats_analysis' | 'resume_tailored' | 'bullet_rewritten' | 'cover_letter_generated';
  jobTitle: string;
  score?: number;
  timestamp: string;
}

