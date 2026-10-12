import type { SQLiteDatabase } from 'expo-sqlite';

// Append-only. Never edit a migration that has shipped; add the next one instead.
// PRAGMA user_version records how many have run.
const migrations: string[] = [
  // 1: initial schema
  `
  CREATE TABLE nights (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    transcript TEXT,
    inputType TEXT NOT NULL CHECK (inputType IN ('voice', 'text')),
    durationSec INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT
  );
  CREATE INDEX nights_date ON nights (date);

  CREATE TABLE reads (
    nightId TEXT PRIMARY KEY NOT NULL REFERENCES nights (id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'ready', 'failed')),
    nightType TEXT,
    summary TEXT,
    reflection TEXT,
    highlights TEXT NOT NULL DEFAULT '[]',
    encouragement TEXT,
    worries TEXT NOT NULL DEFAULT '[]',
    notice TEXT,
    perspective TEXT,
    onDeck TEXT NOT NULL DEFAULT '[]',
    calmLine TEXT,
    tone TEXT,
    themes TEXT NOT NULL DEFAULT '[]',
    crisis INTEGER NOT NULL DEFAULT 0,
    promptVersion TEXT,
    model TEXT
  );

  CREATE TABLE weeks (
    weekId TEXT PRIMARY KEY NOT NULL,
    weekInALine TEXT NOT NULL,
    bestMoments TEXT NOT NULL DEFAULT '[]',
    keptComingUp TEXT NOT NULL DEFAULT '[]',
    whatChanged TEXT,
    oneThingToTry TEXT NOT NULL,
    sourceNightIds TEXT NOT NULL DEFAULT '[]',
    promptVersion TEXT NOT NULL,
    model TEXT NOT NULL
  );

  CREATE TABLE settings (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    reminderTime TEXT,
    timezone TEXT NOT NULL
  );
  `,
];

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < migrations.length) {
    const sql = migrations[version];
    const next = version + 1;
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(sql);
      await txn.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
}
