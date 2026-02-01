export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 'Low' | 'Medium' | 'High';

export interface CheckIn {
  id: string;
  date: string; // ISO string
  mood: MoodLevel;
  energy: EnergyLevel;
  note: string;
  aiInsight?: string;
  createdAt: number;
}

export interface Pattern {
  id: string;
  title: string;
  description: string;
  type: 'behavioral' | 'emotional';
  confidence: number;
  lastDetected: string;
}

export type BackgroundTheme = 'dynamic' | 'northern_lights' | 'sunset' | 'deep_ocean' | 'lavender_dream';

export interface UserSettings {
  hasOnboarded: boolean;
  name: string;
  backgroundTheme: BackgroundTheme;
}

export interface AppState {
  checkIns: CheckIn[];
  patterns: Pattern[];
  settings: UserSettings;
}

export type View = 'landing' | 'dashboard' | 'checkin' | 'patterns' | 'settings' | 'weekly';