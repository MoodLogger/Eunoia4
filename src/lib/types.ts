
export type Mood = 'happy' | 'sad' | 'neutral' | 'angry' | null;

// Represents the score for a single question (-0.25, 0, or 0.25)
export type QuestionScore = -0.25 | 0 | 0.25;

// Stores the scores for the 8 questions within a theme
export interface ThemeQuestionScores {
  [questionIndex: number]: QuestionScore | undefined; // Index 0-7
}

// Main theme scores, calculated from detailed scores (-2 to +2)
export interface ThemeScores {
  dreaming: number;
  moodScore: number;
  training: number;
  diet: number;
  socialRelations: number;
  familyRelations: number;
  selfEducation: number;
}

// Detailed scores for each question within each theme
export interface DetailedThemeScores {
  dreaming: ThemeQuestionScores;
  moodScore: ThemeQuestionScores;
  training: ThemeQuestionScores;
  diet: ThemeQuestionScores;
  socialRelations: ThemeQuestionScores;
  familyRelations: ThemeQuestionScores;
  selfEducation: ThemeQuestionScores;
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD format
  mood: Mood; // Kept for potential direct mood logging, though calculated mood is primary
  scores: ThemeScores; // Overall theme scores (-2 to +2), calculated from detailedScores
  detailedScores: DetailedThemeScores; // Detailed answers for each question
  positives?: string; // New field for positive notes
  negatives?: string; // New field for negative notes
}

// Structure for storing all data in localStorage
export interface StoredData {
  [date: string]: DailyEntry;
}

// Type for Google Sheet statistical analysis results
export type ThemeKey = keyof ThemeScores;

// Updated result type for AI analysis from sheet data
export interface AISheetAnalysisResult {
  success: boolean;
  analysis?: string; // The AI-generated analysis text
  error?: string;
  message?: string; // General message from the server action
}


// Interface for parsed sheet row data for analysis (can be kept for internal processing in the action)
export interface ParsedSheetEntry {
    date: string;
    dayOfWeek?: string;
    totalScore?: number;
    themeScores?: Partial<Record<ThemeKey, number>>;
    detailedQuestionScores?: Partial<Record<ThemeKey, Record<number, { score: QuestionScore | undefined; answer: string }>>>;
    positives?: string;
    negatives?: string;
    // Add other raw columns if needed by AI
    rawRowData?: (string | number | null)[];
}
