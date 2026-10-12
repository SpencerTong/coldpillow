// src/theme.ts — ColdPillow design tokens.
// Every color, font and spacing value in the app comes from this file.
// Night = "Ember", Morning = "Sunrise". The app switches palettes by time of day.

export type Palette = {
  background: string;   // screen background
  surface: string;      // cards
  border: string;       // card borders, dividers
  nav: string;          // tab bar background
  text: string;         // primary text
  textMuted: string;    // secondary text, captions
  accent: string;       // buttons, active tab, streak dots, section labels
  onAccent: string;     // text/icons placed on the accent color
  accentSoft: string;   // second accent for small touches (e.g. a highlighted dot)
  graceDot: string;     // dashed outline for grace nights in the streak
};

export const night: Palette = {
  background: '#1A1512',
  surface: '#251E19',
  border: '#3A2F27',
  nav: '#1F1915',
  text: '#F1E6D8',
  textMuted: '#B3A594',
  accent: '#E8A45C',
  onAccent: '#1F1408',
  accentSoft: '#C98B7A',
  graceDot: '#7A6A5C',
};

export const morning: Palette = {
  background: '#F7EFE6',
  surface: '#FFFBF6',
  border: '#EBDCCB',
  nav: '#F7EFE6',
  text: '#2B231E',
  textMuted: '#6E5E52',
  accent: '#A44E24',      // passes 4.5:1 contrast for white text and on cream
  onAccent: '#FFFFFF',
  accentSoft: '#F2B48C',  // decorative only (sunrise mark), never for text
  graceDot: '#C9B6A4',
};

// Morning palette from 5:00 to 16:59, night palette otherwise.
// Kept as one function so the rule is easy to change later (or to follow the user's reminder time).
export function paletteFor(date: Date = new Date()): Palette {
  const hour = date.getHours();
  return hour >= 5 && hour < 17 ? morning : night;
}

export const fonts = {
  serif: 'Newsreader',        // headings, prompts, quotes from transcripts
  serifItalic: 'Newsreader-Italic',
  sans: 'Nunito',             // body text, buttons, labels
  sansBold: 'Nunito-Bold',
};

export const type = {
  title: { fontFamily: fonts.serif, fontSize: 38, lineHeight: 42 },
  prompt: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44 },
  quote: { fontFamily: fonts.serifItalic, fontSize: 19, lineHeight: 27 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.sansBold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  tab: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16 },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { card: 20, pill: 999, button: 27 };

export const size = {
  touchTarget: 44,     // minimum tap area
  recordButton: 132,   // Tonight screen
  stopButton: 88,      // Recording screen
  primaryButton: 54,   // full-width buttons
  streakDot: 28,
};
