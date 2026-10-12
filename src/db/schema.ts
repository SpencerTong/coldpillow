// Row types for the on-device database. Shapes follow docs/mvp.md (data model)
// and the output schemas in prompts/coldpillow-prompts.md.

export type InputType = 'voice' | 'text';

export type Night = {
  id: string;
  date: string; // local YYYY-MM-DD; a night started before 05:00 belongs to the previous day
  transcript: string | null; // null until transcribed (voice) or saved (text)
  inputType: InputType;
  durationSec: number;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  deletedAt: string | null; // soft delete only
};

export type ReadStatus = 'pending' | 'ready' | 'failed';
export type NightType = 'planning' | 'good_day' | 'overthinking' | 'venting' | 'quiet' | 'mixed';
export type Tone = 'light' | 'mixed' | 'heavy';
export type Theme =
  | 'work'
  | 'money'
  | 'relationships'
  | 'family'
  | 'friends'
  | 'health'
  | 'home'
  | 'future'
  | 'self'
  | 'other';

export type Highlight = { text: string; source_quote: string };
export type Worry = {
  text: string;
  theme: Theme;
  in_control: 'yes' | 'partly' | 'no';
  next_step: string | null;
  source_quote: string;
};
export type OnDeckItem = {
  text: string;
  when: 'tomorrow' | 'this_week' | 'someday';
  source_quote: string;
};

// AI fields are null while status is pending or failed.
export type Read = {
  nightId: string;
  status: ReadStatus;
  nightType: NightType | null;
  summary: string | null;
  reflection: string | null;
  highlights: Highlight[];
  encouragement: string | null;
  worries: Worry[];
  notice: string | null;
  perspective: string | null;
  onDeck: OnDeckItem[];
  calmLine: string | null;
  tone: Tone | null;
  themes: Theme[];
  crisis: boolean;
  promptVersion: string | null;
  model: string | null;
};

export type BestMoment = { text: string; date: string };
export type KeptComingUp = { text: string; dates: string[]; status: 'ongoing' | 'faded' };

export type Week = {
  weekId: string; // ISO week, e.g. 2026-W41
  weekInALine: string;
  bestMoments: BestMoment[];
  keptComingUp: KeptComingUp[];
  whatChanged: string[] | null;
  oneThingToTry: string;
  sourceNightIds: string[];
  promptVersion: string;
  model: string;
};

export type Settings = {
  reminderTime: string | null; // HH:MM, null until onboarding
  timezone: string;
};
