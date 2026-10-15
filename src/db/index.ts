import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { toDateString } from '@/format';

import type { InputType, Night, Read, ReadStatus, Settings } from './schema';

export { migrate } from './migrations';
export * from './schema';

export const DB_NAME = 'coldpillow.db';

// Hour before which a night still counts as the previous day (matches the Ember/Sunrise switch).
const NIGHT_DAY_START_HOUR = 5;

// Local YYYY-MM-DD for the night a moment belongs to: 01:30 on the 12th is the night of the 11th.
export function nightDateFor(moment: Date = new Date()): string {
  const d = new Date(moment);
  if (d.getHours() < NIGHT_DAY_START_HOUR) d.setDate(d.getDate() - 1);
  return toDateString(d);
}

// --- nights ---

export async function insertNight(
  db: SQLiteDatabase,
  input: { inputType: InputType; transcript?: string | null; durationSec?: number; startedAt?: Date },
): Promise<Night> {
  const startedAt = input.startedAt ?? new Date();
  const now = new Date().toISOString();
  const night: Night = {
    id: randomUUID(),
    date: nightDateFor(startedAt),
    transcript: input.transcript ?? null,
    inputType: input.inputType,
    durationSec: input.durationSec ?? 0,
    createdAt: startedAt.toISOString(),
    updatedAt: now,
    deletedAt: null,
  };
  await db.runAsync(
    `INSERT INTO nights (id, date, transcript, inputType, durationSec, createdAt, updatedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    night.id,
    night.date,
    night.transcript,
    night.inputType,
    night.durationSec,
    night.createdAt,
    night.updatedAt,
  );
  return night;
}

export async function updateNightTranscript(
  db: SQLiteDatabase,
  id: string,
  transcript: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE nights SET transcript = ?, updatedAt = ? WHERE id = ?',
    transcript,
    new Date().toISOString(),
    id,
  );
}

export function getNight(db: SQLiteDatabase, id: string): Promise<Night | null> {
  return db.getFirstAsync<Night>('SELECT * FROM nights WHERE id = ? AND deletedAt IS NULL', id);
}

// Newest first, soft-deleted nights excluded.
export function listNights(db: SQLiteDatabase): Promise<Night[]> {
  return db.getAllAsync<Night>(
    'SELECT * FROM nights WHERE deletedAt IS NULL ORDER BY date DESC, createdAt DESC',
  );
}

// One row per Journal card: the night plus the parts of its read the list shows.
export type JournalEntry = Night & {
  readStatus: ReadStatus | null;
  summary: string | null;
};

// Newest first, soft-deleted nights excluded.
export function listJournal(db: SQLiteDatabase): Promise<JournalEntry[]> {
  return db.getAllAsync<JournalEntry>(
    `SELECT nights.*, reads.status AS readStatus, reads.summary AS summary
     FROM nights LEFT JOIN reads ON reads.nightId = nights.id
     WHERE nights.deletedAt IS NULL
     ORDER BY nights.date DESC, nights.createdAt DESC`,
  );
}

// --- reads ---

type ReadRow = Omit<Read, 'highlights' | 'worries' | 'onDeck' | 'themes' | 'crisis'> & {
  highlights: string;
  worries: string;
  onDeck: string;
  themes: string;
  crisis: number;
};

function readFromRow(row: ReadRow): Read {
  return {
    ...row,
    highlights: JSON.parse(row.highlights),
    worries: JSON.parse(row.worries),
    onDeck: JSON.parse(row.onDeck),
    themes: JSON.parse(row.themes),
    crisis: row.crisis === 1,
  };
}

export async function getRead(db: SQLiteDatabase, nightId: string): Promise<Read | null> {
  const row = await db.getFirstAsync<ReadRow>('SELECT * FROM reads WHERE nightId = ?', nightId);
  return row ? readFromRow(row) : null;
}

// --- settings ---

// The single settings row, created on first use with the device time zone.
export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  await db.runAsync('INSERT OR IGNORE INTO settings (id, timezone) VALUES (1, ?)', timezone);
  const row = await db.getFirstAsync<Settings>(
    'SELECT reminderTime, timezone FROM settings WHERE id = 1',
  );
  return row ?? { reminderTime: null, timezone };
}

// --- dev ---

export async function logDbStatus(db: SQLiteDatabase): Promise<void> {
  const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const count = async (table: string) =>
    (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n ?? 0;
  console.log(
    `[db] v${version?.user_version} · nights ${await count('nights')} · reads ${await count('reads')} · weeks ${await count('weeks')} · settings ${await count('settings')}`,
  );
}
