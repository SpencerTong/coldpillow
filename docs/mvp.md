# ColdPillow — Phase 1 (MVP) spec

A personal build for the owner's iPhone, on TestFlight in about three weekends. The question it answers: after two weeks, does he still open it every night? Payments, accounts, cloud sync and polish come later.

## Scope

In Phase 1:

| Feature | Notes |
|---|---|
| Bedtime reminder | Local notification at a chosen time; opens to Tonight. One reminder, no second nag. |
| Talk or type | Up to 5 minutes. Typing for nights you can't talk out loud. |
| Transcription | On-device or cloud, decided by the step 4 spike. |
| Tonight's read | Reflection, cards chosen by the kind of night, calm line, Goodnight. |
| Crisis screen | Shown instead of the read when the crisis flag or keyword check fires. |
| Last night card | Tonight tab during the day: the reflection plus the lead card. Read-only. |
| Journal | Past nights, newest first, each opening its transcript and read. |
| Insights | Weekly insights built on first open on or after Sunday, plus progress counts. |
| Nights this week | A count and totals. No streak rules. |
| Settings (minimal) | Reminder time, and delete all data. |

Not in Phase 1 (do not build): Sign in with Apple, Firestore/Storage sync, Recently Deleted, export, account deletion, retention settings, advice-level setting, unlocks at 7/30/90 nights, chosen focus, monthly letter, Apple Health, widgets, Send to Reminders, transcript editing, search, payments.

Never: to-do management (checkboxes, task state, worry buttons), streaks that break, mental-health scores.

## Screens

Three tabs: **Tonight**, **Journal**, **Insights**. Tonight is home.

- **Onboarding**: pick a reminder time, allow notifications and the microphone. Under a minute, no account. (No mockup; use the Ember palette and the Tonight screen's style.)
- **Tonight, evening** (mockup 02): the prompt, a large talk button, "or type instead", nights this week.
- **Talking** (mockup 03): a dim screen with a timer and waveform; tap to stop. Typing uses the same flow.
- **Tonight's read** (mockups 04–06): reflection, the cards for that kind of night, calm line, Goodnight.
- **Tonight, daytime / Last night card** (mockups 07–09): the reflection and the lead card. Nothing to tap.
- **Journal** (mockup 10): past nights newest first; tap one for its transcript and read.
- **Insights** (mockup 11): progress counts, how the week felt, best moments, what kept coming up (ongoing or faded), one thing to try. Footer: "Based only on what you said. A wellness tool, not therapy."
- **Crisis** (mockup 12): 988 Suicide & Crisis Lifeline (call or text 988), a link for helplines outside the US, 911 for immediate danger, "Not right now". The night is still saved.
- **Reminder** (mockup 01): the notification copy, "Ready for tonight's pillow talk?"

Palette by time of day, from `paletteFor(date)` in src/theme.ts: Ember (night) from 17:00 to 04:59, Sunrise (morning) from 05:00 to 16:59. Newsreader for headings, Nunito for body.

## Cards by kind of night

Every read starts with the reflection and ends with the calm line. The middle cards follow `night_type`, and empty cards are hidden. The card order table in prompts/coldpillow-prompts.md ("How the app arranges the cards") is the source of truth. The Last night card shows the reflection plus the first card in that order.

"On deck" is read-only text, never a checklist.

## Data model (SQLite on the device)

- **nights**: id, date, transcript, inputType (voice | text), durationSec, createdAt, updatedAt, deletedAt
- **reads**: nightId, status (pending | ready | failed), nightType, summary, reflection, highlights, encouragement, worries, notice, perspective, onDeck, calmLine, tone, themes, crisis, promptVersion, model
- **weeks**: weekId, weekInALine, bestMoments, keptComingUp, whatChanged, oneThingToTry, sourceNightIds, promptVersion, model
- **settings**: reminderTime, timezone

Progress counts (nights total, nights this week, good moments saved, worries that faded, light vs heavy nights compared with last week) are computed from nights and reads, never stored.

## AI

- Every call goes through a Firebase Cloud Function protected by anonymous auth and App Check. No key in the app.
- Nightly read: Haiku 5.5, prompt `nightly-v3`. One call per night, stored. Up to two retries on failure; failure never blocks saving the night.
- Weekly insights: Sonnet 5.5, prompt `weekly-v1`, built from that week's stored reads on first open of Insights on or after Sunday, then saved. No scheduler, no Batch API.
- Server checks on the nightly read: crisis keyword backstop, drop any item whose source_quote is not in the transcript, length guard.
- Send only transcript text. Audio is deleted once transcription succeeds.
- Save promptVersion and model with every result. Rerun the test transcripts after any prompt change.

## Build order (one step at a time, test on the phone before the next)

Weekend 1: done when a night can be recorded in airplane mode, shows in Journal, and transcription is decided.
1. Scaffold: Expo Router with three tabs (Tonight, Journal, Insights), src/theme.ts wired in with fonts, plus empty Talking, Read, Crisis and Onboarding screens. Remove the template's example screens.
2. expo-sqlite with migrations for nights, reads and weeks (and settings).
3. Talking: record up to 5 minutes with expo-audio, or type; save the night locally the moment you stop.
4. Spike: transcribe a saved 2-minute recording on-device. If it's unreliable, wire a cloud speech-to-text API instead. Write the transcript to the night.

Weekend 2: done when you talk, stop, and see a read within a minute.
5. Journal: nights newest first, each opening its transcript and read.
6. Nightly-read Cloud Function from prompts/coldpillow-prompts.md (schema, quote check, keyword backstop) with anonymous auth and App Check. Store the result as the night's read.
7. Tonight's read: reflection, cards ordered by kind of night, calm line, Goodnight. Crisis screen when crisis is true.

Weekend 3: done when ColdPillow is on the phone through TestFlight.
8. Tonight as home: evening shows the prompt and talk button; daytime shows the Last night card.
9. Insights: progress counts computed locally, weekly insights from a Cloud Function on first open after Sunday, then saved.
10. Nightly reminder and onboarding (reminder time, notification and microphone permission).
11. EAS build and upload to TestFlight. Bundle ID: app.coldpillow.
